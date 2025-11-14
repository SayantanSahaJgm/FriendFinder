# FriendFinder Deployment Guide for Render

## Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to GitHub
2. **MongoDB Atlas**: Set up MongoDB Atlas database
3. **Render Account**: Create a free account at render.com

## Step-by-Step Deployment

### 1. Prepare Your Repository

✅ **Already Done**: The following files have been created/updated:

- `render.yaml` - Render deployment configuration
- `.env.render` - Environment variables template
- `package.json` - Build scripts updated (removed turbopack flags)
- `next.config.ts` - Production-ready configuration

### 2. Set Up MongoDB Atlas (If not already done)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster or use existing one
3. Create a database user
4. Whitelist IP addresses (use `0.0.0.0/0` for production or specific IPs)
5. Get your connection string

### 3. Deploy on Render

#### Option A: Using Render Dashboard (Recommended)

1. **Connect Repository**:

   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `friendfinder` repository

2. **Configure Service**:

   - **Name**: `friendfinder` (or your preferred name)
   - **Region**: Choose based on your user base
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`

3. **Set Environment Variables**:
   Add these environment variables in the Render dashboard:

   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/your-database?retryWrites=true&w=majority&appName=FriendFinder
   NEXTAUTH_SECRET=your-super-secret-key-for-production-change-this-to-something-unique-and-long
   NEXTAUTH_URL=https://friendfinder-0i02.onrender.com
   NEXT_PUBLIC_SOCKET_URL=https://friendfinder-0i02.onrender.com
   SOCKET_PORT=10000
   ```
 # FriendFinder — Render deployment guide

This file explains a working, minimal Render setup for deploying FriendFinder publicly (Next.js + Socket.IO). It focuses on the single-service approach (recommended) using `server.js`, which runs Next and Socket.IO together on the same origin so clients can connect without CORS headaches.

If you prefer a split deployment (Next on Vercel or Render + separate Socket service), see the "Split services" section below.

## Summary (recommended)
- Deploy one Render Web Service running `node server.js` (package.json `start` script now uses this file).
- Set production environment variables in Render (see list below).
- Render will provide HTTPS and a stable public URL — use that URL for `NEXTAUTH_URL` and `NEXT_PUBLIC_SOCKET_URL`.

---

## Required environment variables (set these in Render → Your Service → Environment)
Do not commit these values to git. Replace angle-bracket values with your real values.

- NODE_ENV=production
- NEXTAUTH_URL=https://<your-render-service>.onrender.com
- NEXTAUTH_SECRET=<strong-random-hex-secret>  # generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
- MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority
- NEXT_PUBLIC_SOCKET_URL=https://<your-render-service>.onrender.com

Optional (if you use these integrations):
- GOOGLE_CLIENT_ID=
- GOOGLE_CLIENT_SECRET=
- CLOUDINARY_CLOUD_NAME=
- CLOUDINARY_API_KEY=
- CLOUDINARY_API_SECRET=
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

Notes:
- Do NOT hardcode `PORT` in Render. Render sets `PORT` for you; `server.js` reads the env and will listen correctly.
- Only set `SOCKET_PORT` if you intentionally want the socket server bound to a different port than the web process (not typically needed with the single-service approach).

---

## Create the Render Web Service (single-service, recommended)
1. Go to https://dashboard.render.com → New + → Web Service
2. Connect your GitHub repo and select the `main` branch
3. Configure:
   - Name: `friendfinder` (or your choice)
   - Environment: Node
   - Build Command: npm install && npm run build
   - Start Command: npm run start
   - Root Directory: leave empty (unless you keep the app in a subfolder)
4. Add the environment variables (see the list above)
5. Create the service and wait for the build & deploy to finish.

After deployment, Render will provide a public URL (example: `https://friendfinder-0i02.onrender.com`). Use that URL for `NEXTAUTH_URL` and `NEXT_PUBLIC_SOCKET_URL`.

## Split services (alternate)
- Deploy Next.js as a web service (or Vercel). Build/start as normal for Next.
- Deploy `server.js` (Socket.IO) as a separate Render service (Web Service or Background Worker). Start with: `node server.js`
- Set the socket service's public URL (e.g. `https://friendfinder-sockets.onrender.com`) into `NEXT_PUBLIC_SOCKET_URL` in the Next app.
-- Ensure `allowedOrigins` in `server.js` include your Next app domain and the socket domain (the code already checks `NEXTAUTH_URL`).

## Verification checklist (post-deploy)
1. Build completed without error in Render logs.
2. No NextAuth NO_SECRET errors in runtime logs (check Render logs). If you see [next-auth][error][NO_SECRET], confirm `NEXTAUTH_SECRET` is set in Render and redeploy.
3. Open your public URL in a browser and confirm the page loads.
4. Health endpoints:
   - Next+Socket integrated: https://<your-domain>/health (server-integration exposes `/health`)
   - If you deployed socket separately: the socket service exposes a health endpoint on `PORT+1` (see `server.js` health server) — check the service logs for the correct URL.
5. Login flow: visit /login and perform a sign-in test. Check Render logs for auth-related errors.
6. Random Chat: open `/dashboard/random-chat` and verify the client connects to the socket server (browser console should show socket connection events and no CORS/connection errors).

## How to run a production-like instance locally
1. Build:
```powershell
npm install
npm run build
```
2. Start the integrated server (this mirrors Render's single-service behavior):
```powershell
npm run start
# or directly:
# node server.js
```
3. Open http://localhost:3000 by default (server-integration listens on the `PORT` env or 3000).

## Run the contrast audit against the public URL
- I can patch `scripts/contrast-audit.js` to accept a `BASE_URL` env var and retry until the target responds. After that you (or I) can run:
```powershell
BASE_URL=https://<your-domain> node scripts/contrast-audit.js
```
The script will save `contrast-audit-report.json` with color-contrast violations.

## Common troubleshooting
- NextAuth NO_SECRET: set `NEXTAUTH_SECRET` in Render and redeploy.
- Socket connection refused or CORS errors: verify `NEXT_PUBLIC_SOCKET_URL` is set to your app domain (or socket host) and that `allowedOrigins` (server) includes that domain. For single-service deployment this should be the same origin and work out of the box.
- WebRTC/video blocked: ensure the site is served over HTTPS (Render provides HTTPS by default) and that the socket host uses TLS.

## Optional improvements I can make for you
1. Patch `scripts/contrast-audit.js` to accept `BASE_URL` and retries, then run the audit against your public URL and produce a remediation report.
2. Create a short `RENDER_DEPLOYMENT_SHORT.md` with exact copy/paste env values and guidance for adding them in the Render UI (I can show screenshots if needed).

Tell me which optional improvement you'd like (1 or 2) or if you want me to proceed to step-by-step Render UI instructions and a draft of the env values ready to paste into Render.

