import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';

// NOTE: This example imports the NearbyUsersScreen from the main web project.
// In a typical setup you should copy the files into this mobile project or
// configure Metro to resolve the workspace `src/` folder (see README).

let NearbyUsersScreen: any;
try {
  // If you copied the files into the mobile project, this import will resolve.
  NearbyUsersScreen = require('./src/screens/NearbyUsersScreen').default;
} catch (err) {
  try {
    // If you prefer to import from the monorepo root (advanced), adjust Metro.
    NearbyUsersScreen = require('../src/components/NearbyUsersScreen').default;
  } catch (e) {
    NearbyUsersScreen = () => null; // Safe fallback
    console.warn('NearbyUsersScreen not found. Copy `src/components/NearbyUsersScreen.tsx` into mobile/src/screens/ or configure Metro watchFolders as described in mobile/README.md');
  }
}

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <NearbyUsersScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
});
