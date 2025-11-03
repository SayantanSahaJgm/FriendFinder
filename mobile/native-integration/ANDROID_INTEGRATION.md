Android native integration for BleAdvertiser

These are the exact files and snippets to add to a standard React Native Android project to register the `BleAdvertiser` native module.

1) Add the Java file (already present in `mobile/native-stubs/android/BleAdvertiserModule.java`).
   Copy it to your RN Android app under:

   android/app/src/main/java/com/<yourapp>/BleAdvertiserModule.java

   Adjust the package name at top to match your app's package (e.g. `package com.friendfinder;`).

2) Create a Package class to expose the module (e.g. `BleAdvertiserPackage.java`):

```java
package com.<yourapp>;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class BleAdvertiserPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new BleAdvertiserModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
```

Place this file next to `BleAdvertiserModule.java`.

3) Register the package in `MainApplication.java`:

Find the `getPackages()` method and add your package to the list:

```java
@Override
protected List<ReactPackage> getPackages() {
  @SuppressWarnings("UnnecessaryLocalVariable")
  List<ReactPackage> packages = new PackageList(this).getPackages();
  // Add this line:
  packages.add(new BleAdvertiserPackage());
  return packages;
}
```

4) AndroidManifest permissions

Add the following permissions in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

5) Gradle / minSdk

Ensure `minSdkVersion` is at least 21 and compileSdk/target SDK are appropriate for Bluetooth LE features (31+ recommended for Android 12+ permissions).

Notes
- The module uses `BluetoothLeAdvertiser` which is available on devices with BLE peripheral support. Many devices (especially older phones and some emulators) do not support advertising.
- After adding files, rebuild the Android app:

```bash
cd android && ./gradlew assembleDebug
```

If you want I can patch an existing Android project in this workspace—point me at `mobile/android` (if present) or provide the app package name and I'll create the files under `mobile/android` for you to merge.
