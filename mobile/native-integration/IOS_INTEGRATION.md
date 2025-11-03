iOS native integration for BleAdvertiser

These are the instructions and sample snippets to register the `BleAdvertiser` native module for an iOS React Native project.

1) Copy the Swift file

Copy `mobile/native-stubs/ios/BleAdvertiserModule.swift` into your iOS project (e.g. `ios/Modules/BleAdvertiserModule.swift`).

2) Ensure Swift bridging

If your project does not yet use Swift, Xcode will prompt to create a bridging header. Accept and add the header when prompted. Alternatively, add an empty `Dummy.swift` file to the project to force Swift support.

3) Expose the module to React Native

Create an Objective-C header to expose the Swift module to React Native if necessary. Example (Objective-C header):

```objc
// BleAdvertiserBridge.h
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BleAdvertiserModule, NSObject)
RCT_EXTERN_METHOD(startAdvertising:(NSString *)serviceUUID payload:(NSString *)payload)
RCT_EXTERN_METHOD(stopAdvertising)
@end
```

Place this file under `ios/Modules/` and ensure it's compiled by Xcode.

4) Podspec / Build settings

No additional CocoaPod is required for this simple module, but ensure your `Podfile` includes the React subspecs and that your project builds with Swift enabled. After adding files, run:

```bash
cd ios
pod install
```

5) Info.plist permissions

Add these keys to `Info.plist`:

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>FriendFinder needs Bluetooth to discover nearby users</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>FriendFinder needs Bluetooth to broadcast your presence</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Location is required for Bluetooth scanning on iOS</string>
```

6) Rebuild

Rebuild the iOS app from Xcode or via CLI:

```bash
cd ios
pod install
xcodebuild -workspace YourApp.xcworkspace -scheme YourApp -sdk iphonesimulator -configuration Debug
```

Notes
- Advertising on iOS requires `CBPeripheralManager` and appropriate capabilities; test on real devices.
- If you want, I can create these files directly under `mobile/ios` and patch a full RN iOS project scaffold — tell me and I'll scaffold the iOS app with the module integrated.
