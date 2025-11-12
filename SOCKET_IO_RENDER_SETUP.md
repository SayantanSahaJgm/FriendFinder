# ✅ Correct Socket.IO Setup for Render (Two Services)

## 🎯 Quick Reference

### Service Architecture
```
┌─────────────────────────────────────┐
│  Next.js Frontend                   │
│  friendfinder-vscode.onrender.com   │
│  Port: Auto (Render assigns)        │
└─────────────────┬───────────────────┘
                  │ WebSocket Connection
                  │ wss://friendfinder-socketio.onrender.com
                  ↓
┌─────────────────────────────────────┐
│  Socket.IO Backend                  │
│  friendfinder-socketio.onrender.com │
│  Port: Auto (Render assigns)        │
└─────────────────────────────────────┘
```

---

## 📝 Environment Variables

### Next.js Frontend Service (`friendfinder-vscode`)

```bash
# Socket.IO Client Configuration
NEXT_PUBLIC_SOCKET_URL=https://friendfinder-socketio.onrender.com
NEXT_PUBLIC_SOCKET_PORT=443

# Other variables...
NEXTAUTH_URL=https://friendfinder-vscode.onrender.com
MONGODB_URI=mongodb+srv://...
# ... (see .env.production for complete list)
```

### Socket.IO Backend Service (`friendfinder-socketio`)

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://sahasayantan13jgm_db_user:SAYantan13@cluster0.y3t5eun.mongodb.net/?appName=Cluster0

# Environment
NODE_ENV=production

# Port (Fallback only - Render uses process.env.PORT)
SOCKET_PORT=10000

# CORS Origins (Your Next.js frontend)
SOCKET_ALLOWED_ORIGINS=https://friendfinder-vscode.onrender.com
```

---

## 🔧 Variable Explanation

| Variable | Service | Purpose | Correct Value |
|----------|---------|---------|---------------|
| `NEXT_PUBLIC_SOCKET_URL` | Frontend | URL frontend connects to | `https://friendfinder-socketio.onrender.com` |
| `NEXT_PUBLIC_SOCKET_PORT` | Frontend | Port used in browser (HTTPS) | `443` (always) |
| `SOCKET_PORT` | Backend | Internal port fallback | `10000` |
| `process.env.PORT` | Both | **Auto-assigned by Render** | Render sets this (e.g., 10000) |
| `SOCKET_ALLOWED_ORIGINS` | Backend | CORS allowed origins | `https://friendfinder-vscode.onrender.com` |

---

## ✅ Backend Code Verification

Your `server.js` **already has the correct configuration**:

```javascript
// ✅ CORRECT - Line 4 in server.js
const SOCKET_PORT = process.env.PORT || process.env.SOCKET_PORT || 3004;

// ✅ CORRECT - Line 1154 in server.js
socketServer.listen(SOCKET_PORT, (err) => {
  if (err) {
    console.error(`Failed to start Socket.IO server on port ${SOCKET_PORT}:`, err);
    process.exit(1);
  }
  console.log(`✅ Socket.IO server running on port ${SOCKET_PORT}`);
});
```

### Why This Works

1. **`process.env.PORT`** - Render automatically assigns this (highest priority)
2. **`process.env.SOCKET_PORT`** - Your fallback setting (10000)
3. **`3004`** - Local development fallback

**Render will use `process.env.PORT`**, which it assigns automatically (typically 10000). This is the **required** configuration for Render's internal routing and WebSocket support.

---

## 🚀 Deployment Steps

### 1. Create Socket.IO Service First

**Render Dashboard → New Web Service**

| Setting | Value |
|---------|-------|
| Name | `friendfinder-socketio` |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Environment Variables | See above (Socket.IO Backend) |

**Result:** `https://friendfinder-socketio.onrender.com`

---

### 2. Create Next.js Service Second

**Render Dashboard → New Web Service**

| Setting | Value |
|---------|-------|
| Name | `friendfinder-vscode` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Environment Variables | See above (Next.js Frontend) |

**Critical:** Set `NEXT_PUBLIC_SOCKET_URL` to your Socket.IO service URL from Step 1

**Result:** `https://friendfinder-vscode.onrender.com`

---

## 🧪 Testing

### 1. Test Socket.IO Health
```bash
curl https://friendfinder-socketio.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "totalConnections": 0,
  "activeConnections": 0,
  "errorCount": 0,
  "uptime": 123456
}
```

### 2. Test Frontend Connection

1. Open: https://friendfinder-vscode.onrender.com
2. Open browser console (F12)
3. Look for: `Socket.IO connected: <socket-id>`
4. Should **NOT** see: `WebSocket connection failed`

---

## 🐛 Common Issues

### Issue: `WebSocket connection to 'wss://...' failed`

**Cause:** Frontend trying to connect to wrong URL

**Fix:** Verify environment variables on Next.js service:
```bash
NEXT_PUBLIC_SOCKET_URL=https://friendfinder-socketio.onrender.com
NEXT_PUBLIC_SOCKET_PORT=443
```

### Issue: `CORS error: No 'Access-Control-Allow-Origin'`

**Cause:** Socket.IO backend doesn't allow your frontend URL

**Fix:** Update Socket.IO service environment:
```bash
SOCKET_ALLOWED_ORIGINS=https://friendfinder-vscode.onrender.com
```

### Issue: Backend logs show `EADDRINUSE: address already in use`

**Cause:** Port conflict (shouldn't happen on Render)

**Fix:** Ensure `server.js` uses `process.env.PORT`:
```javascript
const SOCKET_PORT = process.env.PORT || process.env.SOCKET_PORT || 3004;
```

---

## ✅ Verification Checklist

- [ ] Socket.IO service deployed: `friendfinder-socketio.onrender.com`
- [ ] Next.js service deployed: `friendfinder-vscode.onrender.com`
- [ ] Health endpoint returns `{"status": "healthy"}`
- [ ] Browser console shows `Socket.IO connected`
- [ ] No CORS errors in browser console
- [ ] `NEXT_PUBLIC_SOCKET_URL` points to Socket.IO service
- [ ] `NEXT_PUBLIC_SOCKET_PORT` is set to `443`
- [ ] `SOCKET_ALLOWED_ORIGINS` includes Next.js URL
- [ ] Both services show "Live" status in Render dashboard

---

## 📊 Service Status

### Check Render Dashboard

**Socket.IO Service:**
- Status: ✅ Live
- URL: https://friendfinder-socketio.onrender.com
- Last Deploy: Check dashboard
- Logs: Look for `✅ Socket.IO server running on port 10000`

**Next.js Service:**
- Status: ✅ Live
- URL: https://friendfinder-vscode.onrender.com
- Last Deploy: Check dashboard
- Logs: Look for `✓ Ready in X.Xs`

---

## 🎉 Success Indicators

When everything is correctly configured:

1. **Render Logs (Socket.IO):**
   ```
   ✅ Socket.IO server running on port 10000
   📊 Socket.IO ready for connections
   ```

2. **Browser Console:**
   ```
   Socket.IO connected: a1b2c3d4e5f6
   ```

3. **Health Endpoint:**
   ```json
   {"status": "healthy"}
   ```

4. **No Errors:**
   - ❌ No `WebSocket connection failed`
   - ❌ No `CORS policy` errors
   - ❌ No `ERR_CONNECTION_REFUSED`

---

## 🔗 Quick Links

- **Frontend App:** https://friendfinder-vscode.onrender.com
- **Socket.IO Server:** https://friendfinder-socketio.onrender.com
- **Health Check:** https://friendfinder-socketio.onrender.com/health
- **Render Dashboard:** https://dashboard.render.com/
- **GitHub Repo:** https://github.com/SayantanSahaJgm/FriendFinder

---

## 📞 Need More Help?

See the complete guide: `RENDER_TWO_SERVICES_SETUP.md`
