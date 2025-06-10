import express from 'express';
import Payout from '../models/Payout.js';
import Chama from '../models/Chama.js';
import { authenticateToken, validateChamaAccess } from '../middleware/auth.js';

const router = express.Router();

// Get payouts for a chama
router.get('/chama/:chamaId', authenticateToken, validateChamaAccess, async (req, res) => {
  try {
    const { chamaId } = req.params;

    const payouts = await Payout.find({ chama: chamaId })
      .populate('recipient', 'name email phone')
      .populate('chama', 'name contributionAmount')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payouts
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching payouts'
    });
  }
});

// Get user's received payouts
router.get('/my-payouts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const payouts = await Payout.find({ recipient: userId })
      .populate('chama', 'name contributionAmount')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payouts
    });
  } catch (error) {
    console.error('Error fetching user payouts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching payouts'
    });
  }
});

// Manual payout trigger (admin only, for emergency cases)
router.post('/trigger/:chamaId', authenticateToken, validateChamaAccess, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only chama admin can trigger manual payouts'
      });
    }

    const chama = req.chama;
    const { recipientId, cycle } = req.body;

    if (!recipientId || !cycle) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and cycle are required'
      });
    }

    // Check if recipient is a member
    const member = chama.members.find(m => m.user.toString() === recipientId);
    if (!member) {
      return res.status(400).json({
        success: false,
        message: 'Recipient is not a member of this chama'
      });
    }

    // Check if payout already exists for this cycle
    const existingPayout = await Payout.findOne({
      chama: chama._id,
      cycle: cycle
    });

    if (existingPayout) {
      return res.status(400).json({
        success: false,
        message: 'Payout already exists for this cycle'
      });
    }

    const totalAmount = chama.contributionAmount * chama.members.length;

    // Create payout record
    const payout = new Payout({
      chama: chama._id,
      recipient: recipientId,
      cycle: cycle,
      amount: totalAmount,
      phoneNumber: member.user.phone,
      status: 'pending'
    });

    await payout.save();

    res.json({
      success: true,
      message: 'Manual payout triggered successfully',
      payout
    });
  } catch (error) {
    console.error('Error triggering manual payout:', error);
    res.status(500).json({
      success: false,
      message: 'Server error triggering payout'
    });
  }
});

export default router;