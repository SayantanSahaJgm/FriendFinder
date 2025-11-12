# 🚀 Render Deployment Checklist - Two Services

## Pre-Deployment

### ✅ Code Verification
- [x] `server.js` uses `process.env.PORT || process.env.SOCKET_PORT || 3004`
- [x] Email configuration fixed (SendGrid only, no duplicates)
- [x] `.env.production` template created
- [x] Git repository pushed to GitHub

### 📦 Prepare Repository
```powershell
# Commit all changes
git add .
git commit -m "Prepare for Render deployment with two services"
git push origin main
```

---

## Deployment Steps

### Step 1️⃣: Deploy Socket.IO Service

#### Create Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect repository: `SayantanSahaJgm/FriendFinder`

#### Configure Service
```
Name: friendfinder-socketio
Branch: main
Build Command: npm install
Start Command: node server.js
```

#### Add Environment Variables
```bash
MONGODB_URI=mongodb+srv://sahasayantan13jgm_db_user:SAYantan13@cluster0.y3t5eun.mongodb.net/?appName=Cluster0
NODE_ENV=production
SOCKET_PORT=10000
SOCKET_ALLOWED_ORIGINS=https://friendfinder-vscode.onrender.com
```

#### Deploy & Verify
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (3-5 min)
- [ ] Check logs for: `✅ Socket.IO server running on port 10000`
- [ ] Note URL: `https://friendfinder-socketio.onrender.com`
- [ ] Test health: `curl https://friendfinder-socketio.onrender.com/health`

---

### Step 2️⃣: Deploy Next.js Frontend

#### Create Service
1. Click **"New +"** → **"Web Service"**
2. Connect same repository: `SayantanSahaJgm/FriendFinder`

#### Configure Service
```
Name: friendfinder-vscode
Branch: main
Build Command: npm install && npm run build
Start Command: npm start
```

#### Add Environment Variables
```bash
# Database
MONGODB_URI=mongodb+srv://sahasayantan13jgm_db_user:SAYantan13@cluster0.y3t5eun.mongodb.net/?appName=Cluster0

# Auth
NEXTAUTH_SECRET=b4f5c3d9a1e7f6b0c2d4e8f8193a7c5d6e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3
NEXTAUTH_URL=https://friendfinder-vscode.onrender.com

# Socket.IO - CRITICAL!
NEXT_PUBLIC_SOCKET_URL=https://friendfinder-socketio.onrender.com
NEXT_PUBLIC_SOCKET_PORT=443

# Email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key_here

# Google OAuth
GOOGLE_CLIENT_ID=33609981157-quglpp7pigrmfq7pflj1m1atkjod9ruq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBCXR087zCXzt7eQOP7_Zl1ZdJyXWXKIcI

# Environment
NODE_ENV=production
```

#### Deploy & Verify
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (5-10 min)
- [ ] Check logs for: `✓ Ready in X.Xs`
- [ ] Note URL: `https://friendfinder-vscode.onrender.com`

---

### Step 3️⃣: Verify Integration

#### Test Socket.IO Health
```powershell
curl https://friendfinder-socketio.onrender.com/health
```

Expected:
```json
{"status":"healthy","totalConnections":0,"activeConnections":0}
```

#### Test Frontend
- [ ] Open: https://friendfinder-vscode.onrender.com
- [ ] Page loads without errors
- [ ] Open browser console (F12)
- [ ] Look for: `Socket.IO connected: <id>`
- [ ] No errors like "WebSocket connection failed"

#### Test Features
- [ ] Register new user (email should arrive)
- [ ] Login works
- [ ] Random chat connects
- [ ] No CORS errors in console

---

## Post-Deployment

### MongoDB Atlas Configuration
- [ ] Go to MongoDB Atlas → Network Access
- [ ] Add IP: `0.0.0.0/0` (Allow all - Render uses dynamic IPs)
- [ ] Verify database connection in logs

### SendGrid Configuration
- [ ] Check SendGrid dashboard for email activity
- [ ] Verify API key is active
- [ ] Test email: Register a test user

### Google OAuth Configuration
- [ ] Go to Google Cloud Console
- [ ] Add authorized redirect URI: `https://friendfinder-vscode.onrender.com/api/auth/callback/google`
- [ ] Test Google login

---

## Monitoring

### Check Service Status
| Service | URL | Status |
|---------|-----|--------|
| Frontend | https://friendfinder-vscode.onrender.com | [ ] Live |
| Socket.IO | https://friendfinder-socketio.onrender.com | [ ] Live |
| Health | https://friendfinder-socketio.onrender.com/health | [ ] Healthy |

### View Logs
**Socket.IO Service:**
```
Render Dashboard → friendfinder-socketio → Logs

Look for:
✅ Socket.IO server running on port 10000
📊 Socket.IO ready for connections
```

**Next.js Service:**
```
Render Dashboard → friendfinder-vscode → Logs

Look for:
✓ Ready in X.Xs
- Local: http://localhost:3000
```

---

## Troubleshooting

### ❌ Socket.IO Connection Failed

**Check:**
1. Browser console error message
2. Socket.IO service logs
3. Environment variables:
   ```bash
   # Frontend
   NEXT_PUBLIC_SOCKET_URL=https://friendfinder-socketio.onrender.com
   
   # Backend
   SOCKET_ALLOWED_ORIGINS=https://friendfinder-vscode.onrender.com
   ```

### ❌ CORS Error

**Fix:**
Update Socket.IO service environment:
```bash
SOCKET_ALLOWED_ORIGINS=https://friendfinder-vscode.onrender.com
```
Then: **Manual Deploy** → **Deploy latest commit**

### ❌ Email Not Sending

**Check:**
1. SendGrid API key is correct
2. EMAIL_HOST=smtp.sendgrid.net
3. EMAIL_PORT=587
4. Check SendGrid dashboard for blocks

### ❌ Build Failed

**Common Causes:**
- Missing dependencies in package.json
- TypeScript errors
- Environment variable syntax errors

**Fix:**
1. Check build logs in Render dashboard
2. Test build locally: `npm run build`
3. Fix errors and push: `git push origin main`

---

## Configuration Reference

### Port Configuration

| Variable | Frontend | Backend | Value |
|----------|----------|---------|-------|
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | ❌ | `https://friendfinder-socketio.onrender.com` |
| `NEXT_PUBLIC_SOCKET_PORT` | ✅ | ❌ | `443` |
| `SOCKET_PORT` | ❌ | ✅ | `10000` (fallback) |
| `PORT` | Auto | Auto | Render assigns (e.g., 10000) |

### CORS Configuration

**Backend (Socket.IO):**
```bash
SOCKET_ALLOWED_ORIGINS=https://friendfinder-vscode.onrender.com
```

**Frontend connects to:**
```bash
NEXT_PUBLIC_SOCKET_URL=https://friendfinder-socketio.onrender.com
```

---

## Success Criteria

### ✅ All Systems Go

When deployment is successful:

1. **Services Running:**
   - Frontend: Live (green badge)
   - Backend: Live (green badge)

2. **Browser Console:**
   ```
   ✅ Socket.IO connected: a1b2c3d4
   ```

3. **Health Endpoint:**
   ```json
   {"status": "healthy"}
   ```

4. **Features Working:**
   - User registration sends email
   - Login successful
   - Random chat connects
   - Real-time messaging works

5. **No Errors:**
   - No CORS errors
   - No WebSocket failures
   - No 500 server errors

---

## Next Steps

### Auto-Deploy Setup
- [x] Both services connected to GitHub
- [ ] Enable auto-deploy on push to main
- [ ] Test by making a small commit

### Domain Setup (Optional)
- [ ] Purchase custom domain
- [ ] Add to Render: **Settings** → **Custom Domain**
- [ ] Update DNS records
- [ ] Update environment variables with new domain

### Monitoring Setup
- [ ] Set up Render alerts
- [ ] Monitor service health
- [ ] Check logs regularly
- [ ] Set up uptime monitoring (UptimeRobot, etc.)

---

## 🎉 Deployment Complete!

Your FriendFinder app is now live with:
- ✅ Two separate services (scalable architecture)
- ✅ Email verification via SendGrid
- ✅ Real-time chat via Socket.IO
- ✅ Google OAuth login
- ✅ MongoDB Atlas database
- ✅ HTTPS secure connections

**URLs:**
- **App:** https://friendfinder-vscode.onrender.com
- **Socket.IO:** https://friendfinder-socketio.onrender.com
- **Health:** https://friendfinder-socketio.onrender.com/health

---

## 📚 Documentation

- [x] `RENDER_TWO_SERVICES_SETUP.md` - Complete setup guide
- [x] `SOCKET_IO_RENDER_SETUP.md` - Quick reference
- [x] `.env.production` - Production environment template
- [x] `DEPLOYMENT_CHECKLIST.md` - This file

**Need help?** Check the troubleshooting sections in these guides!
