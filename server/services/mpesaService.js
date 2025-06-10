import axios from 'axios';
import Contribution from '../models/Contribution.js';
import Payout from '../models/Payout.js';
import Chama from '../models/Chama.js';
import User from '../models/User.js';

class MPESAService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.passkey = process.env.MPESA_PASSKEY;
    this.callbackUrl = process.env.MPESA_CALLBACK_URL;
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
    this.accessToken = null;
    this.tokenExpiry = null;

    // Validate required credentials
    if (!this.consumerKey || !this.consumerSecret || !this.shortcode || !this.passkey) {
      console.error('❌ Missing M-PESA credentials. Please check your .env file.');
    } else {
      console.log('✅ M-PESA service initialized with credentials');
      console.log(`📱 Shortcode: ${this.shortcode}`);
      console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
    }
  }

  async getAccessToken() {
    try {
      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      console.log('🔑 Requesting M-PESA access token...');
      
      const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 minute early

      console.log('✅ M-PESA access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Error getting M-PESA access token:', error.response?.data || error.message);
      throw new Error('Failed to get M-PESA access token');
    }
  }

  generatePassword() {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
    return { password, timestamp };
  }

  // ENHANCED: Get collection phone number (admin's phone or business number)
  async getCollectionPhoneNumber(chamaId) {
    try {
      const chama = await Chama.findById(chamaId).populate('admin', 'phone');
      
      if (!chama) {
        throw new Error('Chama not found');
      }

      // For now, use admin's phone as collection point
      // In production, this would be a dedicated business number
      return chama.admin.phone;
    } catch (error) {
      console.error('Error getting collection phone number:', error);
      throw error;
    }
  }

  async initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc, chamaId = null) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      // Format phone number to ensure it starts with 254
      let formattedPhone = phoneNumber;
      if (phoneNumber.startsWith('0')) {
        formattedPhone = '254' + phoneNumber.slice(1);
      } else if (phoneNumber.startsWith('+254')) {
        formattedPhone = phoneNumber.slice(1);
      } else if (!phoneNumber.startsWith('254')) {
        formattedPhone = '254' + phoneNumber;
      }

      // ENHANCED: Determine collection phone number
      let collectionPhone = this.shortcode; // Default to business shortcode
      
      if (chamaId) {
        try {
          // Use admin's phone as collection point for this Chama
          collectionPhone = await this.getCollectionPhoneNumber(chamaId);
          console.log(`📱 Using admin phone ${collectionPhone} as collection point for Chama ${chamaId}`);
        } catch (error) {
          console.log('⚠️ Could not get admin phone, using business shortcode');
          collectionPhone = this.shortcode;
        }
      }

      const requestData = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: collectionPhone, // FIXED: Use collection phone instead of shortcode
        PhoneNumber: formattedPhone,
        CallBackURL: `${this.callbackUrl}/contribution`,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
      };

      console.log('📤 Initiating STK Push:', {
        from: formattedPhone,
        to: collectionPhone,
        amount: Math.round(amount),
        reference: accountReference
      });

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ STK Push Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ STK Push error:', error.response?.data || error.message);
      throw new Error('Failed to initiate STK Push');
    }
  }

  async initiatePayout(phoneNumber, amount, accountReference, transactionDesc) {
    try {
      const accessToken = await this.getAccessToken();

      // Format phone number
      let formattedPhone = phoneNumber;
      if (phoneNumber.startsWith('0')) {
        formattedPhone = '254' + phoneNumber.slice(1);
      } else if (phoneNumber.startsWith('+254')) {
        formattedPhone = phoneNumber.slice(1);
      } else if (!phoneNumber.startsWith('254')) {
        formattedPhone = '254' + phoneNumber;
      }

      const requestData = {
        InitiatorName: 'testapi',
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || 'test_credential',
        CommandID: 'BusinessPayment',
        Amount: Math.round(amount),
        PartyA: this.shortcode,
        PartyB: formattedPhone,
        Remarks: transactionDesc,
        QueueTimeOutURL: `${this.callbackUrl}/payout/timeout`,
        ResultURL: `${this.callbackUrl}/payout/result`,
        Occasion: accountReference
      };

      console.log('💰 Initiating Payout:', {
        phone: formattedPhone,
        amount: Math.round(amount),
        reference: accountReference
      });

      const response = await axios.post(
        `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Payout Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Payout error:', error.response?.data || error.message);
      throw new Error('Failed to initiate payout');
    }
  }

  async handleContributionCallback(callbackData) {
    try {
      console.log('📥 Processing contribution callback:', JSON.stringify(callbackData, null, 2));
      
      const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

      const contribution = await Contribution.findOne({ checkoutRequestId: CheckoutRequestID });
      if (!contribution) {
        console.error('❌ Contribution not found for checkout request:', CheckoutRequestID);
        return;
      }

      if (ResultCode === 0) {
        // Payment successful
        const metadata = CallbackMetadata?.Item || [];
        const mpesaCode = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
        const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;
        const amount = metadata.find(item => item.Name === 'Amount')?.Value;

        contribution.status = 'completed';
        contribution.mpesaCode = mpesaCode;
        contribution.transactionDate = transactionDate ? new Date(transactionDate.toString()) : new Date();
        await contribution.save();

        // Update user's total savings
        await User.findByIdAndUpdate(contribution.user, {
          $inc: { totalSavings: amount || contribution.amount }
        });

        // Update chama's current cycle amount
        await Chama.findByIdAndUpdate(contribution.chama, {
          $inc: { currentCycleAmount: amount || contribution.amount }
        });

        console.log(`✅ Contribution completed: ${mpesaCode} - Amount: KSh ${amount}`);

        // Check if all members have contributed for this cycle
        await this.checkAndProcessPayout(contribution.chama, contribution.cycle);

      } else {
        // Payment failed
        contribution.status = 'failed';
        contribution.failureReason = ResultDesc;
        await contribution.save();

        console.log(`❌ Contribution failed: ${ResultDesc}`);
      }
    } catch (error) {
      console.error('❌ Error handling contribution callback:', error);
    }
  }

  async checkAndProcessPayout(chamaId, cycle) {
    try {
      const chama = await Chama.findById(chamaId).populate('members.user');
      if (!chama) {
        console.error('❌ Chama not found:', chamaId);
        return;
      }

      // Check if cycle is complete
      const isComplete = await chama.isCurrentCycleComplete();
      
      if (isComplete) {
        console.log(`🎯 Cycle ${cycle} complete for Chama: ${chama.name}`);
        
        // Get current receiver
        const currentReceiver = chama.getCurrentReceiver();
        
        if (currentReceiver && currentReceiver.user) {
          const totalAmount = chama.contributionAmount * chama.members.length;
          
          console.log(`💰 Processing payout of KSh ${totalAmount} to ${currentReceiver.user.name} (${currentReceiver.receivingPhone})`);
          
          // Create payout record
          const payout = new Payout({
            chama: chamaId,
            recipient: currentReceiver.user._id,
            cycle: cycle,
            amount: totalAmount,
            phoneNumber: currentReceiver.receivingPhone, // Use receiving phone, not login phone
            status: 'processing'
          });

          await payout.save();

          // Initiate M-PESA payout
          try {
            if (process.env.NODE_ENV === 'production') {
              const payoutResponse = await this.initiatePayout(
                currentReceiver.receivingPhone, // Use receiving phone
                totalAmount,
                `CHAMA-${chamaId}-CYCLE-${cycle}`,
                `Payout for ${chama.name} - Cycle ${cycle}`
              );

              payout.checkoutRequestId = payoutResponse.ConversationID;
              await payout.save();
              
              console.log(`📤 Payout initiated via M-PESA: ${payoutResponse.ConversationID}`);
            } else {
              // Simulate successful payout in development
              console.log(`🧪 Simulating payout in development mode...`);
              
              setTimeout(async () => {
                try {
                  payout.status = 'completed';
                  payout.mpesaCode = 'SIM' + Date.now();
                  payout.transactionDate = new Date();
                  await payout.save();

                  // Update recipient's total received
                  await User.findByIdAndUpdate(currentReceiver.user._id, {
                    $inc: { totalReceived: totalAmount }
                  });

                  // Move chama to next cycle
                  chama.moveToNextCycle();
                  await chama.save();

                  console.log(`✅ Simulated payout completed for cycle ${cycle} - ${currentReceiver.user.name} received KSh ${totalAmount}`);
                } catch (error) {
                  console.error('❌ Error completing simulated payout:', error);
                }
              }, 3000);
            }
          } catch (error) {
            console.error('❌ Error initiating payout:', error);
            payout.status = 'failed';
            payout.failureReason = error.message;
            await payout.save();
          }
        } else {
          console.error('❌ No current receiver found for cycle:', cycle);
        }
      } else {
        console.log(`⏳ Cycle ${cycle} not yet complete for Chama: ${chama.name}`);
      }
    } catch (error) {
      console.error('❌ Error processing payout:', error);
    }
  }

  async handlePayoutCallback(callbackData) {
    try {
      console.log('📥 Processing payout callback:', JSON.stringify(callbackData, null, 2));
      
      const { ConversationID, ResultCode, ResultDesc } = callbackData;

      const payout = await Payout.findOne({ checkoutRequestId: ConversationID });
      if (!payout) {
        console.error('❌ Payout not found for conversation ID:', ConversationID);
        return;
      }

      if (ResultCode === 0) {
        // Payout successful
        payout.status = 'completed';
        payout.mpesaCode = callbackData.TransactionID || 'MP' + Date.now();
        payout.transactionDate = new Date();
        await payout.save();

        // Update recipient's total received
        await User.findByIdAndUpdate(payout.recipient, {
          $inc: { totalReceived: payout.amount }
        });

        // Move chama to next cycle
        const chama = await Chama.findById(payout.chama);
        if (chama) {
          chama.moveToNextCycle();
          await chama.save();
        }

        console.log(`✅ Payout completed: ${payout.mpesaCode} - Amount: KSh ${payout.amount}`);
      } else {
        // Payout failed
        payout.status = 'failed';
        payout.failureReason = ResultDesc;
        await payout.save();

        console.log(`❌ Payout failed: ${ResultDesc}`);
      }
    } catch (error) {
      console.error('❌ Error handling payout callback:', error);
    }
  }

  // Simulate callback for development
  async simulateCallback(checkoutRequestId, resultCode = 0) {
    setTimeout(async () => {
      const callbackData = {
        CheckoutRequestID: checkoutRequestId,
        ResultCode: resultCode,
        ResultDesc: resultCode === 0 ? 'The service request is processed successfully.' : 'Payment cancelled by user',
        CallbackMetadata: resultCode === 0 ? {
          Item: [
            { Name: 'Amount', Value: 100 },
            { Name: 'MpesaReceiptNumber', Value: 'MPS' + Date.now() },
            { Name: 'PhoneNumber', Value: '254712345678' },
            { Name: 'TransactionDate', Value: Date.now() }
          ]
        } : null
      };

      await this.handleContributionCallback(callbackData);
    }, 3000);
  }
}

export default new MPESAService();