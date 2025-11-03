# Phase 3 Testing Guide: Map Location Features

## 🎯 What We're Testing

Phase 3.1-3.3 includes:
- ✅ Google Maps integration with user location
- ✅ Real-time friend location sharing
- ✅ Friend markers on map
- ✅ InfoWindow with Chat/Call actions
- ✅ Distance alerts (500m proximity notifications)

---

## 🧪 Testing Setup

### Prerequisites
1. **Two Users Required**: You need 2 different user accounts
2. **Users Must Be Friends**: They should be connected as friends
3. **Location Permission**: Both browsers need to grant location access
4. **Server Running**: Dev server on `http://localhost:3001`

### Quick Setup
```powershell
# If server not running, start it:
npm run dev
```

---

## 📋 Test Cases

### **Test 1: Map Loads with User Location** ✅

**Steps:**
1. Open browser: `http://localhost:3001`
2. Login as User 1 (e.g., sayantan2@gmail.com)
3. Navigate to: `/dashboard/map`
4. Allow location permission when prompted

**Expected Results:**
- ✅ Google Map loads successfully
- ✅ Blue marker appears at your current location
- ✅ Bottom-left panel shows your coordinates
- ✅ "Your Location" panel displays latitude, longitude, accuracy

**Screenshot Points:**
- Map with blue user marker
- Location info panel

---

### **Test 2: Friend Markers Appear** 👥

**Steps:**
1. Keep User 1 browser open on map page
2. Open **incognito/private window** or **different browser**
3. Login as User 2 (different account)
4. Navigate to: `/dashboard/map` 
5. Allow location permission

**Expected Results:**
- ✅ User 1 sees green marker for User 2
- ✅ User 2 sees green marker for User 1
- ✅ "Friends Nearby" panel (top-right) shows friend count
- ✅ Friend's name and distance appear in the list

**Verify:**
- Check both browsers show each other
- Distance is calculated correctly
- Online status indicator (green dot) is visible

---

### **Test 3: Real-Time Location Updates** 🔄

**Steps:**
1. Both users on map page
2. User 1: Move physically (if on mobile) OR simulate:
   - Open browser DevTools (F12)
   - Console tab, run:
   ```javascript
   // Simulate location change (move ~100m north)
   navigator.geolocation.getCurrentPosition(pos => {
     const newLat = pos.coords.latitude + 0.001
     const newLng = pos.coords.longitude
     fetch('/api/location/update', {
       method: 'POST',
       headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({
         latitude: newLat,
         longitude: newLng,
         accuracy: 10
       })
     })
   })
   ```

**Expected Results:**
- ✅ User 2 sees User 1's marker move within 10 seconds
- ✅ Distance updates automatically
- ✅ No page refresh required

---

### **Test 4: Click Friend Marker - InfoWindow** 💬

**Steps:**
1. User 1 on map page
2. Click green friend marker (User 2)

**Expected Results:**
- ✅ InfoWindow popup appears (centered on map)
- ✅ Shows friend's avatar, name, online status
- ✅ Displays distance from you
- ✅ Shows "Last updated" timestamp
- ✅ Three action buttons visible:
  - 💬 Chat (blue)
  - 📞 Call (green)  
  - 🧭 Get Directions (gray)

**Verify:**
- Click X button closes InfoWindow
- Online status shows green dot if friend is active

---

### **Test 5: Chat Button Action** 💬

**Steps:**
1. Click friend marker
2. Click "Chat" button in InfoWindow

**Expected Results:**
- ✅ Redirects to `/dashboard/chat?userId=<friendId>`
- ✅ Chat interface opens with selected friend
- ✅ InfoWindow closes automatically

---

### **Test 6: Call Button Action** 📞

**Steps:**
1. Click friend marker
2. Click "Call" button in InfoWindow

**Expected Results:**
- ✅ Redirects to `/dashboard/call?userId=<friendId>&userName=<name>`
- ✅ Call interface opens with selected friend
- ✅ InfoWindow closes automatically

---

### **Test 7: Get Directions** 🧭

**Steps:**
1. Click friend marker
2. Click "Get Directions" button

**Expected Results:**
- ✅ Opens Google Maps in new tab
- ✅ Shows route from your location to friend
- ✅ Map app remains open in original tab

---

### **Test 8: Friends List Panel** 📋

**Steps:**
1. Look at top-right panel "Friends Nearby"
2. Click any friend in the list

**Expected Results:**
- ✅ Map centers on that friend's marker
- ✅ Zooms to level 16
- ✅ InfoWindow opens for that friend
- ✅ Distance shows in meters or km

---

### **Test 9: Distance Alerts** 🔔 (Advanced)

**Setup:**
This test requires friends to be within 500m. You can simulate this:

**Steps:**
1. User 1 on map page
2. User 2: Simulate close location (in console):
```javascript
// Get User 1's location and set User 2 very close (within 500m)
fetch('/api/location/update', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    latitude: <USER1_LAT> + 0.003,  // ~300m away
    longitude: <USER1_LNG>,
    accuracy: 10
  })
})
```

**Expected Results:**
- ✅ Toast notification slides in from right side
- ✅ Shows: "<Friend> is nearby! Within 500m"
- ✅ Blue bell badge appears at top center
- ✅ Badge shows count of nearby friends
- ✅ Browser notification (if permission granted)
- ✅ Toast auto-dismisses after 10 seconds

**Verify:**
- Click bell badge to see all alerts
- Click X to dismiss individual alerts
- "Clear all" button works
- Alert only triggers once per friend (won't spam)

---

### **Test 10: Socket.IO Real-Time Sync** ⚡

**Steps:**
1. Open browser DevTools (F12) on both browsers
2. Console tab, check for logs:
```
Socket.IO connected
Location updated via API
Location broadcast via Socket.IO
```

3. User 1: Move location (physically or simulate)
4. Check User 2's console

**Expected Results:**
- ✅ User 2 console shows: "Location changed event received"
- ✅ Friend marker updates within 10 seconds
- ✅ No errors in console
- ✅ Socket remains connected

**Check Socket Health:**
- Navigate to: `/dashboard` 
- Bottom right should show green "Connected" badge

---

## 🐛 Troubleshooting

### Issue: Map doesn't load
- **Check**: Google Maps API key in `.env.local`
- **Verify**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBCXR087zCXzt7eQOP7_Zl1ZdJyXWXKIcI`
- **Solution**: Restart dev server after adding key

### Issue: No friend markers appear
- **Check**: Both users are friends (run in MongoDB):
  ```javascript
  db.users.findOne({email: "user1@gmail.com"}, {friends: 1})
  ```
- **Verify**: Both users have location permission granted
- **Check Console**: Look for API errors

### Issue: Location not updating
- **Check**: Browser granted location permission
- **Try**: Reload page and grant permission again
- **Verify**: Bottom-left panel shows coordinates

### Issue: Socket.IO not working
- **Check**: Server running on port 3001
- **Verify**: Navigate to `http://localhost:3001/api/socket.io/socket.io.js`
  - Should download socket.io.js file
- **Check Console**: Look for "Socket.IO connected" message

### Issue: Distance alerts not working
- **Check**: Friends are actually within 500m
- **Verify**: Browser notification permission granted
- **Test**: Use console simulation method above

---

## ✅ Success Criteria

All tests pass if:
1. ✅ Map loads with user's blue marker
2. ✅ Friend's green markers appear
3. ✅ Markers update in real-time (< 10 seconds)
4. ✅ InfoWindow shows on click with all data
5. ✅ Chat/Call buttons navigate correctly
6. ✅ Distance alerts trigger within 500m
7. ✅ No console errors
8. ✅ Socket.IO stays connected

---

## 📊 Testing Checklist

Use this checklist while testing:

- [ ] Test 1: Map loads with user location
- [ ] Test 2: Friend markers appear
- [ ] Test 3: Real-time updates work
- [ ] Test 4: InfoWindow displays correctly
- [ ] Test 5: Chat button works
- [ ] Test 6: Call button works
- [ ] Test 7: Get Directions works
- [ ] Test 8: Friends list panel works
- [ ] Test 9: Distance alerts trigger
- [ ] Test 10: Socket.IO sync works

---

## 📝 Report Issues

If any test fails, note:
1. **Test Number**: Which test failed
2. **Browser**: Chrome, Firefox, Safari, etc.
3. **Console Errors**: Copy any error messages
4. **Expected vs Actual**: What should happen vs what happened
5. **Screenshots**: If possible

---

## 🎉 Next Steps After Testing

Once all tests pass:
- ✅ Mark Phase 3.1-3.3 as fully complete
- 🚀 Proceed to Phase 3.4: Location Settings & Privacy
- 🚀 Or Phase 3.5: Map Polish (clustering, filters, styles)

---

**Testing Time Estimate**: 15-20 minutes for all tests
**Users Required**: 2 accounts (can use same person, different browsers)
**Best Test Environment**: Desktop browser with DevTools open
