# Phase 5: Offline Sync - Implementation Plan

**Status**: 🚧 IN PROGRESS  
**Started**: November 3, 2025  
**Target Completion**: TBD

---

## 📋 Overview

Phase 5 implements comprehensive offline support for FriendFinder, enabling users to:
- Send and receive messages while offline
- Queue friend requests and actions
- Sync data automatically when connection is restored
- Maintain app functionality with degraded network conditions
- Provide seamless user experience across network states

---

## 🎯 Goals

### Primary Objectives
1. **Offline Message Queue** - Store outgoing messages locally when offline
2. **Data Synchronization** - Sync queued data when connection restored
3. **Conflict Resolution** - Handle simultaneous offline changes intelligently
4. **Local State Management** - Maintain app state with IndexedDB/localStorage
5. **Network Awareness** - Detect and respond to connectivity changes
6. **Background Sync** - Use Service Workers for background synchronization

### Success Criteria
- ✅ Messages sent offline are delivered when online
- ✅ No data loss during network interruptions
- ✅ Sync conflicts resolved automatically or with user input
- ✅ App remains functional offline (read-only mode)
- ✅ Sync progress visible to users
- ✅ Battery-efficient background sync

---

## 🏗️ Architecture

### Technology Stack

#### Client-Side Storage
- **IndexedDB** - Primary offline database
  - Messages, friend requests, user profiles (cached)
  - Advantages: Large storage, structured data, transactions
  - Use library: `idb` (lightweight wrapper)

- **LocalStorage** - Small metadata and settings
  - User preferences, sync status flags
  - Max 5-10MB per origin

- **Service Workers** - Background sync
  - Offline asset caching
  - Background Sync API for queued operations
  - Push notification support

#### Sync Strategy
- **Optimistic UI Updates** - Show changes immediately
- **Queue-based Sync** - FIFO queue for pending operations
- **Retry Logic** - Exponential backoff for failed syncs
- **Conflict Detection** - Timestamp-based versioning
- **Merge Strategy** - Last-write-wins with user override option

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Action                               │
│             (Send message, add friend, etc.)                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   Network Check       │
            │   (Online/Offline?)   │
            └───────────┬───────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌─────────────┐                ┌─────────────┐
│   ONLINE    │                │   OFFLINE   │
│             │                │             │
│ 1. API Call │                │ 1. IndexedDB│
│ 2. Success  │                │    Store    │
│ 3. Update   │                │ 2. Queue Op │
│    Local DB │                │ 3. Optimistic│
│             │                │    UI Update│
└─────────────┘                └──────┬──────┘
                                      │
                        ┌─────────────┘
                        │ Connection Restored
                        ▼
                ┌───────────────────┐
                │  Sync Queue       │
                │  1. Process Queue │
                │  2. API Calls     │
                │  3. Handle Errors │
                │  4. Update Status │
                └───────────────────┘
```

---

## 📦 Implementation Components

### 1. IndexedDB Schema

#### Database Structure
```typescript
Database: 'friendfinder_offline_v1'

Stores:
├─ messages
│  ├─ id (key)
│  ├─ chatId
│  ├─ senderId
│  ├─ receiverId
│  ├─ content
│  ├─ timestamp
│  ├─ status (pending|synced|failed)
│  ├─ retryCount
│  └─ lastAttempt
│
├─ friendRequests
│  ├─ id (key)
│  ├─ fromId
│  ├─ toId
│  ├─ status (pending|synced|failed)
│  ├─ timestamp
│  └─ retryCount
│
├─ userCache
│  ├─ userId (key)
│  ├─ username
│  ├─ profileData
│  ├─ lastFetched
│  └─ expiresAt
│
├─ syncQueue
│  ├─ id (key, auto-increment)
│  ├─ operation (message|friendRequest|profileUpdate)
│  ├─ payload
│  ├─ priority (1=high, 2=normal, 3=low)
│  ├─ createdAt
│  ├─ status (pending|processing|failed|completed)
│  └─ retryCount
│
└─ syncMetadata
   ├─ key (string)
   ├─ value
   └─ updatedAt
```

### 2. Core Services

#### `src/services/offlineSync/OfflineSyncService.ts`
```typescript
class OfflineSyncService {
  // Queue management
  addToQueue(operation, payload, priority)
  processQueue()
  clearQueue()
  
  // Sync operations
  syncMessages()
  syncFriendRequests()
  syncAll()
  
  // Network monitoring
  onOnline()
  onOffline()
  isOnline()
  
  // Conflict resolution
  resolveConflict(localData, serverData)
  
  // Status
  getSyncStatus()
  getQueueLength()
}
```

#### `src/services/offlineSync/IndexedDBService.ts`
```typescript
class IndexedDBService {
  // Database init
  openDatabase()
  createStores()
  
  // CRUD operations
  addMessage(message)
  getMessage(id)
  updateMessage(id, updates)
  deleteMessage(id)
  getAllMessages(chatId)
  
  // Queue operations
  addToQueue(item)
  getNextQueueItem()
  removeFromQueue(id)
  getQueueItems(status?)
  
  // Cache management
  cacheUser(user)
  getCachedUser(userId)
  clearExpiredCache()
}
```

#### `src/hooks/useOfflineSync.ts`
```typescript
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState('idle')
  const [queueLength, setQueueLength] = useState(0)
  
  // Network listeners
  useEffect(() => {
    const handleOnline = () => { /* ... */ }
    const handleOffline = () => { /* ... */ }
    // ...
  }, [])
  
  // API
  return {
    isOnline,
    syncStatus,
    queueLength,
    sendMessageOffline,
    syncNow,
    clearQueue,
  }
}
```

### 3. Service Worker (`public/sw.js`)

```javascript
// Cache strategies
const CACHE_NAME = 'friendfinder-v1'
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard',
  '/offline.html',
  '/styles/main.css',
  '/scripts/main.js',
]

// Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages())
  }
})

// Push notifications
self.addEventListener('push', event => {
  const data = event.data.json()
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icons/icon-192.png',
  })
})
```

### 4. UI Components

#### `src/components/offline/OfflineIndicator.tsx`
- Shows online/offline status banner
- Displays sync progress
- Shows queue count

#### `src/components/offline/SyncProgress.tsx`
- Progress bar for active sync
- Retry controls for failed items
- Clear queue option

#### `src/components/offline/ConflictResolver.tsx`
- Shows conflicting data side-by-side
- User can choose which version to keep
- Auto-merge option for simple conflicts

---

## 🔄 Sync Strategies

### Message Sync Flow

```
Offline Message Send:
1. User types message and hits send
2. Check network status
3. If offline:
   a. Add to IndexedDB messages store (status: pending)
   b. Add to sync queue
   c. Show optimistic UI (message with "pending" indicator)
4. Connection restored:
   a. Process queue (oldest first)
   b. POST message to /api/messages
   c. If success:
      - Update message status to "synced"
      - Update message ID with server ID
      - Remove from queue
   d. If fail:
      - Increment retryCount
      - Exponential backoff (1s, 2s, 4s, 8s...)
      - If retryCount > 5, mark as "failed" and notify user
```

### Friend Request Sync Flow

```
Offline Friend Request:
1. User sends friend request while offline
2. Store in IndexedDB friendRequests store
3. Show optimistic UI (request shows as "pending")
4. Connection restored:
   a. POST to /api/friends/request
   b. If success: mark as synced
   c. If fail (already friends/duplicate): mark as synced, update UI
   d. If server error: retry with backoff
```

### Conflict Resolution Strategy

```
Scenario: User edits profile offline, server has newer version

1. Detect conflict:
   - Compare lastUpdated timestamps
   - Local: 2025-11-03 10:00
   - Server: 2025-11-03 10:05 (newer)

2. Resolution options:
   a. Auto-merge (if non-conflicting fields)
      - Local changed: bio
      - Server changed: profilePicture
      - Merge both changes
   
   b. Last-write-wins (default)
      - Server version is newer → keep server
      - Show notification: "Profile updated from another device"
   
   c. User choice (complex conflicts)
      - Show ConflictResolver modal
      - Display both versions
      - User picks or manually merges
```

---

## 🧪 Testing Plan

### Unit Tests

```typescript
// Test offline detection
test('detects offline state', () => { /* ... */ })

// Test queue operations
test('adds item to queue', () => { /* ... */ })
test('processes queue in order', () => { /* ... */ })
test('retries failed items', () => { /* ... */ })

// Test sync logic
test('syncs messages when online', () => { /* ... */ })
test('handles sync conflicts', () => { /* ... */ })
test('clears expired cache', () => { /* ... */ })
```

### Integration Tests

```typescript
// End-to-end offline flow
test('send message offline and sync when online', async () => {
  // 1. Go offline
  // 2. Send message
  // 3. Verify stored in IndexedDB
  // 4. Go online
  // 5. Verify message synced
  // 6. Verify server received message
})
```

### Manual Testing Scenarios

1. **Basic Offline Messaging**
   - Send message while offline
   - Go online
   - Verify message delivers

2. **Queue Management**
   - Send 10 messages offline
   - Go online
   - Verify all messages sync in order

3. **Retry Logic**
   - Send message offline
   - Go online but simulate API error
   - Verify retries happen with backoff
   - Verify eventual success or failure notification

4. **Conflict Resolution**
   - Edit profile offline
   - Simulate server update from another device
   - Go online
   - Verify conflict detected and resolved

5. **Network Interruption**
   - Start sending message while online
   - Disconnect mid-request
   - Verify message queued
   - Reconnect and verify sync

---

## 📊 Performance Considerations

### Storage Limits
- **IndexedDB**: ~50MB minimum, often 100MB+
- **LocalStorage**: 5-10MB
- **Monitor usage**: Warn user at 80% capacity
- **Cleanup strategy**: Delete synced items older than 7 days

### Battery Optimization
- **Background Sync**: Use native API (limited frequency)
- **Polling**: Avoid aggressive polling when offline
- **Service Worker**: Minimize wake-ups
- **Batch operations**: Sync in batches, not one-by-one

### Network Efficiency
- **Compression**: Compress large payloads
- **Delta sync**: Only sync changes, not full state
- **Priority queue**: High-priority items first (messages > profile updates)
- **Retry backoff**: Exponential backoff to avoid hammering server

---

## 🔐 Security & Privacy

### Data at Rest
- **No encryption by default** (IndexedDB is unencrypted)
- **Optional**: Encrypt sensitive data before storing
- **Mitigation**: Rely on device-level encryption (iOS, Android)

### Sync Authentication
- **Include auth token** in all sync requests
- **Token refresh**: Handle expired tokens during sync
- **Logout**: Clear all IndexedDB data on logout

### Privacy Concerns
- **Local storage visibility**: IndexedDB accessible to all site scripts
- **Shared devices**: Prompt to clear data on logout
- **Sensitive data**: Don't cache passwords or payment info

---

## 🚀 Implementation Phases

### Phase 5.1: Foundation (Week 1)
- [x] Create offline sync plan document
- [ ] Install dependencies (`idb`, service worker libraries)
- [ ] Set up IndexedDB schema and service
- [ ] Implement network status detection
- [ ] Create offline indicator UI

### Phase 5.2: Message Queue (Week 2)
- [ ] Implement message queue (send/receive)
- [ ] Add optimistic UI updates
- [ ] Implement basic sync logic
- [ ] Add retry mechanism with backoff
- [ ] Test offline messaging flow

### Phase 5.3: Service Worker (Week 3)
- [ ] Register service worker
- [ ] Implement asset caching
- [ ] Add background sync support
- [ ] Handle push notifications
- [ ] Test service worker lifecycle

### Phase 5.4: Conflict Resolution (Week 4)
- [ ] Implement conflict detection
- [ ] Build ConflictResolver UI
- [ ] Add auto-merge logic
- [ ] Test various conflict scenarios
- [ ] Handle edge cases

### Phase 5.5: Polish & Testing (Week 5)
- [ ] Add sync progress UI
- [ ] Implement queue management UI
- [ ] Write comprehensive tests
- [ ] Performance optimization
- [ ] Documentation and examples

---

## 📚 Dependencies

### NPM Packages
```json
{
  "idb": "^8.0.0",              // IndexedDB wrapper
  "workbox-window": "^7.0.0",   // Service worker helper
  "workbox-strategies": "^7.0.0" // Caching strategies
}
```

### Browser APIs
- **IndexedDB** - All modern browsers ✅
- **Service Workers** - All modern browsers ✅
- **Background Sync API** - Chrome, Edge, Opera (partial support)
- **Push API** - All modern browsers ✅

### Polyfills (if needed)
- None required for modern browsers
- Consider graceful degradation for older browsers

---

## 🎯 Success Metrics

### Technical KPIs
- **Sync success rate**: >99%
- **Sync latency**: <2 seconds average
- **Queue processing**: 100 items/second
- **Storage efficiency**: <50MB for 1000 messages
- **Battery impact**: <3% per hour background sync

### User Experience KPIs
- **Offline usability**: 4.5/5 rating
- **Data loss incidents**: 0
- **Sync conflict resolution**: <1% require manual intervention
- **User confusion**: Minimal (clear UI indicators)

---

## 🐛 Known Limitations

### Technical Constraints
1. **IndexedDB quota**: Browser-dependent, can fill up
2. **Background Sync**: Limited on iOS (no native support)
3. **Service Workers**: HTTPS required (except localhost)
4. **Sync timing**: No guaranteed background sync on mobile

### Edge Cases
1. **Device storage full**: Sync fails, need error handling
2. **Multiple tabs**: Sync coordination required
3. **Clock skew**: Timestamp conflicts possible
4. **Long offline periods**: Very large queues

### Mitigation Strategies
- Implement storage quota monitoring
- Fallback to polling on iOS
- Use BroadcastChannel for tab coordination
- Server timestamps for conflict resolution
- Queue size limits and pagination

---

## 📖 API Reference

### OfflineSyncService

```typescript
// Send message offline
await offlineSyncService.queueMessage({
  chatId: '123',
  content: 'Hello!',
  receiverId: 'user456'
})

// Sync now
await offlineSyncService.syncAll()

// Check status
const status = offlineSyncService.getSyncStatus()
// Returns: { isOnline: true, syncing: false, queueLength: 0 }

// Listen to events
offlineSyncService.on('syncStart', () => { /* ... */ })
offlineSyncService.on('syncComplete', () => { /* ... */ })
offlineSyncService.on('syncError', (error) => { /* ... */ })
```

### useOfflineSync Hook

```typescript
function MyComponent() {
  const {
    isOnline,
    syncStatus,
    queueLength,
    sendMessageOffline,
    syncNow,
  } = useOfflineSync()

  const handleSend = async () => {
    if (!isOnline) {
      await sendMessageOffline(message)
    } else {
      await sendMessage(message)
    }
  }

  return (
    <div>
      {!isOnline && <OfflineIndicator queueLength={queueLength} />}
      {/* ... */}
    </div>
  )
}
```

---

## 🎓 Learning Resources

### IndexedDB
- [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [idb library docs](https://github.com/jakearchibald/idb)

### Service Workers
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox Guide](https://developers.google.com/web/tools/workbox)

### Background Sync
- [Web.dev: Background Sync](https://web.dev/periodic-background-sync/)
- [Chrome Developers: Background Sync](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync/)

---

## 🔄 Next Steps

1. **Review and approve** this plan
2. **Install dependencies** (`npm install idb workbox-window workbox-strategies`)
3. **Start with Phase 5.1**: Set up IndexedDB service
4. **Iterate** based on testing and feedback

---

**Status**: 📝 Plan Complete, Ready for Implementation  
**Priority**: High  
**Estimated Effort**: 4-5 weeks  
**Risk Level**: Medium (complex sync logic, edge cases)

**Approval Required**: Yes ✋  
**Dependencies**: None (can start immediately)  
**Blockers**: None
