# Bluetooth Mobile Integration - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Prerequisites
- Node.js 18+ and npm installed
- MongoDB running (local or cloud)
- For mobile: React Native development environment setup

### 1. Install Dependencies
```bash
# Install main project dependencies
npm install

# For mobile development (optional)
cd mobile
npm install
cd ..
```

### 2. Configure Environment
Create `.env.local` in the project root:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/friendfinder

# Next.js
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here

# Socket.IO
SOCKET_PORT=3004
```

### 3. Create Test Users
```bash
node scripts/setup-bluetooth-test-users.js
```

This creates 4 test users:
- alice@test.com / test123
- bob@test.com / test123
- charlie@test.com / test123
- diana@test.com / test123

### 4. Start Servers
```bash
# Terminal 1: Start Next.js
npm run dev:3001

# Terminal 2: Start Socket.IO server
npm run dev:socket
```

### 5. Test Bluetooth Pairing (Web)

**Open Browser 1** - http://localhost:3001/dashboard/bluetooth
1. Sign in as `alice@test.com` / `test123`
2. Click "Generate Code"
3. Enter device name: "Alice's Phone"
4. Copy the 6-digit code shown

**Open Browser 2** (incognito/different browser)
1. Sign in as `bob@test.com` / `test123`
2. Go to /dashboard/bluetooth
3. Enter Alice's 6-digit code
4. Click "Connect with Code"
5. ✅ Friend request sent!

**Verify in Browser 1**
1. Go to /dashboard/friends
2. See pending friend request from Bob
3. Accept request
4. ✅ Now friends!

---

## 📱 Mobile App Setup

### iOS Setup
```bash
cd mobile

# Install pods
cd ios
pod install
cd ..

# Run on simulator
npx react-native run-ios

# Or specific device
npx react-native run-ios --device "Your iPhone"
```

### Android Setup
```bash
cd mobile

# Run on emulator (start emulator first)
npx react-native run-android

# Or specific device
npx react-native run-android --deviceId=<device-id>
```

### Mobile Permissions

**iOS** - Add to `Info.plist`:
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>FriendFinder uses Bluetooth to discover nearby friends</string>
```

**Android** - Already configured in `AndroidManifest.xml`
- BLUETOOTH, BLUETOOTH_ADMIN
- BLUETOOTH_SCAN, BLUETOOTH_CONNECT (Android 12+)
- ACCESS_FINE_LOCATION (required for BLE scanning)

### Mobile Testing Flow
1. Install app on Device A
2. Sign in as alice@test.com
3. Grant Bluetooth permissions
4. Tap "Start Discovery"
5. Install app on Device B
6. Sign in as bob@test.com
7. Tap "Start Discovery"
8. Device A should see "bob_bluetooth" nearby
9. Tap on bob → Send Friend Request
10. ✅ Friend request sent via Bluetooth discovery!

---

## 🔍 Testing Checklist

### ✅ Backend Tests
- [ ] Generate pairing code returns 6-digit number
- [ ] Code expires after 5 minutes
- [ ] Pairing with valid code sends friend request
- [ ] Pairing with expired code returns error
- [ ] Cannot pair with self
- [ ] Cannot create duplicate friend requests
- [ ] Bluetooth device registration updates timestamp
- [ ] Nearby users query returns active users

### ✅ Frontend Tests (Web)
- [ ] Pairing code generates successfully
- [ ] Countdown timer shows correct time remaining
- [ ] Code can be copied to clipboard
- [ ] Entering code sends friend request
- [ ] UI shows success/error messages
- [ ] Code expires and UI updates accordingly

### ✅ Mobile Tests
- [ ] Bluetooth permission request works
- [ ] BLE scanning detects nearby devices
- [ ] Device list updates in real-time
- [ ] Tapping device shows user profile
- [ ] Send friend request from discovery works
- [ ] Background scanning (if enabled) works
- [ ] Battery usage is acceptable

---

## 🐛 Troubleshooting

### "Code not found or expired"
- **Cause**: Code expired (>5 minutes old) or already used
- **Fix**: Generate a new code

### "Cannot connect to MongoDB"
- **Cause**: MongoDB not running or wrong connection string
- **Fix**: Start MongoDB or check `MONGODB_URI` in `.env.local`

### "Unauthorized" error
- **Cause**: Not signed in or invalid session
- **Fix**: Sign out and sign in again

### Mobile: "Bluetooth permission denied"
- **iOS**: Go to Settings → FriendFinder → Enable Bluetooth
- **Android**: Grant location permission (required for BLE scanning)

### Mobile: "No devices found"
- **Cause**: Both devices must have Bluetooth enabled and discovery active
- **Fix**: 
  1. Ensure both devices have the app open
  2. Both users tapped "Start Discovery"
  3. Devices are within 10 meters
  4. Location/Bluetooth permissions granted

### Socket.IO connection issues
- **Cause**: Socket server not running or wrong port
- **Fix**: 
  1. Run `npm run dev:socket`
  2. Check `SOCKET_PORT` in `.env.local`
  3. Verify logs show "Socket.IO server running on port 3004"

---

## 📚 API Reference

### Generate Pairing Code
```http
POST /api/users/bluetooth
Content-Type: application/json

{
  "deviceName": "My Phone"
}

Response:
{
  "success": true,
  "bluetoothId": "bt_mhjblnk9_2h5qpg",
  "pairingCode": "123456",
  "pairingCodeExpires": "2025-11-03T10:35:00.000Z"
}
```

### Pair with Code
```http
POST /api/users/bluetooth/pair
Content-Type: application/json

{
  "code": "123456"
}

Response:
{
  "success": true,
  "message": "Friend request sent via pairing code",
  "requestId": "507f1f77bcf86cd799439011"
}
```

### Get Nearby Bluetooth Users
```http
GET /api/users/nearby-bluetooth

Response:
{
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "bob_bluetooth",
      "lastSeenBluetooth": "2025-11-03T10:30:00.000Z",
      "isFriend": false,
      "hasPendingRequestFrom": false,
      "hasPendingRequestTo": false
    }
  ],
  "count": 1,
  "deviceId": "bt_mhjblnk9_2h5qpg"
}
```

### Clear Bluetooth Device
```http
DELETE /api/users/bluetooth

Response:
{
  "success": true,
  "message": "Bluetooth device cleared successfully"
}
```

---

## 🎯 Next Steps

### After Testing
1. **Accept friend requests** in /dashboard/friends
2. **Start chatting** with new friends
3. **Share location** on map with friends
4. **Test random chat** with verified friends

### Production Deployment
1. Update `NEXTAUTH_URL` to production domain
2. Set secure `NEXTAUTH_SECRET` (32+ characters)
3. Use MongoDB Atlas or production database
4. Enable HTTPS (required for Web Bluetooth)
5. Submit mobile apps to stores with Bluetooth usage descriptions

### Advanced Features
- Implement QR code sharing for pairing codes
- Add push notifications for friend requests
- Enable background BLE scanning (mobile)
- Implement Bluetooth mesh for offline messaging

---

## 📖 Additional Resources

- [Full Implementation Docs](./PHASE_4_IMPLEMENTATION_COMPLETE.md)
- [Architecture Overview](./BLUETOOTH_ARCHITECTURE.md)
- [Discovery Algorithm](./BLUETOOTH_DISCOVERY.md)
- [Mobile Service README](../src/services/bluetooth/README.md)

---

**Need help?** Check existing documentation or run automated tests:
```bash
# Run unit tests
node scripts/test-bluetooth-integration.js

# Run full test suite (when server running)
npm test
```

**Phase 4 Status**: ✅ **COMPLETE** - Ready for production use!
