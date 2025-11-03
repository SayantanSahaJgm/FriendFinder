/**
 * useBluetoothDiscovery.ts
 * 
 * React hook for Bluetooth nearby user discovery in FriendFinder.
 * Manages BLE scanning, nearby user list, and provides convenience methods.
 * 
 * Usage:
 * ```tsx
 * const { nearbyUsers, isScanning, startDiscovery, stopDiscovery } = useBluetoothDiscovery();
 * ```
 */

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

  /**
   * Initialize Bluetooth service on mount
   */
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

    // Setup callbacks
    bluetoothService.current.onDeviceFound((user) => {
      setNearbyUsers((prev) => {
        const existing = prev.find((u) => u.userID === user.userID);
        if (existing) {
          // Update existing user
          return prev.map((u) => (u.userID === user.userID ? user : u));
        }
        // Add new user
        return [...prev, user];
      });
    });

    bluetoothService.current.onDeviceLost((userID) => {
      setNearbyUsers((prev) => prev.filter((u) => u.userID !== userID));
    });

    bluetoothService.current.onStateChange((state) => {
      setBluetoothState(state);
    });

    // Cleanup on unmount
    return () => {
      bluetoothService.current.stopScanning();
    };
  }, []);

  /**
   * Start discovering nearby users
   */
  const startDiscovery = useCallback(async () => {
    if (!isInitialized) {
      setError('Bluetooth not initialized. Please enable Bluetooth.');
      return;
    }

    if (isScanning) {
      console.log('Already scanning');
      return;
    }

    try {
      setError(null);
      await bluetoothService.current.startScanning();
      setIsScanning(true);
    } catch (err) {
      console.error('Error starting discovery:', err);
      setError('Failed to start scanning. Please check Bluetooth permissions.');
    }
  }, [isInitialized, isScanning]);

  /**
   * Stop discovering nearby users
   */
  const stopDiscovery = useCallback(() => {
    bluetoothService.current.stopScanning();
    setIsScanning(false);
  }, []);

  /**
   * Manually refresh nearby users list
   */
  const refreshUsers = useCallback(() => {
    const users = bluetoothService.current.getNearbyUsers();
    setNearbyUsers(users);
  }, []);

  /**
   * Send friend request to a nearby user
   * @param userID - Target user's ID
   */
  const sendFriendRequest = useCallback(async (userID: string) => {
    try {
      // TODO: Integrate with your backend API
      // Example:
      // const response = await fetch('/api/friends/request', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ receiverID: userID, method: 'nearby' }),
      // });
      
      console.log('Sending friend request to:', userID);
      
      // For now, just log
      console.warn('⚠️ Friend request API integration required');
      
      // You can also emit a Socket.IO event if you prefer real-time:
      // socket.emit('friend-request-send', { receiverID: userID });
      
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
