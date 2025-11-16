/**
 * NearbyUsersScreen.tsx
 * 
 * Example UI component for displaying nearby FriendFinder users via Bluetooth.
 * Integrates with useBluetoothDiscovery hook and BluetoothService.
 * 
 * Features:
 * - Real-time nearby user list with distance indicators
 * - Start/Stop scanning controls
 * - Send friend requests to nearby users
 * - Error handling and permission prompts
 */

"use client";

import React, { useState } from 'react';
import { useBluetoothDiscovery } from '../hooks/useBluetoothDiscovery';
import { NearbyUser } from '../services/bluetooth/BluetoothService';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

const NearbyUsersScreen: React.FC = () => {
  const {
    nearbyUsers,
    isScanning,
    isInitialized,
    bluetoothState,
    error,
    startDiscovery,
    stopDiscovery,
    sendFriendRequest,
  } = useBluetoothDiscovery();

  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  /**
   * Handle friend request send
   */
  const handleSendRequest = async (userID: string) => {
    setSendingRequest(userID);
    try {
      await sendFriendRequest(userID);
      // Show success toast (integrate with your toast system)
      alert('Friend request sent!');
    } catch (err) {
      alert('Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  /**
   * Format distance for display
   */
  const formatDistance = (meters: number): string => {
    if (meters < 1) {
      return `${Math.round(meters * 100)} cm`;
    } else if (meters < 100) {
      return `${meters.toFixed(1)} m`;
    } else {
      return '100+ m';
    }
  };

  /**
   * Get distance indicator color
   */
  const getDistanceColor = (meters: number): string => {
    if (meters < 2) return 'text-green-500';
    if (meters < 10) return 'text-yellow-500';
    if (meters < 50) return 'text-orange-500';
    return 'text-red-500';
  };

  /**
   * Render user card
   */
  const renderUserCard = (user: NearbyUser) => (
    <div
      key={user.userID}
      className="bg-white rounded-lg shadow p-4 mb-3 flex items-center justify-between"
    >
      <div className="flex items-center space-x-3">
        {/* Profile Picture (use Avatar when available) */}
        <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg ring-2 ring-white">
          <Avatar className="w-full h-full">
            <AvatarImage src={(user as any).profilePicture} alt={user.username} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* User Info */}
        <div>
          <h3 className="font-semibold text-gray-900">{user.username}</h3>
          <p className="text-sm text-gray-500">{user.status}</p>
          <p className={`text-xs font-medium ${getDistanceColor(user.distance)}`}>
            📍 {formatDistance(user.distance)} away
          </p>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => handleSendRequest(user.userID)}
        disabled={sendingRequest === user.userID}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
      >
        {sendingRequest === user.userID ? 'Sending...' : 'Add Friend'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nearby Users</h1>
        <p className="text-gray-600">Discover FriendFinder users around you via Bluetooth</p>
      </div>

      {/* Bluetooth State Indicator */}
      <div className="mb-4 p-3 bg-blue-100 rounded-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              bluetoothState === 'PoweredOn' ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium text-gray-700">
            Bluetooth: {bluetoothState}
          </span>
        </div>

        {isInitialized && (
          <button
            onClick={isScanning ? stopDiscovery : startDiscovery}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              isScanning
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isScanning ? '⏸️ Stop Scanning' : '▶️ Start Scanning'}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-medium">⚠️ Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Not Initialized Message */}
      {!isInitialized && (
        <div className="p-6 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg">
          <p className="font-medium mb-2">📱 Bluetooth Setup Required</p>
          <p className="text-sm">
            Please enable Bluetooth and grant location permissions to discover nearby users.
          </p>
        </div>
      )}

      {/* Nearby Users List */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Found {nearbyUsers.length} user{nearbyUsers.length !== 1 ? 's' : ''}
        </h2>

        {isScanning && nearbyUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-pulse mb-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4"></div>
            </div>
            <p className="text-gray-600">Searching for nearby users...</p>
          </div>
        )}

        {!isScanning && nearbyUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No nearby users found. Start scanning to discover friends!</p>
          </div>
        )}

        <div className="space-y-3">
          {nearbyUsers
            .sort((a, b) => a.distance - b.distance)
            .map(renderUserCard)}
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
        <p className="font-medium mb-2">ℹ️ How it works:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Bluetooth must be enabled on your device</li>
          <li>Location permissions are required for BLE scanning</li>
          <li>Users within ~100m range will appear automatically</li>
          <li>Distance is estimated based on signal strength (RSSI)</li>
        </ul>
      </div>
    </div>
  );
};

export default NearbyUsersScreen;
