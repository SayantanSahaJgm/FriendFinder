# FriendFinder - Complete Setup Guide

## 🚀 Quick Start

Your app requires **TWO servers** to run properly:
1. **Next.js Server** (port 3000) - Main web application
2. **Socket.IO Server** (port 3004) - Real-time features (chat, video calls, presence)

## ⚙️ Environment Variables Setup

Your `.env.local` has been configured with:

### ✅ Email Service (Gmail)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=sahasayantan13jgm@gmail.com
EMAIL_PASSWORD=qegrhwyfdbnxcsje
```

**Note:** The email password is a Gmail App Password (spaces removed). Keep it secure!

### ✅ Google OAuth
```env
GOOGLE_CLIENT_ID=33609981157-quglpp7pigrmfq7pflj1m1atkjod9ruq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### ✅ Socket.IO Configuration
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3004
NEXT_PUBLIC_SOCKET_PORT=3004
SOCKET_PORT=3004
```

## 🔧 How to Run the App

### Option 1: Run Both Servers Together (Recommended)

```bash
npm run dev:full
```

This command starts:
- Next.js on port 3000
- Socket.IO server on port 3004
- Health monitor

### Option 2: Run Servers Separately

**Terminal 1 - Next.js:**
```bash
npm run dev
```

**Terminal 2 - Socket.IO:**
```bash
npm run dev:socket
```
or
```bash
node server.js
```

## 🩺 Troubleshooting Socket/WebSocket Errors

### Common Error: "WebSocket connection failed"

**Symptoms:**
- Console shows: `Socket connection error`
- Chat/video calls don't work
- Real-time features unavailable

**Solutions:**

1. **Make sure Socket.IO server is running:**
   ```bash
   # Check if port 3004 is in use
   netstat -ano | findstr :3004
   
   # If nothing shows, start the socket server
   node server.js
   ```

2. **Verify both servers are running:**
   - Visit `http://localhost:3000` - Should show Next.js app
   - Visit `http://localhost:3004` - Should show "Cannot GET /" (this is OK!)
   
3. **Check Socket Health:**
   - Go to your app dashboard
   - Look for "Socket.IO Connection Health" indicator
   - Should show "Connected" in green

4. **Clear browser cache and reload:**
   ```bash
   # PowerShell
   Ctrl + Shift + Delete
   
   # Or hard refresh
   Ctrl + Shift + R
   ```

### Error: "CORS policy blocked"

**Fix:** Update `server.js` to allow your origin:
```javascript
// Already configured in your server.js:
cors: {
  origin: ["http://localhost:3000", "http://localhost:3001"],
  methods: ["GET", "POST"],
  credentials: true
}
```

### Error: "Auth token invalid"

**Fix:** Make sure you're logged in. Socket.IO requires authentication:
1. Register/Login to your account
2. Socket will auto-connect after authentication
3. Check browser console for "Socket connected: [id]"

## 📹 Video Call (VCall) Setup

Video calls use **WebRTC** + **Socket.IO** for signaling.

### How it works:
1. User A calls User B
2. Socket.IO sends "call-user" event
3. WebRTC peer connection established
4. Video/audio streams shared

### Common VCall Issues:

#### Issue: "Camera/Microphone not working"

**Solution:**
1. **Grant permissions:** Browser will ask for camera/mic access
2. **Check device:** Open browser settings → Privacy → Camera/Mic
3. **Test in browser:**
   ```javascript
   // Open DevTools console and run:
   navigator.mediaDevices.getUserMedia({ video: true, audio: true })
     .then(stream => console.log('✅ Devices working!', stream))
     .catch(err => console.error('❌ Device error:', err))
   ```

#### Issue: "Peer connection failed"

**Solutions:**
1. **Check Socket.IO is connected** (see above)
2. **Both users must be online**
3. **Refresh both browsers**
4. **Check firewall settings** - Allow WebRTC ports

#### Issue: "Cannot hear/see other person"

**Debug steps:**
```javascript
// In browser console:
// Check if streams are active
window.localStream?.getTracks().forEach(t => console.log(t.label, t.enabled))
window.remoteStream?.getTracks().forEach(t => console.log(t.label, t.enabled))
```

### Testing Video Calls:

1. **Open two browser tabs/windows:**
   - Tab 1: Login as User A
   - Tab 2: Login as User B (use incognito/different browser)

2. **Make them friends:**
   - Send friend request
   - Accept request

3. **Start video call:**
   - Go to Chat page
   - Click video camera icon
   - Accept call on other tab

## 🔐 Security Configuration

### Google OAuth Setup:

If you need to update Google OAuth settings:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. APIs & Services → Credentials
4. Click your OAuth 2.0 Client ID
5. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   http://localhost:3001
   https://your-production-domain.com
   ```
6. **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-production-domain.com/api/auth/callback/google
   ```

### Email Service Setup:

If emails aren't sending:

1. **Verify Gmail App Password:**
   - Go to Google Account → Security
   - 2-Step Verification (must be enabled)
   - App Passwords → Generate new
   - Use the 16-character password (no spaces)

2. **Test email in terminal:**
   ```bash
   # Run test script (if available)
   npm run test:email
   ```

## 📊 Monitoring & Health Checks

### Check System Health:

Visit these endpoints:
- **API Health:** `http://localhost:3000/api/health`
- **Socket Health:** `http://localhost:3000/api/socket-health`

### View Connection Status:

In your app dashboard, you'll see:
- ✅ Green: Connected & working
- 🟡 Yellow: Connecting/Fallback mode
- 🔴 Red: Disconnected

### Enable Debug Mode:

Add to `.env.local`:
```env
# Enable detailed logging
SOCKET_DEBUG=1
SOCKET_DEBUG_UPGRADE=1
NODE_ENV=development
```

Then restart servers and check terminal logs.

## 📝 Common npm Scripts

```bash
# Development
npm run dev                 # Next.js only (port 3000)
npm run dev:socket          # Socket.IO only (port 3004)
npm run dev:full            # Both servers + health monitor

# Production Build
npm run build              # Build Next.js app
npm start                  # Start production server

# Testing
npm test                   # Run all tests
npm run test:watch         # Watch mode
npm run test:e2e          # End-to-end tests

# Maintenance
npm run lint              # Check code quality
npm run type-check        # TypeScript validation
```

## 🐛 Still Having Issues?

### Quick Diagnosis:

1. **Check if servers are running:**
   ```bash
   # PowerShell
   Get-NetTCPConnection -LocalPort 3000,3004
   
   # Or use Task Manager → Performance → Open Resource Monitor → Network
   ```

2. **View browser console:**
   - Press F12
   - Go to Console tab
   - Look for errors (red text)
   - Share error messages for help

3. **Check server logs:**
   - Look at terminal where `npm run dev:full` is running
   - Socket.IO logs show connection attempts
   - Share relevant error logs

4. **Restart everything:**
   ```bash
   # Stop all servers (Ctrl+C in terminals)
   # Clear Next.js cache
   rm -rf .next
   
   # Reinstall dependencies (if needed)
   npm install
   
   # Start fresh
   npm run dev:full
   ```

## 🎯 Feature Checklist

After setup, verify these work:

- [ ] User registration with OTP email
- [ ] Email verification (check inbox)
- [ ] Google Sign-In
- [ ] Login to dashboard
- [ ] Socket.IO connected (green indicator)
- [ ] Send/receive chat messages
- [ ] Video call with friend
- [ ] Real-time location on map
- [ ] Friend requests

## 🚀 Production Deployment

When deploying to Render/Railway/Vercel:

1. **Add all environment variables** to deployment platform
2. **Ensure WebSocket support is enabled** (Render/Railway support it)
3. **Update URLs:**
   ```env
   NEXTAUTH_URL=https://your-app.onrender.com
   NEXT_PUBLIC_SOCKET_URL=https://your-app.onrender.com
   ```
4. **Set Google OAuth redirect URIs** to production domain
5. **Use production email service** (SendGrid recommended over Gmail)

## 📚 Additional Resources

- **Socket.IO Docs:** https://socket.io/docs/v4/
- **WebRTC Docs:** https://webrtc.org/getting-started/overview
- **Next.js Auth:** https://next-auth.js.org/
- **Google OAuth:** https://developers.google.com/identity/protocols/oauth2

---

**Need Help?** Check these files in your project:
- `SOCKET_IO_IMPLEMENTATION_SUMMARY.md` - Socket.IO architecture
- `RANDOM_CHAT_IMPLEMENTATION.md` - Chat features
- `EMAIL_VERIFICATION_SETUP.md` - Email setup guide

**Current Status:** ✅ Email configured | ✅ Google OAuth configured | ⚠️ Socket server needs to be running
