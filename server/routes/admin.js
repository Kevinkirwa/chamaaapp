import express from 'express';
import User from '../models/User.js';
import Chama from '../models/Chama.js';
import Contribution from '../models/Contribution.js';
import Payout from '../models/Payout.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Create super admin (one-time setup route - should be secured in production)
router.post('/setup-super-admin', async (req, res) => {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Super admin already exists'
      });
    }

    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Format phone number
    let formattedPhone = phone.toString().trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    const superAdmin = new User({
      name,
      email: email.toLowerCase().trim(),
      phone: formattedPhone,
      password,
      role: 'super_admin',
      isVerified: true,
      canCreateChamas: true
    });

    await superAdmin.save();

    const token = jwt.sign(
      { userId: superAdmin._id, email: superAdmin.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Super admin created successfully',
      token,
      user: superAdmin.toJSON()
    });
  } catch (error) {
    console.error('Error creating super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating super admin'
    });
  }
});

// Get verification requests (admin only)
router.get('/verification-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const requests = await User.find({
      'verificationRequest.status': 'pending'
    }).select('-password').sort({ 'verificationRequest.requestedAt': -1 });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching verification requests'
    });
  }
});

// Approve/Reject verification request (admin only)
router.patch('/verification-requests/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve or reject'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.verificationRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'No pending verification request for this user'
      });
    }

    if (action === 'approve') {
      user.verificationRequest.status = 'approved';
      user.verificationRequest.approvedBy = req.user._id;
      user.verificationRequest.approvedAt = new Date();
      user.canCreateChamas = true;
      user.isVerified = true;
      
      // Optionally upgrade role to chama_creator
      if (user.role === 'member') {
        user.role = 'chama_creator';
      }
    } else {
      user.verificationRequest.status = 'rejected';
      user.verificationRequest.rejectionReason = rejectionReason || 'No reason provided';
    }

    await user.save();

    res.json({
      success: true,
      message: `Verification request ${action}d successfully`,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error processing verification request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing verification request'
    });
  }
});

// Grant Chama creation permission (admin only)
router.patch('/users/:userId/grant-chama-permission', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        canCreateChamas: true,
        isVerified: true,
        role: user.role === 'member' ? 'chama_creator' : user.role
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Chama creation permission granted successfully',
      user
    });
  } catch (error) {
    console.error('Error granting chama permission:', error);
    res.status(500).json({
      success: false,
      message: 'Server error granting permission'
    });
  }
});

// Revoke Chama creation permission (admin only)
router.patch('/users/:userId/revoke-chama-permission', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        canCreateChamas: false,
        role: user.role === 'chama_creator' ? 'member' : user.role
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Chama creation permission revoked successfully',
      user
    });
  } catch (error) {
    console.error('Error revoking chama permission:', error);
    res.status(500).json({
      success: false,
      message: 'Server error revoking permission'
    });
  }
});

// Get system overview (super admin only)
router.get('/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required'
      });
    }

    const totalUsers = await User.countDocuments({ isActive: true });
    const totalChamas = await Chama.countDocuments({ status: 'active' });
    const totalContributions = await Contribution.countDocuments({ status: 'completed' });
    const totalPayouts = await Payout.countDocuments({ status: 'completed' });
    const pendingVerifications = await User.countDocuments({ 'verificationRequest.status': 'pending' });

    // Calculate total money in system
    const contributionSum = await Contribution.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const payoutSum = await Payout.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalContributionAmount = contributionSum[0]?.total || 0;
    const totalPayoutAmount = payoutSum[0]?.total || 0;

    // Get recent activities
    const recentChamas = await Chama.find({ status: 'active' })
      .populate('admin', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentContributions = await Contribution.find({ status: 'completed' })
      .populate('user', 'name email')
      .populate('chama', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user role distribution
    const roleDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      overview: {
        totalUsers,
        totalChamas,
        totalContributions,
        totalPayouts,
        totalContributionAmount,
        totalPayoutAmount,
        systemBalance: totalContributionAmount - totalPayoutAmount,
        pendingVerifications,
        roleDistribution
      },
      recentActivities: {
        recentChamas,
        recentContributions
      }
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching overview'
    });
  }
});

// Get chama admin dashboard (for chama admins)
router.get('/chama/:chamaId/dashboard', authenticateToken, async (req, res) => {
  try {
    const { chamaId } = req.params;
    const userId = req.user._id;

    const chama = await Chama.findById(chamaId)
      .populate('admin', 'name email phone')
      .populate('members.user', 'name email phone');

    if (!chama) {
      return res.status(404).json({
        success: false,
        message: 'Chama not found'
      });
    }

    // Check if user is admin of this chama or super admin
    const isAdmin = chama.admin._id.toString() === userId.toString();
    const isSuperAdmin = req.user.role === 'super_admin';

    if (!isAdmin && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required for this chama'
      });
    }

    // Get contributions for current cycle
    const currentCycleContributions = await Contribution.find({
      chama: chamaId,
      cycle: chama.currentCycle
    }).populate('user', 'name email phone');

    // Get all contributions
    const allContributions = await Contribution.find({
      chama: chamaId
    })
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });

    // Get payouts
    const payouts = await Payout.find({
      chama: chamaId
    })
    .populate('recipient', 'name email phone')
    .sort({ createdAt: -1 });

    // Calculate statistics
    const totalContributed = await Contribution.aggregate([
      { $match: { chama: chama._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalPaidOut = await Payout.aggregate([
      { $match: { chama: chama._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const stats = {
      memberCount: chama.members.length,
      currentCycle: chama.currentCycle,
      totalContributed: totalContributed[0]?.total || 0,
      totalPaidOut: totalPaidOut[0]?.total || 0,
      currentCycleProgress: currentCycleContributions.filter(c => c.status === 'completed').length,
      currentCycleTarget: chama.members.length,
      currentReceiver: chama.getCurrentReceiver()
    };

    res.json({
      success: true,
      chama,
      contributions: {
        current: currentCycleContributions,
        all: allContributions
      },
      payouts,
      stats,
      isAdmin,
      isSuperAdmin
    });
  } catch (error) {
    console.error('Error fetching chama dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching chama dashboard'
    });
  }
});

// Get all users (super admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required'
      });
    }

    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const skip = (page - 1) * limit;

    let searchQuery = {};
    
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      searchQuery.role = role;
    }

    const users = await User.find(searchQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(searchQuery);

    // Add user statistics
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const chamasAsAdmin = await Chama.countDocuments({ admin: user._id });
      const chamasAsMember = await Chama.countDocuments({ 'members.user': user._id });
      const totalContributions = await Contribution.countDocuments({ user: user._id, status: 'completed' });
      const totalPayouts = await Payout.countDocuments({ recipient: user._id, status: 'completed' });

      return {
        ...user.toJSON(),
        stats: {
          chamasAsAdmin,
          chamasAsMember,
          totalContributions,
          totalPayouts
        }
      };
    }));

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

// Get all chamas (super admin only)
router.get('/chamas', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required'
      });
    }

    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const skip = (page - 1) * limit;

    let searchQuery = {};
    
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      searchQuery.status = status;
    }

    const chamas = await Chama.find(searchQuery)
      .populate('admin', 'name email phone')
      .populate('members.user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Chama.countDocuments(searchQuery);

    // Add additional stats for each chama
    const chamasWithStats = await Promise.all(chamas.map(async (chama) => {
      const totalContributions = await Contribution.countDocuments({
        chama: chama._id,
        status: 'completed'
      });

      const totalPayouts = await Payout.countDocuments({
        chama: chama._id,
        status: 'completed'
      });

      const totalAmount = await Contribution.aggregate([
        { $match: { chama: chama._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      return {
        ...chama.toJSON(),
        stats: {
          totalContributions,
          totalPayouts,
          memberCount: chama.members.length,
          totalAmount: totalAmount[0]?.total || 0
        }
      };
    }));

    res.json({
      success: true,
      chamas: chamasWithStats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching chamas:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching chamas'
    });
  }
});

// Promote user to admin role (super admin only)
router.patch('/users/:userId/promote', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required'
      });
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!['member', 'chama_creator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be member, chama_creator, or admin'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        role,
        canCreateChamas: ['chama_creator', 'admin'].includes(role),
        isVerified: true
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user role'
    });
  }
});

// Suspend/Activate user (super admin only)
router.patch('/users/:userId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required'
      });
    }

    const { userId } = req.params;
    const { isActive } = req.body;

    // Prevent super admin from deactivating themselves
    if (userId === req.user._id.toString() && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user status'
    });
  }
});

// Suspend/Activate chama (super admin only)
router.patch('/chamas/:chamaId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required'
      });
    }

    const { chamaId } = req.params;
    const { status } = req.body;

    if (!['active', 'paused', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, paused, or cancelled'
      });
    }

    const chama = await Chama.findByIdAndUpdate(
      chamaId,
      { status },
      { new: true }
    ).populate('admin', 'name email');

    if (!chama) {
      return res.status(404).json({
        success: false,
        message: 'Chama not found'
      });
    }

    res.json({
      success: true,
      message: `Chama status updated to ${status} successfully`,
      chama
    });
  } catch (error) {
    console.error('Error updating chama status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating chama status'
    });
  }
});

// Force cycle completion (chama admin or super admin)
router.post('/chamas/:chamaId/force-cycle', authenticateToken, async (req, res) => {
  try {
    const { chamaId } = req.params;
    const userId = req.user._id;

    const chama = await Chama.findById(chamaId).populate('members.user');
    if (!chama) {
      return res.status(404).json({
        success: false,
        message: 'Chama not found'
      });
    }

    // Check if user is admin of this chama or super admin
    const isAdmin = chama.admin.toString() === userId.toString();
    const isSuperAdmin = req.user.role === 'super_admin';

    if (!isAdmin && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required for this chama'
      });
    }

    // Move to next cycle
    chama.moveToNextCycle();
    await chama.save();

    res.json({
      success: true,
      message: 'Cycle completed successfully',
      chama: {
        currentCycle: chama.currentCycle,
        currentReceiver: chama.currentReceiver
      }
    });
  } catch (error) {
    console.error('Error forcing cycle completion:', error);
    res.status(500).json({
      success: false,
      message: 'Server error completing cycle'
    });
  }
});

// Get system statistics (super admin only)
router.get('/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required'
      });
    }

    // Monthly statistics for the last 12 months
    const monthlyStats = await Contribution.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAmount: { $sum: '$amount' },
          totalContributions: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top performing chamas
    const topChamas = await Chama.aggregate([
      { $match: { status: 'active' } },
      {
        $lookup: {
          from: 'contributions',
          localField: '_id',
          foreignField: 'chama',
          as: 'contributions'
        }
      },
      {
        $addFields: {
          totalContributions: {
            $size: {
              $filter: {
                input: '$contributions',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          },
          totalAmount: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$contributions',
                    cond: { $eq: ['$$this.status', 'completed'] }
                  }
                },
                as: 'contribution',
                in: '$$contribution.amount'
              }
            }
          }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'admin',
          foreignField: '_id',
          as: 'admin'
        }
      },
      { $unwind: '$admin' },
      {
        $project: {
          name: 1,
          memberCount: { $size: '$members' },
          totalContributions: 1,
          totalAmount: 1,
          'admin.name': 1,
          'admin.email': 1
        }
      }
    ]);

    res.json({
      success: true,
      statistics: {
        monthlyStats,
        topChamas
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
});

export default router;