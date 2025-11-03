# Bluetooth & WiFi Local Discovery — Technical Specification

**FriendFinder Core Feature**  
Last Updated: November 3, 2025

---

## 🧭 Overview

The Bluetooth/WiFi local discovery system allows users to **discover and connect with nearby users** without requiring an active internet connection or being on the same network. This is the core differentiator of FriendFinder, similar to ShareIt or AirDrop functionality.

**Purpose:** Enable local friend discovery and instant friend requests using device-to-device communication.

---

## 🎯 Core Requirements

### Functional Requirements
1. Detect nearby users who have the FriendFinder app open or running in the background
2. Display nearby users in real-time with approximate distance
3. Allow users to send friend requests to discovered nearby users
4. Sync friend requests to backend when internet is available
5. Support both Bluetooth Low Energy (BLE) and WiFi Direct as transport layers

### Non-Functional Requirements
- Low battery consumption (use BLE advertising)
- Work in background (within OS limitations)
- Privacy-focused (broadcast only necessary identifiers)
- Graceful degradation (WiFi fallback if BLE unavailable)

---

## 🏗️ Architecture

### System Components

| Layer            | Technology                  | Function                                        |
| ---------------- | --------------------------- | ----------------------------------------------- |
| Frontend         | React / React Native        | Displays nearby users, triggers friend requests |
| Backend          | Node.js + Express + MongoDB | Handles friend requests, user data, syncing     |
| Local Networking | BLE + WiFi Direct           | Discover nearby users & exchange metadata       |
| Realtime Updates | WebSocket / Socket.IO       | Sync friend requests & online status            |
| Optional         | GPS / Location              | For map view of friends when not nearby         |

### Data Flow

```
Device A (Broadcasting)  <--[BLE/WiFi]-->  Device B (Scanning)
       ↓                                          ↓
   Local Cache                              Local Cache
       ↓                                          ↓
   UI Update                                 UI Update
       ↓                                          ↓
[User taps "Add Friend"]                         ↓
       ↓                                          ↓
   HTTP/WS Request  ----[Internet]---->  Backend MongoDB
       ↓                                          ↓
   Notification     <---[Socket.IO]----   Device B
```

---

## 🔧 Implementation Details

### 1. Nearby User Detection

**Objective:** Use BLE and WiFi Direct to detect users nearby who have the app open or running in the background.

#### How It Works

1. Each device periodically **broadcasts a unique user identifier** (e.g., hashed MongoDB userID or anonymous session token)
2. Simultaneously, each device **scans for nearby broadcasts** from other devices
3. When another user is detected, both devices exchange minimal data:
   - User ID (hashed for privacy)
   - Username
   - Profile photo thumbnail URL or hash
   - Timestamp
4. Once both sides confirm detection, the app shows the user in the **"Nearby"** section

#### Technology Stack

**Android:**
- `BluetoothLeAdvertiser` — for broadcasting presence
- `BluetoothLeScanner` — for discovering nearby devices
- `WifiP2pManager` — WiFi Direct fallback if Bluetooth is disabled

**iOS (future):**
- `CoreBluetooth` — BLE advertising and scanning
- `MultipeerConnectivity` — for peer-to-peer sessions

**Web (PWA — limited support):**
- Web Bluetooth API (Chrome/Edge only, requires user interaction)
- Fallback: QR code scanning or manual pairing code entry

---

### 2. Broadcast Protocol

Each device broadcasts a compact JSON payload encoded into BLE advertisement data or WiFi Direct service info.

#### Payload Structure

```json
{
  "userID": "abc123",           // Hashed user identifier (SHA256 of MongoDB _id)
  "username": "sayantan",       // Display name
  "status": "online",           // User status (online, busy, away)
  "timestamp": 1730544000,      // Unix timestamp (for freshness check)
  "version": "1.0"              // Protocol version (for future compatibility)
}
```

#### Broadcast Behavior

- **Interval:** Every 5–10 seconds (configurable)
- **Transport:**
  - Primary: BLE advertisement data (up to 31 bytes)
  - Fallback: WiFi Direct service name or TXT record
- **Encoding:** JSON stringified and Base64-encoded (or MessagePack for efficiency)

#### BLE Advertisement Example (Pseudocode)

```javascript
// Encode payload to fit BLE 31-byte limit
const payload = {
  uid: hashUserID(user.id).slice(0, 8),  // 8-char hash
  un: user.username.slice(0, 12),         // 12-char username
  ts: Math.floor(Date.now() / 1000)       // Unix timestamp
};

const encoded = base64Encode(JSON.stringify(payload));

// Start BLE advertising
bleAdvertiser.startAdvertising({
  serviceUUID: "0000FFF0-0000-1000-8000-00805F9B34FB",  // Custom FriendFinder UUID
  manufacturerData: encoded
});
```

---

### 3. Discovery Logic

**Objective:** Parse incoming broadcasts, maintain a fresh list of nearby users, and update the UI.

#### Algorithm

1. **Receive Advertisement:**
   - BLE scanner detects a new advertisement packet
   - Extract and decode the payload

2. **Parse & Validate:**
   - Check protocol version compatibility
   - Verify timestamp is recent (< 60 seconds old)

3. **Update Nearby List:**
   - If `userID` is not in the list → add new entry
   - If `userID` exists → update `lastSeen` timestamp

4. **Freshness Check (every 5 seconds):**
   - Remove users with `lastSeen > 30 seconds ago`

5. **UI Update:**
   - Trigger re-render of Nearby component with updated list

#### Pseudocode

```javascript
const nearbyUsers = new Map(); // userID -> { username, lastSeen, rssi, distance }

function onDeviceFound(advertisementData) {
  try {
    const user = parseAdvertisement(advertisementData);
    
    // Validate
    if (!user.userID || !user.username) return;
    if (Date.now() - user.timestamp > 60000) return; // Ignore stale broadcasts
    
    // Update or add
    if (!nearbyUsers.has(user.userID)) {
      nearbyUsers.set(user.userID, {
        userID: user.userID,
        username: user.username,
        lastSeen: Date.now(),
        rssi: advertisementData.rssi,
        distance: calculateDistance(advertisementData.rssi)
      });
      console.log(`New user detected: ${user.username}`);
    } else {
      nearbyUsers.get(user.userID).lastSeen = Date.now();
      nearbyUsers.get(user.userID).rssi = advertisementData.rssi;
    }
    
    updateUI();
  } catch (error) {
    console.error("Error parsing advertisement:", error);
  }
}

// Cleanup stale entries
setInterval(() => {
  const now = Date.now();
  for (const [userID, userData] of nearbyUsers.entries()) {
    if (now - userData.lastSeen > 30000) {
      nearbyUsers.delete(userID);
      console.log(`User ${userData.username} disappeared`);
    }
  }
  updateUI();
}, 5000);
```

---

### 4. Friend Request Flow

**Objective:** Allow users to send friend requests to discovered nearby users and sync them to the backend.

#### Flow

1. **User Interaction:**
   - User sees nearby user "Amar (5m away)" in the Nearby list
   - User taps "Add Friend" button

2. **Local Validation:**
   - Check if already friends or request pending
   - Show confirmation dialog if needed

3. **Send Request to Backend:**
   - HTTP POST or WebSocket emit to `/api/friends/request`
   - Payload:
     ```json
     {
       "senderID": "abc123",
       "receiverID": "xyz789",
       "method": "nearby",
       "timestamp": 1730544000
     }
     ```

4. **Backend Processing:**
   - Validate both users exist in MongoDB
   - Create `FriendRequest` document with status "pending"
   - Emit Socket.IO event to receiver if online:
     ```javascript
     io.to(`user-${receiverID}`).emit('friend-request-received', {
       senderID: "abc123",
       senderUsername: "sayantan",
       method: "nearby"
     });
     ```

5. **Receiver Notification:**
   - Receiver sees notification: "Sayantan (nearby) sent you a friend request"
   - Receiver can accept or decline

6. **Accept/Decline:**
   - HTTP PATCH `/api/friends/request/:requestId`
   - Backend updates `FriendRequest` status
   - Both users' friend lists updated
   - Socket.IO notifies sender

#### API Endpoints

```typescript
// Send friend request
POST /api/friends/request
Body: { senderID, receiverID, method }
Response: { success, requestId }

// Accept/decline request
PATCH /api/friends/request/:requestId
Body: { action: "accept" | "decline" }
Response: { success, message }

// Get pending requests
GET /api/friends/requests/pending
Response: { requests: [...] }
```

---

### 5. Offline Mode (Advanced Feature)

**Objective:** Exchange friend requests directly via BLE/WiFi when both users have no internet, then sync when online.

#### Implementation Strategy

1. **Direct Exchange:**
   - Establish BLE GATT connection or WiFi Direct socket
   - Exchange encrypted JSON payload:
     ```json
     {
       "type": "friend_request",
       "senderID": "abc123",
       "senderUsername": "sayantan",
       "receiverID": "xyz789",
       "signature": "...",  // HMAC signature for verification
       "timestamp": 1730544000
     }
     ```

2. **Local Storage:**
   - Save pending offline requests in AsyncStorage/IndexedDB
   - Mark as "pending_sync"

3. **Sync on Reconnect:**
   - When internet becomes available, POST all pending requests to backend
   - Backend validates signatures and processes requests
   - Update local storage to mark as synced

#### Security Considerations

- Use HMAC-SHA256 to sign offline requests (key derived from user's session token)
- Backend must verify signatures before accepting offline-synced requests
- Rate-limit offline request processing to prevent abuse

---

### 6. User Interface

**Objective:** Display nearby users in a clean, real-time updated list with distance indicators.

#### Components

**Nearby Screen (`/dashboard/nearby` or tab)**

```jsx
<NearbyUsersScreen>
  <Header>
    <Title>Nearby Friends</Title>
    <ScanningIndicator active={isScanning} />
  </Header>
  
  <UserList>
    {nearbyUsers.map(user => (
      <NearbyUserCard key={user.userID}>
        <Avatar src={user.profilePicture} />
        <UserInfo>
          <Username>{user.username}</Username>
          <Distance>{formatDistance(user.distance)}</Distance>
        </UserInfo>
        <ActionButtons>
          <AddFriendButton onClick={() => sendFriendRequest(user.userID)}>
            Add Friend
          </AddFriendButton>
        </ActionButtons>
      </NearbyUserCard>
    ))}
  </UserList>
  
  {nearbyUsers.length === 0 && (
    <EmptyState>
      <Icon name="radar" />
      <Message>No nearby users found</Message>
      <Hint>Make sure Bluetooth is enabled</Hint>
    </EmptyState>
  )}
</NearbyUsersScreen>
```

#### State Management

```javascript
const [nearbyUsers, setNearbyUsers] = useState([]);
const [isScanning, setIsScanning] = useState(false);

useEffect(() => {
  startBluetoothScanning();
  
  const subscription = BluetoothService.onDeviceFound((device) => {
    setNearbyUsers(prev => updateNearbyList(prev, device));
  });
  
  return () => {
    stopBluetoothScanning();
    subscription.remove();
  };
}, []);
```

---

### 7. Distance Estimation

**Objective:** Estimate proximity using Bluetooth RSSI (Received Signal Strength Indicator).

#### Formula

```python
distance = 10 ^ ((txPower - rssi) / (10 * n))
```

**Parameters:**
- `txPower`: Transmission power at 1 meter (typically -59 dBm for BLE)
- `rssi`: Received signal strength (from advertisement packet)
- `n`: Path loss exponent
  - 2.0 for open space (outdoor)
  - 3.5 for indoor environments
  - 4.0 for dense obstacles

#### Implementation

```javascript
function calculateDistance(rssi, txPower = -59, n = 2.5) {
  if (rssi === 0) return -1.0; // Invalid signal
  
  const ratio = rssi / txPower;
  if (ratio < 1.0) {
    return Math.pow(ratio, 10);
  } else {
    const distance = (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
    return distance;
  }
}

function formatDistance(distanceMeters) {
  if (distanceMeters < 0) return "Unknown";
  if (distanceMeters < 1) return "Very close";
  if (distanceMeters < 3) return `${distanceMeters.toFixed(1)}m away`;
  if (distanceMeters < 10) return "Nearby";
  return "Far";
}
```

#### Display Categories

| Distance Range | Label         | Icon/Color |
| -------------- | ------------- | ---------- |
| 0–1m           | Very close    | 🟢 Green   |
| 1–3m           | X.Xm away     | 🔵 Blue    |
| 3–10m          | Nearby        | 🟡 Yellow  |
| 10m+           | Far           | 🟠 Orange  |

---

## 📱 Example User Flow

### Scenario: Sayantan and Amar Meet at a Coffee Shop

1. **Step 1: Sayantan Opens App**
   - App starts broadcasting his userID via BLE
   - Scanning service activates

2. **Step 2: Amar Opens App**
   - Amar's phone detects Sayantan's BLE advertisement
   - Parses payload: `{ userID: "abc123", username: "sayantan" }`
   - Adds Sayantan to nearby list

3. **Step 3: Amar Sees Sayantan**
   - UI shows: "Sayantan (2.5m away)"
   - Distance calculated from RSSI (-65 dBm)

4. **Step 4: Amar Sends Friend Request**
   - Amar taps "Add Friend"
   - App sends POST to `/api/friends/request`
   - Backend creates pending request in MongoDB

5. **Step 5: Sayantan Receives Notification**
   - Socket.IO emits `friend-request-received` event
   - Notification: "Amar (nearby) sent you a friend request"

6. **Step 6: Sayantan Accepts**
   - Sayantan taps "Accept"
   - App sends PATCH to `/api/friends/request/:id`
   - Backend updates both users' friend lists

7. **Step 7: They Become Friends**
   - Both see each other in Friends list
   - Can now chat, call, or view location on map

---

## ✅ Implementation Checklist

### Phase 1: Core BLE/WiFi Setup

- [ ] **Bluetooth Service Module**
  - [ ] BLE advertising (broadcast userID + username)
  - [ ] BLE scanning (detect nearby advertisements)
  - [ ] Parse and decode advertisement data
  - [ ] Background service (Android: Foreground Service, iOS: Background modes)

- [ ] **WiFi Direct Module** (Android)
  - [ ] Peer discovery
  - [ ] Service broadcasting
  - [ ] Fallback when BLE unavailable

- [ ] **Permissions Handler**
  - [ ] Request Bluetooth permissions (Android 12+: BLUETOOTH_SCAN, BLUETOOTH_ADVERTISE)
  - [ ] Request Location permissions (required for BLE on Android)
  - [ ] Request WiFi permissions (ACCESS_WIFI_STATE, CHANGE_WIFI_STATE)
  - [ ] Handle permission denial gracefully

### Phase 2: Frontend Integration

- [ ] **Nearby Users Screen**
  - [ ] Display list of detected users
  - [ ] Real-time updates (add/remove users)
  - [ ] Distance indicator (RSSI-based)
  - [ ] "Add Friend" button per user

- [ ] **State Management**
  - [ ] Context or Redux for nearby users list
  - [ ] WebSocket integration for friend requests
  - [ ] Notification handling

- [ ] **UI Components**
  - [ ] NearbyUserCard component
  - [ ] EmptyState for no users found
  - [ ] Scanning indicator (animated)

### Phase 3: Backend API

- [ ] **Friend Request Endpoints**
  - [ ] POST `/api/friends/request` (send request)
  - [ ] PATCH `/api/friends/request/:id` (accept/decline)
  - [ ] GET `/api/friends/requests/pending` (fetch pending)

- [ ] **MongoDB Schema**
  - [ ] `FriendRequest` model (sender, receiver, status, method, timestamp)
  - [ ] Update `User` model with friends array

- [ ] **Socket.IO Events**
  - [ ] Emit `friend-request-received` on new request
  - [ ] Emit `friend-request-accepted` on accept
  - [ ] User online/offline status broadcasts

### Phase 4: Advanced Features

- [ ] **Offline Mode**
  - [ ] Direct BLE GATT connection
  - [ ] Offline request signing (HMAC)
  - [ ] Sync queue in local storage
  - [ ] Background sync when online

- [ ] **Distance Estimation**
  - [ ] RSSI-based distance calculation
  - [ ] Kalman filter for smoothing
  - [ ] Display distance categories

- [ ] **Privacy & Security**
  - [ ] Hash userIDs in broadcasts
  - [ ] Encrypted payloads for sensitive data
  - [ ] Rate limiting on friend requests
  - [ ] Block/report nearby users

### Phase 5: Testing & Optimization

- [ ] **Testing**
  - [ ] Test with multiple devices
  - [ ] Test background scanning
  - [ ] Test battery consumption
  - [ ] Test range limits (indoor/outdoor)

- [ ] **Optimization**
  - [ ] Adjust broadcast interval for battery
  - [ ] Reduce payload size (MessagePack)
  - [ ] Cache profile pictures locally

---

## 🛠️ Technical Notes

### Platform-Specific Considerations

#### Android

- **Permissions:** Android 12+ requires `BLUETOOTH_SCAN` and `BLUETOOTH_ADVERTISE` runtime permissions
- **Background Limitations:** Use a foreground service with notification to keep BLE running
- **Battery Optimization:** Users may need to disable battery optimization for the app
- **WiFi Direct:** Works best on Android 4.0+ (API 14+), but peer discovery can be flaky

#### iOS

- **Background Modes:** Enable "Uses Bluetooth LE accessories" and "Acts as a Bluetooth LE accessory" in Xcode
- **CoreBluetooth:** iOS restricts background advertising; only service UUIDs can be broadcast
- **MultipeerConnectivity:** Alternative for iOS-to-iOS discovery (doesn't work cross-platform)
- **Privacy:** iOS 13+ requires "Privacy - Bluetooth Always Usage Description" in Info.plist

#### Web (PWA)

- **Web Bluetooth API:** Chrome/Edge only; requires user gesture (button click)
- **Limited Background:** No background scanning in browsers
- **Fallback:** QR code scanning or manual pairing codes for web users

### Security Best Practices

1. **Hash User IDs:** Never broadcast raw MongoDB ObjectIDs
2. **Rate Limiting:** Limit friend requests to prevent spam (e.g., 10 per hour)
3. **Signature Verification:** Verify offline request signatures on backend
4. **Encryption:** Use TLS for all backend communication
5. **User Blocking:** Allow users to hide from nearby discovery or block specific users

### Performance Optimization

1. **Payload Size:** Keep BLE payloads under 31 bytes (use short IDs, MessagePack)
2. **Scan Interval:** Balance between responsiveness and battery (5–10 seconds is optimal)
3. **Caching:** Cache profile pictures locally to avoid repeated fetches
4. **Debouncing:** Debounce UI updates to avoid flickering
5. **Memory Management:** Limit nearby list to 50 users max; clear stale entries

---

## 📚 Additional Resources

### Documentation

- [Android BLE Guide](https://developer.android.com/guide/topics/connectivity/bluetooth-le)
- [Android WiFi Direct](https://developer.android.com/guide/topics/connectivity/wifip2p)
- [iOS CoreBluetooth](https://developer.apple.com/documentation/corebluetooth)
- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)

### Libraries

- **React Native:**
  - [react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx) — BLE for React Native
  - [react-native-wifi-p2p](https://github.com/kirillzyusko/react-native-wifi-p2p) — WiFi Direct for RN
  - [react-native-ble-manager](https://github.com/innoveit/react-native-ble-manager) — Alternative BLE lib

- **Android Native:**
  - Built-in `BluetoothLeAdvertiser` and `BluetoothLeScanner`
  - `WifiP2pManager` for WiFi Direct

- **iOS Native:**
  - Built-in `CoreBluetooth` framework
  - `MultipeerConnectivity` for P2P sessions

### Example Projects

- [BLE Chat Example](https://github.com/IvanKiral/BLE-chat-example) — React Native BLE chat
- [WiFi Direct Sample](https://github.com/anuragmadnawat/WiFi_Direct_Sample) — Android WiFi Direct
- [CoreBluetooth Example](https://github.com/0x7fffffff/Core-Bluetooth-Example) — iOS BLE

---

## 🚀 Next Steps

1. **Set up development environment:**
   - Install React Native CLI or Expo (if using RN)
   - Set up Android Studio and Xcode
   - Install BLE testing apps (nRF Connect, LightBlue)

2. **Implement Phase 1 (BLE setup):**
   - Start with broadcasting module
   - Test with BLE scanner app
   - Add scanning module
   - Test device-to-device discovery

3. **Build Phase 2 (UI):**
   - Create Nearby screen
   - Connect to BLE service
   - Display real-time updates

4. **Backend integration (Phase 3):**
   - Create friend request API
   - Test Socket.IO events
   - Integrate with frontend

5. **Test & Iterate:**
   - Test with real devices
   - Measure battery impact
   - Optimize based on metrics

---

**Document maintained by:** FriendFinder Development Team  
**For questions or clarifications:** Create an issue in the GitHub repo or contact the team lead.
