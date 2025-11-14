# Bluetooth/WiFi Local Discovery Implementation

This directory contains the **Bluetooth Low Energy (BLE)** service implementation for FriendFinder's nearby user discovery feature.

## 📁 File Structure

```
src/
├── services/
│   └── bluetooth/
│       └── BluetoothService.ts       # Core BLE service (React Native)
├── hooks/
│   └── useBluetoothDiscovery.ts      # React hook for BLE integration
└── components/
    └── NearbyUsersScreen.tsx         # Example "Nearby" UI component
```

## ⚠️ Important Notes

### Platform Requirements

**This BLE service requires React Native for mobile apps.** The current FriendFinder project is a **Next.js web application**, so this code is intended for a **future mobile app** (iOS/Android).

### Why React Native?

- **Full Bluetooth Access**: React Native provides native BLE APIs via `react-native-ble-plx`
- **Cross-Platform**: Single codebase for iOS and Android
- **Background Scanning**: Native modules support background BLE operations
- **BLE Advertising**: Native bridges required (see below)

### Web Bluetooth API Limitations

If you want a **web-only** version, note these severe limitations:
- ❌ **No BLE Advertising**: Web apps cannot broadcast their presence
- ❌ **User Must Initiate**: Scanning requires explicit user action (button click)
- ❌ **Limited Background**: No scanning when tab is inactive
- ✅ **Can Scan**: Web Bluetooth API supports scanning for nearby devices
- ✅ **Chrome/Edge Only**: Not supported in Safari/Firefox

**Verdict**: For full nearby discovery, a mobile app is required.

---

## 🚀 Quick Start (React Native Setup)

### 1. Create React Native Project

```bash
npx react-native init FriendFinderMobile
cd FriendFinderMobile
```

### 2. Install Dependencies

```bash
npm install react-native-ble-plx
npm install react-native-permissions
npm install @react-native-async-storage/async-storage
```

### 3. Link Native Modules (React Native CLI)

```bash
cd ios && pod install && cd ..
```

### 4. Configure Permissions

#### **Android** (`android/app/src/main/AndroidManifest.xml`):

```xml
<manifest>
  <!-- Bluetooth Permissions (Android 12+) -->
  <uses-permission android:name="android.permission.BLUETOOTH_SCAN"
                   android:usesPermissionFlags="neverForLocation" />
  <uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
  <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
  
  <!-- Location (Required for BLE on Android <12) -->
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  
  <!-- Legacy Bluetooth (Android <12) -->
  <uses-permission android:name="android.permission.BLUETOOTH" />
  <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
</manifest>
```

#### **iOS** (`ios/FriendFinderMobile/Info.plist`):

```xml
<dict>
  <key>NSBluetoothAlwaysUsageDescription</key>
  <string>FriendFinder needs Bluetooth to discover nearby users</string>
  
  <key>NSBluetoothPeripheralUsageDescription</key>
  <string>FriendFinder needs Bluetooth to broadcast your presence</string>
  
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>Location is required for Bluetooth scanning on iOS</string>
</dict>
```

### 5. Copy Service Files

Copy these files to your React Native project:

```bash
# From your Next.js project:
cp src/services/bluetooth/BluetoothService.ts <RN_PROJECT>/src/services/bluetooth/
cp src/hooks/useBluetoothDiscovery.ts <RN_PROJECT>/src/hooks/
cp src/components/NearbyUsersScreen.tsx <RN_PROJECT>/src/screens/
```

### 6. Usage Example

```tsx
// App.tsx (React Native)
import React from 'react';
import NearbyUsersScreen from './src/screens/NearbyUsersScreen';

export default function App() {
  return <NearbyUsersScreen />;
}
```

---

## 🔧 Implementation Details

### BluetoothService.ts

**Core Features:**
- ✅ BLE scanning for nearby FriendFinder users
- ✅ Permission handling (Android 12+ & iOS 13+)
- ✅ RSSI-based distance calculation
- ✅ Automatic stale user cleanup (30-second threshold)
- ✅ Event callbacks (`onDeviceFound`, `onDeviceLost`, `onStateChange`)
- ⚠️ **BLE Advertising** (requires native bridge implementation — see below)

**Key Methods:**

```typescript
import { getBluetoothService } from './services/bluetooth/BluetoothService';

const bluetoothService = getBluetoothService();

// Initialize Bluetooth
await bluetoothService.initialize();

// Start scanning for nearby users
await bluetoothService.startScanning();

// Get current nearby users
const nearbyUsers = bluetoothService.getNearbyUsers();

// Stop scanning
bluetoothService.stopScanning();
```

### useBluetoothDiscovery Hook

**React Hook Features:**
- ✅ Automatic initialization and cleanup
- ✅ Real-time nearby user list updates
- ✅ Bluetooth state monitoring
- ✅ Error handling
- ✅ `sendFriendRequest()` helper (needs backend integration)

**Usage:**

```tsx
const { 
  nearbyUsers, 
  isScanning, 
  startDiscovery, 
  stopDiscovery 
} = useBluetoothDiscovery();
```

### NearbyUsersScreen Component

**UI Features:**
- ✅ Real-time nearby user cards with distance indicators
- ✅ Start/Stop scanning controls
- ✅ Color-coded distance (green < 2m, yellow < 10m, orange < 50m, red > 50m)
- ✅ "Add Friend" buttons
- ✅ Error prompts and permission guides

---

## ⚠️ BLE Advertising (Native Bridge Required)

### Problem

The `react-native-ble-plx` library **does not support BLE advertising** out of the box. You must implement a **native bridge** to broadcast your presence.

### Solution: Native Modules

#### **Android** (Java/Kotlin Native Module)

Create `android/app/src/main/java/com/friendfinder/BleAdvertiserModule.java`:

```java
package com.friendfinder;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.os.ParcelUuid;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.util.UUID;

public class BleAdvertiserModule extends ReactContextBaseJavaModule {
    private BluetoothLeAdvertiser advertiser;
    
    public BleAdvertiserModule(ReactApplicationContext context) {
        super(context);
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter != null) {
            advertiser = adapter.getBluetoothLeAdvertiser();
        }
    }
    
    @Override
    public String getName() {
        return "BleAdvertiser";
    }
    
    @ReactMethod
    public void startAdvertising(String serviceUUID, String payload) {
        AdvertiseSettings settings = new AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(false)
            .build();
        
        AdvertiseData data = new AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .addServiceUuid(ParcelUuid.fromString(serviceUUID))
            .addManufacturerData(0xFFFF, payload.getBytes())
            .build();
        
        advertiser.startAdvertising(settings, data, new AdvertiseCallback() {
            @Override
            public void onStartSuccess(AdvertiseSettings settingsInEffect) {
                // Success
            }
            
            @Override
            public void onStartFailure(int errorCode) {
                // Error
            }
        });
    }
    
    @ReactMethod
    public void stopAdvertising() {
        if (advertiser != null) {
            advertiser.stopAdvertising();
        }
    }
}
```

#### **iOS** (Swift Native Module)

Create `ios/BleAdvertiserModule.swift`:

```swift
import CoreBluetooth

@objc(BleAdvertiserModule)
class BleAdvertiserModule: NSObject, CBPeripheralManagerDelegate {
    var peripheralManager: CBPeripheralManager!
    
    override init() {
        super.init()
        peripheralManager = CBPeripheralManager(delegate: self, queue: nil)
    }
    
    @objc
    func startAdvertising(_ serviceUUID: String, payload: String) {
        let uuid = CBUUID(string: serviceUUID)
        peripheralManager.startAdvertising([
            CBAdvertisementDataServiceUUIDsKey: [uuid],
            CBAdvertisementDataLocalNameKey: payload
        ])
    }
    
    @objc
    func stopAdvertising() {
        peripheralManager.stopAdvertising()
    }
    
    func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
        // Handle state changes
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
```

#### **React Native Bridge Usage**

```typescript
import { NativeModules } from 'react-native';

const { BleAdvertiser } = NativeModules;

// Start advertising
BleAdvertiser.startAdvertising(
  '0000FFF0-0000-1000-8000-00805F9B34FB',
  JSON.stringify({ userID: '123', username: 'John' })
);

// Stop advertising
BleAdvertiser.stopAdvertising();
```

---

## 🔐 Security Considerations

### Current Implementation

- ✅ **User Data in Payload**: Broadcasts `userID`, `username`, `status`
- ⚠️ **No Encryption**: Plaintext JSON in BLE advertisement
- ⚠️ **No Authentication**: Anyone can read broadcast data

### Recommended Improvements

1. **Hash User IDs**: Broadcast `SHA256(userID)` instead of raw ID
2. **Encrypt Payloads**: Use AES-128 with shared key (complex, impacts performance)
3. **Ephemeral IDs**: Rotate broadcasted identifier every 15 minutes
4. **TLS for API**: Friend requests via HTTPS only (already implemented)

**Example Hashing:**

```typescript
import CryptoJS from 'crypto-js';

const hashedUserID = CryptoJS.SHA256(userID).toString();
// Broadcast hashedUserID instead of raw userID
```

---

## 📡 Backend Integration

### Friend Request API

**Endpoint:** `POST /api/friends/request`

```typescript
// Request Body
{
  "receiverID": "user123",
  "method": "nearby" // or "search"
}

// Response
{
  "success": true,
  "requestId": "req_abc123"
}
```

**Update `useBluetoothDiscovery.ts`:**

```typescript
const sendFriendRequest = useCallback(async (userID: string) => {
  const response = await fetch('/api/friends/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Send cookies
    body: JSON.stringify({ receiverID: userID, method: 'nearby' }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send friend request');
  }
  
  return response.json();
}, []);
```

### Socket.IO Real-Time Events

**Server:** Emit friend request notifications

```javascript
// server.js (send from socket server)
io.to(receiverSocketId).emit('friend-request-received', {
  requestId: 'req_abc123',
  senderID: 'user456',
  senderName: 'Jane Doe',
  method: 'nearby',
});
```

**Client:** Listen for notifications

```typescript
// In your React component
useEffect(() => {
  socket.on('friend-request-received', (data) => {
    console.log('New friend request from:', data.senderName);
    // Show toast notification
  });
}, []);
```

---

## 🧪 Testing

### Manual Testing Steps

1. **Two Devices**: Install app on 2 phones (or emulator + physical device)
2. **Enable Bluetooth**: Turn on Bluetooth on both devices
3. **Start App**: Open FriendFinder and navigate to "Nearby" screen
4. **Grant Permissions**: Accept Bluetooth and location permissions
5. **Start Scanning**: Tap "Start Scanning" on both devices
6. **Verify Detection**: Each device should see the other in the list
7. **Check Distance**: Move devices closer/farther to verify RSSI updates
8. **Send Request**: Tap "Add Friend" and verify backend API call
9. **Accept Request**: Accept on receiving device and verify friendship

### Automated Tests

```typescript
// __tests__/bluetooth-service.test.ts
import { getBluetoothService } from '../src/services/bluetooth/BluetoothService';

describe('BluetoothService', () => {
  it('initializes successfully', async () => {
    const service = getBluetoothService();
    const result = await service.initialize();
    expect(result).toBe(true);
  });
  
  it('calculates distance from RSSI', () => {
    const service = getBluetoothService();
    const distance = service.calculateDistance(-60, -59, 2.5);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(100);
  });
});
```

---

## 📚 Related Documentation

- **Detailed Spec**: [`docs/BLUETOOTH_WIFI_SPEC.md`](../../docs/BLUETOOTH_WIFI_SPEC.md) (669 lines, comprehensive)
- **Quick Start**: [`docs/BLUETOOTH_WIFI_QUICKSTART.md`](../../docs/BLUETOOTH_WIFI_QUICKSTART.md) (246 lines, concise)
- **BLE Plx Library**: https://github.com/dotintent/react-native-ble-plx

---

## 🛠️ Troubleshooting

### Issue: "Bluetooth not initialized"

**Cause**: User denied permissions or Bluetooth is off.

**Fix**:
```typescript
const granted = await PermissionsAndroid.request(
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
);
if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
  alert('Bluetooth permission is required');
}
```

### Issue: "No devices found"

**Causes**:
1. Other device not advertising (native bridge missing)
2. Devices too far apart (>100m)
3. Background scanning disabled (iOS)

**Fix**: Implement native advertising module (see above).

### Issue: TypeScript errors in Next.js project

**This is expected!** The BLE code is for React Native (mobile apps), not web. Either:
1. Create a separate React Native project (recommended)
2. Use conditional imports if building a monorepo

---

## 📝 Next Steps

1. ✅ **Complete**: BLE service, hook, UI component created
2. ⏳ **Todo**: Implement native advertising bridges (Android/iOS)
3. ⏳ **Todo**: Create backend API endpoints (`/api/friends/request`, etc.)
4. ⏳ **Todo**: Integrate Socket.IO real-time notifications
5. ⏳ **Todo**: Add encryption/hashing for user IDs
6. ⏳ **Todo**: Test on physical devices (iOS/Android)

---

## 🤝 Contributing

If you implement the native advertising bridge or encounter platform-specific issues, please document them here!

---

**Generated for FriendFinder Project**  
**Last Updated**: January 2025
