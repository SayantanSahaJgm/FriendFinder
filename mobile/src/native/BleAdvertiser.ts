import { NativeModules, Platform } from 'react-native';

const { BleAdvertiser } = NativeModules as any;

/**
 * Start advertising via the native module. Returns true when the native call was made
 * successfully (or the native module reports success). Returns false when the native
 * module is missing or the call failed.
 */
export const startAdvertising = async (serviceUUID: string, payload: string): Promise<boolean> => {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return false;

  if (!BleAdvertiser || typeof BleAdvertiser.startAdvertising !== 'function') {
    console.warn('BleAdvertiser native module not available');
    return false;
  }

  try {
    // Some native implementations may be synchronous or return a value/promise.
    const result = BleAdvertiser.startAdvertising(serviceUUID, payload);
    if (result && typeof result.then === 'function') {
      // native returned a promise that resolves to a boolean
      const resolved = await result;
      return !!resolved;
    }
    // native call was synchronous - interpret truthy return value
    return !!result;
  } catch (err) {
    console.warn('BleAdvertiser.startAdvertising failed:', err);
    return false;
  }
};

export const stopAdvertising = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return false;

  if (!BleAdvertiser || typeof BleAdvertiser.stopAdvertising !== 'function') {
    console.warn('BleAdvertiser native module not available');
    return false;
  }

  try {
    const result = BleAdvertiser.stopAdvertising();
    if (result && typeof result.then === 'function') {
      const resolved = await result;
      return !!resolved;
    }
    return !!result;
  } catch (err) {
    console.warn('BleAdvertiser.stopAdvertising failed:', err);
    return false;
  }
};

/**
 * Synchronous availability check for UI. Returns true if native module exists and exposes methods.
 */
export const isAdvertisingAvailable = (): boolean => {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return false;
  // If the native module exposes an async availability check, prefer that. Otherwise fall back to presence check.
  if (BleAdvertiser && typeof BleAdvertiser.isAdvertisingAvailable === 'function') {
    // Note: native isAdvertisingAvailable likely returns a Promise; caller should use tryStartAdvertising/tryStopAdvertising for async checks.
    // Here we return a presence-based fallback since this function is synchronous.
    try {
      // some platforms may expose a boolean directly
      const avail = BleAdvertiser.isAdvertisingAvailable();
      if (typeof avail === 'boolean') return avail;
    } catch (e) {
      // ignore - fall through to presence check
    }
  }
  return !!BleAdvertiser && typeof BleAdvertiser.startAdvertising === 'function' && typeof BleAdvertiser.stopAdvertising === 'function';
};

// Small compatibility shim: some native modules may return nothing. Provide a helper
// that attempts to call startAdvertising and returns a boolean indicating success.
export const tryStartAdvertising = async (serviceUUID: string, payload: string): Promise<boolean> => {
  return await startAdvertising(serviceUUID, payload);
};

export const tryStopAdvertising = async (): Promise<boolean> => {
  return await stopAdvertising();
};
