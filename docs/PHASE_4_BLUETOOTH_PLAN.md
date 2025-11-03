# Phase 4 — Bluetooth (Mobile) Plan

Goal: Add mobile Bluetooth-based discovery and pairing so users can discover nearby friends/devices when GPS/WiFi is unavailable.

Scope (MVP):
- Mobile (React Native) Bluetooth scanning (BLE) to detect nearby devices advertising a stable `bluetoothId`.
- Pairing flow using short numeric pairing codes exchanged via BLE advertisement or write characteristic.
- Server-side: accept Bluetooth pairing attempts and persist `bluetoothId`, `pairingCode`, `pairingCodeExpires`, and `bluetoothName` on user records.
- Web fallback (optional): Web Bluetooth scan support for modern browsers (limited).

Components & Files to add:
- src/components/Bluetooth/
  - BluetoothManager.tsx (web wrapper to show pairing status & actions)
  - mobile/src/services/bluetooth/BluetoothService.ts (RN BLE manager encapsulation)
  - src/hooks/useBluetooth.ts (cross-platform hook exposing scan/start/stop/pair functions)
- scripts/setup-bluetooth-test-users.js — create test users with pre-populated bluetooth IDs for QA
- docs/PHASE_4_BLUETOOTH_PLAN.md (this file)

Data Model Additions (already present in `User` schema):
- bluetoothId: string
- bluetoothName: string
- pairingCode: string
- pairingCodeExpires: Date

Contract (brief):
- Input: request to start scan or pair
- Output: events: `bluetooth:found`, `bluetooth:paired`, `bluetooth:pair-failed` emitted over Socket.IO and REST endpoints for pairing confirmation.
- Errors: BLE permission denied, hardware not available, pairing code mismatch, timeout.

Edge cases:
- Multiple devices advertising same bluetoothId
- BLE permission denied or unsupported
- Race condition: two users pair at the same time

Testing plan:
- Unit tests for `useBluetooth` hook (mock BLE manager)
- E2E manual test on two devices (or emulator with BLE) — verify pairing flow and server persistence

Next steps to implement now (in this iteration):
1. Add a lightweight `useBluetooth` hook that exposes startScan/stopScan/pair APIs and emits events via callbacks.
2. Implement `scripts/setup-bluetooth-test-users.js` to create 5 test users with generated bluetooth IDs and pairing codes.
3. Add a `BluetoothManager.tsx` component (web) with a simple UI and fallback message for unsupported environments.
4. Add TypeScript types for BLE events.

Notes:
- For React Native BLE we expect to use `react-native-ble-plx` in the mobile package; that dependency is referenced in the repo but may require native linking and testing on device/emulator.
- Web Bluetooth API is limited and requires HTTPS and user gestures — provide a graceful fallback UI.
