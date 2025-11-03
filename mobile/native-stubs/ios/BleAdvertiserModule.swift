import Foundation
import CoreBluetooth

@objc(BleAdvertiserModule)
class BleAdvertiserModule: NSObject, CBPeripheralManagerDelegate {
    var peripheralManager: CBPeripheralManager!

    override init() {
        super.init()
        peripheralManager = CBPeripheralManager(delegate: self, queue: nil)
    }

    @objc
    func startAdvertising(_ serviceUUID: String, payload: String) {
        let uuid = CBUUID(string: serviceUUID)
        peripheralManager.startAdvertising([
            CBAdvertisementDataServiceUUIDsKey: [uuid],
            CBAdvertisementDataLocalNameKey: payload
        ])
    }

    @objc
    func stopAdvertising() {
        peripheralManager.stopAdvertising()
    }

    func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
        // No-op: add state handling as needed
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
