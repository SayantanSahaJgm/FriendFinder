# Bluetooth Discovery Feature

## Overview
The Bluetooth Discovery feature allows FriendFinder users to find and connect with other users who are nearby by enabling Bluetooth discovery in the app.

## How It Works

### 1. Enable Bluetooth Discovery
- User clicks "Enable Bluetooth Discovery" button
- App generates a unique Bluetooth ID for the device
- Bluetooth ID is saved to the user's profile in MongoDB
- User becomes discoverable to other nearby FriendFinder users

### 2. Scan for Nearby Users
- User clicks "Scan for Nearby Users" button
- App queries the database for other users with Bluetooth IDs
- Shows list of nearby users with their profiles
- Displays activity status (Active now, Active recently, etc.)

### 3. Send Friend Requests
- Click "Add Friend" button on any nearby user
- Friend request is sent via the existing friend request system
- Status updates in real-time (Friends, Pending, etc.)

## Testing the Feature

### Setup Test Users
To test the Bluetooth discovery feature, you need multiple users with Bluetooth enabled:

```bash
# Run the test user setup script
node scripts/setup-bluetooth-test-users.js
```

This creates 4 test users with Bluetooth IDs:
- alice@test.com / alice_bluetooth
- bob@test.com / bob_bluetooth
- charlie@test.com / charlie_bluetooth  
- diana@test.com / diana_bluetooth

### Test Workflow
1. Enable Bluetooth discovery on your account
2. The app will automatically scan for nearby users
3. You should see the 4 test users in the "Nearby Users" list
4. Try sending friend requests to test users
5. Test the "Scan Again" functionality

## Technical Implementation

### Frontend Components
- **Page**: `src/app/dashboard/bluetooth/page.tsx`
- **Hooks**: `src/hooks/useBluetooth.ts`
- **Service**: `src/services/bluetoothService.ts`

### Backend API Endpoints
- **GET** `/api/users/bluetooth` - Get current user's Bluetooth status
- **POST** `/api/users/bluetooth` - Enable Bluetooth (save ID to database)
- **DELETE** `/api/users/bluetooth` - Disable Bluetooth (clear ID)
- **GET** `/api/users/nearby-bluetooth` - Get list of nearby users

### Database Schema
User model includes:
- `bluetoothId`: string (unique device identifier)
- `bluetoothIdUpdatedAt`: Date (last time Bluetooth was enabled)

### Matching Algorithm
The `findNearbyByBluetooth` method in the User model:
1. Finds users with Bluetooth IDs
2. Filters users active in the last 5 minutes
3. Excludes the current user
4. Sorts by most recently seen
5. Limits to 50 results

## Privacy & Security

### What's Shared
- ✅ Bluetooth proximity (nearby/not nearby)
- ✅ User profile information (name, bio, avatar)
- ✅ Last active timestamp

### What's NOT Shared
- ❌ Exact location/GPS coordinates
- ❌ Bluetooth device MAC address
- ❌ Real-time location tracking

### User Controls
- Users must explicitly enable Bluetooth discovery
- Users can disable discovery at any time
- Bluetooth ID is automatically cleared when disabled
- Only FriendFinder app users can be discovered

## Browser Bluetooth API (Optional)
The app includes optional integration with the Web Bluetooth API for browsers that support it (Chrome, Edge). This allows for:
- Real device scanning (if user grants permission)
- Signal strength measurement (RSSI)
- Distance estimation

**Note**: The core functionality works without browser Bluetooth - the app uses database-level matching as the primary mechanism.

## Troubleshooting

### "No nearby users found"
**Solutions**:
1. Run the test user setup script to create test data
2. Make sure you have enabled Bluetooth discovery
3. Ensure other users have enabled Bluetooth in the app
4. Check that users were active recently (< 5 minutes)

### "Please enable Bluetooth discovery first"
**Solution**: Click the "Enable Bluetooth Discovery" button first

### Users not appearing after enabling
**Solutions**:
1. Wait a few seconds for the database to update
2. Click "Scan Again" to refresh the list
3. Check browser console for any API errors
4. Verify MongoDB connection is working

## Future Enhancements
- Real-time updates via Socket.IO
- Distance estimation based on signal strength
- Bluetooth beacons for improved accuracy
- Push notifications for nearby friends
- Geofencing for automatic discovery
- Bluetooth Low Energy (BLE) integration for mobile apps
