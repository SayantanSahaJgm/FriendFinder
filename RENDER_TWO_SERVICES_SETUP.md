# 🚀 Render Deployment: Two Separate Services Setup

## Overview

This guide shows you how to deploy FriendFinder using **two separate services** on Render:
1. **Next.js Frontend** - Main web application
2. **Socket.IO Backend** - Real-time communication server

---

## 📋 Prerequisites

- ✅ GitHub repository pushed to: https://github.com/SayantanSahaJgm/FriendFinder.git
- ✅ Render account created
- ✅ MongoDB Atlas database ready
- ✅ SendGrid API key ready

---

## 🎯 Step 1: Create Socket.IO Backend Service

### 1.1 Create New Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `SayantanSahaJgm/FriendFinder`

### 1.2 Configure Socket.IO Service

| Setting | Value |
|---------|-------|
| **Name** | `friendfinder-socketio` |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | Leave empty |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free or Starter |

### 1.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://sahasayantan13jgm_db_user:SAYantan13@cluster0.y3t5eun.mongodb.net/?appName=Cluster0

# Node Environment
NODE_ENV=production

# Socket.IO Port (Render auto-assigns PORT, but keep this as fallback)
SOCKET_PORT=10000

# Allowed Origins (Your Next.js frontend URL - will add after creating it)
SOCKET_ALLOWED_ORIGINS=https://friendfinder-vscode.onrender.com

# Debug (optional - set to 1 for debugging)
SOCKET_DEBUG=0
SOCKET_DEBUG_UPGRADE=0
```

### 1.4 Deploy Socket.IO Service
1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. **Note your Socket.IO URL**: `https://friendfinder-socketio.onrender.com`

---

## 🎯 Step 2: Create Next.js Frontend Service

### 2.1 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect the same GitHub repository

### 2.2 Configure Next.js Service

| Setting | Value |
|---------|-------|
| **Name** | `friendfinder-vscode` |
| **Region** | Same as Socket.IO service |
| **Branch** | `main` |
| **Root Directory** | Leave empty |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free or Starter |

### 2.3 Add Environment Variables

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://sahasayantan13jgm_db_user:SAYantan13@cluster0.y3t5eun.mongodb.net/?appName=Cluster0

# NextAuth Configuration
NEXTAUTH_SECRET=b4f5c3d9a1e7f6b0c2d4e8f8193a7c5d6e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3
NEXTAUTH_URL=https://friendfinder-vscode.onrender.com

# Socket.IO Configuration - CRITICAL!
NEXT_PUBLIC_SOCKET_URL=https://friendfinder-socketio.onrender.com
NEXT_PUBLIC_SOCKET_PORT=443

# Email Service (SendGrid)
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

# Node Environment
NODE_ENV=production
```

### 2.4 Deploy Next.js Service
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. **Your app URL**: `https://friendfinder-vscode.onrender.com`

---

## 🔧 Step 3: Update Socket.IO CORS Settings

After both services are deployed, update the Socket.IO service to allow the Next.js frontend:

### 3.1 Update Socket.IO Environment Variables

Go to Socket.IO service → **"Environment"** → Add/Update:

```bash
SOCKET_ALLOWED_ORIGINS=https://friendfinder-vscode.onrender.com
```

### 3.2 Trigger Redeploy
1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Wait for redeploy to complete

---

## ✅ Step 4: Verify Everything Works

### 4.1 Check Socket.IO Health

Open your browser and visit:
```
https://friendfinder-socketio.onrender.com/health
```

You should see:
```json
{
  "status": "healthy",
  "totalConnections": 0,
  "activeConnections": 0,
  "errorCount": 0,
  "uptime": 123456
}
```

### 4.2 Test Your Application

1. **Open**: https://friendfinder-vscode.onrender.com
2. **Register a new account** (test email delivery)
3. **Open browser console** (F12) and look for:
   ```
   Socket.IO connected: <socket-id>
   ```
4. **Test random chat** feature
5. **Check for errors** in console

---

## 📊 Configuration Summary

### Your Service URLs
| Service | URL |
|---------|-----|
| **Next.js App** | https://friendfinder-vscode.onrender.com |
| **Socket.IO Server** | https://friendfinder-socketio.onrender.com |
| **Socket.IO Health** | https://friendfinder-socketio.onrender.com/health |

### Port Configuration Explained

| Variable | Frontend | Socket.IO Backend | Explanation |
|----------|----------|-------------------|-------------|
| `NEXT_PUBLIC_SOCKET_URL` | ✅ `https://friendfinder-socketio.onrender.com` | ❌ Not needed | Frontend connects to Socket.IO |
| `NEXT_PUBLIC_SOCKET_PORT` | ✅ `443` | ❌ Not needed | HTTPS always uses port 443 |
| `SOCKET_PORT` | ❌ Not needed | ✅ `10000` | Fallback only (Render uses `PORT`) |
| `PORT` | ✅ Auto-assigned | ✅ Auto-assigned | Render sets this automatically |

### Critical: Backend Port Binding

Your `server.js` already has the **correct configuration**:

```javascript
// ✅ CORRECT - Already in your server.js
const SOCKET_PORT = process.env.PORT || process.env.SOCKET_PORT || 3004;

socketServer.listen(SOCKET_PORT, (err) => {
  if (err) {
    console.error(`Failed to start Socket.IO server on port ${SOCKET_PORT}:`, err);
    process.exit(1);
  }
  console.log(`✅ Socket.IO server running on port ${SOCKET_PORT}`);
});
```

**Why this works:**
- `process.env.PORT` - Render automatically assigns this (e.g., 10000)
- `process.env.SOCKET_PORT` - Your fallback (10000)
- `3004` - Local development fallback

---

## 🐛 Troubleshooting

### Issue 1: Socket.IO Connection Failed

**Symptoms:**
```
Browser console: WebSocket connection to 'wss://friendfinder-socketio.onrender.com/socket.io/' failed
```

**Solution:**
1. Check Socket.IO service logs in Render dashboard
2. Verify `SOCKET_ALLOWED_ORIGINS` includes your Next.js URL
3. Ensure Socket.IO service is running (not suspended)

**Check:**
```bash
# Frontend environment variable
NEXT_PUBLIC_SOCKET_URL=https://friendfinder-socketio.onrender.com

# Backend environment variable
SOCKET_ALLOWED_ORIGINS=https://friendfinder-vscode.onrender.com
```

### Issue 2: CORS Error

**Symptoms:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
Update Socket.IO service environment:
```bash
SOCKET_ALLOWED_ORIGINS=https://friendfinder-vscode.onrender.com,https://www.friendfinder-vscode.onrender.com
```

### Issue 3: Email Not Sending

**Symptoms:**
```
Render logs: Error: Invalid login: 535 Authentication failed
```

**Solution:**
1. Verify SendGrid API key in Render environment variables
2. Check SendGrid dashboard for recent activity
3. Test locally first:
   ```bash
   curl https://friendfinder-vscode.onrender.com/api/auth/test
   ```

### Issue 4: MongoDB Connection Timeout

**Symptoms:**
```
MongoServerError: connection timeout
```

**Solution:**
1. Go to MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (allows all IPs - Render uses dynamic IPs)
3. Wait 2-3 minutes for changes to propagate

### Issue 5: Service Suspended (Free Tier)

**Symptoms:**
```
Service spins down after 15 minutes of inactivity
```

**Solution:**
- Render Free tier auto-sleeps
- First request takes 30-60 seconds to wake up
- Upgrade to Starter plan for always-on services
- Or use a cron job to ping your services every 10 minutes

---

## 🔍 Monitoring & Logs

### View Socket.IO Logs
1. Go to Render dashboard
2. Select `friendfinder-socketio` service
3. Click **"Logs"** tab
4. Look for:
   ```
   ✅ Socket.IO server running on port 10000
   📊 Socket.IO ready for connections
   ```

### View Next.js Logs
1. Select `friendfinder-vscode` service
2. Click **"Logs"** tab
3. Look for:
   ```
   ✓ Ready in 2.5s
   - Local: http://localhost:3000
   ```

### Monitor Health
Create a simple monitoring script:

```bash
# health-check.sh
#!/bin/bash
curl -s https://friendfinder-socketio.onrender.com/health | jq
curl -s https://friendfinder-vscode.onrender.com/api/health | jq
```

---

## 🚀 Deployment Workflow

### Automatic Deploys (Recommended)

Both services are configured for auto-deploy:
1. Push to `main` branch: `git push origin main`
2. Render automatically detects changes
3. Both services redeploy (5-10 minutes)

### Manual Deploy

From Render dashboard:
1. Select service
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Or **"Clear build cache & deploy"** if needed

---

## 💰 Cost Estimation

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Next.js Frontend | Free | $0 |
| Socket.IO Backend | Free | $0 |
| MongoDB Atlas | M0 Free | $0 |
| SendGrid | Free (100/day) | $0 |
| **Total** | | **$0** |

**Limitations on Free Tier:**
- Services spin down after 15 minutes of inactivity
- 750 hours/month per service
- Limited bandwidth and build minutes

**Upgrade to Starter ($7/month each):**
- Always-on services
- Faster build times
- More bandwidth

---

## ✅ Post-Deployment Checklist

- [ ] Socket.IO service deployed and running
- [ ] Next.js service deployed and running
- [ ] Health endpoint returns `{"status": "healthy"}`
- [ ] Browser console shows `Socket.IO connected`
- [ ] User registration sends email
- [ ] Random chat connects users
- [ ] No CORS errors in console
- [ ] MongoDB connection stable
- [ ] Google OAuth working
- [ ] All environment variables set

---

## 🎉 Success!

Once everything is working:
- **Frontend**: https://friendfinder-vscode.onrender.com
- **Socket.IO**: https://friendfinder-socketio.onrender.com
- **Health Check**: https://friendfinder-socketio.onrender.com/health

Your app is now live with:
✅ Email verification (SendGrid)
✅ Real-time chat (Socket.IO)
✅ Google OAuth login
✅ Bluetooth proximity features
✅ Random chat matching

---

## 📞 Support

**Common URLs:**
- Render Dashboard: https://dashboard.render.com/
- MongoDB Atlas: https://cloud.mongodb.com/
- SendGrid Dashboard: https://app.sendgrid.com/
- GitHub Repo: https://github.com/SayantanSahaJgm/FriendFinder

**Need Help?**
1. Check Render logs first
2. Check browser console (F12)
3. Test health endpoints
4. Verify environment variables
