# Render environment variables & deploy notes

This file lists the minimal environment variables and deploy steps needed to run the Socket.IO service on Render (or a similar host).

## Required env vars

- `SOCKET_ALLOWED_ORIGINS`
  - Comma-separated list of allowed client origins for CORS / Socket.IO `allowRequest`.
  - Example: `https://friendfinder-vscode.onrender.com`

- `NEXT_PUBLIC_SOCKET_URL` (recommended)
  - The full URL clients should use to connect to the Socket.IO server.
  - Example: `https://friendfinder-vscode.onrender.com`

Optional / useful
- `REDIS_URL`
  - If you want distributed anonymous matching across instances, set this to your Redis connection string and ensure `ioredis` is installed.

## Quick Render UI steps

1. Open https://dashboard.render.com and sign in.
2. Select the service that runs the Socket.IO server (e.g. `friendfinder-socket`).
3. Go to Environment (Environment Variables) and add/update the keys above.
4. Save changes and trigger a deploy / restart:
   - Click **Manual Deploy** → **Deploy latest commit** (or use the **Restart** button).

## Verification

1. Check service logs after startup — the server logs the computed allowed origins:

   Socket.IO allowed origins: [ 'https://friendfinder-vscode.onrender.com', ... ]

2. Health endpoint (should return JSON):

   ```powershell
   curl https://friendfinder-vscode.onrender.com/health -UseBasicParsing -TimeoutSec 10
   ```

3. Open the deployed frontend and verify the browser console no longer shows WebSocket connect failures to `/socket.io/`.

4. If connections are still rejected, paste the server logs lines showing `connection request` ALLOWED/DENIED so we can diagnose further.

## Notes

- If you need multiple allowed origins, supply them comma-separated to `SOCKET_ALLOWED_ORIGINS`.
- For local dev, the server still permits `http://localhost:3000`, `http://localhost:3001`, etc.

---
Tiny reference added by automation to help redeploy Socket.IO on Render.
