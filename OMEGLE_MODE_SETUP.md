# Omegle-Style Random Chat Setup

## Quick Start (2 Terminal Windows)

### Terminal 1: Socket.IO Server
```powershell
$env:SOCKET_PORT=3004
$env:NODE_ENV="development"
node server.js
```

Wait for this message:
```
✅ Socket.IO server running on port 3004
📊 Socket.IO ready for connections
🏥 Health endpoint: http://localhost:3005/health
```

### Terminal 2: Next.js Frontend
```powershell
npm run dev
```

Wait for:
```
Ready - started server on 0.0.0.0:3000
```

## Access the App

1. Open: http://localhost:3000
2. Navigate to the Random Chat page
3. You should see **"Online"** status (green badge)
4. Click **"Start Text Chat"** to begin

## How It Works (Omegle-Style)

### Guest Mode (No Login Required)
- Opens random chat page → Auto-connects as anonymous guest
- No authentication needed
- Immediate anonymous ID assigned via localStorage

### Face Verification (Video Mode Only)
- For video chat: Verify face first
- After verification: Immediately connects to find partner
- Text/Audio modes: No verification needed

### Matching
- Click "Start" → Searches for available users (15 seconds)
- If no users found → Connects to AI bot automatically
- Partner disconnects → Returns to idle, user clicks "Next" or "Start" manually
- No automatic re-searching (user controls when to find next person)

## Configuration Files

### `.env.local`
```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:3004
NEXT_PUBLIC_SOCKET_PORT=3004
```

### Key Changes Made
1. **Socket URL**: Changed from port 3000 → 3004 (standalone Socket.IO server)
2. **Auto-Connect**: Page loads → Auto-connects as guest (no login required)
3. **No Auto-Refresh**: Partner leaves → User manually starts next search
4. **Simplified Flow**: Removed complex authentication dependencies

## Architecture

```
┌─────────────────────┐
│   Browser (3000)    │
│   Next.js Frontend  │
│   Random Chat UI    │
└──────────┬──────────┘
           │ Socket.IO Client
           │ (connects on page load)
           │
           ▼
┌─────────────────────┐
│  Socket.IO (3004)   │
│  server.js          │
│  • Guest matching   │
│  • Queue system     │
│  • Message relay    │
└─────────────────────┘
```

## Troubleshooting

### "Connecting..." Never Changes to "Online"

**Cause**: Socket.IO server not running or wrong port

**Fix**:
```powershell
# Terminal 1: Stop any existing server (Ctrl+C)
# Then start fresh:
$env:SOCKET_PORT=3004
node server.js
```

### "Offline" Status Shows

**Cause**: `.env.local` has wrong socket URL

**Fix**: Ensure `.env.local` contains:
```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:3004
```

Then restart Next.js:
```powershell
# Terminal 2: Stop (Ctrl+C) and restart
npm run dev
```

### Changes Not Reflecting

**Fix**: Hard refresh the browser
- Chrome/Edge: `Ctrl + Shift + R`
- Firefox: `Ctrl + F5`

## Testing with Multiple Users

Open multiple browser windows (or use incognito mode) to simulate multiple users:

1. Window 1: http://localhost:3000 → Random Chat → Start
2. Window 2: http://localhost:3000 → Random Chat → Start

Both should match with each other (if no other users in queue).

## Key Features

✅ **Anonymous by default** - No login required  
✅ **Instant connection** - Auto-connects on page load  
✅ **AI fallback** - If no users available, connects to bot  
✅ **Manual control** - User decides when to find next person  
✅ **Face verification** - Only for video mode  
✅ **Simple matching** - First-come-first-served queue  

## Production Deployment

Update `.env.local` (or Render environment variables):

```bash
NEXT_PUBLIC_SOCKET_URL=https://your-app.onrender.com
```

Make sure both Next.js and Socket.IO are deployed to same domain for CORS simplicity.
