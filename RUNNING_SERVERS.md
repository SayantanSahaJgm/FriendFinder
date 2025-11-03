# Running FriendFinder with Real-Time Features

## 🚀 Quick Start

To run FriendFinder with full real-time features (Socket.IO), you need to run **TWO servers**:

### 1. Next.js Dev Server (Port 3000)
```bash
npm run dev
```

### 2. Socket.IO Server (Port 3004)
```bash
node server.js
```

## 📋 Step-by-Step Setup

### Option A: Run Both Servers Separately

**Terminal 1 - Next.js:**
```bash
npm run dev
```

**Terminal 2 - Socket.IO:**
```bash
node server.js
```

### Option B: Run Both with One Command (PowerShell)

```powershell
# Start Socket.IO server in background
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "server.js"

# Start Next.js dev server
npm run dev
```

### Option C: Create a Startup Script

Create `start-dev.ps1`:
```powershell
# Start Socket.IO server
Write-Host "Starting Socket.IO server..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "server.js"

# Wait a moment for Socket.IO to start
Start-Sleep -Seconds 2

# Start Next.js dev server
Write-Host "Starting Next.js dev server..." -ForegroundColor Green
npm run dev
```

Then run:
```powershell
.\start-dev.ps1
```

## ✅ Verify Everything is Running

### 1. Check Socket.IO Server
Open: http://localhost:3005/health

Should return:
```json
{
  "status": "healthy",
  "connections": 0,
  "uptime": "0m 15s",
  "port": 3004
}
```

### 2. Check Next.js Dev Server
Open: http://localhost:3000

Should show the FriendFinder homepage.

### 3. Check Socket Connection
Go to: http://localhost:3000/dashboard/random-chat

Should show:
- ✅ **Badge: "Online"** (green)
- ✅ No "Offline" alert
- ✅ No connection errors

## 🔧 Troubleshooting

### Issue: "Offline" showing in Random Chat

**Problem**: Socket.IO server not running

**Solution**:
```bash
node server.js
```

**Verify**: Check http://localhost:3005/health

---

### Issue: "Forbidden" in Socket.IO logs

**Problem**: CORS configuration blocking connections

**Solution**: The server already whitelists localhost:3000, but if you see this:
1. Check `server.js` allowed origins
2. Make sure you're accessing from `localhost:3000` (not 127.0.0.1 or IP)

---

### Issue: "Connection retrying..." forever

**Symptoms**:
- Retry count keeps increasing
- Transport: websocket
- Status: connecting

**Solutions**:

1. **Restart Socket.IO server:**
   ```bash
   # Kill existing node processes
   Stop-Process -Name "node" -Force
   
   # Start fresh
   node server.js
   ```

2. **Check environment variables:**
   - `.env.local` should have: `NEXT_PUBLIC_SOCKET_URL=http://localhost:3000`

3. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete`
   - Clear cookies and cached files
   - Or use Incognito mode

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

---

### Issue: White text not visible

**Problem**: Text colors not adapting to dark/light mode

**Solution**: Already fixed in the latest version! The text now has proper contrast:
- Light mode: Dark text
- Dark mode: Light text

---

## 🌐 Production Deployment (Render)

On Render, you need to set up environment variables:

### Required Environment Variables:

```bash
# Database
MONGODB_URI=your-mongodb-uri

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-app-name.onrender.com

# Socket.IO (IMPORTANT!)
NEXT_PUBLIC_SOCKET_URL=https://your-app-name.onrender.com

# Node Environment
NODE_ENV=production
```

### How to Add on Render:

1. Go to Render Dashboard
2. Select your service
3. Click **Environment** tab
4. Add each variable
5. Click **Save Changes**

Render will auto-deploy and restart your app.

## 🎯 Feature Status by Server

### Next.js Server (Port 3000)
- ✅ Login/Authentication
- ✅ User profiles
- ✅ Dashboard
- ✅ Friend requests
- ✅ Basic messaging
- ✅ All pages and routes

### Socket.IO Server (Port 3004)
- ✅ Real-time messaging
- ✅ Random chat
- ✅ Live presence (online/offline)
- ✅ WebRTC signaling
- ✅ Notifications
- ✅ Live updates

## 💡 Tips

### Auto-Start Both Servers on Windows Startup

Create a batch file `start-friendfinder.bat`:
```batch
@echo off
start "Socket.IO Server" node server.js
timeout /t 2
start "Next.js Dev Server" npm run dev
```

### Monitor Both Servers

Use two terminal windows/tabs:
- **Terminal 1**: Socket.IO logs (connection events, errors)
- **Terminal 2**: Next.js logs (page requests, API calls)

### Check if Servers are Running

**Socket.IO:**
```powershell
Get-Process -Name "node" | Where-Object {$_.Path -like "*server.js*"}
```

**Next.js:**
```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

## 🔒 Security Notes

### Development (Localhost):
- ✅ CORS allows localhost:3000
- ✅ No authentication required for socket connection
- ✅ All transports enabled (websocket, polling)

### Production (Render):
- ✅ CORS restricted to your domain
- ✅ Socket authentication via JWT
- ✅ HTTPS only
- ✅ Proper error handling

## 📊 Port Reference

| Service | Port | URL |
|---------|------|-----|
| Next.js Dev | 3000 | http://localhost:3000 |
| Socket.IO | 3004 | ws://localhost:3004 |
| Socket.IO Health | 3005 | http://localhost:3005/health |

## 🆘 Still Having Issues?

1. **Check both servers are running:**
   ```powershell
   Get-Process -Name "node"
   ```

2. **Check ports are available:**
   ```powershell
   Get-NetTCPConnection -LocalPort 3000,3004 -State Listen
   ```

3. **Restart everything:**
   ```powershell
   Stop-Process -Name "node" -Force
   node server.js  # Terminal 1
   npm run dev     # Terminal 2
   ```

4. **Check browser console (F12):**
   - Look for Socket.IO connection errors
   - Check Network tab for failed requests

---

**Last Updated**: November 3, 2025
**Status**: ✅ Both visual issues fixed, server running instructions added
