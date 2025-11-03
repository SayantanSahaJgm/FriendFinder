import { NativeModules } from 'react-native';
import { startAdvertising, stopAdvertising, isAdvertisingAvailable } from '../src/native/BleAdvertiser';

jest.mock('react-native', () => ({
  NativeModules: {
    BleAdvertiser: {
      startAdvertising: jest.fn(() => true),
      stopAdvertising: jest.fn(() => true),
    }
  },
  Platform: { OS: 'android' }
}));

describe('BleAdvertiser wrapper', () => {
  it('reports available when native module present', () => {
    expect(isAdvertisingAvailable()).toBe(true);
  });

  it('startAdvertising returns true when native returns success', async () => {
    const ok = await startAdvertising('uuid', 'payload');
    expect(ok).toBe(true);
  });

  it('stopAdvertising returns true when native returns success', async () => {
    const ok = await stopAdvertising();
    expect(ok).toBe(true);
  });
});
