# Comprehensive UI/UX Fixes - Implementation Plan

## ✅ Completed
1. **Dark Mode Text Visibility** - Fixed all text colors in settings page to be visible in both light and dark modes

## 🔄 In Progress - High Priority Fixes

### 2. Dynamic Notification & Message Counts
- **Issue**: Hardcoded "2" in notification/message badges
- **Fix**: Create hooks to fetch real counts from API
- **Files**: 
  - `src/app/dashboard/layout.tsx` - Message badge
  - `src/components/notifications/NotificationCenter.tsx` - Notification badge
  
### 3. Settings Theme Auto-Switch Bug  
- **Issue**: Clicking anywhere in settings triggers theme change
- **Fix**: Ensure only ThemeToggle component triggers theme change
- **File**: `src/app/dashboard/settings/page.tsx`

### 4. Bluetooth Auto-Disable on Tab Switch
- **Issue**: Bluetooth disables when switching tabs (like WiFi)
- **Fix**: Remove auto-disable logic, keep state persistent
- **File**: `src/app/dashboard/bluetooth/page.tsx`

### 5. Socket.IO Excessive Reconnections
- **Issue**: Page refreshing frequently, multiple API hits
- **Fixes**:
  - Increase reconnection delay exponentially
  - Add connection debouncing
  - Implement proper cleanup on unmount
- **Files**: 
  - `src/hooks/useSocket.ts`
  - `src/context/RandomChatContext.tsx`

### 6. Guest Temporary Names for Random Chat
- **Issue**: No anonymous names for guest users
- **Fix**: Generate random names like "Guest_1234"
- **File**: `src/components/random-chat/*`

## 📋 Backend Connections Needed

### 7. Settings Backend Integration
**Delete Account**: ✅ Working
**Download Data**: ❌ Need API endpoint
**Change Password**: ❌ Need API endpoint  
**Discovery Settings**: ❌ Need to connect GPS/BT/WiFi toggles
**Privacy & Security**: ❌ Need backend for who-can-see settings
**2FA**: ⚠️ Partial - need OTP verification
**Notification Preferences**: ❌ Need to persist to database

### 8. Stories Visibility Filter
- Add privacy filter: friends-only vs public
- Filter stories based on user settings
- **Files**: 
  - `src/app/dashboard/page.tsx`
  - API endpoint for stories

## 🎨 Visual/UX Improvements

### 9. Dashboard Post Background
- Ensure consistent background colors
- Match Instagram-style card design
- **File**: `src/app/dashboard/page.tsx`

### 10. Light Mode Issues
- Review all components in light mode
- Fix any contrast/visibility issues
- Test all pages systematically

## 📊 Priority Order
1. Fix notification/message counts (High - user-facing)
2. Fix theme toggle bug (High - annoying)
3. Optimize Socket.IO (High - cost/performance)
4. Bluetooth persistence (Medium)
5. Guest names (Medium)
6. Settings backend (Medium - functionality)
7. Stories filter (Low - feature enhancement)
8. Visual polish (Low - nice-to-have)

