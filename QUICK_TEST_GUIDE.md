# Quick Start: Test Phase 3 Map Features Now!

## 🚀 Option A: Using Your Existing Accounts (FASTEST)

You already have `sayantan2@gmail.com` logged in. Let's use it!

### Step 1: Check Current User's Friends

Open browser console (F12) on your current session and run:

```javascript
// Check who you're friends with
fetch('/api/friends')
  .then(res => res.json())
  .then(data => {
    console.log('Your friends:', data.friends);
    data.friends?.forEach(friend => {
      console.log(`- ${friend.username} (${friend.email})`);
    });
  });
```

### Step 2: Two Browser Setup

**Window 1 (Current - Already logged in):**
- You're already at: `http://localhost:3001`
- Navigate to: `/dashboard/map`
- Allow location permission when prompted

**Window 2 (Incognito/Private):**
1. Open **Chrome Incognito** (Ctrl+Shift+N) or **Firefox Private** (Ctrl+Shift+P)
2. Go to: `http://localhost:3001/login`
3. Login with a DIFFERENT account that's friends with sayantan2
4. Navigate to: `/dashboard/map`
5. Allow location permission

### Step 3: Watch the Magic! ✨

- ✅ Both windows should show each other's markers
- ✅ Green markers = friends
- ✅ Blue marker = you
- ✅ Click any marker to see InfoWindow popup

---

## 🚀 Option B: Create New Test Users (15 minutes)

### Step 1: Register Two New Accounts

**Account 1:**
1. Go to: `http://localhost:3001/register`
2. Register as:
   - Username: `maptest1`
   - Email: `maptest1@test.com`
   - Password: `Test123!`

**Account 2 (Incognito window):**
1. Open incognito window
2. Go to: `http://localhost:3001/register`
3. Register as:
   - Username: `maptest2`
   - Email: `maptest2@test.com`
   - Password: `Test123!`

### Step 2: Make Them Friends

**In Account 1:**
1. Go to: `/dashboard/friends`
2. Search for: `maptest2`
3. Click "Add Friend"

**In Account 2 (incognito):**
1. Go to: `/dashboard/friends`
2. Accept friend request from `maptest1`

### Step 3: Test Map Features

**Both accounts:**
1. Navigate to: `/dashboard/map`
2. Allow location permission
3. You should see each other!

---

## 🧪 Testing Checklist

Once both users are on the map page, verify:

### ✅ Basic Features
- [ ] Map loads successfully
- [ ] Your blue marker appears
- [ ] Friend's green marker appears
- [ ] "Friends Nearby" panel shows friend count
- [ ] Distance is calculated and displayed

### ✅ InfoWindow Popup
- [ ] Click friend marker → InfoWindow appears
- [ ] Shows friend's name and online status
- [ ] Shows distance from you
- [ ] Shows "Last updated" timestamp
- [ ] Chat button is visible
- [ ] Call button is visible
- [ ] Get Directions button is visible

### ✅ Actions
- [ ] Click "Chat" → Opens chat with friend
- [ ] Click "Call" → Opens call interface
- [ ] Click "Get Directions" → Opens Google Maps
- [ ] Click X → Closes InfoWindow

### ✅ Friends List Panel
- [ ] Panel shows in top-right corner
- [ ] Displays all friends with locations
- [ ] Shows distance for each friend
- [ ] Online status indicators work
- [ ] Click friend in list → Map zooms to friend

### ✅ Real-Time Updates
Test this by running in one browser's console:

```javascript
// Simulate location change
navigator.geolocation.getCurrentPosition(pos => {
  fetch('/api/location/update', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      latitude: pos.coords.latitude + 0.001,  // Move ~100m north
      longitude: pos.coords.longitude,
      accuracy: 10
    })
  })
})
```

- [ ] Other browser sees marker move within 10 seconds
- [ ] Distance updates automatically
- [ ] No page refresh needed

### ✅ Distance Alerts (Advanced)
To test proximity alerts, simulate moving close to friend:

```javascript
// In User 1 console, get friend's location
fetch('/api/location/friends')
  .then(res => res.json())
  .then(data => {
    const friend = data.friends[0];
    console.log('Friend location:', friend.location);
    
    // Move very close (within 500m)
    fetch('/api/location/update', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        latitude: friend.location.lat + 0.003,  // ~300m away
        longitude: friend.location.lng,
        accuracy: 10
      })
    })
  })
```

Expected:
- [ ] Toast notification appears: "Friend is nearby!"
- [ ] Blue bell badge appears at top center
- [ ] Badge shows count: "1 nearby"
- [ ] Browser notification (if permission granted)
- [ ] Toast auto-dismisses after 10 seconds

---

## 🐛 Troubleshooting

### Problem: No friend markers appear

**Solution:**
```javascript
// Check if friends API works
fetch('/api/location/friends')
  .then(res => res.json())
  .then(data => console.log(data))
```

If `friends: []` is empty, users aren't friends yet.

### Problem: "Location not available"

**Solution:**
1. Check browser permission: Settings → Privacy → Location
2. Try different browser (Chrome works best)
3. Reload page and allow permission again

### Problem: Map doesn't load

**Solution:**
1. Check console for errors
2. Verify API key in `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBCXR087zCXzt7eQOP7_Zl1ZdJyXWXKIcI
   ```
3. Restart dev server if you just added the key

### Problem: Socket.IO not connecting

**Solution:**
```javascript
// Check Socket.IO health
fetch('/api/socket-health')
  .then(res => res.json())
  .then(data => console.log(data))
```

Should show `status: "connected"`. If not, restart server.

---

## 📊 Quick Test Commands

Copy/paste these in browser console (F12) for quick diagnostics:

```javascript
// 1. Check session
fetch('/api/auth/session').then(r => r.json()).then(console.log)

// 2. Check friends
fetch('/api/friends').then(r => r.json()).then(console.log)

// 3. Check location API
fetch('/api/location/friends').then(r => r.json()).then(console.log)

// 4. Check Socket.IO
fetch('/api/socket-health').then(r => r.json()).then(console.log)

// 5. Update your location
navigator.geolocation.getCurrentPosition(pos => {
  fetch('/api/location/update', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy
    })
  }).then(r => r.json()).then(console.log)
})
```

---

## ✅ Success Criteria

Phase 3 testing is complete when:

1. ✅ Both users see each other's markers on map
2. ✅ Markers update in real-time (< 10 seconds)
3. ✅ InfoWindow shows complete friend info
4. ✅ Chat/Call buttons navigate correctly
5. ✅ Distance alerts trigger within 500m
6. ✅ No console errors
7. ✅ Socket.IO stays connected

---

## 🎉 Next Steps

After successful testing:
- Mark Phase 3.1-3.3 as complete ✅
- Proceed to Phase 3.4: Location Privacy Settings
- Or Phase 3.5: Map Polish & Clustering

---

**Estimated Testing Time:** 10-15 minutes
**Recommended:** Start with Option A (existing accounts) for fastest results!
