FriendFinder Mobile (React Native) - Quickstart

This directory holds a React Native project scaffold to run the Bluetooth Nearby feature on mobile.

Two ways to use this scaffold:

1) Recommended — copy the existing BLE source files from the web project into this mobile project.
   - Copy these files into `mobile/src/`:
     - `../../src/services/bluetooth/BluetoothService.ts` -> `mobile/src/services/bluetooth/BluetoothService.ts`
     - `../../src/hooks/useBluetoothDiscovery.ts` -> `mobile/src/hooks/useBluetoothDiscovery.ts`
     - `../../src/components/NearbyUsersScreen.tsx` -> `mobile/src/screens/NearbyUsersScreen.tsx`
   - Then run the install steps below and start the app.

2) Advanced — use a monorepo setup and configure Metro to resolve the root `src/` folder.
   - `mobile/metro.config.js` includes `watchFolders` to include the parent project.
   - You will still need to adjust `tsconfig` and Metro settings for path aliases.

Install and run (React Native CLI)

# from the `mobile` folder
npm install
# iOS only: cd ios && pod install && cd ..
# Start Metro
npm run start
# In another terminal build and run
npm run android
npm run ios

Notes
- This scaffold uses `react-native-ble-plx` and `react-native-permissions`.
- BLE advertising requires native bridge implementation (stubs provided under `mobile/native-stubs/`).
- If you copy files from the root project be careful with import paths — prefer relative imports inside the mobile project.

Android permission hints (add to `android/app/src/main/AndroidManifest.xml`):

<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

iOS Info.plist hints:

<key>NSBluetoothAlwaysUsageDescription</key>
<string>FriendFinder needs Bluetooth to discover nearby users</string>

Native bridge stubs
- `mobile/native-stubs/android/BleAdvertiserModule.java`
- `mobile/native-stubs/ios/BleAdvertiserModule.swift`

If you want, I can scaffold the Android and iOS native module wiring into your RN project (register module, update Gradle/Podspec). Say the word and I will add the minimal Java/Kotlin and Swift files directly under `mobile/android` and `mobile/ios` with usage notes.
