#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(GrpcModule, NSObject)

RCT_EXTERN_METHOD(initialize:(NSString *)host 
                  port:(NSInteger)port
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(createProduct:(NSString *)skuid
                  barcodePos:(NSString *)barcodePos
                  productName:(NSString *)productName
                  merchantId:(NSString *)merchantId
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(shutdown:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

@end
