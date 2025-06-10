# M-Chama API Documentation

Complete API reference for the M-Chama digital savings platform.

**Live API Base URL**: https://chamaaapp.onrender.com  
**Frontend Application**: https://dainty-kitten-f03bb6.netlify.app

## 🔗 Base URLs

- **Production API**: `https://chamaaapp.onrender.com`
- **Development API**: `http://localhost:3002`
- **Frontend**: `https://dainty-kitten-f03bb6.netlify.app`

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <jwt_token>
```

### Getting a Token
Tokens are obtained through login and are valid for 7 days.

## 📋 API Endpoints

### Health & Status

#### GET /api/health
Check API server status.

**Response:**
```json
{
  "status": "API Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production",
  "database": "MongoDB Atlas",
  "port": 3002,
  "cors": "Enabled"
}
```

#### GET /api/test
Test API connectivity.

**Response:**
```json
{
  "message": "M-Chama API is working!",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production",
  "server": "M-Chama API v1.0"
}
```

---

## 👤 Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "254712345678",
  "password": "securepassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "254712345678",
    "role": "member",
    "isActive": true,
    "canCreateChamas": false
  }
}
```

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "254712345678",
    "role": "member"
  }
}
```

### GET /api/auth/me
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "254712345678",
    "role": "member",
    "canCreateChamas": false,
    "isVerified": false
  }
}
```

---

## 🏠 Chama Management Endpoints

### POST /api/chamas
Create a new Chama (requires verification).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Family Savings Group",
  "description": "Monthly savings for family goals",
  "contributionAmount": 5000
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Chama created successfully",
  "chama": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "Family Savings Group",
    "description": "Monthly savings for family goals",
    "contributionAmount": 5000,
    "inviteCode": "ABC123",
    "currentCycle": 1,
    "admin": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": [...]
  }
}
```

**Response (Verification Required):**
```json
{
  "success": false,
  "message": "You need verification with valid Kenya National ID documents to create Chamas.",
  "requiresVerification": true
}
```

### GET /api/chamas/my-chamas
Get user's Chamas (as admin or member).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "chamas": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Family Savings Group",
      "description": "Monthly savings for family goals",
      "contributionAmount": 5000,
      "currentCycle": 3,
      "admin": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "memberCount": 8,
      "totalContributed": 6,
      "totalRequired": 8,
      "isAdmin": true
    }
  ]
}
```

### POST /api/chamas/join
Join a Chama using invite code.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "inviteCode": "ABC123",
  "receivingPhone": "254712345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully joined chama",
  "chama": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "Family Savings Group",
    "members": [...]
  }
}
```

### GET /api/chamas/:chamaId
Get detailed Chama information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "chama": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "Family Savings Group",
    "description": "Monthly savings for family goals",
    "contributionAmount": 5000,
    "currentCycle": 3,
    "inviteCode": "ABC123",
    "isOrderingFinalized": true,
    "admin": {...},
    "members": [...],
    "isAdmin": false
  },
  "contributions": [...],
  "payouts": [...],
  "stats": {
    "totalContributed": 6,
    "totalRequired": 8,
    "currentReceiver": {...},
    "cycleProgress": 75
  }
}
```

### POST /api/chamas/:chamaId/finalize-ordering
Start the Chama by finalizing member ordering (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Member ordering finalized successfully",
  "chama": {
    "isOrderingFinalized": true,
    "orderingDate": "2024-01-15T10:30:00.000Z",
    "currentReceiver": "60f7b3b3b3b3b3b3b3b3b3b3",
    "members": [...]
  }
}
```

### PATCH /api/chamas/:chamaId/update-phone
Update receiving phone number for M-PESA payouts.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "receivingPhone": "254798765432"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Receiving phone number updated successfully"
}
```

---

## 🆔 Document Verification Endpoints

### POST /api/chamas/request-verification
Submit documents for Chama creation verification.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "nationalId": "12345678",
  "fullName": "John Doe Mwangi",
  "dateOfBirth": "1990-01-15",
  "placeOfBirth": "Nairobi, Kenya",
  "idFrontPhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "idBackPhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "selfiePhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification request with documents submitted successfully. An admin will review your documents and verify your identity.",
  "verificationProgress": 80
}
```

### GET /api/chamas/verification-status
Check current verification status.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "canCreateChamas": false,
  "verificationRequest": {
    "status": "pending",
    "requestedAt": "2024-01-15T10:30:00.000Z",
    "nationalId": {
      "idNumber": "12345678",
      "fullName": "John Doe Mwangi"
    }
  },
  "verificationProgress": 80,
  "hasCompleteDocuments": true,
  "role": "member"
}
```

### PATCH /api/chamas/verification-documents
Update verification documents.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "idFrontPhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "idBackPhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "selfiePhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Documents updated successfully",
  "verificationProgress": 100
}
```

---

## 💳 Contribution Endpoints

### POST /api/contributions
Make a contribution via M-PESA STK Push.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "chamaId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "phoneNumber": "254712345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "STK Push initiated successfully. Please complete payment on your phone.",
  "contribution": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "user": "60f7b3b3b3b3b3b3b3b3b3b3",
    "chama": "60f7b3b3b3b3b3b3b3b3b3b3",
    "cycle": 3,
    "amount": 5000,
    "status": "processing",
    "phoneNumber": "254712345678"
  },
  "checkoutRequestId": "ws_CO_15012024103000123456"
}
```

### GET /api/contributions/chama/:chamaId
Get user's contributions for a specific Chama.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "contributions": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "chama": {
        "name": "Family Savings Group",
        "contributionAmount": 5000
      },
      "cycle": 3,
      "amount": 5000,
      "status": "completed",
      "mpesaCode": "MPS123456789",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### GET /api/contributions/:contributionId/status
Check contribution payment status.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "contribution": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "status": "completed",
    "mpesaCode": "MPS123456789",
    "transactionDate": "2024-01-15T10:35:00.000Z",
    "chama": {
      "name": "Family Savings Group"
    }
  }
}
```

---

## 💰 Payout Endpoints

### GET /api/payouts/chama/:chamaId
Get payouts for a specific Chama.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "payouts": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "recipient": {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "254798765432"
      },
      "chama": {
        "name": "Family Savings Group",
        "contributionAmount": 5000
      },
      "cycle": 2,
      "amount": 40000,
      "status": "completed",
      "mpesaCode": "MPX987654321",
      "createdAt": "2024-01-10T15:20:00.000Z"
    }
  ]
}
```

### GET /api/payouts/my-payouts
Get user's received payouts.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "payouts": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "chama": {
        "name": "Family Savings Group",
        "contributionAmount": 5000
      },
      "cycle": 1,
      "amount": 40000,
      "status": "completed",
      "mpesaCode": "MPX987654321",
      "createdAt": "2024-01-05T12:00:00.000Z"
    }
  ]
}
```

---

## 👑 Admin Endpoints

### POST /api/admin/setup-super-admin
Create the super admin account (one-time setup).

**Request Body:**
```json
{
  "name": "Super Admin",
  "email": "admin@mchama.co.ke",
  "phone": "254712345678",
  "password": "SuperSecure123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Super admin created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "Super Admin",
    "email": "admin@mchama.co.ke",
    "role": "super_admin",
    "canCreateChamas": true
  }
}
```

### GET /api/admin/overview
Get system overview (super admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "overview": {
    "totalUsers": 1250,
    "totalChamas": 89,
    "totalContributions": 2340,
    "totalPayouts": 156,
    "totalContributionAmount": 11750000,
    "totalPayoutAmount": 7800000,
    "systemBalance": 3950000,
    "pendingVerifications": 12,
    "verifiedUsers": 234,
    "verificationRate": 87,
    "roleDistribution": [
      {"_id": "member", "count": 1100},
      {"_id": "chama_creator", "count": 140},
      {"_id": "admin", "count": 9},
      {"_id": "super_admin", "count": 1}
    ]
  }
}
```

### GET /api/admin/verification-requests
Get pending verification requests (admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): Filter by status (pending, approved, rejected)

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "254712345678",
      "verificationRequest": {
        "status": "pending",
        "requestedAt": "2024-01-15T10:30:00.000Z",
        "nationalId": {
          "idNumber": "12345678",
          "fullName": "John Doe Mwangi"
        }
      },
      "verificationProgress": 80
    }
  ]
}
```

### PATCH /api/admin/verification-requests/:userId
Approve or reject verification request (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "action": "approve",
  "adminNotes": "Documents verified successfully",
  "riskScore": 25,
  "phoneVerified": true,
  "phoneOwnerName": "John Doe Mwangi"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification request approved successfully",
  "user": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "canCreateChamas": true,
    "isVerified": true,
    "role": "chama_creator"
  }
}
```

---

## 💬 Group Chat Endpoints

### GET /api/chamas/:chamaId/messages
Get messages for a Chama group chat.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Messages per page (default: 50)

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "sender": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "content": "Hello everyone! Ready for this month's contribution?",
      "messageType": "text",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 3,
    "total": 127
  }
}
```

### POST /api/chamas/:chamaId/messages
Send a message to Chama group chat.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "Thanks for the reminder! I'll pay today."
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "sender": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "content": "Thanks for the reminder! I'll pay today.",
    "messageType": "text",
    "createdAt": "2024-01-15T10:35:00.000Z"
  }
}
```

---

## 📱 M-PESA Callback Endpoints

### POST /api/mpesa/callback/contribution
M-PESA STK Push callback (internal use).

**Request Body:**
```json
{
  "Body": {
    "stkCallback": {
      "CheckoutRequestID": "ws_CO_15012024103000123456",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {"Name": "Amount", "Value": 5000},
          {"Name": "MpesaReceiptNumber", "Value": "MPS123456789"},
          {"Name": "PhoneNumber", "Value": "254712345678"},
          {"Name": "TransactionDate", "Value": 20240115103500}
        ]
      }
    }
  }
}
```

**Response:**
```json
{
  "ResultCode": 0,
  "ResultDesc": "Callback processed successfully"
}
```

---

## 🚨 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **422 Unprocessable Entity**: Validation error
- **500 Internal Server Error**: Server error

### Example Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Access token required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You need verification with valid Kenya National ID documents to create Chamas.",
  "requiresVerification": true
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "All fields are required (name, email, phone, password)"
}
```

---

## 🔧 Rate Limiting

- **Authentication endpoints**: 5 requests per minute per IP
- **General API**: 100 requests per minute per user
- **File uploads**: 10 requests per minute per user
- **M-PESA callbacks**: No rate limiting (internal use)

## 📝 Request/Response Headers

### Required Headers
```
Content-Type: application/json
Authorization: Bearer <jwt_token> (for protected endpoints)
```

### Response Headers
```
Content-Type: application/json
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

---

## 🧪 Testing the API

### Using curl

**Health Check:**
```bash
curl https://chamaaapp.onrender.com/api/health
```

**Register User:**
```bash
curl -X POST https://chamaaapp.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "254700000000",
    "password": "test123"
  }'
```

**Login:**
```bash
curl -X POST https://chamaaapp.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

**Get User Chamas:**
```bash
curl -X GET https://chamaaapp.onrender.com/api/chamas/my-chamas \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using JavaScript (Frontend)

```javascript
// Login and get token
const loginResponse = await fetch('https://chamaaapp.onrender.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test123'
  })
});

const { token } = await loginResponse.json();

// Use token for authenticated requests
const chamasResponse = await fetch('https://chamaaapp.onrender.com/api/chamas/my-chamas', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const chamas = await chamasResponse.json();
```

---

## 🔗 Related Resources

- **Frontend Application**: https://dainty-kitten-f03bb6.netlify.app
- **Backend Repository**: https://github.com/Kevinkirwa/chamaaapp
- **Frontend Repository**: https://github.com/Kevinkirwa/chamaa-app
- **M-PESA Developer Portal**: https://developer.safaricom.co.ke/

---

This API documentation provides complete reference for integrating with the M-Chama platform. For additional support or questions, please refer to the main documentation or create an issue in the repository.