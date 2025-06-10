import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './database/connection.js';
import authRoutes from './routes/auth.js';
import chamaRoutes from './routes/chamas.js';
import contributionRoutes from './routes/contributions.js';
import payoutRoutes from './routes/payouts.js';
import adminRoutes from './routes/admin.js';
import mpesaService from './services/mpesaService.js';

// Load environment variables first
dotenv.config();

console.log('🔧 Starting M-Chama API Server...');
console.log('📊 Environment:', process.env.NODE_ENV || 'development');

// Connect to MongoDB Atlas
connectDB();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
console.log('⚙️ Setting up middleware...');

// CORS configuration for production API server
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000', 
      'http://localhost:4173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:4173',
      'https://dainty-kitten-f03bb6.netlify.app'
    ];

    // Add production domains if specified
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'No Origin'}`);
  
  if (req.method === 'POST' && req.body && Object.keys(req.body).length > 0) {
    console.log('📝 Request body keys:', Object.keys(req.body));
  }
  
  next();
});

// Health check endpoint (before other routes)
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({ 
    status: 'API Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'MongoDB Atlas',
    port: PORT,
    cors: 'Enabled',
    mode: 'API-only',
    routes: {
      auth: '/api/auth',
      chamas: '/api/chamas',
      contributions: '/api/contributions',
      payouts: '/api/payouts',
      admin: '/api/admin'
    }
  });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint accessed');
  res.json({
    message: 'M-Chama API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    server: 'M-Chama API v1.0',
    database: 'MongoDB Atlas',
    cors: 'Enabled',
    origin: req.get('Origin') || 'No Origin',
    mode: 'API-only (Frontend served separately)'
  });
});

// API Routes
console.log('🛣️ Setting up API routes...');

app.use('/api/auth', authRoutes);
app.use('/api/chamas', chamaRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/admin', adminRoutes);

console.log('✅ API routes configured:');
console.log('   - /api/auth (authentication)');
console.log('   - /api/chamas (chama management)');
console.log('   - /api/contributions (contributions)');
console.log('   - /api/payouts (payouts)');
console.log('   - /api/admin (admin management)');

// ENHANCED M-PESA callback endpoints - Handle REAL Safaricom responses
app.post('/api/mpesa/callback/contribution', async (req, res) => {
  try {
    console.log('📥 REAL Safaricom Contribution Callback received:', JSON.stringify(req.body, null, 2));
    
    // Handle both possible callback formats from Safaricom
    const callbackData = req.body.Body?.stkCallback || req.body.stkCallback || req.body;
    
    if (!callbackData) {
      console.error('❌ Invalid callback format received');
      return res.json({ 
        ResultCode: 1, 
        ResultDesc: 'Invalid callback format' 
      });
    }

    // Process the real Safaricom callback
    await mpesaService.handleContributionCallback(callbackData);
    
    // Respond to Safaricom with success
    res.json({ 
      ResultCode: 0, 
      ResultDesc: 'Callback processed successfully' 
    });
  } catch (error) {
    console.error('❌ Error processing Safaricom M-PESA callback:', error);
    
    // Still respond with success to Safaricom to avoid retries
    res.json({ 
      ResultCode: 0, 
      ResultDesc: 'Callback received but processing failed' 
    });
  }
});

app.post('/api/mpesa/callback/payout/result', async (req, res) => {
  try {
    console.log('📥 REAL Safaricom Payout Result received:', JSON.stringify(req.body, null, 2));
    
    const { Result } = req.body;
    if (Result) {
      await mpesaService.handlePayoutCallback(Result);
    }
    
    res.json({ 
      ResultCode: 0, 
      ResultDesc: 'Result processed successfully' 
    });
  } catch (error) {
    console.error('❌ Error processing payout result:', error);
    res.json({ 
      ResultCode: 0, 
      ResultDesc: 'Result received but processing failed' 
    });
  }
});

app.post('/api/mpesa/callback/payout/timeout', async (req, res) => {
  try {
    console.log('📥 REAL Safaricom Payout Timeout received:', JSON.stringify(req.body, null, 2));
    
    res.json({ 
      ResultCode: 0, 
      ResultDesc: 'Timeout processed successfully' 
    });
  } catch (error) {
    console.error('❌ Error processing payout timeout:', error);
    res.json({ 
      ResultCode: 0, 
      ResultDesc: 'Timeout received but processing failed' 
    });
  }
});

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    name: 'M-Chama API',
    version: '1.0.0',
    description: 'Digital Savings Groups Platform API',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      auth: '/api/auth',
      chamas: '/api/chamas',
      contributions: '/api/contributions',
      payouts: '/api/payouts',
      admin: '/api/admin'
    },
    frontend: process.env.FRONTEND_URL || 'https://dainty-kitten-f03bb6.netlify.app',
    documentation: 'https://github.com/Kevinkirwa/chamaa-app'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  console.log('❌ 404 - API route not found:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /api/health',
      'GET /api/test',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'POST /api/chamas',
      'GET /api/chamas/my-chamas',
      'POST /api/admin/setup-super-admin'
    ]
  });
});

// Catch-all for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'This is an API server. Frontend is served separately.',
    frontend: process.env.FRONTEND_URL || 'https://dainty-kitten-f03bb6.netlify.app',
    api: {
      health: '/api/health',
      test: '/api/test'
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ================================');
  console.log(`🚀 M-Chama API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: MongoDB Atlas`);
  console.log(`💳 M-PESA service configured for REAL callbacks`);
  console.log(`🌐 CORS enabled for frontend`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`👑 Setup Super Admin: POST http://localhost:${PORT}/api/admin/setup-super-admin`);
  console.log(`📱 M-PESA Callbacks:`);
  console.log(`   - Contribution: ${process.env.MPESA_CALLBACK_URL || 'http://localhost:3002'}/api/mpesa/callback/contribution`);
  console.log(`   - Payout Result: ${process.env.MPESA_CALLBACK_URL || 'http://localhost:3002'}/api/mpesa/callback/payout/result`);
  console.log(`   - Payout Timeout: ${process.env.MPESA_CALLBACK_URL || 'http://localhost:3002'}/api/mpesa/callback/payout/timeout`);
  console.log(`🎯 Mode: API-only (Frontend served separately)`);
  console.log(`🌍 Frontend URL: ${process.env.FRONTEND_URL || 'https://dainty-kitten-f03bb6.netlify.app'}`);
  console.log(`📱 Ready to process REAL Safaricom M-PESA callbacks`);
  console.log('🚀 ================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});