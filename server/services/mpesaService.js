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

    // Track pending payments to avoid auto-completion
    this.pendingPayments = new Map();

    // Validate required credentials
    if (!this.consumerKey || !this.consumerSecret || !this.shortcode || !this.passkey) {
      console.error('❌ Missing M-PESA credentials. Please check your .env file.');
      console.log('💡 Required variables: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY');
    } else {
      console.log('✅ M-PESA service initialized with credentials');
      console.log(`📱 Business Shortcode: ${this.shortcode}`);
      console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Base URL: ${this.baseUrl}`);
      
      // FIXED: Show correct callback URL format without duplication
      const callbackBase = this.callbackUrl || 'https://chamaaapp.onrender.com';
      const contributionCallbackUrl = `${callbackBase}/api/mpesa/callback/contribution`;
      console.log(`📞 Contribution Callback URL: ${contributionCallbackUrl}`);
      console.log('⚠️  CRITICAL: Make sure your M-PESA app callback URL matches EXACTLY!');
      console.log('⚠️  Common mistake: Adding /api/mpesa/callback/contribution to a URL that already contains it');
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
      throw new Error('Failed to get M-PESA access token: ' + (error.response?.data?.errorMessage || error.message));
    }
  }

  generatePassword() {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
    return { password, timestamp };
  }

  formatPhoneNumber(phoneNumber) {
    // Remove any spaces, dashes, or other characters
    let formatted = phoneNumber.replace(/\D/g, '');
    
    // Handle different formats
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.slice(1);
    } else if (formatted.startsWith('254')) {
      // Already in correct format
    } else if (formatted.length === 9) {
      formatted = '254' + formatted;
    }
    
    // Validate final format
    if (!/^254\d{9}$/.test(formatted)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}. Expected format: 254XXXXXXXXX`);
    }
    
    return formatted;
  }

  // ENHANCED: Better date parsing for M-PESA transaction dates
  parseTransactionDate(transactionDate) {
    try {
      if (!transactionDate) {
        console.log('⚠️ No transaction date provided, using current date');
        return new Date();
      }

      // Handle different M-PESA date formats
      let parsedDate;

      if (typeof transactionDate === 'number') {
        // Format: 20240115103500 (YYYYMMDDHHMMSS)
        const dateStr = transactionDate.toString();
        if (dateStr.length === 14) {
          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          const hour = dateStr.substring(8, 10);
          const minute = dateStr.substring(10, 12);
          const second = dateStr.substring(12, 14);
          
          parsedDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
          console.log(`📅 Parsed M-PESA date format (YYYYMMDDHHMMSS): ${dateStr} → ${parsedDate.toISOString()}`);
        } else {
          // Assume it's a timestamp
          parsedDate = new Date(transactionDate);
          console.log(`📅 Parsed timestamp: ${transactionDate} → ${parsedDate.toISOString()}`);
        }
      } else if (typeof transactionDate === 'string') {
        // Try to parse as ISO string or other formats
        parsedDate = new Date(transactionDate);
        console.log(`📅 Parsed string date: ${transactionDate} → ${parsedDate.toISOString()}`);
      } else {
        // Already a Date object
        parsedDate = new Date(transactionDate);
        console.log(`📅 Using provided date object: ${parsedDate.toISOString()}`);
      }

      // Validate the parsed date
      if (isNaN(parsedDate.getTime())) {
        console.error(`❌ Invalid date parsed from: ${transactionDate}`);
        console.log('🔄 Falling back to current date');
        return new Date();
      }

      // Check if date is reasonable (not too far in past or future)
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

      if (parsedDate < oneYearAgo || parsedDate > oneYearFromNow) {
        console.error(`❌ Date seems unreasonable: ${parsedDate.toISOString()}`);
        console.log('🔄 Using current date instead');
        return new Date();
      }

      console.log(`✅ Successfully parsed transaction date: ${parsedDate.toISOString()}`);
      return parsedDate;

    } catch (error) {
      console.error('❌ Error parsing transaction date:', error);
      console.log(`🔄 Original value: ${transactionDate}, Type: ${typeof transactionDate}`);
      console.log('🔄 Falling back to current date');
      return new Date();
    }
  }

  async initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      // Format and validate phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Validate amount
      const roundedAmount = Math.round(amount);
      if (roundedAmount < 1) {
        throw new Error('Amount must be at least KSh 1');
      }

      // FIXED: Construct callback URL properly without duplication
      const callbackBase = this.callbackUrl || 'https://chamaaapp.onrender.com';
      // Remove any existing /api/mpesa/callback/contribution from the base URL
      const cleanCallbackBase = callbackBase.replace(/\/api\/mpesa\/callback\/contribution$/, '');
      const contributionCallbackUrl = `${cleanCallbackBase}/api/mpesa/callback/contribution`;

      // CRITICAL: Use business shortcode for PartyB (collection point)
      const requestData = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline', // Customer pays to business
        Amount: roundedAmount,
        PartyA: formattedPhone, // Customer phone number
        PartyB: this.shortcode, // Business shortcode (collection point)
        PhoneNumber: formattedPhone, // Phone to receive STK push
        CallBackURL: contributionCallbackUrl, // FIXED: Clean callback URL
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
      };

      console.log('📤 Initiating STK Push to Business Account:', {
        from: formattedPhone,
        to: `Business Account (${this.shortcode})`,
        amount: `KSh ${roundedAmount.toLocaleString()}`,
        reference: accountReference,
        description: transactionDesc,
        callbackUrl: contributionCallbackUrl // Show the clean callback URL
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

      console.log('✅ STK Push Response:', {
        CheckoutRequestID: response.data.CheckoutRequestID,
        ResponseCode: response.data.ResponseCode,
        ResponseDescription: response.data.ResponseDescription,
        CustomerMessage: response.data.CustomerMessage
      });

      // Track this payment as pending - WAIT FOR REAL SAFARICOM CALLBACK
      if (response.data.CheckoutRequestID) {
        this.pendingPayments.set(response.data.CheckoutRequestID, {
          initiated: Date.now(),
          amount: roundedAmount,
          phone: formattedPhone,
          reference: accountReference,
          status: 'pending_user_action'
        });

        console.log(`⏳ Payment ${response.data.CheckoutRequestID} tracked as pending - waiting for Safaricom callback`);
        console.log(`📞 Safaricom will call: ${contributionCallbackUrl}`);

        // Remove from pending after 5 minutes (M-PESA timeout)
        setTimeout(() => {
          const payment = this.pendingPayments.get(response.data.CheckoutRequestID);
          if (payment && payment.status === 'pending_user_action') {
            console.log(`⏰ Payment ${response.data.CheckoutRequestID} timed out - removing from pending`);
            this.pendingPayments.delete(response.data.CheckoutRequestID);
            
            // Mark as failed due to timeout
            this.handleTimeoutPayment(response.data.CheckoutRequestID);
          }
        }, 5 * 60 * 1000); // 5 minutes timeout
      }

      return response.data;
    } catch (error) {
      console.error('❌ STK Push error:', error.response?.data || error.message);
      
      // Provide specific error messages
      if (error.response?.data?.errorMessage) {
        throw new Error(`M-PESA Error: ${error.response.data.errorMessage}`);
      } else if (error.message.includes('Invalid phone number')) {
        throw error; // Re-throw phone validation errors
      } else {
        throw new Error('Failed to initiate M-PESA payment. Please try again.');
      }
    }
  }

  // Handle timeout payments
  async handleTimeoutPayment(checkoutRequestId) {
    try {
      const contribution = await Contribution.findOne({ checkoutRequestId });
      if (contribution && contribution.status === 'processing') {
        contribution.status = 'failed';
        contribution.failureReason = 'Payment timed out - no response from user';
        contribution.transactionDate = new Date();
        await contribution.save();
        
        console.log(`⏰ Marked contribution ${contribution._id} as failed due to timeout`);
      }
    } catch (error) {
      console.error('❌ Error handling timeout payment:', error);
    }
  }

  async initiatePayout(phoneNumber, amount, accountReference, transactionDesc) {
    try {
      const accessToken = await this.getAccessToken();

      // Format and validate phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Validate amount
      const roundedAmount = Math.round(amount);
      if (roundedAmount < 1) {
        throw new Error('Payout amount must be at least KSh 1');
      }

      // FIXED: Construct callback URLs properly
      const callbackBase = this.callbackUrl || 'https://chamaaapp.onrender.com/api/mpesa/callback/contribution';
      const cleanCallbackBase = callbackBase.replace(/\/api\/mpesa\/callback\/.*$/, '');

      // B2C Payment Request (Business to Customer)
      const requestData = {
        InitiatorName: 'M-Chama System', // System initiator
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || 'test_credential',
        CommandID: 'BusinessPayment', // Business payment to customer
        Amount: roundedAmount,
        PartyA: this.shortcode, // Business shortcode (source)
        PartyB: formattedPhone, // Customer phone (destination)
        Remarks: transactionDesc,
        QueueTimeOutURL: `${cleanCallbackBase}/api/mpesa/callback/payout/timeout`,
        ResultURL: `${cleanCallbackBase}/api/mpesa/callback/payout/result`,
        Occasion: accountReference
      };

      console.log('💰 Initiating B2C Payout from Business Account:', {
        from: `Business Account (${this.shortcode})`,
        to: formattedPhone,
        amount: `KSh ${roundedAmount.toLocaleString()}`,
        reference: accountReference,
        description: transactionDesc
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

      console.log('✅ B2C Payout Response:', {
        ConversationID: response.data.ConversationID,
        OriginatorConversationID: response.data.OriginatorConversationID,
        ResponseCode: response.data.ResponseCode,
        ResponseDescription: response.data.ResponseDescription
      });

      return response.data;
    } catch (error) {
      console.error('❌ B2C Payout error:', error.response?.data || error.message);
      throw new Error('Failed to initiate payout: ' + (error.response?.data?.errorMessage || error.message));
    }
  }

  // ENHANCED: Handle real Safaricom callbacks with detailed status tracking
  async handleContributionCallback(callbackData) {
    try {
      console.log('📥 Processing REAL Safaricom contribution callback:', JSON.stringify(callbackData, null, 2));
      
      const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

      if (!CheckoutRequestID) {
        console.error('❌ No CheckoutRequestID in callback data');
        return;
      }

      // Remove from pending payments tracking
      const pendingPayment = this.pendingPayments.get(CheckoutRequestID);
      if (pendingPayment) {
        this.pendingPayments.delete(CheckoutRequestID);
        console.log('🔄 Removed payment from pending tracking');
      }

      const contribution = await Contribution.findOne({ checkoutRequestId: CheckoutRequestID });
      if (!contribution) {
        console.error('❌ Contribution not found for checkout request:', CheckoutRequestID);
        return;
      }

      console.log(`🔍 Found contribution: ${contribution._id} for user ${contribution.user}`);

      // ENHANCED: Handle different result codes with specific messages
      if (ResultCode === 0) {
        // Payment successful
        const metadata = CallbackMetadata?.Item || [];
        const mpesaCode = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
        const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;
        const amount = metadata.find(item => item.Name === 'Amount')?.Value;
        const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;

        console.log('📊 Safaricom callback metadata:', {
          mpesaCode,
          transactionDate,
          amount,
          phoneNumber,
          transactionDateType: typeof transactionDate
        });

        // FIXED: Use enhanced date parsing
        const parsedTransactionDate = this.parseTransactionDate(transactionDate);

        // Update contribution with safe date handling
        contribution.status = 'completed';
        contribution.mpesaCode = mpesaCode;
        contribution.transactionDate = parsedTransactionDate;
        
        await contribution.save();

        console.log(`✅ Contribution completed via Safaricom callback:`, {
          mpesaCode,
          amount: `KSh ${amount}`,
          phone: phoneNumber,
          contributionId: contribution._id,
          transactionDate: parsedTransactionDate.toISOString()
        });

        // Update user's total savings
        await User.findByIdAndUpdate(contribution.user, {
          $inc: { totalSavings: amount || contribution.amount }
        });

        // Update chama's current cycle amount
        await Chama.findByIdAndUpdate(contribution.chama, {
          $inc: { currentCycleAmount: amount || contribution.amount }
        });

        // Check if the chama cycle is complete and initiate payout
        this.checkAndProcessPayout(contribution.chama, contribution.cycle);
      } else {
        // Payment failed or was cancelled by the user
        let failureReason = ResultDesc; // Initialize with the default description
        let userFriendlyMessage = ResultDesc;
        
        contribution.status = 'failed'; // Default to failed

        switch (ResultCode) {
          case 1032:
            failureReason = 'User cancelled the STK Push payment';
            userFriendlyMessage = 'Payment was cancelled by user on their phone';
            contribution.status = 'cancelled'; // Special status for user cancellation
            console.log('🚫 Safaricom confirmed: User cancelled the STK Push payment');
            break;
          case 1037:
            failureReason = 'STK Push timeout - user did not respond';
            userFriendlyMessage = 'Payment timed out - user did not respond to STK Push';
            console.log('⏰ Safaricom confirmed: STK Push timed out');
            break;
          case 1001:
            failureReason = 'Insufficient funds in user M-PESA account';
            userFriendlyMessage = 'Insufficient M-PESA balance';
            console.log('💰 Safaricom confirmed: Insufficient M-PESA balance');
            break;
          case 2001:
            failureReason = 'Invalid M-PESA PIN entered by user';
            userFriendlyMessage = 'Incorrect M-PESA PIN entered';
            console.log('🔐 Safaricom confirmed: Invalid M-PESA PIN');
            break;
          case 1:
            failureReason = 'General M-PESA payment failure';
            userFriendlyMessage = 'Payment failed - please try again';
            console.log('❌ Safaricom confirmed: General payment failure');
            break;
          case 1019:
            failureReason = 'Transaction failed - initiator authentication error';
            userFriendlyMessage = 'System error - please try again';
            console.log('🔑 Safaricom confirmed: Authentication error');
            break;
          case 1025:
            failureReason = 'Unable to lock subscriber - subscriber busy';
            userFriendlyMessage = 'M-PESA account busy - please try again';
            console.log('📱 Safaricom confirmed: Subscriber busy');
            break;
          default:
            failureReason = `Safaricom error: ${ResultDesc}`;
            userFriendlyMessage = 'Payment failed - please try again';
            console.log(`❓ Safaricom unknown error: ${ResultCode} - ${ResultDesc}`);
        }

        contribution.failureReason = failureReason;
        contribution.transactionDate = new Date(); // Mark the time of failure
        
        await contribution.save();

        console.log(`❌ Contribution failed via Safaricom callback:`, {
          reason: failureReason,
          userMessage: userFriendlyMessage,
          contributionId: contribution._id,
          resultCode: ResultCode,
          status: contribution.status
        });
      }
    } catch (error) {
      console.error('❌ Error handling Safaricom contribution callback:', error);
      
      // If it's a validation error, log more details
      if (error.name === 'ValidationError') {
        console.error('❌ Validation Error Details:', {
          errors: Object.keys(error.errors),
          messages: Object.values(error.errors).map(err => err.message)
        });
        
        // Try to save with current date if transaction date is the issue
        if (error.errors.transactionDate) {
          try {
            const contribution = await Contribution.findOne({ checkoutRequestId: callbackData.CheckoutRequestID });
            if (contribution) {
              contribution.transactionDate = new Date();
              await contribution.save();
              console.log('✅ Fixed contribution with current date');
            }
          } catch (fixError) {
            console.error('❌ Could not fix contribution date:', fixError);
          }
        }
      }
    }
  }

  async checkAndProcessPayout(chamaId, cycle) {
    try {
      const chama = await Chama.findById(chamaId).populate('members.user');
      if (!chama) {
        console.error('❌ Chama not found:', chamaId);
        return;
      }

      console.log(`🔍 Checking payout for ${chama.name}, Cycle ${cycle}`);

      // Check if cycle is complete
      const isComplete = await chama.isCurrentCycleComplete();
      
      if (isComplete) {
        console.log(`🎯 Cycle ${cycle} complete for Chama: ${chama.name}`);
        
        // Get current receiver
        const currentReceiver = chama.getCurrentReceiver();
        
        if (currentReceiver && currentReceiver.user) {
          const totalAmount = chama.contributionAmount * chama.members.length;
          
          console.log(`💰 Processing automatic payout:`, {
            chama: chama.name,
            cycle,
            receiver: currentReceiver.user.name,
            amount: `KSh ${totalAmount.toLocaleString()}`,
            receivingPhone: currentReceiver.receivingPhone
          });
          
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

          // Initiate automatic payout
          try {
            if (process.env.NODE_ENV === 'production') {
              // Production: Real M-PESA B2C payout
              const payoutResponse = await this.initiatePayout(
                currentReceiver.receivingPhone,
                totalAmount,
                `CHAMA-${chamaId}-CYCLE-${cycle}`,
                `Payout for ${chama.name} - Cycle ${cycle}`
              );

              payout.checkoutRequestId = payoutResponse.ConversationID;
              await payout.save();
              
              console.log(`📤 B2C Payout initiated:`, {
                conversationId: payoutResponse.ConversationID,
                receiver: currentReceiver.user.name,
                amount: `KSh ${totalAmount.toLocaleString()}`
              });
            } else {
              // Development: Simulate successful payout
              console.log(`🧪 Simulating payout in development mode...`);
              
              setTimeout(async () => {
                try {
                  payout.status = 'completed';
                  payout.mpesaCode = 'SIM' + Date.now();
                  payout.transactionDate = new Date(); // Safe date assignment
                  await payout.save();

                  // Update recipient's total received
                  await User.findByIdAndUpdate(currentReceiver.user._id, {
                    $inc: { totalReceived: totalAmount }
                  });

                  // Move chama to next cycle
                  chama.moveToNextCycle();
                  await chama.save();

                  console.log(`✅ Simulated payout completed:`, {
                    cycle,
                    receiver: currentReceiver.user.name,
                    amount: `KSh ${totalAmount.toLocaleString()}`,
                    nextCycle: chama.currentCycle
                  });
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
        const completedContributions = await Contribution.countDocuments({
          chama: chamaId,
          cycle: cycle,
          status: 'completed'
        });
        
        console.log(`⏳ Cycle ${cycle} not yet complete for ${chama.name}:`, {
          completed: completedContributions,
          required: chama.members.length,
          remaining: chama.members.length - completedContributions
        });
      }
    } catch (error) {
      console.error('❌ Error processing payout check:', error);
    }
  }

  async handlePayoutCallback(callbackData) {
    try {
      console.log('📥 Processing payout callback:', JSON.stringify(callbackData, null, 2));
      
      const { ConversationID, ResultCode, ResultDesc } = callbackData;

      if (!ConversationID) {
        console.error('❌ No ConversationID in payout callback');
        return;
      }

      const payout = await Payout.findOne({ checkoutRequestId: ConversationID });
      if (!payout) {
        console.error('❌ Payout not found for conversation ID:', ConversationID);
        return;
      }

      console.log(`🔍 Found payout: ${payout._id} for recipient ${payout.recipient}`);

      if (ResultCode === 0) {
        // Payout successful
        payout.status = 'completed';
        payout.mpesaCode = callbackData.TransactionID || 'MP' + Date.now();
        payout.transactionDate = new Date(); // Safe date assignment
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

        console.log(`✅ Payout completed successfully:`, {
          mpesaCode: payout.mpesaCode,
          amount: `KSh ${payout.amount.toLocaleString()}`,
          cycle: payout.cycle,
          payoutId: payout._id
        });
      } else {
        // Payout failed
        payout.status = 'failed';
        payout.failureReason = ResultDesc;
        payout.transactionDate = new Date(); // Safe date assignment even for failures
        await payout.save();

        console.log(`❌ Payout failed:`, {
          reason: ResultDesc,
          resultCode: ResultCode,
          payoutId: payout._id
        });
      }
    } catch (error) {
      console.error('❌ Error handling payout callback:', error);
    }
  }

  // Manual method to simulate payment success (for testing only)
  async simulatePaymentSuccess(checkoutRequestId) {
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Payment simulation not allowed in production');
      return;
    }

    console.log(`🧪 Manually simulating payment success for: ${checkoutRequestId}`);
    
    const pendingPayment = this.pendingPayments.get(checkoutRequestId);
    if (!pendingPayment) {
      console.log(`❌ Payment ${checkoutRequestId} not found in pending payments`);
      return;
    }

    const callbackData = {
      CheckoutRequestID: checkoutRequestId,
      ResultCode: 0,
      ResultDesc: 'The service request is processed successfully.',
      CallbackMetadata: {
        Item: [
          { Name: 'Amount', Value: pendingPayment.amount },
          { Name: 'MpesaReceiptNumber', Value: 'SIM' + Date.now() },
          { Name: 'PhoneNumber', Value: pendingPayment.phone },
          { Name: 'TransactionDate', Value: Date.now() }
        ]
      }
    };

    console.log('🧪 Simulated success callback data:', callbackData);
    await this.handleContributionCallback(callbackData);
  }

  // Manual method to simulate payment cancellation (for testing only)
  async simulatePaymentCancellation(checkoutRequestId) {
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Payment simulation not allowed in production');
      return;
    }

    console.log(`🧪 Manually simulating payment cancellation for: ${checkoutRequestId}`);
    
    const callbackData = {
      CheckoutRequestID: checkoutRequestId,
      ResultCode: 1032,
      ResultDesc: 'Request cancelled by user'
    };

    console.log('🧪 Simulated cancellation callback data:', callbackData);
    await this.handleContributionCallback(callbackData);
  }

  // Utility method to check M-PESA service status
  async checkServiceStatus() {
    try {
      const token = await this.getAccessToken();
      const callbackBase = this.callbackUrl || 'https://chamaaapp.onrender.com';
      const cleanCallbackBase = callbackBase.replace(/\/api\/mpesa\/callback\/.*$/, '');
      
      return {
        status: 'operational',
        environment: process.env.NODE_ENV || 'development',
        baseUrl: this.baseUrl,
        shortcode: this.shortcode,
        tokenValid: !!token,
        pendingPayments: this.pendingPayments.size,
        callbackUrl: `${cleanCallbackBase}/api/mpesa/callback/contribution`
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        environment: process.env.NODE_ENV || 'development'
      };
    }
  }
}

export default new MPESAService();