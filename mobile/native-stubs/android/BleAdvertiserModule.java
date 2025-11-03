package com.friendfinder;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.os.ParcelUuid;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class BleAdvertiserModule extends ReactContextBaseJavaModule {
    private BluetoothLeAdvertiser advertiser;

    public BleAdvertiserModule(ReactApplicationContext context) {
        super(context);
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter != null) {
            advertiser = adapter.getBluetoothLeAdvertiser();
        }
    }

    @Override
    public String getName() {
        return "BleAdvertiser";
    }

    @ReactMethod
    public void startAdvertising(String serviceUUID, String payload) {
        if (advertiser == null) return;

        AdvertiseSettings settings = new AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(false)
            .build();

        AdvertiseData data = new AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .addServiceUuid(ParcelUuid.fromString(serviceUUID))
            .addManufacturerData(0xFFFF, payload.getBytes())
            .build();

        advertiser.startAdvertising(settings, data, new AdvertiseCallback() {
            @Override
            public void onStartSuccess(AdvertiseSettings settingsInEffect) {
                // Advertise started
            }

            @Override
            public void onStartFailure(int errorCode) {
                // Advertise failed
            }
        });
    }

    @ReactMethod
    public void stopAdvertising() {
        if (advertiser != null) {
            advertiser.stopAdvertising(null);
        }
    }
}
