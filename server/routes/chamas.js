import express from 'express';
import Chama from '../models/Chama.js';
import Contribution from '../models/Contribution.js';
import Payout from '../models/Payout.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { authenticateToken, validateChamaAccess } from '../middleware/auth.js';

const router = express.Router();

// Request verification to create Chamas with document upload
router.post('/request-verification', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      nationalId, 
      fullName, 
      dateOfBirth, 
      placeOfBirth,
      idFrontPhoto, 
      idBackPhoto, 
      selfiePhoto 
    } = req.body;

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

    // Validate required fields
    if (!nationalId || !fullName || !dateOfBirth || !placeOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'All personal details are required (National ID, Full Name, Date of Birth, Place of Birth)'
      });
    }

    // Validate National ID format (8 digits)
    if (!/^\d{8}$/.test(nationalId)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 8-digit Kenya National ID number'
      });
    }

    // Validate documents
    if (!idFrontPhoto || !idBackPhoto || !selfiePhoto) {
      return res.status(400).json({
        success: false,
        message: 'All documents are required (ID Front Photo, ID Back Photo, Selfie Photo)'
      });
    }

    // Check if National ID is already used by another user
    const existingUser = await User.findOne({
      'verificationRequest.nationalId.idNumber': nationalId,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This National ID number is already registered with another account'
      });
    }

    // Update verification request with documents
    user.verificationRequest = {
      status: 'pending',
      requestedAt: new Date(),
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      nationalId: {
        idNumber: nationalId,
        fullName: fullName.trim(),
        dateOfBirth: new Date(dateOfBirth),
        placeOfBirth: placeOfBirth.trim()
      },
      documents: {
        idFrontPhoto: idFrontPhoto, // Base64 encoded image
        idBackPhoto: idBackPhoto,   // Base64 encoded image
        selfiePhoto: selfiePhoto,   // Base64 encoded image
        uploadedAt: new Date()
      },
      phoneVerification: {
        isPhoneRegisteredWithId: false, // To be verified by admin
        phoneOwnerName: null,
        verificationMethod: 'document_review'
      },
      adminNotes: null,
      riskAssessment: {
        score: 0,
        factors: [],
        assessedBy: null,
        assessedAt: null
      }
    };

    await user.save();

    res.json({
      success: true,
      message: 'Verification request with documents submitted successfully. An admin will review your documents and verify your identity.',
      verificationProgress: user.getVerificationProgress()
    });
  } catch (error) {
    console.error('Error requesting verification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing verification request'
    });
  }
});

// Get verification status with progress
router.get('/verification-status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      canCreateChamas: user.canCreateChama(),
      verificationRequest: user.verificationRequest,
      verificationProgress: user.getVerificationProgress(),
      hasCompleteDocuments: user.hasCompleteDocuments(),
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

// Update verification documents
router.patch('/verification-documents', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { idFrontPhoto, idBackPhoto, selfiePhoto } = req.body;

    const user = await User.findById(userId);

    if (user.verificationRequest.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update documents for approved verification'
      });
    }

    // Update documents
    if (idFrontPhoto) user.verificationRequest.documents.idFrontPhoto = idFrontPhoto;
    if (idBackPhoto) user.verificationRequest.documents.idBackPhoto = idBackPhoto;
    if (selfiePhoto) user.verificationRequest.documents.selfiePhoto = selfiePhoto;
    
    user.verificationRequest.documents.uploadedAt = new Date();

    // If status was rejected, reset to pending
    if (user.verificationRequest.status === 'rejected') {
      user.verificationRequest.status = 'pending';
      user.verificationRequest.requestedAt = new Date();
      user.verificationRequest.rejectionReason = null;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Documents updated successfully',
      verificationProgress: user.getVerificationProgress()
    });
  } catch (error) {
    console.error('Error updating documents:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating documents'
    });
  }
});

// Create a new chama (restricted to verified users)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, contributionAmount } = req.body;
    const adminId = req.user._id;

    // Check if user can create Chamas
    const user = await User.findById(adminId);
    if (!user.canCreateChama()) {
      return res.status(403).json({
        success: false,
        message: 'You need verification with valid Kenya National ID documents to create Chamas. Please submit your verification request.',
        requiresVerification: true
      });
    }

    // Additional security check - ensure user is properly verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your account is not verified. Please complete the verification process with valid documents.',
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
        hasReceived: false,
        receivingPhone: user.phone // Use admin's phone as default
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

    // Send welcome message
    const welcomeMessage = new Message({
      chama: chama._id,
      sender: adminId,
      content: `Welcome to ${chama.name}! 🎉 This is your group chat. Share updates, coordinate payments, and stay connected!`,
      messageType: 'system'
    });
    await welcomeMessage.save();

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

// Join chama by invite code
router.post('/join', authenticateToken, async (req, res) => {
  try {
    const { inviteCode, receivingPhone } = req.body;
    const userId = req.user._id;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Invite code is required'
      });
    }

    if (!receivingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number for receiving payments is required'
      });
    }

    // Format phone number
    let formattedPhone = receivingPhone.toString().trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    // Validate phone number format
    if (!/^254\d{9}$/.test(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid Kenyan phone number (e.g., 0712345678)'
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

    // Check if ordering is finalized
    if (chama.isOrderingFinalized) {
      return res.status(400).json({
        success: false,
        message: 'This chama has already started and ordering is finalized. Cannot join now.'
      });
    }

    // Add member with temporary payout order (will be randomized later)
    const nextPayoutOrder = chama.members.length + 1;
    chama.members.push({
      user: userId,
      payoutOrder: nextPayoutOrder,
      hasReceived: false,
      receivingPhone: formattedPhone
    });

    await chama.save();
    await chama.populate('admin', 'name email phone');
    await chama.populate('members.user', 'name email phone');

    // Send join notification message
    const joinMessage = new Message({
      chama: chama._id,
      sender: userId,
      content: `${req.user.name} joined the group! 👋`,
      messageType: 'system'
    });
    await joinMessage.save();

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

// Finalize member ordering (admin only)
router.post('/:chamaId/finalize-ordering', authenticateToken, validateChamaAccess, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only chama admin can finalize ordering'
      });
    }

    const chama = req.chama;

    if (chama.isOrderingFinalized) {
      return res.status(400).json({
        success: false,
        message: 'Ordering has already been finalized'
      });
    }

    if (chama.members.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 2 members to start the chama'
      });
    }

    // Finalize ordering using the method
    chama.finalizeOrdering();
    await chama.save();

    // Send ordering notification
    const orderingMessage = new Message({
      chama: chama._id,
      sender: req.user._id,
      content: `🎲 Member ordering has been finalized! The payout order has been randomly determined. Check your position in the Members tab.`,
      messageType: 'system'
    });
    await orderingMessage.save();

    await chama.populate('admin', 'name email phone');
    await chama.populate('members.user', 'name email phone');

    res.json({
      success: true,
      message: 'Member ordering finalized successfully',
      chama
    });
  } catch (error) {
    console.error('Error finalizing ordering:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error finalizing ordering'
    });
  }
});

// Update receiving phone number
router.patch('/:chamaId/update-phone', authenticateToken, validateChamaAccess, async (req, res) => {
  try {
    const { receivingPhone } = req.body;
    const userId = req.user._id;
    const chama = req.chama;

    if (!receivingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Format phone number
    let formattedPhone = receivingPhone.toString().trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    // Validate phone number format
    if (!/^254\d{9}$/.test(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid Kenyan phone number (e.g., 0712345678)'
      });
    }

    // Find and update member's receiving phone
    const member = chama.members.find(m => m.user.toString() === userId.toString());
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'You are not a member of this chama'
      });
    }

    member.receivingPhone = formattedPhone;
    await chama.save();

    res.json({
      success: true,
      message: 'Receiving phone number updated successfully'
    });
  } catch (error) {
    console.error('Error updating phone number:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating phone number'
    });
  }
});

// Get chama messages
router.get('/:chamaId/messages', authenticateToken, validateChamaAccess, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ chama: req.chama._id })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ chama: req.chama._id });

    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching messages'
    });
  }
});

// Send message
router.post('/:chamaId/messages', authenticateToken, validateChamaAccess, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 1000 characters'
      });
    }

    const message = new Message({
      chama: req.chama._id,
      sender: req.user._id,
      content: content.trim(),
      messageType: 'text'
    });

    await message.save();
    await message.populate('sender', 'name email');

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending message'
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

    // Don't allow removing members if ordering is finalized
    if (chama.isOrderingFinalized) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove members after ordering is finalized'
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