# 🔍 Bluetooth & WiFi Discovery Troubleshooting Guide

## Problem: "No Users Found" in Discovery

If one account can see nearby users but another cannot, here's how to diagnose and fix it.

---

## 🎯 Quick Diagnosis

Visit: **http://localhost:3000/dashboard/diagnostics**

This page will show you exactly why discovery isn't working for a specific account.

---

## ✅ Requirements for Discovery to Work

For **both accounts** to see each other, **ALL** of these must be true:

### 1. Discovery Mode Enabled
- Go to **Settings** → Enable **"Discovery Mode"**
- This is the master switch - if this is OFF, nothing works

### 2. Choose a Discovery Method

You need **at least ONE** of these enabled:

#### Option A: WiFi Discovery
- **Both users** must be on the **same WiFi network**
- Go to **Settings** → **Discovery** → **WiFi**
- Enable WiFi discovery
- **Expires after 1 hour** - need to refresh

#### Option B: Bluetooth Discovery  
- **Both users** must have Bluetooth enabled
- Go to **Settings** → **Discovery** → **Bluetooth**
- Enable Bluetooth discovery
- **Expires after 30 minutes** - need to refresh

#### Option C: GPS Discovery
- Both users must share their location
- Location must be within discovery range (default 1000m)

---

## 🐛 Common Issues & Fixes

### Issue 1: Discovery Mode Disabled

**Symptom:** No users appear at all

**Check:**
```
User Model → isDiscoveryEnabled: false
```

**Fix:**
1. Go to **Settings**
2. Enable **"Discovery Mode"** toggle
3. Save settings

---

### Issue 2: WiFi Connection Expired

**Symptom:** WiFi worked before, now shows "No users found"

**Check:**
- WiFi last seen > 1 hour ago
- `lastSeenWiFi` timestamp is old

**Fix:**
1. Go to **Settings** → **Discovery** → **WiFi**
2. Click **"Refresh WiFi Connection"**
3. Or re-enable WiFi discovery

**Why This Happens:**
WiFi connections expire after 1 hour for security/privacy reasons.

---

### Issue 3: Bluetooth Connection Expired

**Symptom:** Bluetooth worked before, now shows "No users found"

**Check:**
- Bluetooth last updated > 30 minutes ago
- `bluetoothIdUpdatedAt` timestamp is old

**Fix:**
1. Go to **Settings** → **Discovery** → **Bluetooth**
2. Click **"Refresh Bluetooth"**
3. Or re-enable Bluetooth discovery

**Why This Happens:**
Bluetooth connections expire after 30 minutes to ensure real-time proximity.

---

### Issue 4: Only One User Has WiFi/Bluetooth Enabled

**Symptom:** User A sees nobody, User B sees User A

**Problem:**
- User A has WiFi enabled
- User B has WiFi disabled (or expired)
- Result: User B appears in User A's list, but User A doesn't appear in User B's list

**Fix:**
**Both users** must have the same discovery method enabled and active:
1. User B: Enable WiFi discovery
2. Make sure both are on same network
3. Both should now see each other

---

### Issue 5: Different WiFi Networks

**Symptom:** Both have WiFi enabled but can't see each other

**Problem:**
- User A is on "Home WiFi"
- User B is on "Office WiFi"
- They're on different networks

**Fix:**
- Both users must be on the **exact same WiFi network**
- Or use Bluetooth/GPS discovery instead

---

### Issue 6: No Other Users Nearby

**Symptom:** "0 users found" but everything is configured correctly

**Problem:**
- Discovery is working fine
- There are simply no other users with:
  - Same WiFi network (for WiFi)
  - Bluetooth enabled and nearby (for Bluetooth)
  - Location within range (for GPS)

**Fix:**
This is normal! Try:
1. Ask a friend to create an account
2. Have them enable discovery
3. Make sure you're both using the same discovery method

---

## 🧪 Testing Two Accounts

To test WiFi/Bluetooth discovery between two accounts:

### Step 1: Account A
1. Login as User A
2. Go to Settings
3. Enable **Discovery Mode** ✅
4. Enable **WiFi Discovery** or **Bluetooth Discovery** ✅
5. Note the timestamp

### Step 2: Account B  
1. Login as User B (different browser/device)
2. Go to Settings
3. Enable **Discovery Mode** ✅
4. Enable the **SAME** discovery method (WiFi or Bluetooth) ✅
5. Make sure timestamps are recent (< 1 hour for WiFi, < 30 min for Bluetooth)

### Step 3: Verify
1. Both users: Go to **Discover** page
2. You should see each other
3. If not, visit **Diagnostics** page to see what's wrong

---

## 📊 Database Checks (For Developers)

### Check User's Discovery Settings

```javascript
// In MongoDB or your database client
db.users.findOne({ email: "user@example.com" }, {
  isDiscoveryEnabled: 1,
  hashedBSSID: 1,
  lastSeenWiFi: 1,
  bluetoothId: 1,
  bluetoothIdUpdatedAt: 1,
  discoveryRange: 1
})
```

**Expected for WiFi Discovery:**
```json
{
  "isDiscoveryEnabled": true,
  "hashedBSSID": "abc123...",
  "lastSeenWiFi": "2025-11-12T10:30:00.000Z", // Recent timestamp
  "discoveryRange": 1000
}
```

**Expected for Bluetooth Discovery:**
```json
{
  "isDiscoveryEnabled": true,
  "bluetoothId": "bt_abc123...",
  "bluetoothIdUpdatedAt": "2025-11-12T10:30:00.000Z", // Recent timestamp
  "discoveryRange": 1000
}
```

---

## 🔧 Manual Fixes

### Reset WiFi Discovery
```bash
curl -X POST http://localhost:3000/api/users/wifi \
  -H "Content-Type: application/json" \
  -d '{"networkName": "Test WiFi"}'
```

### Reset Bluetooth Discovery
```bash
curl -X POST http://localhost:3000/api/users/bluetooth \
  -H "Content-Type: application/json" \
  -d '{"deviceName": "Test Device"}'
```

### Check Discovery Status
```bash
curl http://localhost:3000/api/users/discovery-status
```

---

## ⏰ Expiration Times

| Discovery Method | Expiration Time | Why |
|-----------------|----------------|-----|
| **WiFi** | 1 hour | Network changes, users leave |
| **Bluetooth** | 30 minutes | Physical proximity changes quickly |
| **GPS** | Real-time | Updated continuously with location |

---

## 🎯 Quick Checklist

Before asking "why can't I see users?", check:

- [ ] `isDiscoveryEnabled: true` ✅
- [ ] At least one discovery method enabled (WiFi, Bluetooth, or GPS) ✅
- [ ] Timestamps are recent (not expired) ✅
- [ ] Other user also has discovery enabled ✅
- [ ] Other user has same discovery method enabled ✅
- [ ] You're on same network (WiFi) or nearby (Bluetooth) ✅

---

## 🆘 Still Not Working?

1. Visit `/dashboard/diagnostics` to see detailed status
2. Check browser console for errors (F12)
3. Check server logs for API errors
4. Verify database has correct data
5. Try refreshing the connection (disable/enable discovery)

---

## 📱 For Production

When deploying to production (Render):

1. Make sure Socket.IO server is running
2. Verify environment variables are set
3. Check MongoDB connection
4. Test with real devices on different networks
5. Monitor expiration times (users need to refresh periodically)

---

## ✅ Success Indicators

When everything is working:

- Diagnostics page shows all green checkmarks ✅
- Status messages say "Active (X users nearby)" ✅
- Timestamps are recent (< 30 mins for Bluetooth, < 1 hour for WiFi) ✅
- Discover page shows nearby users ✅
- No error messages in console ✅

---

## 🔗 Related Files

- **API Routes:**
  - `/api/users/discovery-status` - Diagnostic endpoint
  - `/api/users/wifi` - WiFi configuration
  - `/api/users/bluetooth` - Bluetooth configuration
  - `/api/users/nearby/wifi` - Find WiFi users
  - `/api/users/nearby/bluetooth` - Find Bluetooth users

- **Frontend:**
  - `/dashboard/diagnostics` - Diagnostic page
  - `/dashboard/settings` - Enable discovery
  - `/dashboard/discover` - View nearby users

- **Database:**
  - `User.findNearbyByWiFi()` - WiFi query method
  - `User.findNearbyByBluetooth()` - Bluetooth query method
