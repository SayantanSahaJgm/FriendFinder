Native integration templates (Android + iOS)

I added templates under `mobile/android` and `mobile/ios` to make it easy to copy these into your React Native platform projects.

What I added

- Android
  - `mobile/android/app/src/main/java/com/friendfinder/bleadvertiser/BleAdvertiserModule.java`
  - `mobile/android/app/src/main/java/com/friendfinder/bleadvertiser/BleAdvertiserPackage.java`
  - `mobile/android/app/src/main/java/com/friendfinder/MainApplication.java` (example showing package registration)
  - `mobile/android/app/src/main/AndroidManifest.xml` (permissions + sample application/activity)
  - `mobile/android/` gradle stubs (`settings.gradle`, `build.gradle`, `app/build.gradle`)

- iOS
  - `mobile/ios/BleAdvertiser/BleAdvertiser.h`
  - `mobile/ios/BleAdvertiser/BleAdvertiser.m`
  - `mobile/ios/BleAdvertiser/BleAdvertiser.podspec`
  - `mobile/ios/SupportFiles/Info.plist` (Bluetooth usage keys)

Quick copy/paste integration steps

Android
1. Copy `BleAdvertiserModule.java` and `BleAdvertiserPackage.java` into your RN Android project's `android/app/src/main/java/<your_package_path>/` (adjust `package` at top of file if necessary).
2. Make sure the `package` declaration in the Java files matches your app's Java package (e.g., `package com.myapp;`).
3. Add permissions to `android/app/src/main/AndroidManifest.xml`:
   - `BLUETOOTH`, `BLUETOOTH_ADMIN`, `ACCESS_FINE_LOCATION`, and for Android 12+: `BLUETOOTH_ADVERTISE`, `BLUETOOTH_CONNECT`.
4. If your RN project doesn't auto-link the package, add the package to `getPackages()` in `MainApplication.java`:
   `packages.add(new com.friendfinder.bleadvertiser.BleAdvertiserPackage());`
5. Rebuild the app: `cd android && ./gradlew assembleDebug` (Windows: `gradlew assembleDebug`).

Notes: Advertising on Android depends on device hardware and OS. Emulators typically don't support BLE advertising.

iOS
1. Copy the `BleAdvertiser` folder into your iOS project and add the files to the target in Xcode.
2. Option A (recommended): add a local Pod entry in your project's Podfile:
   `pod 'BleAdvertiser', :path => '../mobile/ios/BleAdvertiser'`
   then `pod install`.
   Option B: add `BleAdvertiser.h` and `BleAdvertiser.m` directly to your Xcode project.
3. Add the following keys to `Info.plist`:
   - `NSBluetoothAlwaysUsageDescription`
   - `NSBluetoothPeripheralUsageDescription`
   Provide short user-facing strings explaining why the app needs Bluetooth.
4. Build and run on a physical device (emulators don't support peripheral advertising).

Java/Objective-C API details
- Methods provided by the templates:
  - `isAdvertisingAvailable(): Promise<boolean>`
  - `startAdvertising(serviceUUID: string, base64Payload: string): Promise<boolean>`
  - `stopAdvertising(): Promise<boolean>`

These return boolean success values so the JS layer can decide whether to continue broadcasting or fall back.

Testing
- Use `mobile/src/screens/AdvertisingTestScreen.tsx` in the RN JS app to call the native API and verify behavior.
- Confirm runtime permissions on Android (runtime location/Bluetooth permissions may be required).

If you'd like, I can now patch these templates into an existing `android/` or `ios/` project layout you create — provide the Java package name (e.g. `com.mycompany.friendfinder`) and the iOS bundle id and I can adapt the templates to match.
