# Bluetooth Architecture Documentation

## Overview
This document explains the Bluetooth discovery architecture and how it's designed for future mobile app conversion.

## Two Separate Systems

### 1. Manual Pairing (Left Panel)
**Location**: `src/components/BluetoothManager.tsx`

**Purpose**: Manual friend connection via pairing codes

**Flow**:
1. User A enters device name → generates 6-digit pairing code (valid for 5 minutes)
2. User A shares code with User B (text, QR code, etc.)
3. User B enters the code → friend request sent automatically
4. Code is single-use and cleared after successful pairing

**API Endpoints**:
- `POST /api/users/bluetooth` - Generate pairing code
- `POST /api/users/bluetooth/pair` - Submit pairing code to connect

**Use Cases**:
- Connect with someone not physically nearby
- Manual friend connection when automatic discovery doesn't work
- Share code via any channel (SMS, messaging app, QR code, etc.)

---

### 2. Automatic Nearby Discovery (Right Panel)
**Location**: `src/app/dashboard/discover/page.tsx` (right side, Bluetooth tab)

**Purpose**: Automatically discover nearby users with Bluetooth ON and the app installed

**Current Implementation (Web)**:
- Uses database-based "simulated" discovery
- Finds users who recently updated their Bluetooth presence (within last 24 hours)
- Limited by browser Bluetooth API restrictions

**Future Implementation (Mobile App)**:
When converting to React Native or native mobile app:

#### iOS (Swift/Objective-C)
```swift
import CoreBluetooth

class BluetoothScanner: NSObject, CBCentralManagerDelegate {
    var centralManager: CBCentralManager!
    
    func startScanning() {
        centralManager = CBCentralManager(delegate: self, queue: nil)
        // Scan for devices advertising your app's service UUID
        centralManager.scanForPeripherals(
            withServices: [CBUUID(string: "YOUR-APP-UUID")],
            options: nil
        )
    }
    
    func centralManager(_ central: CBCentralManager, 
                       didDiscover peripheral: CBPeripheral,
                       advertisementData: [String : Any],
                       rssi RSSI: NSNumber) {
        // Extract user ID from advertisement data
        // Send to server to fetch user profile
        // Display in nearby users list
    }
}
```

#### Android (Java/Kotlin)
```kotlin
import android.bluetooth.BluetoothAdapter
import android.bluetooth.le.ScanCallback

class BluetoothScanner {
    private val bluetoothAdapter: BluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
    private val bluetoothLeScanner = bluetoothAdapter.bluetoothLeScanner
    
    fun startScanning() {
        val scanCallback = object : ScanCallback() {
            override fun onScanResult(callbackType: Int, result: ScanResult) {
                // Extract user ID from scan result
                // Send to server to fetch user profile
                // Display in nearby users list
            }
        }
        
        bluetoothLeScanner.startScan(scanCallback)
    }
}
```

#### React Native
```javascript
import BleManager from 'react-native-ble-manager';

export const startBluetoothScanning = async () => {
  try {
    await BleManager.start();
    await BleManager.scan([], 5, true);
    
    // Listen for discovered devices
    bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', (device) => {
      // Extract user ID from device advertisement
      // Fetch user profile from server
      // Update nearby users list
    });
  } catch (error) {
    console.error('Bluetooth scan failed:', error);
  }
};
```

---

## Migration Path (Web → Mobile)

### Step 1: Service UUID Setup
1. Generate unique UUID for your app (e.g., `12345678-1234-1234-1234-123456789abc`)
2. Register in app configuration
3. All users advertise this UUID when Bluetooth is enabled

### Step 2: Advertisement Data Structure
```json
{
  "serviceUUID": "12345678-1234-1234-1234-123456789abc",
  "userData": {
    "userId": "encrypted-user-id",
    "timestamp": 1698765432
  }
}
```

### Step 3: Replace Client Code
**Current (Web)**:
```typescript
// src/services/bluetoothService.ts
async getNearbyUsers(): Promise<NearbyBluetoothResponse> {
  const response = await fetch("/api/users/nearby-bluetooth");
  return response.json();
}
```

**Future (Mobile)**:
```typescript
async getNearbyUsers(): Promise<NearbyBluetoothResponse> {
  // Scan for nearby Bluetooth devices
  const devices = await BluetoothScanner.scan();
  
  // Extract user IDs from discovered devices
  const userIds = devices.map(d => d.userData.userId);
  
  // Fetch user profiles from server
  const response = await fetch("/api/users/bluetooth/resolve", {
    method: "POST",
    body: JSON.stringify({ userIds })
  });
  
  return response.json();
}
```

### Step 4: Server Endpoint (New)
```typescript
// POST /api/users/bluetooth/resolve
// Input: { userIds: string[] }
// Output: { users: UserProfile[] }

export async function POST(request: NextRequest) {
  const { userIds } = await request.json();
  
  // Fetch user profiles for discovered device IDs
  const users = await User.find({ 
    _id: { $in: userIds },
    // ... privacy filters
  });
  
  return NextResponse.json({ users });
}
```

---

## Key Differences

| Feature | Web Version | Mobile Version |
|---------|-------------|----------------|
| **Discovery Method** | Database query | Real Bluetooth scan |
| **Accuracy** | Approximate (last 24h) | Real-time (currently nearby) |
| **Range** | Unlimited (DB) | ~10-100 meters (Bluetooth) |
| **Battery Impact** | None | Medium (BLE scanning) |
| **Privacy** | Server knows all | Only nearby devices visible |
| **Permissions** | Browser prompt | OS-level Bluetooth permission |

---

## Real-time Updates

Both systems use Socket.IO for real-time updates:

### Events
- `bluetooth_update` - User registered/updated Bluetooth presence
- `bluetooth_cleared` - User disabled Bluetooth
- `friend_request_received` - New pairing code connection

### Client Subscription
```typescript
const { onNearbyBluetoothUpdate } = useSocket();

useEffect(() => {
  const unsubscribe = onNearbyBluetoothUpdate(async () => {
    // Refresh nearby users list
    await findBluetoothUsers();
  });
  
  return unsubscribe;
}, []);
```

---

## Privacy & Security

### Web Version
- User IDs stored in database with timestamps
- No actual Bluetooth device information exposed
- Server-side filtering for privacy settings

### Mobile Version (Recommendations)
1. **Encrypt User IDs** in BLE advertisement data
2. **Rotate Advertisement Data** every 15 minutes to prevent tracking
3. **Require Mutual Opt-in** - both users must have discovery enabled
4. **Respect Privacy Settings** - honor user's discovery preferences
5. **Background Scanning Limits** - follow platform guidelines

---

## Testing

### Web Version
1. Two browser sessions (different accounts)
2. User A: Left panel → Generate code
3. User B: Left panel → Enter code OR right panel → Scan nearby
4. Verify friend request created

### Mobile Version (Future)
1. Two physical devices nearby
2. Both enable Bluetooth in app
3. Click "Scan Nearby Friends"
4. Verify both users appear in each other's lists
5. Test range limits (10m, 50m, 100m)

---

## Performance Considerations

### Web Version
- Database query: ~50-200ms
- No battery impact
- Scales to thousands of users

### Mobile Version
- BLE scan: ~1-5 seconds
- Battery drain: ~5-10% per hour (active scanning)
- Should implement:
  - Scan throttling (max every 30 seconds)
  - Background scan limits (iOS: limited, Android: more flexible)
  - Stop scanning when app in background

---

## Sappa App Reference

The right panel (automatic discovery) is modeled after the **Sappa social networking app**:
- Users appear as "bubbles" when nearby
- Real-time Bluetooth-based discovery
- Click to connect/friend request
- Distance-based visualization

For web demo: simulated via database
For mobile app: implement with real Bluetooth as documented above

---

## Implementation Checklist

### Phase 1: Web (Current) ✅
- [x] Manual pairing via codes
- [x] Database-based "nearby" simulation
- [x] Socket.IO real-time updates
- [x] Friend request flow

### Phase 2: Mobile App (Future)
- [ ] Choose React Native vs native (Swift/Kotlin)
- [ ] Implement BLE scanning
- [ ] Generate/advertise service UUID
- [ ] Background scanning permissions
- [ ] Battery optimization
- [ ] Distance calculation (RSSI-based)
- [ ] Privacy encryption for user IDs
- [ ] Testing with physical devices

---

## Additional Resources

- [CoreBluetooth Documentation (iOS)](https://developer.apple.com/documentation/corebluetooth)
- [Android Bluetooth LE Guide](https://developer.android.com/guide/topics/connectivity/bluetooth/ble-overview)
- [React Native BLE Manager](https://github.com/innoveit/react-native-ble-manager)
- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
