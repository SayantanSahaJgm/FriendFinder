# FriendFinder Android - WiFi Direct Module

This directory contains the native Android implementation for WiFi Direct (P2P) discovery and connection in the FriendFinder app.

## Overview

The web app cannot access WiFi Direct APIs directly in browsers. This native Android module provides:
- WiFi P2P device discovery
- Peer-to-peer connection establishment
- Socket-based messaging between connected devices
- Integration with FriendFinder backend for user verification

## Architecture

```
mobile/android/
├── AndroidManifest.xml          # Permissions and activity declarations
├── build.gradle                 # Dependencies
├── wifi/
│   ├── WiFiDirectActivity.kt    # Main activity with UI and discovery
│   ├── WiFiDirectBroadcastReceiver.kt  # P2P event handler
│   ├── WiP2pManagerWrapper.kt   # WiFi P2P manager wrapper
│   ├── SocketServer.kt          # TCP server (group owner)
│   ├── SocketClient.kt          # TCP client (peer)
│   └── WiFiPeerAdapter.kt       # RecyclerView adapter for peer list
└── README.md                    # This file
```

## Required Permissions

### Manifest Permissions
```xml
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.NEARBY_WIFI_DEVICES" />  <!-- Android 13+ -->
```

### Runtime Permissions (Requested by app)
- **Android 13+**: `NEARBY_WIFI_DEVICES`
- **Android 12 and below**: `ACCESS_FINE_LOCATION`

## Setup Instructions

### 1. Create Android Project
```bash
# In Android Studio:
File → New → New Project → Empty Activity
Package name: com.friendfinder.android
```

### 2. Copy Files
Copy all files from `mobile/android/` to your Android project:
```
app/src/main/
├── AndroidManifest.xml
├── java/com/friendfinder/android/wifi/
│   ├── WiFiDirectActivity.kt
│   ├── WiFiDirectBroadcastReceiver.kt
│   ├── WiP2pManagerWrapper.kt
│   ├── SocketServer.kt
│   ├── SocketClient.kt
│   └── WiFiPeerAdapter.kt
```

### 3. Create Layouts

#### activity_wifi_direct.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp">

    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="WiFi Direct Discovery"
        android:textSize="24sp"
        android:textStyle="bold"
        android:layout_marginBottom="16dp" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:layout_marginBottom="16dp">

        <Button
            android:id="@+id/btnDiscover"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="Start Discovery"
            android:layout_marginEnd="8dp" />

        <Button
            android:id="@+id/btnStop"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="Stop"
            android:layout_marginStart="8dp" />
    </LinearLayout>

    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/rvPeers"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1" />
</LinearLayout>
```

#### item_wifi_peer.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.cardview.widget.CardView xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_margin="8dp"
    app:cardCornerRadius="8dp"
    app:cardElevation="4dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:padding="16dp">

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:orientation="vertical">

            <TextView
                android:id="@+id/tvDeviceName"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Device Name"
                android:textSize="16sp"
                android:textStyle="bold" />

            <TextView
                android:id="@+id/tvDeviceAddress"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="00:00:00:00:00:00"
                android:textSize="12sp" />

            <TextView
                android:id="@+id/tvStatus"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Status"
                android:textSize="12sp" />
        </LinearLayout>

        <Button
            android:id="@+id/btnConnect"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Connect" />
    </LinearLayout>
</androidx.cardview.widget.CardView>
```

### 4. Update build.gradle
Add the dependencies from `build.gradle` to your app's `build.gradle` file.

## Usage

### 1. Request Permissions
The app will automatically request required permissions when you tap "Start Discovery".

### 2. Start Discovery
- Tap "Start Discovery" button
- The app will scan for nearby WiFi Direct devices
- Found peers appear in the list below

### 3. Connect to Peer
- Tap "Connect" on any available peer
- Wait for connection to establish
- Once connected:
  - **Group Owner** (one device) starts a TCP server
  - **Client** (other device) connects to the server

### 4. Send Messages
After connection, devices can exchange messages via TCP sockets.

## Integration with Backend

To verify users and sync with the FriendFinder backend (`https://friendfinder-vscode.onrender.com`):

### Add Network Service
```kotlin
// In a new file: NetworkService.kt
interface BackendApi {
    @POST("/api/wifi/register")
    suspend fun registerDevice(@Body device: DeviceInfo): Response<Unit>
    
    @GET("/api/wifi/nearby")
    suspend fun getNearbyUsers(): Response<List<User>>
}

data class DeviceInfo(
    val userId: String,
    val deviceId: String,
    val deviceName: String
)
```

### Call During Discovery
```kotlin
// In WiFiDirectActivity.kt
private fun registerWithBackend() {
    CoroutineScope(Dispatchers.IO).launch {
        try {
            val response = backendApi.registerDevice(
                DeviceInfo(
                    userId = currentUserId,
                    deviceId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID),
                    deviceName = Build.MODEL
                )
            )
            // Handle response
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
```

## Security Considerations

1. **Authentication**: After P2P connection, exchange JWT tokens and verify with backend
2. **Encryption**: Use TLS for socket communication or implement custom encryption
3. **Battery**: Limit discovery frequency to conserve battery
4. **Privacy**: Request location permission only when needed

## Platform Limitations

- **Android 10+**: Cannot programmatically enable WiFi
- **Android 13+**: Requires `NEARBY_WIFI_DEVICES` permission
- **OEM Variations**: WiFi Direct behavior may vary across manufacturers

## Testing

1. Install app on two physical Android devices (emulators don't support WiFi Direct)
2. Enable WiFi on both devices
3. Start discovery on both
4. Connect from one device to another
5. Verify socket communication works

## Future Enhancements

- [ ] Background discovery service
- [ ] Persistent connections
- [ ] File transfer support
- [ ] Group chat (multiple peers)
- [ ] Integration with React Native bridge for web app

## Resources

- [Android WiFi P2P Guide](https://developer.android.com/guide/topics/connectivity/wifip2p)
- [WiFi Direct Documentation](https://developer.android.com/training/connect-devices-wirelessly/wifi-direct)
