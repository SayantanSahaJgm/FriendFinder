# Socket.IO Deployment Guide

## Current Issue
The Socket.IO server is trying to connect to a separate domain which causes CORS errors.

## Solution for Render.com Deployment

### Option 1: Run Both Next.js and Socket.IO on Same Server (Recommended)

1. **Update your Render build command:**
   ```bash
   npm install && npm run build
   ```

2. **Update your Render start command:**
   ```bash
   npm run start:all
   ```

3. **Add this script to package.json:**
   ```json
   "scripts": {
     "start:all": "node server.js & next start"
   }
   ```

4. **Update Environment Variables on Render:**
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-app-name.onrender.com
   NEXTAUTH_URL=https://your-app-name.onrender.com
   MONGODB_URI=your-mongodb-connection-string
   NEXTAUTH_SECRET=your-secret-key
   NODE_ENV=production
   PORT=10000
   ```

### Option 2: Use Integrated Socket.IO (Current Implementation)

The app is now configured to use Socket.IO on the same domain:
- Development: Proxies `/socket.io/*` to `localhost:3004`
- Production: Uses `window.location.origin` (same domain)

This eliminates CORS issues entirely.

## Testing Locally

1. **Start Socket.IO server:**
   ```bash
   node server.js
   ```

2. **In another terminal, start Next.js:**
   ```bash
   npm run dev
   ```

3. **Open browser to:** `http://localhost:3000`

The app should now connect to Socket.IO without CORS errors.

## Verifying Connection

Check browser console for:
- ✅ "Socket connected: [socket-id]"
- ✅ "Connected to real-time services"

If you see errors, check:
1. Is `server.js` running?
2. Are the ports correct in `.env.local`?
3. Are there any firewall issues?

## Production Deployment Notes

For Render.com:
- The app needs both Next.js AND Socket.IO running
- Use a process manager or run both with `&` in the start command
- Ensure `PORT` environment variable is set to `10000`
- Socket.IO will use the same port as Next.js
