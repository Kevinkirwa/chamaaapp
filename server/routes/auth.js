import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();

console.log('🔐 Auth routes loaded');

// Test route to verify auth routes are working
router.get('/test', (req, res) => {
  console.log('🧪 Auth test route accessed');
  res.json({
    success: true,
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString(),
    database: 'MongoDB Atlas',
    connectionState: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Registration attempt started');
    console.log('📝 Request body:', { 
      name: req.body.name, 
      email: req.body.email, 
      phone: req.body.phone,
      hasPassword: !!req.body.password
    });

    const { name, email, phone, password } = req.body;

    // Validate input
    if (!name || !email || !phone || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required (name, email, phone, password)'
      });
    }

    // Validate password length
    if (password.length < 6) {
      console.log('❌ Password too short');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
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

    console.log('📱 Formatted phone:', formattedPhone);

    // Validate phone number format
    if (!/^254\d{9}$/.test(formattedPhone)) {
      console.log('❌ Invalid phone format');
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid Kenyan phone number (e.g., 0712345678)'
      });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ Database not connected, state:', mongoose.connection.readyState);
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }

    // Check if user already exists
    console.log('🔍 Checking for existing user...');
    
    try {
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase().trim() },
          { phone: formattedPhone }
        ]
      }).maxTimeMS(10000); // 10 second timeout

      if (existingUser) {
        console.log('❌ User already exists:', existingUser.email);
        const field = existingUser.email === email.toLowerCase().trim() ? 'email' : 'phone number';
        return res.status(400).json({
          success: false,
          message: `User with this ${field} already exists`
        });
      }
    } catch (dbError) {
      console.error('❌ Database query error:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Database connection timeout. Please check your internet connection and try again.',
        error: dbError.message
      });
    }

    // Create new user
    console.log('👤 Creating new user...');
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: formattedPhone,
      password: password
    });

    try {
      await user.save();
      console.log('✅ User saved successfully with ID:', user._id);
    } catch (saveError) {
      console.error('❌ Error saving user:', saveError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user. Please try again.',
        error: saveError.message
      });
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🔑 JWT token generated successfully');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: user.toJSON()
    });

    console.log('✅ Registration completed successfully for:', user.email);

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field === 'email' ? 'Email' : 'Phone number'} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt for:', req.body.email);

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .maxTimeMS(10000);
      
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User account deactivated:', email);
      return res.status(400).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Validate password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful for:', user.email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
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
    const user = await User.findById(decoded.userId).maxTimeMS(10000);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

export default router;