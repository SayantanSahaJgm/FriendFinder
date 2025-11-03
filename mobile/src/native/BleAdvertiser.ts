import { NativeModules, Platform } from 'react-native';

const { BleAdvertiser } = NativeModules as any;

export const startAdvertising = (serviceUUID: string, payload: string) => {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    if (BleAdvertiser && typeof BleAdvertiser.startAdvertising === 'function') {
      BleAdvertiser.startAdvertising(serviceUUID, payload);
    } else {
      console.warn('BleAdvertiser native module not available');
    }
  }
};

export const stopAdvertising = () => {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    if (BleAdvertiser && typeof BleAdvertiser.stopAdvertising === 'function') {
      BleAdvertiser.stopAdvertising();
    } else {
      console.warn('BleAdvertiser native module not available');
    }
  }
};
