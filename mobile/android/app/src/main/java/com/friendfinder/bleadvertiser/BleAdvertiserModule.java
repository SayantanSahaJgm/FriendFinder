package com.friendfinder.bleadvertiser;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.content.Context;
import android.os.ParcelUuid;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.UUID;

public class BleAdvertiserModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private BluetoothLeAdvertiser advertiser;
    private AdvertiseCallback advertiseCallback;

    public BleAdvertiserModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        try {
            BluetoothManager manager = (BluetoothManager) reactContext.getSystemService(Context.BLUETOOTH_SERVICE);
            BluetoothAdapter adapter = manager != null ? manager.getAdapter() : BluetoothAdapter.getDefaultAdapter();
            if (adapter != null && adapter.isEnabled() && adapter.getBluetoothLeAdvertiser() != null) {
                advertiser = adapter.getBluetoothLeAdvertiser();
            } else {
                advertiser = null;
            }
        } catch (Exception e) {
            advertiser = null;
        }
    }

    @Override
    public String getName() {
        return "BleAdvertiser";
    }

    @ReactMethod
    public void isAdvertisingAvailable(Promise promise) {
        promise.resolve(advertiser != null);
    }

    @ReactMethod
    public void startAdvertising(String serviceUuid, String base64Payload, Promise promise) {
        if (advertiser == null) {
            promise.resolve(false);
            return;
        }

        try {
            AdvertiseSettings settings = new AdvertiseSettings.Builder()
                    .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                    .setConnectable(false)
                    .setTimeout(0)
                    .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM)
                    .build();

            ParcelUuid parcelUuid = ParcelUuid.fromString(serviceUuid);

            AdvertiseData data = new AdvertiseData.Builder()
                    .addServiceUuid(parcelUuid)
                    // Note: adding custom manufacturer data or service data would require bytes. Use base64Payload decoding in JS if needed.
                    .setIncludeDeviceName(false)
                    .build();

            advertiseCallback = new AdvertiseCallback() {};
            advertiser.startAdvertising(settings, data, advertiseCallback);
            promise.resolve(true);
        } catch (Exception e) {
            // Many devices or OS versions may throw when advertising not supported.
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void stopAdvertising(Promise promise) {
        if (advertiser == null || advertiseCallback == null) {
            promise.resolve(false);
            return;
        }
        try {
            advertiser.stopAdvertising(advertiseCallback);
            advertiseCallback = null;
            promise.resolve(true);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }
}
