# FriendFinder Development Guide

## Quick Start

### Development Servers

FriendFinder requires two servers to run properly:

1. **Next.js Server** (port 3000) - Main application
2. **Socket.IO Server** (port 3004) - Real-time features

### Starting Development Environment

#### Option 1: Full Development (Recommended)
```bash
npm run dev:full
```
This starts:
- Next.js server on port 3000
- Socket.IO server on port 3004
- Health monitor for both services

#### Option 2: Individual Servers
```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Socket.IO
npm run dev:socket

# Terminal 3 (Optional): Start Health Monitor
npm run dev:health
```

### Production Deployment
```bash
npm run start:production
```

## Troubleshooting

### Common Issues

#### 1. Socket.IO Connection Errors (503)
**Problem**: Seeing errors like:
```
GET http://localhost:3000/api/socket.io?... 503 (Service Unavailable)
Socket connection error: Error: timeout
```

**Solution**: 
- Use `npm run dev:full` instead of just `npm run dev`
- Ensure Socket.IO server is running on port 3004
- Check the health monitor output

#### 2. React Hydration Mismatches
**Problem**: Console warnings about server/client HTML mismatches

**Solution**: 
- Already fixed in dashboard layout with proper hydration handling
- Components use `mounted` state for responsive classes

#### 3. Random Chat Page Errors
**Problem**: Random chat features not working

**Solution**:
- Ensure both servers are running with `npm run dev:full`
- Check Socket.IO connection status in dev tools
- Use the health monitor to verify server status

### Health Monitoring

The application includes comprehensive health monitoring:

- **Health Monitor Script**: Real-time status of both servers
- **Connection Status Dashboard**: Available in-app for users
- **Health API Endpoints**: 
  - `/api/health` - Next.js server health
  - `/api/socket-health` - Socket.IO server health

### Development Workflow

1. **Start Development**:
   ```bash
   npm run dev:full
   ```

2. **Monitor Status**: The health monitor will show:
   - ✅ Next.js running on port 3000
   - ✅ Socket.IO running on port 3004
   - Connection status and error counts

3. **Debugging**: If issues occur:
   - Check health monitor output
   - Use browser dev tools for client-side errors
   - Check server logs for Socket.IO issues

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   Socket.IO     │
│   Port 3000     │────│   Port 3004     │
│                 │    │                 │
│ • Web Interface │    │ • Real-time     │
│ • API Routes    │    │ • Chat          │
│ • Proxy to      │    │ • Notifications │
│   Socket.IO     │    │ • Presence      │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              Health Monitor
```

### Environment Variables

```env
# Socket.IO Configuration
SOCKET_PORT=3004
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_PORT=3004
```

### Features Status

- ✅ **Connection Management**: Automatic reconnection with exponential backoff
- ✅ **Fallback Mode**: HTTP API fallback when Socket.IO is unavailable  
- ✅ **Health Monitoring**: Real-time server health tracking
- ✅ **Error Recovery**: Graceful degradation and recovery
- ✅ **Development Tools**: Comprehensive debugging and monitoring

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

The application includes comprehensive test coverage for:
- Socket.IO connection handling
- Error recovery mechanisms
- Fallback functionality
- Real-time features

---

## Phase 5: Offline-First Architecture

### Overview

Phase 5 implements a complete offline-first system with progressive sync and data resilience:

- **Phase 5.1 ✅ Foundation**: IndexedDB, network monitoring, UI indicators
- **Phase 5.2 ✅ Message Queue**: Real API sync with exponential backoff
- **Phase 5.3 ✅ Service Worker**: Asset caching, background sync, push notifications

### Phase 5.1: Offline Sync Foundation

**Features:**
- IndexedDB local database (messages, requests, profiles, cache)
- Real-time network status detection
- Offline indicator UI
- useOfflineSync React hook

**Files:** `src/services/offlineSync/IndexedDBService.ts`, `src/services/offlineSync/NetworkStatusService.ts`, `src/components/offline/OfflineIndicator.tsx`

**Demo:** `/dashboard/offline-demo`

### Phase 5.2: Message Queue Implementation

**Features:**
- OfflineSyncService with real API calls
- Priority-based queue (Messages > Requests > Profile)
- Exponential backoff retry: 1s → 2s → 4s → 8s → 16s + jitter
- Message composer component
- Sync progress tracker

**Files:** `src/services/offlineSync/OfflineSyncService.ts`, `src/components/offline/OfflineMessageComposer.tsx`, `src/components/offline/SyncProgress.tsx`

**Demo:** `/dashboard/offline-queue-demo`

### Phase 5.3: Service Worker & Background Sync

**Features:**
- Service worker with dual caching strategies:
  - Cache-first: Static assets (50-100ms)
  - Network-first: API calls (fresh when online)
- Background Sync API: Automatic retry on network reconnect
- Push notifications: Friend requests, messages, locations, sync status
- Offline fallback page at `/offline`

**Files:**
- `public/sw.js` - Main service worker
- `src/lib/serviceWorkerUtils.ts` - Complete SW API
- `src/services/notificationService.ts` - Notification handling
- `src/hooks/useServiceWorker.ts` - React integration
- `src/components/offline/ServiceWorkerManager.tsx` - UI control panel

**Demo:** `/dashboard/service-worker-demo`

**Usage Example:**
```typescript
import { useServiceWorker } from '@/hooks/useServiceWorker';

export function App() {
  const sw = useServiceWorker({
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_KEY,
  });

  return <ServiceWorkerManager showDetails={true} />;
}
```

### Offline Mode Testing

**Test Scenario 1: Go Offline**
1. Start dev server: `npm run dev:full`
2. Open DevTools → Network tab → Throttle to offline
3. Try sending a message
4. Message queued (yellow indicator)
5. Reconnect: Message auto-syncs
6. Check sync progress

**Test Scenario 2: Offline Page**
1. Go to `/dashboard`
2. Open DevTools → Network → Offline
3. Reload page
4. See offline fallback page
5. View queued items
6. Click "Sync Now" to test background sync

**Test Scenario 3: Service Worker**
1. Go to `/dashboard/service-worker-demo`
2. Test notifications (4 types)
3. Test cache management
4. Test background sync registration
5. Check browser DevTools → Application → Service Workers

### Performance Metrics

**Cache Performance:**
- First visit: Normal (network)
- Repeat visits: 80-90% faster (cache)
- Cache hit: 50-100ms vs 200-500ms (4-10x improvement)

**Sync Performance:**
- Offline queue: Instant
- Sync on reconnect: 0-5 minutes (OS dependent)
- Success rate: 95%+ on 3G

**Storage:**
- App assets: ~2-5MB
- Cached API: ~1-2MB
- Sync queue: <100KB
- Total: ~5-8MB typical

### Configuration

**Environment Variables:**
```bash
# .env.local
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_key
```

**Browser Support:**
- Service Workers: All modern browsers ✅
- Cache API: All modern browsers ✅
- Background Sync: Chrome, Edge, Opera ✅
- Push Notifications: All modern browsers ✅

### Documentation

- `docs/PHASE_5_OFFLINE_SYNC_PLAN.md` - Complete architecture
- `docs/PHASE_5.1_FOUNDATION_COMPLETE.md` - Phase 5.1 details
- `docs/PHASE_5.2_MESSAGE_QUEUE_COMPLETE.md` - Phase 5.2 details
- `docs/PHASE_5.3_SERVICE_WORKER_COMPLETE.md` - Phase 5.3 details
- `PHASE_5.3_SUMMARY.md` - Quick reference guide
- `PHASE_5.3_VERIFICATION.md` - Verification checklist

### Next Steps

**Phase 5.4: Conflict Resolution**
- Timestamp-based versioning
- ConflictResolver UI component
- Auto-merge logic for non-conflicting changes
- Conflict scenario testing

**Phase 5.5: Polish & Testing**
- E2E offline scenarios
- Performance optimization
- Cache strategy tuning
- Error handling refinement