# FriendFinder App – Bluetooth & WiFi Specification

## 📘 Overview
The Bluetooth and WiFi module in the **FriendFinder App** allows users to **discover and connect with nearby users** even when there is **no active internet connection**.  
This feature uses **Bluetooth Low Energy (BLE)** and **WiFi Direct (Peer-to-Peer)** technologies to broadcast and detect nearby users automatically.

The purpose is to help users:
- Find and add people nearby in real-time.
- Exchange friend requests seamlessly.
- Discover users within Bluetooth/WiFi range (like ShareIt or AirDrop).

---

## 🧭 Objectives
1. Detect nearby FriendFinder users without requiring internet.
2. Exchange minimal metadata (userID, username, status).
3. Show nearby users in the "Nearby" section of the app.
4. Allow sending friend requests through the server (when online).
5. (Optional) Store offline friend requests locally and sync later.

---

## ⚙️ Core Functionalities

### 1. Nearby User Detection
Each device:
- **Broadcasts** its unique user identifier via BLE and WiFi Direct.
- **Scans** for nearby devices broadcasting the same format.

**When another user is found:**
- Extract metadata from the advertisement.
- Add that user to the nearby list.
- Update the list dynamically as users appear or disappear.

**Technologies**
- **Android:** `BluetoothLeAdvertiser`, `BluetoothLeScanner`, `WifiP2pManager`
- **iOS (future):** `CoreBluetooth`, `MultipeerConnectivity`

---

### 2. Broadcast Protocol

Each device should advertise a JSON payload like this:

```json
{
  "userID": "abc123",
  "username": "sayantan",
  "status": "online",
  "timestamp": 1730544000
}
```

* This data is **encoded into bytes** and sent as BLE advertisement data.
* If BLE is turned off or unavailable, fallback to **WiFi Direct service info**.

**Broadcast interval:** Every 5–10 seconds.

---

### 3. Discovery Logic

When a broadcast is received:

1. Decode the advertisement data.
2. Check if `userID` is already in the nearby list.
3. If not, add it and update the UI.
4. Refresh the timestamp (`lastSeen`).
5. If `lastSeen` > 30 seconds ago → remove the user from the list.

**Pseudocode Example:**

```javascript
onDeviceFound(advertisementData) {
  const user = parseAdvertisement(advertisementData)
  if (!nearbyUsers.includes(user.userID)) {
    nearbyUsers.push(user)
    updateNearbyUI()
  }
  nearbyUsers[user.userID].lastSeen = Date.now()
}
```

---

### 4. Friend Request Flow

When the user taps "Add Friend":

1. Send an HTTP/WebSocket request to the backend:
   ```
   POST /api/friends/request
   Body: { senderID, receiverID }
   ```

2. The backend updates MongoDB and notifies the receiver in real time.

3. Once the receiver accepts, both users become friends.

📝 **Note:**  
Bluetooth/WiFi is only used for *discovery* — the actual friend request is sent via the internet for synchronization.

---

### 5. Offline Mode (Optional)

If both users are offline:

* Exchange friend request data directly over Bluetooth or WiFi Direct.
* When either device reconnects to the internet, sync the stored requests with the server.

**Offline Friend Request JSON:**

```json
{
  "senderID": "abc123",
  "receiverID": "xyz789",
  "type": "friend_request"
}
```

---

### 6. UI Behavior

**Nearby Tab (Frontend)** should:

* Display all detected users in real time.
* Show:
  * Profile picture thumbnail
  * Username
  * Distance (approximation)
  * "Add Friend" button

**Example:**

| Username | Distance  | Action         |
| -------- | --------- | -------------- |
| Sayantan | 5 meters  | ➕ Add Friend  |
| Amar     | 12 meters | ➕ Add Friend  |

---

### 7. Distance Estimation (Optional Enhancement)

Use Bluetooth RSSI to estimate distance.

**Formula:**

```
distance = 10 ^ ((txPower - rssi) / (10 * n))
```

Where:
* `txPower` = signal strength at 1 meter (≈ -59 dBm)
* `n` = environment factor (2 for open, 3–4 for indoor)
* `rssi` = current signal strength

**Distance Labels:**

* 0–3m → "Very Close"
* 3–10m → "Nearby"
* 10m+ → "Far Away"

---

## 🧩 System Architecture Summary

| Layer          | Technology                  | Purpose                              |
| -------------- | --------------------------- | ------------------------------------ |
| **Frontend**   | React / React Native        | UI for discovery, adding friends     |
| **Backend**    | Node.js + Express + MongoDB | User data, friend requests, syncing  |
| **Networking** | BLE + WiFi Direct           | Nearby discovery & metadata exchange |
| **Realtime**   | WebSocket / Socket.IO       | Instant friend request updates       |
| **Optional**   | GPS                         | Map view of long-distance friends    |

---

## 📲 Example Flow (Step-by-Step)

1. Sayantan opens FriendFinder → starts **BLE broadcast** with his `userID`.
2. Amar opens FriendFinder nearby → scans and **detects Sayantan**.
3. Amar's app shows "Sayantan (5m away)" in Nearby list.
4. Amar taps "Add Friend".
5. Request goes to backend → Sayantan gets a notification.
6. Sayantan accepts → they become friends → can chat/video call.

---

## ✅ Developer Implementation Checklist

### Bluetooth & WiFi Layer

* [ ] Implement BLE broadcasting (advertising userID JSON)
* [ ] Implement BLE scanning (detect nearby users)
* [ ] Add WiFi Direct fallback for discovery
* [ ] Decode and manage nearby user list dynamically
* [ ] Handle permission prompts for Bluetooth, Location, WiFi

### Backend Integration

* [ ] Expose `/sendFriendRequest` and `/acceptFriendRequest` APIs
* [ ] Use Socket.IO for instant notifications
* [ ] Sync offline friend requests once online

### Frontend (React/React Native)

* [ ] Create "Nearby" screen showing detected users
* [ ] Add dynamic updates as users enter/leave range
* [ ] Implement "Add Friend" and notification pop-ups
* [ ] Connect to backend using REST + WebSocket

---

## 🔒 Security & Privacy Notes

* Broadcasted data must **not include sensitive info** (no phone numbers or emails).
* Encrypt local storage for offline requests.
* Hash or encrypt `userID` in broadcast payload if possible.
* Use HTTPS and secure WebSocket (wss://) for server communications.

---

## 🧠 Summary

The Bluetooth + WiFi module:

* Uses **BLE & WiFi Direct** to detect nearby users.
* Sends **lightweight JSON payloads** for user discovery.
* Syncs **friend requests** through the backend.
* Enables a **unique offline + online hybrid friend discovery experience**.

This document serves as the **complete guide** for implementing and coding the Bluetooth and WiFi part of the FriendFinder App.

---

## 📚 See Also

- [Detailed Technical Specification](./BLUETOOTH_WIFI_SPEC.md) — In-depth implementation details, pseudocode, security best practices, and platform-specific notes
- [Bluetooth Architecture](./BLUETOOTH_ARCHITECTURE.md) — Existing architecture documentation
- [WiFi Implementation](./WIFI_IMPLEMENTATION.md) — Existing WiFi implementation details

---

**Document maintained by:** FriendFinder Development Team  
**For questions:** Create an issue in the GitHub repo or contact the team lead.
