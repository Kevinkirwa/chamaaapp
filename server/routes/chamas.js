import express from 'express';
import Chama from '../models/Chama.js';
import Contribution from '../models/Contribution.js';
import Payout from '../models/Payout.js';
import User from '../models/User.js';
import { authenticateToken, validateChamaAccess } from '../middleware/auth.js';

const router = express.Router();

// Create a new chama (restricted to approved users)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, contributionAmount } = req.body;
    const adminId = req.user._id;

    // Check if user can create Chamas
    const user = await User.findById(adminId);
    if (!user.canCreateChama()) {
      return res.status(403).json({
        success: false,
        message: 'You need approval to create Chamas. Please request verification from an admin.',
        requiresVerification: true
      });
    }

    // Validate input
    if (!name || !description || !contributionAmount) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (contributionAmount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum contribution amount is KSh 100'
      });
    }

    if (contributionAmount > 1000000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum contribution amount is KSh 1,000,000'
      });
    }

    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingChama = await Chama.findOne({ inviteCode });
      if (!existingChama) isUnique = true;
    }

    // Create chama
    const chama = new Chama({
      name,
      description,
      contributionAmount,
      admin: adminId,
      inviteCode,
      members: [{
        user: adminId,
        payoutOrder: 1,
        hasReceived: false
      }]
    });

    await chama.save();
    await chama.populate('admin', 'name email phone');
    await chama.populate('members.user', 'name email phone');

    // Update user role to chama_creator if they're just a member
    if (user.role === 'member') {
      user.role = 'chama_creator';
      user.canCreateChamas = true;
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Chama created successfully',
      chama
    });
  } catch (error) {
    console.error('Error creating chama:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating chama'
    });
  }
});

// Request verification to create Chamas
router.post('/request-verification', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (user.canCreateChama()) {
      return res.status(400).json({
        success: false,
        message: 'You already have permission to create Chamas'
      });
    }

    if (user.verificationRequest.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Your verification request is already pending approval'
      });
    }

    // Update verification request
    user.verificationRequest = {
      status: 'pending',
      requestedAt: new Date(),
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null
    };

    await user.save();

    res.json({
      success: true,
      message: 'Verification request submitted successfully. An admin will review your request.'
    });
  } catch (error) {
    console.error('Error requesting verification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing verification request'
    });
  }
});

// Get verification status
router.get('/verification-status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      canCreateChamas: user.canCreateChama(),
      verificationRequest: user.verificationRequest,
      role: user.role
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching verification status'
    });
  }
});

// Get user's chamas
router.get('/my-chamas', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find chamas where user is admin or member
    const chamas = await Chama.find({
      $or: [
        { admin: userId },
        { 'members.user': userId }
      ],
      status: 'active'
    })
    .populate('admin', 'name email phone')
    .populate('members.user', 'name email phone')
    .sort({ createdAt: -1 });

    // Add additional info for each chama
    const chamasWithInfo = await Promise.all(chamas.map(async (chama) => {
      const memberCount = chama.members.length;
      const totalContributed = await Contribution.countDocuments({
        chama: chama._id,
        cycle: chama.currentCycle,
        status: 'completed'
      });

      return {
        ...chama.toJSON(),
        memberCount,
        totalContributed,
        totalRequired: memberCount,
        isAdmin: chama.admin._id.toString() === userId.toString()
      };
    }));

    res.json({
      success: true,
      chamas: chamasWithInfo
    });
  } catch (error) {
    console.error('Error fetching chamas:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching chamas'
    });
  }
});

// Join chama by invite code
router.post('/join', authenticateToken, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user._id;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Invite code is required'
      });
    }

    const chama = await Chama.findOne({ 
      inviteCode: inviteCode.toUpperCase(),
      status: 'active'
    });

    if (!chama) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code or chama not found'
      });
    }

    // Check if user is already a member
    const existingMember = chama.members.find(member => 
      member.user.toString() === userId.toString()
    );

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this chama'
      });
    }

    // Add member with next payout order
    const nextPayoutOrder = chama.members.length + 1;
    chama.members.push({
      user: userId,
      payoutOrder: nextPayoutOrder,
      hasReceived: false
    });

    await chama.save();
    await chama.populate('admin', 'name email phone');
    await chama.populate('members.user', 'name email phone');

    res.json({
      success: true,
      message: 'Successfully joined chama',
      chama
    });
  } catch (error) {
    console.error('Error joining chama:', error);
    res.status(500).json({
      success: false,
      message: 'Server error joining chama'
    });
  }
});

// Get chama details
router.get('/:chamaId', authenticateToken, validateChamaAccess, async (req, res) => {
  try {
    const chama = req.chama;
    
    // Get contributions for current cycle
    const contributions = await Contribution.find({
      chama: chama._id,
      cycle: chama.currentCycle
    }).populate('user', 'name email phone');

    // Get recent payouts
    const payouts = await Payout.find({
      chama: chama._id
    })
    .populate('recipient', 'name email phone')
    .sort({ createdAt: -1 })
    .limit(10);

    // Calculate statistics
    const totalContributed = contributions.filter(c => c.status === 'completed').length;
    const totalRequired = chama.members.length;
    const currentReceiver = chama.members.find(member => 
      member.payoutOrder === chama.currentCycle && !member.hasReceived
    );

    res.json({
      success: true,
      chama: {
        ...chama.toJSON(),
        isAdmin: req.isAdmin
      },
      contributions,
      payouts,
      stats: {
        totalContributed,
        totalRequired,
        currentReceiver: currentReceiver ? currentReceiver.user : null,
        cycleProgress: (totalContributed / totalRequired) * 100
      }
    });
  } catch (error) {
    console.error('Error fetching chama details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching chama details'
    });
  }
});

// Update chama (admin only)
router.put('/:chamaId', authenticateToken, validateChamaAccess, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only chama admin can update chama details'
      });
    }

    const { name, description, contributionAmount } = req.body;
    const chama = req.chama;

    if (name) chama.name = name;
    if (description) chama.description = description;
    if (contributionAmount && contributionAmount >= 100) {
      chama.contributionAmount = contributionAmount;
    }

    await chama.save();
    await chama.populate('admin', 'name email phone');
    await chama.populate('members.user', 'name email phone');

    res.json({
      success: true,
      message: 'Chama updated successfully',
      chama
    });
  } catch (error) {
    console.error('Error updating chama:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating chama'
    });
  }
});

// Remove member (admin only)
router.delete('/:chamaId/members/:memberId', authenticateToken, validateChamaAccess, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only chama admin can remove members'
      });
    }

    const { memberId } = req.params;
    const chama = req.chama;

    // Don't allow removing admin
    if (chama.admin.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove chama admin'
      });
    }

    // Remove member
    chama.members = chama.members.filter(member => 
      member.user.toString() !== memberId
    );

    // Reorder payout orders
    chama.members.forEach((member, index) => {
      member.payoutOrder = index + 1;
    });

    await chama.save();

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing member'
    });
  }
});

export default router;