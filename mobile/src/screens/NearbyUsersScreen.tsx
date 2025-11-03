import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import useBluetoothDiscovery from '../hooks/useBluetoothDiscovery';
import { NearbyUser } from '../services/bluetooth/BluetoothService';

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

  const handleSendRequest = async (userID: string) => {
    setSendingRequest(userID);
    try {
      await sendFriendRequest(userID);
      // Replace alert with your toast
      console.log('Friend request sent');
    } catch (err) {
      console.warn('Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1) return `${Math.round(meters * 100)} cm`;
    if (meters < 100) return `${meters.toFixed(1)} m`;
    return '100+ m';
  };

  const getDistanceColor = (meters: number) => {
    if (meters < 2) return styles.greenText;
    if (meters < 10) return styles.yellowText;
    if (meters < 50) return styles.orangeText;
    return styles.redText;
  };

  const renderItem = ({ item }: { item: NearbyUser }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <View style={styles.avatar}>{/* initial */}
          <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.status}>{item.status}</Text>
          <Text style={[styles.distance, getDistanceColor(item.distance)]}>📍 {formatDistance(item.distance)}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleSendRequest(item.userID)}
        disabled={sendingRequest === item.userID}
        style={[styles.button, sendingRequest === item.userID ? styles.buttonDisabled : null]}
      >
        <Text style={styles.buttonText}>{sendingRequest === item.userID ? 'Sending...' : 'Add Friend'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nearby Users</Text>
      <Text style={styles.subtitle}>Discover FriendFinder users around you via Bluetooth</Text>

      <View style={styles.stateRow}>
        <View style={styles.stateLeft}>
          <View style={[styles.stateDot, bluetoothState === 'PoweredOn' ? styles.dotOn : styles.dotOff]} />
          <Text style={styles.stateText}>Bluetooth: {String(bluetoothState)}</Text>
        </View>
        {isInitialized && (
          <TouchableOpacity onPress={isScanning ? stopDiscovery : startDiscovery} style={[styles.controlButton, isScanning ? styles.stopButton : styles.startButton]}>
            <Text style={styles.controlButtonText}>{isScanning ? 'Stop Scanning' : 'Start Scanning'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

      {!isInitialized && <View style={styles.warnBox}><Text style={styles.warnText}>Please enable Bluetooth and grant permissions.</Text></View>}

      <View style={styles.listContainer}>
        <Text style={styles.foundCount}>Found {nearbyUsers.length} user{nearbyUsers.length !== 1 ? 's' : ''}</Text>

        {isScanning && nearbyUsers.length === 0 && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.searchingText}>Searching for nearby users...</Text>
          </View>
        )}

        <FlatList
          data={nearbyUsers.sort((a,b) => a.distance - b.distance)}
          keyExtractor={(item) => item.userID}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{height:8}} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  subtitle: { color: '#475569', marginBottom: 12 },
  stateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  stateLeft: { flexDirection: 'row', alignItems: 'center' },
  stateDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  dotOn: { backgroundColor: '#10B981' },
  dotOff: { backgroundColor: '#EF4444' },
  stateText: { color: '#334155' },
  controlButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  startButton: { backgroundColor: '#10B981' },
  stopButton: { backgroundColor: '#EF4444' },
  controlButtonText: { color: '#fff', fontWeight: '600' },
  errorBox: { backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginBottom: 8 },
  errorText: { color: '#B91C1C' },
  warnBox: { backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8, marginBottom: 8 },
  warnText: { color: '#92400E' },
  listContainer: { flex: 1, marginTop: 8 },
  foundCount: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  centered: { alignItems: 'center', padding: 16 },
  searchingText: { marginTop: 8, color: '#6B7280' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarText: { color: '#fff', fontWeight: '700' },
  username: { fontWeight: '600' },
  status: { color: '#6B7280' },
  distance: { fontSize: 12, marginTop: 2 },
  button: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#2563EB' },
  buttonDisabled: { backgroundColor: '#9CA3AF' },
  buttonText: { color: '#fff', fontWeight: '600' },
  greenText: { color: '#10B981' },
  yellowText: { color: '#F59E0B' },
  orangeText: { color: '#F97316' },
  redText: { color: '#EF4444' },
});

export default NearbyUsersScreen;
