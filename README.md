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

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **Database**: MongoDB Atlas
- **Payments**: M-PESA STK Push integration
- **Authentication**: JWT tokens

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- M-PESA Developer account (for payments)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd mchama-app
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..
```

### 3. Environment Configuration

Create `.env` file in the `server` directory:
```bash
cp .env.example server/.env
```

Configure the following variables in `server/.env`:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/mchama

# JWT Secret
JWT_SECRET=your-super-secure-jwt-secret-key

# Server Configuration
PORT=3002
NODE_ENV=development

# M-PESA Configuration
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_SHORTCODE=your-business-shortcode
MPESA_PASSKEY=your-mpesa-passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
```

### 4. MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Add your IP address to the whitelist

### 5. M-PESA Setup (Optional for development)

1. Register at [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create a new app
3. Get your Consumer Key and Consumer Secret
4. Configure STK Push settings

## 🚀 Development

### Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually:
# Frontend only
npm run client

# Backend only  
npm run server
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3002
- API Health Check: http://localhost:3002/api/health

### Create Super Admin
```bash
curl -X POST http://localhost:3002/api/admin/setup-super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "email": "admin@mchama.co.ke", 
    "phone": "254712345678",
    "password": "securepassword123"
  }'
```

## 📦 Production Deployment

### Option 1: Single Server Deployment

1. **Build the application:**
```bash
npm run build
```

2. **Start production server:**
```bash
cd server
NODE_ENV=production npm start
```

The server will serve both the API and the React app on port 3002.

### Option 2: Docker Deployment

1. **Build and run with Docker:**
```bash
docker build -t mchama-app .
docker run -p 3002:3002 --env-file server/.env mchama-app
```

2. **Or use Docker Compose:**
```bash
docker-compose up -d
```

### Option 3: Separate Frontend/Backend Deployment

#### Frontend (Netlify/Vercel)
1. Build: `npm run build`
2. Deploy `dist` folder
3. Configure API proxy in `netlify.toml` or `vercel.json`

#### Backend (Railway/Render/DigitalOcean)
1. Deploy `server` folder
2. Set environment variables
3. Ensure MongoDB Atlas connectivity

## 🔧 Configuration

### Environment Variables

#### Server (.env)
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 3002)
- `NODE_ENV`: Environment (development/production)
- `MPESA_*`: M-PESA configuration variables

#### Frontend (.env.local)
- `VITE_API_URL`: Backend API URL (development only)

### CORS Configuration

The server is configured to accept requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative dev port)
- `http://localhost:4173` (Vite preview)
- Production domains (configure in server.js)

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Chamas
- `POST /api/chamas` - Create chama
- `GET /api/chamas/my-chamas` - Get user's chamas
- `POST /api/chamas/join` - Join chama with invite code
- `GET /api/chamas/:id` - Get chama details

### Contributions
- `POST /api/contributions` - Make contribution
- `GET /api/contributions/chama/:id` - Get chama contributions

### Admin
- `POST /api/admin/setup-super-admin` - Create super admin
- `GET /api/admin/overview` - System overview
- `GET /api/admin/users` - Manage users
- `GET /api/admin/chamas` - Manage chamas

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- Rate limiting (recommended for production)
- Environment variable protection

## 🧪 Testing

### Manual Testing
1. Register a new user
2. Create a chama
3. Join chama with invite code
4. Make contributions
5. Test admin functions

### API Testing
```bash
# Health check
curl http://localhost:3002/api/health

# Test endpoint
curl http://localhost:3002/api/test
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check if backend is running on port 3002
   - Verify CORS configuration in server.js

2. **Database Connection**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure network connectivity

3. **Authentication Issues**
   - Check JWT_SECRET configuration
   - Verify token storage in localStorage

4. **M-PESA Integration**
   - Verify M-PESA credentials
   - Check callback URL configuration
   - Test in sandbox environment first

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and logging.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support, email support@mchama.co.ke or create an issue in the repository.