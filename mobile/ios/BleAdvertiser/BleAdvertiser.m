#import "BleAdvertiser.h"
#import <CoreBluetooth/CoreBluetooth.h>

@interface BleAdvertiser () <CBPeripheralManagerDelegate>
@property (nonatomic, strong) CBPeripheralManager *peripheralManager;
@property (nonatomic, copy) RCTPromiseResolveBlock startResolve;
@end

@implementation BleAdvertiser

RCT_EXPORT_MODULE();

- (instancetype)init {
  if (self = [super init]) {
    _peripheralManager = [[CBPeripheralManager alloc] initWithDelegate:self queue:dispatch_get_main_queue()];
  }
  return self;
}

RCT_EXPORT_METHOD(isAdvertisingAvailable:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  BOOL available = NO;
  if (@available(iOS 13.0, *)) {
    available = (_peripheralManager.state == CBManagerStatePoweredOn);
  } else {
    available = (_peripheralManager.state == CBPeripheralManagerStatePoweredOn);
  }
  resolve(@(available));
}

RCT_EXPORT_METHOD(startAdvertising:(NSString *)serviceUUID base64Payload:(NSString *)base64 resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  // Simplified: advertise service UUID only. Payload handling can be added by decoding base64 and using CBAdvertisementDataServiceDataKey.
  if (_peripheralManager.state != CBPeripheralManagerStatePoweredOn) {
    resolve(@(NO));
    return;
  }

  CBUUID *uuid = [CBUUID UUIDWithString:serviceUUID];
  NSDictionary *advertisement = @{CBAdvertisementDataServiceUUIDsKey: @[uuid]};
  [_peripheralManager startAdvertising:advertisement];
  resolve(@(YES));
}

RCT_EXPORT_METHOD(stopAdvertising:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (_peripheralManager.isAdvertising) {
    [_peripheralManager stopAdvertising];
    resolve(@(YES));
  } else {
    resolve(@(NO));
  }
}

#pragma mark - CBPeripheralManagerDelegate
- (void)peripheralManagerDidUpdateState:(CBPeripheralManager *)peripheral {
  // no-op; clients can call isAdvertisingAvailable to check state
}

@end
