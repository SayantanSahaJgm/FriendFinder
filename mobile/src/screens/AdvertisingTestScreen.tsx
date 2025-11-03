import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { getBluetoothService } from '../services/bluetooth/BluetoothService';
import { isAdvertisingAvailable } from '../native/BleAdvertiser';

const AdvertisingTestScreen: React.FC = () => {
  const bt = getBluetoothService();
  const [available, setAvailable] = useState<boolean>(false);
  const [advertising, setAdvertising] = useState<boolean>(false);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    setAvailable(isAdvertisingAvailable());
  }, []);

  const append = (msg: string) => setLog((l) => [new Date().toISOString() + ' - ' + msg, ...l].slice(0, 50));

  const handleStart = async () => {
    append('Starting advertising...');
    try {
      // BluetoothService.startAdvertising may or may not return a boolean depending on
      // native availability. We treat any truthy result as success.
      const result: any = await bt.startAdvertising('test-user-id', 'TestUser', 'online');
      const ok = !!result;
      setAdvertising(ok);
      append('Start result: ' + ok);
    } catch (err) {
      append('Start error: ' + String(err));
    }
  };

  const handleStop = async () => {
    append('Stopping advertising...');
    try {
      await bt.stopAdvertising();
      setAdvertising(false);
      append('Stopped');
    } catch (err) {
      append('Stop error: ' + String(err));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Advertising Test</Text>
      <Text>Native advertising available: {available ? 'Yes' : 'No'}</Text>
      <Text>Internal advertising state: {advertising ? 'On' : 'Off'}</Text>

      <View style={styles.buttons}>
        <Button title="Start Advertising" onPress={handleStart} disabled={!available} />
        <View style={{ height: 8 }} />
        <Button title="Stop Advertising" onPress={handleStop} disabled={!advertising} />
      </View>

      <View style={styles.logBox}>
        <Text style={styles.logTitle}>Recent logs:</Text>
        {log.map((l, i) => (
          <Text key={i} style={styles.logLine}>{l}</Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F8FAFC' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  buttons: { marginVertical: 12 },
  logBox: { marginTop: 12, backgroundColor: '#fff', padding: 8, borderRadius: 8, maxHeight: 300 },
  logTitle: { fontWeight: '600', marginBottom: 6 },
  logLine: { fontSize: 12, color: '#111827' },
});

export default AdvertisingTestScreen;
