# Deploy M-Chama Frontend to Netlify from chamaaapp Repository

## 🎯 Goal
Deploy the frontend to Netlify directly from https://github.com/Kevinkirwa/chamaaapp repository while keeping the backend on Render.

## 📋 Netlify Configuration

### 1. Connect Repository to Netlify

1. **Go to Netlify Dashboard**: https://app.netlify.com
2. **Click "Add new site"** → "Import an existing project"
3. **Connect to Git**: Choose GitHub
4. **Select Repository**: `Kevinkirwa/chamaaapp`
5. **Configure Build Settings**:

### 2. Build Settings

```
Build command: npm run build
Publish directory: dist
```

### 3. Environment Variables (Optional)

**No environment variables needed** - the proxy handles everything!

But if you want to test locally with the live backend:
```
VITE_API_URL = https://chamaaapp.onrender.com
```

### 4. Deploy Settings

**Branch to deploy**: `main` (or your default branch)

## 📁 Required Files in chamaaapp Repository

Make sure these files exist in your `chamaaapp` repository:

### 1. `netlify.toml` (Root directory)
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "https://chamaaapp.onrender.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[dev]
  command = "npm run dev"
  port = 5173
  publish = "dist"
```

### 2. `package.json` (Root directory)
Make sure it has these scripts:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "client": "vite",
    "server": "cd server && npm run dev",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 3. Frontend Files Structure
```
chamaaapp/
├── src/                 # React frontend source
├── public/              # Public assets
├── server/              # Backend code (ignored by Netlify)
├── package.json         # Frontend dependencies
├── vite.config.ts       # Vite configuration
├── netlify.toml         # Netlify configuration
├── tailwind.config.js   # Tailwind CSS config
└── tsconfig.json        # TypeScript config
```

## 🚀 Deployment Steps

### Step 1: Prepare Repository
Ensure your `chamaaapp` repository has:
- ✅ Frontend code in root directory
- ✅ `netlify.toml` file
- ✅ `package.json` with build scripts
- ✅ All frontend dependencies

### Step 2: Deploy to Netlify
1. **Site Settings**:
   - Repository: `https://github.com/Kevinkirwa/chamaaapp`
   - Branch: `main`
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Deploy**: Click "Deploy site"

### Step 3: Verify Deployment
- ✅ Frontend loads at your Netlify URL
- ✅ API calls work (check browser console)
- ✅ Authentication works
- ✅ All features functional

## 🔧 Architecture After Deployment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Browser  │───▶│  Netlify CDN    │───▶│  Render API     │
│                 │    │  (Frontend)     │    │  (Backend)      │
│                 │    │                 │    │                 │
│  React App      │    │  Static Files   │    │  Node.js API    │
│  JavaScript     │    │  + Proxy        │    │  MongoDB        │
│  CSS/HTML       │    │                 │    │  M-PESA         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📝 Key Points

1. **Single Repository**: Both frontend and backend in `chamaaapp`
2. **Netlify**: Builds and serves frontend only
3. **Render**: Runs backend API only
4. **Proxy**: Netlify forwards `/api/*` to Render
5. **No Environment Variables**: Proxy handles routing

## 🚨 Important Notes

- **Backend Ignored**: Netlify only builds frontend, ignores `server/` folder
- **API Proxy**: All `/api/*` requests go to `chamaaapp.onrender.com`
- **CORS**: Backend must allow requests from Netlify domain
- **Build Time**: Only frontend dependencies are installed

## ✅ Success Checklist

- [ ] Repository connected to Netlify
- [ ] Build settings configured
- [ ] `netlify.toml` file present
- [ ] Frontend builds successfully
- [ ] API proxy working
- [ ] Authentication functional
- [ ] All features working

## 🔗 URLs After Deployment

- **Frontend**: `https://your-site-name.netlify.app`
- **Backend**: `https://chamaaapp.onrender.com`
- **API Calls**: `https://your-site-name.netlify.app/api/*` → `https://chamaaapp.onrender.com/api/*`