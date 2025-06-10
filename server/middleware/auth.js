import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Chama from '../models/Chama.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  next();
};

// ENHANCED: Better chama access validation with detailed logging
export const validateChamaAccess = async (req, res, next) => {
  try {
    const chamaId = req.params.chamaId || req.body.chamaId;
    const userId = req.user._id;

    console.log(`🔍 Validating chama access: User ${req.user.email} → Chama ${chamaId}`);

    const chama = await Chama.findById(chamaId).populate('members.user', 'name email phone');
    if (!chama) {
      console.log(`❌ Chama not found: ${chamaId}`);
      return res.status(404).json({
        success: false,
        message: 'Chama not found'
      });
    }

    // Check if user is admin
    const isAdmin = chama.admin.toString() === userId.toString();
    
    // Check if user is member (more thorough check)
    const memberIndex = chama.members.findIndex(member => 
      member.user._id.toString() === userId.toString()
    );
    const isMember = memberIndex !== -1;

    console.log(`👤 Access check for ${req.user.email}:`, {
      chamaName: chama.name,
      isAdmin,
      isMember,
      memberIndex,
      totalMembers: chama.members.length,
      adminId: chama.admin.toString(),
      userId: userId.toString()
    });

    // User must be either admin or member
    if (!isAdmin && !isMember) {
      console.log(`❌ Access denied: User ${req.user.email} is not admin or member of ${chama.name}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this chama.'
      });
    }

    console.log(`✅ Access granted: User ${req.user.email} has ${isAdmin ? 'admin' : 'member'} access to ${chama.name}`);

    req.chama = chama;
    req.isAdmin = isAdmin;
    req.isMember = isMember;
    req.memberIndex = memberIndex;
    next();
  } catch (error) {
    console.error('❌ Chama access validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error validating chama access'
    });
  }
};