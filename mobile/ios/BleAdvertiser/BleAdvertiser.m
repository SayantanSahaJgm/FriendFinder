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
  // Advertise service UUID and optional service data decoded from base64Payload
  if (_peripheralManager.state != CBPeripheralManagerStatePoweredOn) {
    resolve(@(NO));
    return;
  }

  CBUUID *uuid = [CBUUID UUIDWithString:serviceUUID];
  NSMutableDictionary *advertisement = [NSMutableDictionary dictionary];
  advertisement[CBAdvertisementDataServiceUUIDsKey] = @[uuid];

  if (base64 != nil && base64.length > 0) {
    NSData *payloadData = [[NSData alloc] initWithBase64EncodedString:base64 options:0];
    if (payloadData) {
      // Service data expects a mapping from CBUUID to NSData
      NSDictionary *serviceData = @{ uuid : payloadData };
      advertisement[CBAdvertisementDataServiceDataKey] = serviceData;
    }
  }

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
