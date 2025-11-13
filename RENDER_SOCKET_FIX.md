# 🔧 URGENT: Fix Socket.IO Connection on Render

## Current Problem
The random chat is showing "Offline" because Socket.IO can't connect. Browser shows CORS errors.

## What's Been Fixed in Code
✅ Socket.IO now uses same domain (no CORS)
✅ Guest users can connect
✅ Better error handling
✅ Development proxy configured

## 🚨 What YOU Need to Do on Render.com

### Step 1: Update Environment Variables

Go to your Render dashboard → Your service → Environment

**Add/Update these variables:**
```
NEXT_PUBLIC_SOCKET_URL=https://friendfinder-vscode.onrender.com
NEXTAUTH_URL=https://friendfinder-vscode.onrender.com
MONGODB_URI=mongodb+srv://sahasayantan13jgm_db_user:SAYantan13@cluster0.y3t5eun.mongodb.net/?appName=Cluster0
NEXTAUTH_SECRET=b4f5c3d9a1e7f6b0c2d4e8f8193a7c5d6e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3
NODE_ENV=production
PORT=10000
```

### Step 2: Update Build & Start Commands

**Build Command:**
```bash
npm install && npm run build
```

**Start Command (IMPORTANT - Change this!):**
```bash
npm run start:all
```

The `start:all` command runs BOTH Next.js AND Socket.IO server together.

### Step 3: Save and Redeploy

1. Click "Save Changes" on environment variables
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for build to complete (~5-10 minutes)

### Step 4: Test

Once deployed, open your app and check:
1. Go to `/dashboard/random-chat`
2. Status badge should show "Online" (green)
3. Click "Start Video Chat" - should work without errors
4. Check browser console - should see "Socket connected: [id]"

## Alternative: If MongoDB Needs Configuration

If you need to provide MongoDB connection string separately, let me know and I'll help configure it.

Current MongoDB URI in code:
```
mongodb+srv://sahasayantan13jgm_db_user:SAYantan13@cluster0.y3t5eun.mongodb.net/?appName=Cluster0
```

## Troubleshooting

If still showing "Offline" after deployment:

1. **Check Render logs:**
   - Go to your service → Logs
   - Look for "Socket.IO server listening on port"
   - Should see "Socket connected" messages

2. **Check environment variables:**
   - Make sure `NEXT_PUBLIC_SOCKET_URL` matches your actual Render URL
   - Make sure `PORT=10000`

3. **Force fresh deployment:**
   - Clear build cache on Render
   - Redeploy

## Need Help?

If issues persist, provide:
1. Screenshot of Render logs
2. Screenshot of browser console errors
3. Screenshot of Render environment variables (hide secrets!)

The main fix is changing the Start Command to `npm run start:all` so both servers run together.
