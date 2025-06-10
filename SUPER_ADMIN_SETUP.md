# Super Admin Setup & User Management Guide

## 🚀 Quick Setup Guide

### Step 1: Create Super Admin (One-time setup)

**Method 1: Using curl (Recommended)**
```bash
curl -X POST https://chamaaapp.onrender.com/api/admin/setup-super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "email": "admin@mchama.co.ke",
    "phone": "254712345678",
    "password": "SuperSecure123!"
  }'
```

**Method 2: Using Postman/Insomnia**
- URL: `https://chamaaapp.onrender.com/api/admin/setup-super-admin`
- Method: `POST`
- Body (JSON):
```json
{
  "name": "Super Admin",
  "email": "admin@mchama.co.ke", 
  "phone": "254712345678",
  "password": "SuperSecure123!"
}
```

**Method 3: Using Browser Console**
```javascript
fetch('https://chamaaapp.onrender.com/api/admin/setup-super-admin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Super Admin',
    email: 'admin@mchama.co.ke',
    phone: '254712345678',
    password: 'SuperSecure123!'
  })
}).then(r => r.json()).then(console.log);
```

### Step 2: Login as Super Admin
1. Go to your Netlify site: `https://dainty-kitten-f03bb6.netlify.app`
2. Click "Get Started" or "Sign In"
3. Use the super admin credentials:
   - Email: `admin@mchama.co.ke`
   - Password: `SuperSecure123!`
4. You'll be redirected to the Super Admin Dashboard

## 🎯 User Flow After Login

### Super Admin Flow
```
Login → Dashboard → Click "Super Admin" tab → Full system control
```
**Features:**
- View all users and Chamas
- Promote users to admin
- Suspend/activate accounts
- System statistics
- Manage all Chamas

### Chama Admin Flow  
```
Login → Dashboard → Create/Manage Chamas → Admin features for their Chamas
```
**Features:**
- Create new Chamas
- Manage their Chama members
- View contribution details
- Share invite codes
- Force cycle completion

### Regular Member Flow
```
Login → Dashboard → Join Chamas → Make contributions
```
**Features:**
- Join Chamas with invite codes
- Make monthly contributions
- View their Chamas and progress
- Update phone number for M-PESA

## 🔄 How Users Get Different Roles

### 1. Super Admin
- **Created once** using the setup endpoint
- **Cannot be created** through normal registration
- **Full system access**

### 2. Chama Admin
**Method A: Create a Chama**
- Any user who creates a Chama automatically becomes its admin
- They get admin powers for that specific Chama

**Method B: Promotion by Super Admin**
- Super Admin can promote any user to "admin" role
- This gives them general admin privileges

### 3. Regular Member
- **Default role** for all new registrations
- Can join multiple Chamas
- Can be promoted by Super Admin

## 🎛️ Navigation Based on Role

### Super Admin Navigation
```
Dashboard | Super Admin | Logout
```

### Chama Admin Navigation  
```
Dashboard | Admin Panel | Logout
```

### Regular Member Navigation
```
Dashboard | Logout
```

## 📱 Complete User Journey Examples

### Example 1: Setting up the system
1. **Deploy backend** to Render
2. **Deploy frontend** to Netlify  
3. **Create super admin** using API
4. **Login as super admin** → Full control

### Example 2: Chama Admin creates group
1. **Register** as regular user
2. **Login** → Goes to Dashboard
3. **Click "Create Chama"** → Becomes admin of that Chama
4. **Share invite code** with friends
5. **Manage contributions** and payouts

### Example 3: Member joins group
1. **Register** as regular user
2. **Login** → Goes to Dashboard  
3. **Click "Join Chama"** → Enter invite code
4. **Set phone number** for M-PESA
5. **Make contributions** monthly

## 🔧 Technical Implementation

### Role-Based Routing
```typescript
// Layout.tsx automatically shows different navigation
{(user?.role === 'admin' || user?.role === 'super_admin') && (
  <button onClick={() => navigate('/admin')}>
    <Shield className="w-4 h-4" />
    <span>{user.role === 'super_admin' ? 'Super Admin' : 'Admin Panel'}</span>
  </button>
)}
```

### Dashboard Redirection
```typescript
// After login, users go to appropriate dashboard
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/auth" />;
  
  // All authenticated users go to /dashboard
  // Navigation shows role-appropriate options
  return <Layout>{children}</Layout>;
};
```

### Role Checking
```typescript
// Backend middleware checks roles
export const requireAdmin = (req, res, next) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  next();
};
```

## 🚨 Security Features

### 1. Role-Based Access Control
- **Frontend**: Navigation hidden based on role
- **Backend**: API endpoints protected by role middleware
- **Database**: User roles stored securely

### 2. Super Admin Protection
- **One-time setup**: Can only create if none exists
- **Cannot self-demote**: Super admin cannot deactivate themselves
- **Secure creation**: Requires direct API call

### 3. Chama Admin Scope
- **Limited scope**: Only admin of their own Chamas
- **Member management**: Can only manage their Chama members
- **No system access**: Cannot access other Chamas or users

## ✅ Testing the System

### 1. Test Super Admin
```bash
# Create super admin
curl -X POST https://chamaaapp.onrender.com/api/admin/setup-super-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Admin","email":"test@admin.com","phone":"254700000000","password":"test123"}'

# Login and check dashboard access
```

### 2. Test Chama Admin
1. Register normal user
2. Create a Chama
3. Check admin features appear
4. Share invite code

### 3. Test Regular Member  
1. Register normal user
2. Join Chama with invite code
3. Make contribution
4. Check member features

## 🎯 Key Points

1. **Single Login Page**: Everyone uses the same login form
2. **Role-Based Redirection**: System automatically shows appropriate dashboard
3. **Progressive Permissions**: Users can gain admin rights by creating Chamas
4. **Secure Super Admin**: Requires API call to create, full system control
5. **Scoped Admin Powers**: Chama admins only control their own groups

The system is designed to be simple for users but powerful for administrators! 🚀