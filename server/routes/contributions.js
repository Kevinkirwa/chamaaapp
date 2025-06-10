import express from 'express';
import Contribution from '../models/Contribution.js';
import Chama from '../models/Chama.js';
import { authenticateToken, validateChamaAccess } from '../middleware/auth.js';
import mpesaService from '../services/mpesaService.js';

const router = express.Router();

// Make a contribution
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { chamaId, phoneNumber } = req.body;
    const userId = req.user._id;

    if (!chamaId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Chama ID and phone number are required'
      });
    }

    const chama = await Chama.findById(chamaId);
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
      return res.status(400).json({
        success: false,
        message: 'You have already contributed for this cycle'
      });
    }

    // Format phone number
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedPhone = '254' + phoneNumber.slice(1);
    } else if (phoneNumber.startsWith('+254')) {
      formattedPhone = phoneNumber.slice(1);
    }

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

      // Simulate callback for development
      if (process.env.NODE_ENV !== 'production') {
        mpesaService.simulateCallback(stkResponse.CheckoutRequestID);
      }

      res.json({
        success: true,
        message: 'STK Push initiated successfully. Please complete payment on your phone.',
        contribution: contribution.toJSON(),
        checkoutRequestId: stkResponse.CheckoutRequestID
      });
    } catch (mpesaError) {
      // Update contribution status to failed
      contribution.status = 'failed';
      contribution.failureReason = mpesaError.message;
      await contribution.save();

      res.status(500).json({
        success: false,
        message: 'Failed to initiate payment. Please try again.',
        error: mpesaError.message
      });
    }
  } catch (error) {
    console.error('Error making contribution:', error);
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

    res.json({
      success: true,
      contribution
    });
  } catch (error) {
    console.error('Error checking contribution status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking contribution status'
    });
  }
});

export default router;