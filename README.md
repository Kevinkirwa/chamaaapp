# M-Chama - Digital Savings Groups Platform

A modern web application for managing traditional savings groups (Chamas) with M-PESA integration.

## 🚀 Features

- **User Management**: Registration, authentication, and role-based access
- **Chama Management**: Create and join savings groups
- **M-PESA Integration**: Secure mobile money transactions
- **Admin Dashboard**: Super admin and chama admin interfaces
- **Real-time Updates**: Live contribution and payout tracking
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS (Deployed on Netlify)
- **Backend**: Node.js + Express + MongoDB (Deployed on Render)
- **Database**: MongoDB Atlas
- **Payments**: M-PESA STK Push integration
- **Authentication**: JWT tokens

## 🌐 Live Deployment

- **Frontend**: https://dainty-kitten-f03bb6.netlify.app
- **Backend API**: https://chamaaapp.onrender.com
- **Backend Repository**: https://github.com/Kevinkirwa/chamaaapp

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- M-PESA Developer account (for payments)

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

**Deployment Configuration:**
- Build command: `npm run build`
- Publish directory: `dist`
- API proxy: All `/api/*` requests are forwarded to `https://chamaaapp.onrender.com`

### Backend (Render)
The backend is deployed separately from https://github.com/Kevinkirwa/chamaaapp

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
- `POST /api/chamas` - Create chama
- `GET /api/chamas/my-chamas` - Get user's chamas
- `POST /api/chamas/join` - Join chama with invite code
- `GET /api/chamas/:id` - Get chama details

#### Contributions
- `POST /api/contributions` - Make contribution
- `GET /api/contributions/chama/:id` - Get chama contributions

#### Admin
- `POST /api/admin/setup-super-admin` - Create super admin
- `GET /api/admin/overview` - System overview

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- Environment variable protection

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

4. **Build Errors**
   - Clear node_modules and reinstall dependencies
   - Check for TypeScript errors

### Debug Mode
- Open browser developer tools
- Check console for detailed request/response logs
- Network tab shows API call routing

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

## 🔗 Related Repositories

- **Backend**: https://github.com/Kevinkirwa/chamaaapp
- **Frontend**: https://github.com/Kevinkirwa/chamaa-app (this repository)