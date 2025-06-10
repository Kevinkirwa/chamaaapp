# M-Chama - Digital Savings Groups Platform

A modern web application for managing traditional savings groups (Chamas) with M-PESA integration and Kenya National ID verification.

## 🌐 Live Application

**Frontend**: https://dainty-kitten-f03bb6.netlify.app  
**Backend API**: https://chamaaapp.onrender.com  
**Backend Repository**: https://github.com/Kevinkirwa/chamaaapp

## 🚀 Features

### Core Features
- **User Management**: Registration, authentication, and role-based access
- **Chama Management**: Create and join savings groups with invite codes
- **M-PESA Integration**: Secure mobile money transactions via STK Push
- **Document Verification**: Kenya National ID verification with photo uploads
- **Admin Dashboard**: Super admin and chama admin interfaces
- **Real-time Updates**: Live contribution and payout tracking
- **Group Chat**: Communication within Chama groups
- **Responsive Design**: Works on desktop and mobile devices

### Security Features
- **Document Verification**: Kenya National ID front/back photos + selfie
- **Phone Verification**: Ensure phone number is registered with the ID
- **Role-Based Access**: Different permissions for members, admins, and super admins
- **Bank-Level Security**: SSL encryption and secure M-PESA integration
- **Audit Trail**: Complete transaction and activity logging

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS (Deployed on Netlify)
- **Backend**: Node.js + Express + MongoDB (Deployed on Render)
- **Database**: MongoDB Atlas
- **Payments**: M-PESA STK Push integration
- **Authentication**: JWT tokens
- **File Storage**: Base64 encoded images for document verification

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- M-PESA Developer account (for payments)
- Kenya National ID (for Chama creation verification)

## 🛠️ Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Kevinkirwa/chamaa-app.git
cd chamaa-app
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install
```

### 3. Environment Configuration

Create `.env.local` file in the root directory for development:
```env
# Development API URL (points to local backend)
VITE_API_URL=http://localhost:3002
```

### 4. Backend Setup

The backend is deployed separately at https://github.com/Kevinkirwa/chamaaapp

For local development, clone and run the backend:
```bash
git clone https://github.com/Kevinkirwa/chamaaapp.git
cd chamaaapp
npm install
# Configure .env file with MongoDB and M-PESA credentials
npm run dev
```

## 🚀 Development

### Start Frontend Development Server
```bash
npm run dev
```

The frontend will be available at:
- Frontend: http://localhost:5173
- API calls will proxy to: http://localhost:3002 (if backend is running locally)

## 📦 Production Deployment

### Frontend (Netlify)
The frontend is automatically deployed to Netlify from this repository.

**Live URL**: https://dainty-kitten-f03bb6.netlify.app

**Deployment Configuration:**
- Build command: `npm run build`
- Publish directory: `dist`
- API proxy: All `/api/*` requests are forwarded to `https://chamaaapp.onrender.com`

### Backend (Render)
The backend is deployed separately from https://github.com/Kevinkirwa/chamaaapp

**Live API**: https://chamaaapp.onrender.com

**Backend Features:**
- API-only server (no static file serving)
- MongoDB Atlas integration
- M-PESA payment processing
- JWT authentication
- CORS configured for Netlify frontend

## 🔧 Configuration

### Frontend Environment Variables
- `VITE_API_URL`: Backend API URL (development only)

### API Endpoints

All API requests are proxied through Netlify to the backend:

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

#### Chamas
- `POST /api/chamas` - Create chama (requires verification)
- `GET /api/chamas/my-chamas` - Get user's chamas
- `POST /api/chamas/join` - Join chama with invite code
- `GET /api/chamas/:id` - Get chama details
- `POST /api/chamas/:id/finalize-ordering` - Start chama (admin only)
- `PATCH /api/chamas/:id/update-phone` - Update receiving phone number

#### Document Verification
- `POST /api/chamas/request-verification` - Submit verification documents
- `GET /api/chamas/verification-status` - Check verification status
- `PATCH /api/chamas/verification-documents` - Update documents

#### Contributions
- `POST /api/contributions` - Make contribution (STK Push)
- `GET /api/contributions/chama/:id` - Get chama contributions

#### Admin
- `POST /api/admin/setup-super-admin` - Create super admin (one-time)
- `GET /api/admin/overview` - System overview (super admin)
- `GET /api/admin/verification-requests` - Get pending verifications
- `PATCH /api/admin/verification-requests/:userId` - Approve/reject verification

## 👥 User Roles & Permissions

### 1. Super Admin
- **Creation**: One-time setup via API endpoint
- **Permissions**: Full system access
- **Features**:
  - View all users and Chamas
  - Review and approve document verifications
  - Promote users to admin roles
  - Suspend/activate accounts
  - System statistics and analytics
  - Manage all Chamas across the platform

### 2. Chama Admin
- **Creation**: Automatically assigned when creating a Chama
- **Permissions**: Admin of their specific Chama(s)
- **Features**:
  - Create new Chamas (after verification)
  - Manage Chama members
  - Start Chama (finalize member ordering)
  - View detailed contribution reports
  - Force cycle completion (emergency)
  - Share invite codes

### 3. Regular Member
- **Creation**: Default role for new registrations
- **Permissions**: Basic member access
- **Features**:
  - Join Chamas with invite codes
  - Make monthly contributions via M-PESA
  - View their Chamas and progress
  - Update phone number for receiving payments
  - Participate in group chat
  - Request verification to create Chamas

## 🆔 Document Verification Process

### Required Documents
1. **Kenya National ID (Front Photo)** - Clear photo of ID front side
2. **Kenya National ID (Back Photo)** - Clear photo of ID back side  
3. **Selfie Photo** - Clear selfie for identity verification
4. **Personal Information**:
   - 8-digit National ID number
   - Full name (as on ID)
   - Date of birth
   - Place of birth

### Verification Steps
1. **User Submits Request**: Upload documents and personal info
2. **Admin Review**: Super admin reviews documents for authenticity
3. **Phone Verification**: Admin verifies phone is registered with the ID
4. **Risk Assessment**: Admin assigns risk score (0-100)
5. **Decision**: Approve or reject with detailed notes
6. **Notification**: User notified of decision

### Document Requirements
- **Image Quality**: Clear, readable, well-lit photos
- **File Size**: Maximum 5MB per image
- **Format**: JPEG, PNG, or other image formats
- **Authenticity**: Must be genuine Kenya National ID documents

## 💳 M-PESA Integration

### STK Push Flow
1. **User Initiates**: Click "Pay KSh X" button
2. **Enter Phone**: Provide M-PESA phone number
3. **STK Push Sent**: M-PESA popup appears on phone
4. **User Pays**: Enter M-PESA PIN to complete
5. **Callback Received**: System receives payment confirmation
6. **Update Records**: Contribution marked as completed
7. **Auto Payout**: When cycle complete, automatic payout to receiver

### Payment Security
- **M-PESA Encryption**: Bank-level security
- **PIN Verification**: User must enter M-PESA PIN
- **Receipt Tracking**: Every payment has M-PESA receipt
- **Callback Verification**: System verifies payment completion

## 🔄 Chama Lifecycle

### 1. Creation Phase
- Admin creates Chama with contribution amount
- Members join using invite code
- Members set their receiving phone numbers
- Admin finalizes member ordering (random assignment)

### 2. Active Phase
- Monthly contribution cycles
- Members contribute via M-PESA STK Push
- Automatic payout when all members contribute
- Progress tracking and notifications
- Group chat communication

### 3. Cycle Management
- **Fair Ordering**: Random assignment of payout order
- **Automatic Progression**: System moves to next cycle
- **Transparency**: All members see progress and history
- **Flexibility**: Admin can force cycle completion if needed

## 🛡️ Security Features

### Authentication & Authorization
- JWT-based authentication with 7-day expiry
- Role-based access control (RBAC)
- Password hashing with bcrypt (12 rounds)
- Session management and automatic logout

### Document Security
- Secure document upload and storage
- Admin-only access to verification documents
- Audit trail for all verification decisions
- Risk assessment and scoring system

### Payment Security
- M-PESA integration with official APIs
- STK Push for secure mobile payments
- Transaction tracking and receipts
- Automatic reconciliation and error handling

### Data Protection
- CORS protection for API endpoints
- Input validation and sanitization
- Environment variable protection
- SSL/TLS encryption for all communications

## 🧪 Testing

### Frontend Testing
```bash
# Test frontend locally
npm run dev

# Build for production
npm run build
npm run preview
```

### API Testing
```bash
# Health check
curl https://chamaaapp.onrender.com/api/health

# Test endpoint
curl https://chamaaapp.onrender.com/api/test
```

### Super Admin Setup
```bash
# Create super admin (one-time setup)
curl -X POST https://chamaaapp.onrender.com/api/admin/setup-super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "email": "admin@mchama.co.ke",
    "phone": "254712345678",
    "password": "SuperSecure123!"
  }'
```

## 🚨 Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check if backend is running at https://chamaaapp.onrender.com
   - Verify Netlify proxy configuration in `netlify.toml`

2. **CORS Errors**
   - Ensure backend CORS is configured for Netlify domain
   - Check browser console for specific CORS messages

3. **Authentication Issues**
   - Check JWT token storage in localStorage
   - Verify token format and expiration

4. **Document Upload Issues**
   - Ensure images are under 5MB
   - Check image format (JPEG, PNG supported)
   - Verify base64 encoding is working

5. **M-PESA Payment Issues**
   - Verify phone number format (254XXXXXXXXX)
   - Check M-PESA account balance
   - Ensure network connectivity

### Debug Mode
- Open browser developer tools
- Check console for detailed request/response logs
- Network tab shows API call routing
- Application tab shows localStorage tokens

## 📱 Mobile Compatibility

### Responsive Design
- Mobile-first design approach
- Touch-friendly interface elements
- Optimized for various screen sizes
- Progressive Web App (PWA) features

### M-PESA Mobile Integration
- Native STK Push support
- Mobile-optimized payment flow
- SMS notifications and receipts
- Offline capability for basic features

## 🔗 Related Resources

### Documentation
- [STK Push Integration Guide](./STK_PUSH_INTEGRATION.md)
- [Super Admin Setup Guide](./SUPER_ADMIN_SETUP.md)
- [Complete STK Push Flow](./COMPLETE_STK_PUSH_FLOW.md)
- [Netlify Deployment Guide](./NETLIFY_DEPLOYMENT.md)

### External APIs
- [M-PESA Developer Portal](https://developer.safaricom.co.ke/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Netlify Documentation](https://docs.netlify.com/)
- [Render Documentation](https://render.com/docs)

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support, create an issue in the repository or contact the development team.

## 🎯 Key Features Summary

### For Users
- ✅ **Easy Registration**: Simple signup with email and phone
- ✅ **Document Verification**: Secure ID verification for Chama creation
- ✅ **Mobile Payments**: M-PESA STK Push integration
- ✅ **Group Management**: Create or join savings groups
- ✅ **Real-time Tracking**: Live progress and contribution updates
- ✅ **Group Communication**: Built-in chat for each Chama
- ✅ **Transparent Process**: Fair random ordering and automatic payouts

### For Administrators
- ✅ **Document Review**: Comprehensive ID verification system
- ✅ **User Management**: Promote, suspend, and manage users
- ✅ **System Analytics**: Complete overview of platform usage
- ✅ **Chama Oversight**: Monitor all savings groups
- ✅ **Security Controls**: Risk assessment and fraud prevention
- ✅ **Audit Trails**: Complete logging of all activities

### For Developers
- ✅ **Modern Stack**: React, Node.js, MongoDB, TypeScript
- ✅ **API-First**: RESTful API with comprehensive endpoints
- ✅ **Scalable Architecture**: Microservices-ready design
- ✅ **Security Best Practices**: JWT, CORS, input validation
- ✅ **Documentation**: Comprehensive guides and examples
- ✅ **Testing**: Built-in testing and debugging tools

---

**Live Application**: https://dainty-kitten-f03bb6.netlify.app  
**API Documentation**: https://chamaaapp.onrender.com/api/health  
**Repository**: https://github.com/Kevinkirwa/chamaa-app