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

export const validateChamaAccess = async (req, res, next) => {
  try {
    const chamaId = req.params.chamaId || req.body.chamaId;
    const userId = req.user._id;

    const chama = await Chama.findById(chamaId);
    if (!chama) {
      return res.status(404).json({
        success: false,
        message: 'Chama not found'
      });
    }

    // Check if user is admin or member
    const isAdmin = chama.admin.toString() === userId.toString();
    const isMember = chama.members.some(member => 
      member.user.toString() === userId.toString()
    );

    if (!isAdmin && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this chama.'
      });
    }

    req.chama = chama;
    req.isAdmin = isAdmin;
    next();
  } catch (error) {
    console.error('Chama access validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error validating chama access'
    });
  }
};