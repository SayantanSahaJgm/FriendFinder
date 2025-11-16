# Deploying the Socket.IO Server (server.js)

This guide shows how to deploy the project's `server.js` Socket.IO server to a host that supports long‑lived TCP connections (recommended: Render or Railway). Vercel serverless hosts are not suitable for persistent Socket.IO servers.

## Quick summary
- Use Render or Railway (or any VM/container host that supports long‑lived processes).
- Set the socket server env vars below.
- Update your frontend environment (`NEXT_PUBLIC_SOCKET_URL`) to point to the deployed socket host and remove `NEXT_PUBLIC_SOCKET_PORT`.

---

## Prepare the repo

1. Ensure `server.js` is at the repository root (it is in this project).
2. Add a `package.json` script if you prefer (optional):

```json
"scripts": {
  "start:socket": "node server.js"
}
```

## Environment variables (server)

Set the following environment variables on the socket host. Exact names are used by `server.js`.

- `SOCKET_ALLOWED_ORIGINS` — Comma-separated list of allowed origins (no trailing slashes). Example:
  - `https://friendfinder-mu.vercel.app`
- `NEXTAUTH_URL` — (if your server reads it) set to your frontend production origin:
  - `https://friendfinder-mu.vercel.app`
- `SOCKET_PORT` — Optional. The server will compute a default if not provided. If your host exposes a port via `PORT`, the server will use `PORT + 1` by default.
- `SOCKET_DEBUG=1` — Optional while testing, enables upgrade logging.
- `SOCKET_DEBUG_UPGRADE=1` — Optional to log HTTP upgrade requests.
- `SOCKET_ALLOW_MISSING_ORIGIN=1` — (optional) allow missing Origin headers from trusted proxies (only for advanced setups).

Notes:
- Do not include a trailing slash on origins in `SOCKET_ALLOWED_ORIGINS` (server normalizes, but avoid mismatches).
- Avoid setting `SOCKET_ALLOWED_ORIGINS` to `*` in production.

## Render (recommended)

1. Create a new Web Service in Render.
2. Connect your GitHub repo and select the repository root.
3. Build command: leave empty or `npm ci` if you want dependencies installed.
4. Start command: `node server.js` (or `npm run start:socket` if you added the script).
5. Set environment variables (Render dashboard - Environment): add `SOCKET_ALLOWED_ORIGINS`, `NEXTAUTH_URL`, and `SOCKET_DEBUG=1` while testing.
6. Deploy. After deploy, note the service URL, e.g. `https://friendfinder-socketio.onrender.com`.

## Railway (alternative)

1. Create a new Project on Railway and connect the GitHub repo.
2. Set the start command to `node server.js`.
3. Add the environment variables listed above.
4. Deploy and note the service URL.

## Post-deploy: Frontend environment (Vercel)

1. In your Vercel project environment variables:
   - Set `NEXT_PUBLIC_SOCKET_URL` to the socket host URL, e.g. `https://friendfinder-socketio.onrender.com` (no trailing slash).
   - Remove `NEXT_PUBLIC_SOCKET_PORT` (not needed when using a URL).
   - Keep `NEXTAUTH_URL` pointing to your frontend origin (`https://friendfinder-mu.vercel.app`).
2. Re-deploy your frontend on Vercel.

## Verify connectivity (quick checks)

From your workstation, run these (PowerShell / macOS / Linux):

```powershell
# Check polling endpoint and CORS header
curl -i -H "Origin: https://friendfinder-mu.vercel.app" "https://<YOUR_SOCKET_HOST>/socket.io/?EIO=4&transport=polling"

# Probe websocket upgrade (may not complete in curl but shows HTTP response)
curl -i -H "Connection: Upgrade" -H "Upgrade: websocket" "https://<YOUR_SOCKET_HOST>/socket.io/?EIO=4&transport=websocket"

# If server exposes health endpoint (server.js creates a health server), try:
curl -i "https://<YOUR_SOCKET_HOST>/health"
```

What to expect:
- Polling endpoint should return 200 and include `Access-Control-Allow-Origin: https://friendfinder-mu.vercel.app` (or `*`) when you provide the `Origin` header.
- WebSocket upgrade should be accepted (status 101) when supported.
- The `/health` endpoint should return JSON describing the socket server.

## Debugging tips

- If you see `404` on `/socket.io/`: the host/URL is not running the socket server (static site or wrong route).
- If the response lacks `Access-Control-Allow-Origin`: update `SOCKET_ALLOWED_ORIGINS` on the socket host to include your frontend origin.
- Enable `SOCKET_DEBUG`/`SOCKET_DEBUG_UPGRADE` on the socket host during troubleshooting to see upgrade logs.

## Local testing

Run locally to confirm behavior before deploying:

```powershell
npm ci
node server.js
# In the frontend dev environment, set NEXT_PUBLIC_SOCKET_URL to http://localhost:3004 (or the port printed by server.js)
```

---

If you want, I can also add a small `deploy/socket-render.yml` example for Render's static blueprint, or generate a Railway `service.json` snippet — tell me which platform you prefer and I'll add it.
