import { useState, useEffect, useCallback, useRef } from 'react';
import { getBluetoothService, NearbyUser } from '../services/bluetooth/BluetoothService';

export interface UseBluetoothDiscoveryReturn {
  nearbyUsers: NearbyUser[];
  isScanning: boolean;
  isInitialized: boolean;
  bluetoothState: string;
  error: string | null;
  startDiscovery: () => Promise<void>;
  stopDiscovery: () => void;
  refreshUsers: () => void;
  sendFriendRequest: (userID: string) => Promise<void>;
}

export const useBluetoothDiscovery = (): UseBluetoothDiscoveryReturn => {
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [bluetoothState, setBluetoothState] = useState<string>('Unknown');
  const [error, setError] = useState<string | null>(null);

  const bluetoothService = useRef(getBluetoothService());

  useEffect(() => {
    const initBluetooth = async () => {
      try {
        const initialized = await bluetoothService.current.initialize();
        setIsInitialized(initialized);

        if (!initialized) {
          setError('Failed to initialize Bluetooth. Please enable Bluetooth and grant permissions.');
        }
      } catch (err) {
        console.error('Bluetooth initialization error:', err);
        setError('Bluetooth initialization failed');
      }
    };

    initBluetooth();

    bluetoothService.current.onDeviceFound((user) => {
      setNearbyUsers((prev) => {
        const existing = prev.find((u) => u.userID === user.userID);
        if (existing) {
          return prev.map((u) => (u.userID === user.userID ? user : u));
        }
        return [...prev, user];
      });
    });

    bluetoothService.current.onDeviceLost((userID) => {
      setNearbyUsers((prev) => prev.filter((u) => u.userID !== userID));
    });

    bluetoothService.current.onStateChange((state) => {
      setBluetoothState(String(state));
    });

    return () => {
      bluetoothService.current.stopScanning();
    };
  }, []);

  const startDiscovery = useCallback(async () => {
    if (!isInitialized) {
      setError('Bluetooth not initialized. Please enable Bluetooth.');
      return;
    }

    if (isScanning) return;

    try {
      setError(null);
      await bluetoothService.current.startScanning();
      setIsScanning(true);
    } catch (err) {
      console.error('Error starting discovery:', err);
      setError('Failed to start scanning. Please check Bluetooth permissions.');
    }
  }, [isInitialized, isScanning]);

  const stopDiscovery = useCallback(() => {
    bluetoothService.current.stopScanning();
    setIsScanning(false);
  }, []);

  const refreshUsers = useCallback(() => {
    const users = bluetoothService.current.getNearbyUsers();
    setNearbyUsers(users);
  }, []);

  const sendFriendRequest = useCallback(async (userID: string) => {
    try {
      console.log('Sending friend request to:', userID);
      console.warn('⚠️ Friend request API integration required');
    } catch (err) {
      console.error('Error sending friend request:', err);
      throw err;
    }
  }, []);

  return {
    nearbyUsers,
    isScanning,
    isInitialized,
    bluetoothState,
    error,
    startDiscovery,
    stopDiscovery,
    refreshUsers,
    sendFriendRequest,
  };
};

export default useBluetoothDiscovery;
