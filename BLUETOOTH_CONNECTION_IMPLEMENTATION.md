# FriendFinder Bluetooth Connection Implementation

## Overview
Complete backend implementation for Bluetooth-based user discovery and connection in the FriendFinder app. This feature allows users to detect nearby users via Bluetooth, connect with them, and sync offline connections when internet is restored.

---

## 🏗️ Architecture

### Tech Stack
- **Backend**: Node.js + Express.js (Next.js API Routes)
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO for live updates
- **Security**: AES-256-CBC encryption for Bluetooth device IDs

### Database Schema Updates
```typescript
// User Model - New Bluetooth Fields
{
  bluetoothEnabled: Boolean,          // Bluetooth on/off status
  bluetoothDeviceId: String,          // Encrypted Bluetooth MAC address
  nearbyUsers: [ObjectId],            // Array of detected nearby user IDs
  bluetoothName: String,              // Human-readable device name
  lastSeen: Date,                     // Last activity timestamp
}
```

---

## 📡 API Endpoints

### 1. Bluetooth Status API
**Endpoint**: `POST /api/bluetooth/status`

**Purpose**: Enable/disable Bluetooth and register device ID

**Request Body**:
```json
{
  "bluetoothEnabled": true,
  "bluetoothDeviceId": "AA:BB:CC:DD:EE:FF",
  "bluetoothName": "John's Phone"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Bluetooth enabled successfully",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "bluetoothEnabled": true,
    "bluetoothName": "John's Phone",
    "nearbyUsers": []
  }
}
```

**Security**:
- JWT authentication required via NextAuth session
- Bluetooth device ID is encrypted (AES-256) before storage
- Validates device ID format (MAC address or custom format)

**Socket Event Emitted**: `bluetoothDisconnected` (when disabled)

---

### 2. Detect Nearby User API
**Endpoint**: `POST /api/bluetooth/detect`

**Purpose**: Register detection of a nearby Bluetooth device and find matching user

**Request Body**:
```json
{
  "detectedDeviceId": "AA:BB:CC:DD:EE:FF"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User detected successfully",
  "detectedUser": {
    "id": "detected_user_id",
    "username": "jane_doe",
    "name": "Jane Doe",
    "profilePicture": "https://...",
    "bluetoothName": "Jane's Phone",
    "bio": "Hello!"
  }
}
```

**Behavior**:
- Searches all users with Bluetooth enabled
- Decrypts device IDs to find matching user
- Updates `nearbyUsers` array for both users (avoids duplicates with `$addToSet`)
- Emits real-time notifications to both users

**Socket Events Emitted**: 
- `bluetoothNearby` → to detector
- `bluetoothNearby` → to detected user

**Security**:
- Prevents detecting yourself
- Only users with Bluetooth enabled are searchable
- Device IDs never exposed in responses

---

### 3. Connect via Bluetooth API
**Endpoint**: `POST /api/bluetooth/connect`

**Purpose**: Add detected user as friend

**Request Body**:
```json
{
  "receiverId": "detected_user_id"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully connected via Bluetooth",
  "connectedUser": {
    "id": "user_id",
    "username": "jane_doe",
    "name": "Jane Doe",
    "profilePicture": "https://...",
    "bluetoothName": "Jane's Phone"
  }
}
```

**Validation**:
- Both users must have Bluetooth enabled
- Receiver must be in sender's `nearbyUsers` list
- Cannot connect to yourself
- Cannot connect if already friends

**Socket Events Emitted**:
- `bluetoothConnected` → to sender
- `bluetoothConnected` → to receiver

---

### 4. Disconnect Bluetooth API
**Endpoint**: `POST /api/bluetooth/disconnect`

**Purpose**: Disable Bluetooth and clear nearby users

**Request Body**: None (uses session user ID)

**Response**:
```json
{
  "success": true,
  "message": "Bluetooth disconnected successfully",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "bluetoothEnabled": false,
    "nearbyUsers": []
  }
}
```

**Behavior**:
- Sets `bluetoothEnabled` to false
- Clears `nearbyUsers` array
- Updates `lastSeen` timestamp

**Socket Event Emitted**: `bluetoothDisconnected`

---

### 5. Sync Offline Connections API
**Endpoint**: `POST /api/bluetooth/sync`

**Purpose**: Sync connections made while offline (after internet reconnects)

**Request Body**:
```json
{
  "pendingConnections": [
    "user_id_1",
    "user_id_2",
    "user_id_3"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Bluetooth connections synced",
  "totalRequested": 3,
  "synced": 2,
  "failed": 1,
  "syncedConnections": [
    {
      "userId": "user_id_1",
      "username": "jane_doe",
      "name": "Jane Doe",
      "status": "synced",
      "message": "Connection synced successfully"
    },
    {
      "userId": "user_id_2",
      "username": "bob_smith",
      "status": "already_friends",
      "message": "Already friends"
    }
  ],
  "failedConnections": [
    {
      "userId": "user_id_3",
      "username": "invalid_user",
      "status": "failed",
      "error": "User not found"
    }
  ]
}
```

**Behavior**:
- Validates all receiver IDs
- Adds valid receivers to friends list
- Skips users who are already friends
- Notifies receivers via Socket.IO

**Socket Events Emitted**:
- `bluetoothConnected` → to each receiver (with `synced: true`)
- `bluetoothSyncCompleted` → to sender (with summary)

---

## 🔌 Socket.IO Events

### Client → Server Events

1. **bluetooth:status-change**
   ```javascript
   socket.emit('bluetooth:status-change', {
     userId: 'user_id',
     bluetoothEnabled: true
   });
   ```

2. **bluetooth:device-detected**
   ```javascript
   socket.emit('bluetooth:device-detected', {
     detectorId: 'user_id',
     detectedDeviceId: 'AA:BB:CC:DD:EE:FF'
   });
   ```

3. **bluetooth:request-connection**
   ```javascript
   socket.emit('bluetooth:request-connection', {
     senderId: 'user_id',
     receiverId: 'receiver_id',
     senderInfo: {
       username: 'john_doe',
       name: 'John Doe'
     }
   });
   ```

4. **bluetooth:accept-connection**
   ```javascript
   socket.emit('bluetooth:accept-connection', {
     senderId: 'sender_id',
     receiverId: 'user_id',
     receiverInfo: { ... }
   });
   ```

5. **bluetooth:reject-connection**
   ```javascript
   socket.emit('bluetooth:reject-connection', {
     senderId: 'sender_id',
     receiverId: 'user_id'
   });
   ```

---

### Server → Client Events

1. **bluetoothNearby**
   ```javascript
   socket.on('bluetoothNearby', (data) => {
     // data: { detectedUser, timestamp, message }
     console.log('Nearby user:', data.detectedUser);
   });
   ```

2. **bluetoothConnected**
   ```javascript
   socket.on('bluetoothConnected', (data) => {
     // data: { connectedUser, timestamp, message, synced? }
     console.log('Connected with:', data.connectedUser);
   });
   ```

3. **bluetoothDisconnected**
   ```javascript
   socket.on('bluetoothDisconnected', (data) => {
     // data: { userId, timestamp, message }
     console.log('Bluetooth disconnected');
   });
   ```

4. **bluetoothSyncCompleted**
   ```javascript
   socket.on('bluetoothSyncCompleted', (data) => {
     // data: { syncedCount, failedCount, syncedConnections, failedConnections }
     console.log(`Synced ${data.syncedCount} connections`);
   });
   ```

5. **bluetooth:connection-request**
   ```javascript
   socket.on('bluetooth:connection-request', (data) => {
     // data: { from: { username, name, ... }, timestamp }
     showConnectionRequestPopup(data.from);
   });
   ```

6. **bluetooth:connection-accepted**
   ```javascript
   socket.on('bluetooth:connection-accepted', (data) => {
     // data: { from, timestamp }
     showSuccessMessage('Connection accepted!');
   });
   ```

7. **bluetooth:connection-rejected**
   ```javascript
   socket.on('bluetooth:connection-rejected', (data) => {
     // data: { receiverId, timestamp }
     showInfoMessage('Connection request declined');
   });
   ```

---

## 🔒 Security Features

### 1. Encryption
- **Algorithm**: AES-256-CBC
- **Key**: SHA-256 hash of environment variable `BLUETOOTH_ENCRYPTION_KEY`
- **Storage**: Only encrypted device IDs stored in database
- **Decryption**: Only occurs server-side during matching

### 2. Authentication
- All API endpoints require JWT token via NextAuth session
- User ID extracted from session, not from request body
- Prevents impersonation attacks

### 3. Validation
- Device ID format validation (MAC address regex)
- ObjectId validation for all user references
- Input sanitization for device names (removes HTML, limits length)

### 4. Duplicate Prevention
- MongoDB `$addToSet` operator prevents duplicate entries in arrays
- Checks for existing friendships before connecting

### 5. Privacy
- Encrypted device IDs never exposed in API responses
- Users only discoverable if Bluetooth explicitly enabled
- Socket events only sent to specific user rooms

---

## 🧪 Testing Guide

### Prerequisites
```bash
# Set encryption key in .env.local
BLUETOOTH_ENCRYPTION_KEY=your-32-character-secret-key-here

# Ensure MongoDB is running
# Ensure Socket.IO server is running on port 3004
```

### Test Scenario 1: Enable Bluetooth
```bash
curl -X POST http://localhost:3000/api/bluetooth/status \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "bluetoothEnabled": true,
    "bluetoothDeviceId": "AA:BB:CC:DD:EE:FF",
    "bluetoothName": "Test Device"
  }'
```

### Test Scenario 2: Detect Nearby User
```bash
# User A detects User B
curl -X POST http://localhost:3000/api/bluetooth/detect \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=USER_A_TOKEN" \
  -d '{
    "detectedDeviceId": "11:22:33:44:55:66"
  }'
```

### Test Scenario 3: Connect via Bluetooth
```bash
curl -X POST http://localhost:3000/api/bluetooth/connect \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=USER_A_TOKEN" \
  -d '{
    "receiverId": "USER_B_ID"
  }'
```

### Test Scenario 4: Sync Offline Connections
```bash
curl -X POST http://localhost:3000/api/bluetooth/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "pendingConnections": ["user_id_1", "user_id_2"]
  }'
```

### Socket.IO Testing (JavaScript)
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3004');

socket.on('connect', () => {
  console.log('Connected to Socket.IO');
  
  // Register user
  socket.emit('user-register', {
    userId: 'your_user_id',
    username: 'test_user'
  });
});

// Listen for Bluetooth events
socket.on('bluetoothNearby', (data) => {
  console.log('Nearby user detected:', data);
});

socket.on('bluetoothConnected', (data) => {
  console.log('Connected with user:', data);
});

socket.on('bluetoothDisconnected', (data) => {
  console.log('Bluetooth disconnected:', data);
});
```

---

## 📋 API Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized. Please log in."
}
```

### 400 Bad Request
```json
{
  "error": "Invalid Bluetooth device ID format"
}
```

### 403 Forbidden
```json
{
  "error": "Bluetooth is not enabled for your account"
}
```

### 404 Not Found
```json
{
  "error": "No user found with that Bluetooth device ID",
  "detectedDeviceId": "AA:BB:CC:DD:EE:FF"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Detailed error message"
}
```

---

## 🚀 Deployment Checklist

- [ ] Set `BLUETOOTH_ENCRYPTION_KEY` environment variable (32+ characters)
- [ ] Ensure MongoDB indexes are created (run first request to trigger)
- [ ] Verify Socket.IO server is accessible from frontend
- [ ] Test CORS settings for Socket.IO
- [ ] Configure production logging (disable debug logs)
- [ ] Set up monitoring for Bluetooth connection success rate
- [ ] Test with real Bluetooth devices on mobile
- [ ] Implement rate limiting for API endpoints (optional)
- [ ] Add database backup for user connections
- [ ] Document client-side integration steps

---

## 📁 File Structure

```
src/
├── app/api/bluetooth/
│   ├── status/route.ts       # Enable/disable Bluetooth
│   ├── detect/route.ts       # Detect nearby users
│   ├── connect/route.ts      # Connect with user
│   ├── disconnect/route.ts   # Disconnect Bluetooth
│   └── sync/route.ts         # Sync offline connections
├── lib/
│   └── bluetooth-utils.ts    # Encryption utilities
├── models/
│   └── User.ts               # Updated with Bluetooth fields
└── server.js                 # Socket.IO handlers added
```

---

## 🐛 Common Issues & Solutions

### Issue: "No user found with that Bluetooth device ID"
**Solution**: Ensure the detected user has:
- Bluetooth enabled (`bluetoothEnabled: true`)
- Valid encrypted device ID stored
- Called `/api/bluetooth/status` to register their device

### Issue: Socket events not received
**Solution**: 
- Verify user has called `socket.emit('user-register')` after connecting
- Check that Socket.IO server is running on correct port
- Ensure user is joining the correct room: `user-{userId}`

### Issue: "User is not in your nearby users list"
**Solution**: 
- Call `/api/bluetooth/detect` first before `/api/bluetooth/connect`
- Check that detection was successful (status 200 response)

### Issue: Encryption/decryption errors
**Solution**:
- Ensure `BLUETOOTH_ENCRYPTION_KEY` is set and at least 32 characters
- Don't change the key after users have registered (old data won't decrypt)
- Regenerate device IDs if key is changed

---

## 📖 Additional Resources

- **Bluetooth Utilities**: `src/lib/bluetooth-utils.ts` - Encryption functions
- **User Model**: `src/models/User.ts` - Database schema
- **Socket.IO Server**: `server.js` - Real-time event handlers
- **Testing Scripts**: `scripts/setup-bluetooth-test-users.js` (to be created)

---

## 🎯 Next Steps for Frontend Integration

1. **Install Socket.IO client**: `npm install socket.io-client`

2. **Create Bluetooth context/hook**:
   ```typescript
   import { useEffect, useState } from 'react';
   import io from 'socket.io-client';
   
   export function useBluetoothConnection() {
     const [socket, setSocket] = useState(null);
     const [nearbyUsers, setNearbyUsers] = useState([]);
     
     useEffect(() => {
       const newSocket = io('http://localhost:3004');
       setSocket(newSocket);
       
       newSocket.on('bluetoothNearby', (data) => {
         setNearbyUsers(prev => [...prev, data.detectedUser]);
       });
       
       return () => newSocket.close();
     }, []);
     
     return { socket, nearbyUsers };
   }
   ```

3. **Implement Bluetooth UI components**:
   - Toggle switch for enabling Bluetooth
   - List of nearby users
   - Connect/reject buttons
   - Connection status indicators

4. **Handle mobile platform-specific Bluetooth APIs**:
   - React Native: Use `react-native-bluetooth-classic` or `react-native-ble-manager`
   - Expo: Use `expo-bluetooth`
   - Web: Not supported (use WiFi/location fallback)

---

## ✅ Implementation Complete

All Bluetooth backend features have been implemented:
- ✅ Database schema updated
- ✅ Encryption utilities created
- ✅ 5 API endpoints implemented
- ✅ Socket.IO handlers added
- ✅ Security measures in place
- ✅ Comprehensive documentation

Ready for frontend integration and testing! 🎉
