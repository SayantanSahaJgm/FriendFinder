# 🚀 Complete Render Deployment Guide for FriendFinder

## ✅ Current Email Configuration Fixed

Your SendGrid email setup is now properly configured in `.env.local`:
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key_here
```

**Removed duplicate Gmail configuration** to prevent conflicts.

---

## 🌐 Render Deployment - Socket.IO Configuration

### Your Production URL
```
https://friendfinder-vscode.onrender.com
```

### Step 1: Update Next.js App for Production

Create/update your `.env.production` file on Render with these **exact values**:

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://sahasayantan13jgm_db_user:SAYantan13@cluster0.y3t5eun.mongodb.net/?appName=Cluster0

# NextAuth Configuration
NEXTAUTH_SECRET=b4f5c3d9a1e7f6b0c2d4e8f8193a7c5d6e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3
NEXTAUTH_URL=https://friendfinder-vscode.onrender.com

# Socket.IO Configuration (CRITICAL - Use HTTPS and port 443)
NEXT_PUBLIC_SOCKET_URL=https://friendfinder-vscode.onrender.com
NEXT_PUBLIC_SOCKET_PORT=443
SOCKET_PORT=10000

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

# Socket.IO Allowed Origins (for production CORS)
SOCKET_ALLOWED_ORIGINS=https://friendfinder-vscode.onrender.com
```

### Step 2: Configure Render Services

You need **TWO services** on Render:

#### Service 1: Next.js Web App
1. **Service Type:** Web Service
2. **Name:** friendfinder-vscode
3. **Build Command:**
   ```bash
   npm install && npm run build
   ```
4. **Start Command:**
   ```bash
   npm start
   ```
5. **Environment Variables:** (Add all variables from above)

#### Service 2: Socket.IO Server
1. **Service Type:** Web Service
2. **Name:** friendfinder-socketio
3. **Build Command:**
   ```bash
   npm install
   ```
4. **Start Command:**
   ```bash
   node server.js
   ```
5. **Port:** `10000` (Render assigns this automatically)
6. **Environment Variables:**
   ```bash
   PORT=10000
   SOCKET_PORT=10000
   NODE_ENV=production
   SOCKET_ALLOWED_ORIGINS=https://friendfinder-vscode.onrender.com
   MONGODB_URI=mongodb+srv://sahasayantan13jgm_db_user:SAYantan13@cluster0.y3t5eun.mongodb.net/?appName=Cluster0
   ```

### Step 3: Update Socket.IO Client Configuration

The Socket.IO client in your app needs to connect to the correct URL in production. Update the Socket.IO initialization:

**File: `src/hooks/useSocket.ts` or wherever you initialize Socket.IO client**

```typescript
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3004';
const SOCKET_PORT = process.env.NEXT_PUBLIC_SOCKET_PORT || '3004';

const socket = io(SOCKET_URL, {
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  // In production, port is handled by the URL (443 for HTTPS)
  // Don't specify port separately when using https://
  ...(process.env.NODE_ENV === 'production' 
    ? {} 
    : { port: parseInt(SOCKET_PORT) }
  ),
});
```

### Step 4: Alternative - Single Service Deployment (Recommended)

If you want to run both Next.js and Socket.IO on the **same Render service**, update `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "node start-all.js",
    "start:next": "next start",
    "start:socket": "node server.js"
  }
}
```

Create `start-all.js`:
```javascript
const { spawn } = require('child_process');

// Start Socket.IO server on internal port
const socketServer = spawn('node', ['server.js'], {
  env: { ...process.env, SOCKET_PORT: '3004' },
  stdio: 'inherit'
});

// Start Next.js server on Render's PORT
const nextServer = spawn('npm', ['run', 'start:next'], {
  stdio: 'inherit'
});

socketServer.on('close', (code) => {
  console.log(`Socket.IO server exited with code ${code}`);
  process.exit(code);
});

nextServer.on('close', (code) => {
  console.log(`Next.js server exited with code ${code}`);
  process.exit(code);
});
```

With this approach:
- **Render Port:** Uses `process.env.PORT` (assigned by Render, typically 10000)
- **Socket.IO Internal:** Runs on `localhost:3004`
- **Client Connection:** Uses `https://friendfinder-vscode.onrender.com` (proxied through Next.js)

---

## 📋 Deployment Checklist

### Pre-Deployment
- [x] SendGrid email configured (no more duplicate configs)
- [ ] Update `.env.production` on Render dashboard
- [ ] Update Socket.IO client to use `NEXT_PUBLIC_SOCKET_URL`
- [ ] Test locally with production-like settings
- [ ] Commit and push changes to GitHub

### Render Dashboard Setup
- [ ] Create/update web service: `friendfinder-vscode`
- [ ] Set build command: `npm install && npm run build`
- [ ] Set start command: `npm start`
- [ ] Add all environment variables
- [ ] Enable automatic deploys from `main` branch
- [ ] Set custom domain (if needed)

### Post-Deployment Testing
- [ ] Visit: https://friendfinder-vscode.onrender.com
- [ ] Test user registration (email should arrive via SendGrid)
- [ ] Test Socket.IO connection (check browser console)
- [ ] Test random chat feature
- [ ] Check Render logs for errors

---

## 🐛 Troubleshooting

### Email Not Sending
**Check:**
1. Render logs: `Failed to send email` errors
2. SendGrid dashboard: Recent Activity → See if emails were attempted
3. Verify `EMAIL_PASSWORD` is correct in Render environment variables

**Fix:**
```bash
# In Render dashboard, update:
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key_here
```

### Socket.IO Connection Failed
**Symptoms:** Browser console shows `WebSocket connection failed`

**Check:**
1. Client is using HTTPS URL: `https://friendfinder-vscode.onrender.com`
2. Not using port `3004` in production (use port `443` or omit)
3. `SOCKET_ALLOWED_ORIGINS` includes your Render URL

**Fix:**
```bash
# Update environment variables on Render:
NEXT_PUBLIC_SOCKET_URL=https://friendfinder-vscode.onrender.com
NEXT_PUBLIC_SOCKET_PORT=443
SOCKET_ALLOWED_ORIGINS=https://friendfinder-vscode.onrender.com
```

### CORS Errors
**Symptoms:** `Access-Control-Allow-Origin` errors in browser

**Fix:** Update `server.js` allowed origins:
```javascript
const allowedOrigins = [
  'https://friendfinder-vscode.onrender.com',
  process.env.NEXTAUTH_URL
].filter(Boolean);
```

### MongoDB Connection Issues
**Check:** Render logs for `MongoServerError`

**Fix:**
1. Verify MongoDB Atlas allows Render's IP (add `0.0.0.0/0` to whitelist)
2. Check `MONGODB_URI` is correct in Render environment variables
3. Ensure database user has read/write permissions

---

## 🧪 Local Testing with Production Config

Before deploying, test with production-like settings:

```bash
# 1. Update .env.local temporarily
NEXT_PUBLIC_SOCKET_URL=http://localhost:3004
NEXT_PUBLIC_SOCKET_PORT=3004

# 2. Start both servers
npm run dev
# In another terminal:
node server.js

# 3. Test registration at http://localhost:3000/register
# 4. Check email arrives (SendGrid)
# 5. Test Socket.IO features
```

---

## 📊 Monitoring

### Render Logs
```bash
# View logs in Render dashboard or use Render CLI:
render logs friendfinder-vscode

# For Socket.IO server logs:
render logs friendfinder-socketio
```

### SendGrid Dashboard
- Check: https://app.sendgrid.com/stats
- View email delivery rates
- Check for bounces/spam reports

### Health Checks
Your Socket.IO server has a health endpoint:
```bash
curl https://friendfinder-vscode.onrender.com:10000/health
```

---

## 🎯 Quick Commands

### Deploy to Render
```bash
# Push to GitHub (triggers auto-deploy):
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

### Test Email Sending
```bash
# Once deployed, test the email config:
curl https://friendfinder-vscode.onrender.com/api/auth/test
```

### Restart Services
From Render dashboard:
1. Go to your service
2. Click "Manual Deploy" → "Clear build cache & deploy"

---

## ✅ Success Indicators

When everything is working:
- ✅ User registration sends email (check spam folder)
- ✅ Browser console shows: `Socket.IO connected: <socket-id>`
- ✅ Random chat matches users successfully
- ✅ No CORS errors in browser console
- ✅ Render logs show: `Socket.IO server running on port 10000`

---

## 🆘 Need Help?

If issues persist:
1. Check Render logs: Dashboard → Logs tab
2. Check browser console: F12 → Console tab
3. Test email config: `/api/auth/test` endpoint
4. Verify environment variables in Render dashboard

**Common Issue:** Socket.IO clients connecting to `http://` instead of `https://`
**Fix:** Ensure `NEXT_PUBLIC_SOCKET_URL=https://friendfinder-vscode.onrender.com` in Render environment variables.
