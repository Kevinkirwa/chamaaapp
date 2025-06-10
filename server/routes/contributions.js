import express from 'express';
import Contribution from '../models/Contribution.js';
import Chama from '../models/Chama.js';
import { authenticateToken, validateChamaAccess } from '../middleware/auth.js';
import mpesaService from '../services/mpesaService.js';

const router = express.Router();

// Make a contribution - ENHANCED VERSION
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { chamaId, phoneNumber } = req.body;
    const userId = req.user._id;

    console.log(`💳 Contribution request from ${req.user.email} for Chama ${chamaId}`);

    if (!chamaId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Chama ID and phone number are required'
      });
    }

    const chama = await Chama.findById(chamaId).populate('admin', 'name phone');
    if (!chama) {
      return res.status(404).json({
        success: false,
        message: 'Chama not found'
      });
    }

    // Check if user is a member
    const member = chama.members.find(member => 
      member.user.toString() === userId.toString()
    );

    if (!member) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this chama'
      });
    }

    // Check if already contributed for this cycle
    const existingContribution = await Contribution.findOne({
      user: userId,
      chama: chamaId,
      cycle: chama.currentCycle
    });

    if (existingContribution) {
      // Check the status of existing contribution
      if (existingContribution.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'You have already successfully contributed for this cycle'
        });
      } else if (existingContribution.status === 'processing') {
        return res.status(400).json({
          success: false,
          message: 'You have a payment in progress. Please wait for it to complete or cancel before trying again.',
          contributionId: existingContribution._id,
          checkoutRequestId: existingContribution.checkoutRequestId
        });
      } else if (existingContribution.status === 'failed') {
        // Allow retry for failed payments
        console.log(`🔄 Allowing retry for failed contribution: ${existingContribution._id}`);
        // Delete the failed contribution to allow a new attempt
        await Contribution.findByIdAndDelete(existingContribution._id);
      }
    }

    // Format phone number
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedPhone = '254' + phoneNumber.slice(1);
    } else if (phoneNumber.startsWith('+254')) {
      formattedPhone = phoneNumber.slice(1);
    }

    // Validate phone number format
    if (!/^254\d{9}$/.test(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid Kenyan phone number (e.g., 0712345678)'
      });
    }

    // Check if this is the current receiver
    const currentReceiver = chama.members.find(m => 
      m.payoutOrder === chama.currentCycle && !m.hasReceived
    );
    const isCurrentReceiver = currentReceiver?.user.toString() === userId.toString();

    // Create contribution record
    const contribution = new Contribution({
      user: userId,
      chama: chamaId,
      cycle: chama.currentCycle,
      amount: chama.contributionAmount,
      phoneNumber: formattedPhone,
      status: 'pending'
    });

    await contribution.save();

    try {
      // Initiate STK Push
      const stkResponse = await mpesaService.initiateSTKPush(
        formattedPhone,
        chama.contributionAmount,
        `CHAMA-${chamaId}`,
        `Contribution to ${chama.name} - Cycle ${chama.currentCycle}`
      );

      // Update contribution with checkout request ID
      contribution.checkoutRequestId = stkResponse.CheckoutRequestID;
      contribution.status = 'processing';
      await contribution.save();

      // IMPORTANT: Don't auto-simulate in development - let user complete or cancel
      console.log(`✅ STK Push initiated for ${req.user.email}: ${stkResponse.CheckoutRequestID}`);
      console.log(`⏳ Waiting for user to complete or cancel payment...`);

      res.json({
        success: true,
        message: isCurrentReceiver 
          ? `STK Push sent! You'll contribute KSh ${chama.contributionAmount.toLocaleString()} and receive KSh ${(chama.contributionAmount * chama.members.length).toLocaleString()} when everyone pays.`
          : 'STK Push sent to your phone! Please enter your M-PESA PIN to complete the payment.',
        contribution: contribution.toJSON(),
        checkoutRequestId: stkResponse.CheckoutRequestID,
        isCurrentReceiver,
        paymentInfo: {
          amount: chama.contributionAmount,
          totalPayout: isCurrentReceiver ? chama.contributionAmount * chama.members.length : null,
          netGain: isCurrentReceiver ? (chama.contributionAmount * chama.members.length) - chama.contributionAmount : null
        },
        instructions: {
          step1: 'Check your phone for M-PESA STK Push notification',
          step2: 'Enter your M-PESA PIN to complete payment',
          step3: 'Wait for payment confirmation',
          note: 'Payment will be marked as failed if cancelled or timed out'
        }
      });
    } catch (mpesaError) {
      console.error('❌ M-PESA STK Push failed:', mpesaError);
      
      // Update contribution status to failed
      contribution.status = 'failed';
      contribution.failureReason = mpesaError.message;
      await contribution.save();

      res.status(500).json({
        success: false,
        message: 'Failed to initiate M-PESA payment. Please try again.',
        error: mpesaError.message,
        troubleshooting: {
          checkPhone: 'Ensure your phone number is correct and active',
          checkBalance: 'Verify you have sufficient M-PESA balance',
          checkNetwork: 'Ensure you have good network connection',
          tryAgain: 'Wait a moment and try again'
        }
      });
    }
  } catch (error) {
    console.error('❌ Error making contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Server error making contribution'
    });
  }
});

// Get user contributions for a chama
router.get('/chama/:chamaId', authenticateToken, validateChamaAccess, async (req, res) => {
  try {
    const { chamaId } = req.params;
    const userId = req.user._id;

    const contributions = await Contribution.find({
      user: userId,
      chama: chamaId
    })
    .populate('chama', 'name contributionAmount')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      contributions
    });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching contributions'
    });
  }
});

// Get all contributions for a chama (admin only)
router.get('/chama/:chamaId/all', authenticateToken, validateChamaAccess, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only chama admin can view all contributions'
      });
    }

    const { chamaId } = req.params;
    const { cycle } = req.query;

    const query = { chama: chamaId };
    if (cycle) query.cycle = parseInt(cycle);

    const contributions = await Contribution.find(query)
      .populate('user', 'name email phone')
      .populate('chama', 'name contributionAmount')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      contributions
    });
  } catch (error) {
    console.error('Error fetching all contributions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching contributions'
    });
  }
});

// Check contribution status
router.get('/:contributionId/status', authenticateToken, async (req, res) => {
  try {
    const { contributionId } = req.params;
    const userId = req.user._id;

    const contribution = await Contribution.findOne({
      _id: contributionId,
      user: userId
    }).populate('chama', 'name');

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found'
      });
    }

    // Provide detailed status information
    let statusMessage = '';
    let nextAction = '';

    switch (contribution.status) {
      case 'pending':
        statusMessage = 'Payment initiated, waiting for STK Push';
        nextAction = 'Check your phone for M-PESA notification';
        break;
      case 'processing':
        statusMessage = 'STK Push sent, waiting for completion';
        nextAction = 'Enter your M-PESA PIN to complete payment';
        break;
      case 'completed':
        statusMessage = 'Payment completed successfully';
        nextAction = 'Thank you for your contribution!';
        break;
      case 'failed':
        statusMessage = `Payment failed: ${contribution.failureReason || 'Unknown error'}`;
        nextAction = 'You can try making a new contribution';
        break;
      case 'cancelled':
        statusMessage = 'Payment was cancelled';
        nextAction = 'You can try making a new contribution';
        break;
      default:
        statusMessage = 'Unknown status';
        nextAction = 'Please contact support';
    }

    res.json({
      success: true,
      contribution: {
        ...contribution.toJSON(),
        statusMessage,
        nextAction
      }
    });
  } catch (error) {
    console.error('Error checking contribution status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking contribution status'
    });
  }
});

// Cancel a pending contribution (for testing)
router.post('/:contributionId/cancel', authenticateToken, async (req, res) => {
  try {
    const { contributionId } = req.params;
    const userId = req.user._id;

    const contribution = await Contribution.findOne({
      _id: contributionId,
      user: userId
    });

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found'
      });
    }

    if (contribution.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed payment'
      });
    }

    if (contribution.status === 'failed' || contribution.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Payment is already cancelled or failed'
      });
    }

    // Update contribution status
    contribution.status = 'cancelled';
    contribution.failureReason = 'Cancelled by user';
    contribution.transactionDate = new Date();
    await contribution.save();

    // Simulate cancellation callback for development
    if (process.env.NODE_ENV !== 'production' && contribution.checkoutRequestId) {
      mpesaService.simulatePaymentCancellation(contribution.checkoutRequestId);
    }

    res.json({
      success: true,
      message: 'Payment cancelled successfully',
      contribution
    });
  } catch (error) {
    console.error('Error cancelling contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling contribution'
    });
  }
});

// Simulate payment success (for testing only)
router.post('/:contributionId/simulate-success', authenticateToken, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Simulation not allowed in production'
    });
  }

  try {
    const { contributionId } = req.params;
    const userId = req.user._id;

    const contribution = await Contribution.findOne({
      _id: contributionId,
      user: userId
    });

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found'
      });
    }

    if (contribution.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment is already completed'
      });
    }

    if (contribution.checkoutRequestId) {
      await mpesaService.simulatePaymentSuccess(contribution.checkoutRequestId);
      
      res.json({
        success: true,
        message: 'Payment success simulated'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No checkout request ID found'
      });
    }
  } catch (error) {
    console.error('Error simulating payment success:', error);
    res.status(500).json({
      success: false,
      message: 'Server error simulating payment'
    });
  }
});

export default router;