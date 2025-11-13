import Foundation
import GRPC
import NIO

@objc(GrpcModule)
class GrpcModule: NSObject {
  private var channel: GRPCChannel?
  private var group: EventLoopGroup?
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func initialize(_ host: String, port: Int, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    do {
      group = MultiThreadedEventLoopGroup(numberOfThreads: 1)
      
      channel = try GRPCChannelPool.with(
        target: .host(host, port: port),
        transportSecurity: .plaintext,
        eventLoopGroup: group!
      )
      
      resolver(true)
    } catch {
      rejecter("INIT_ERROR", "Failed to initialize gRPC: \(error.localizedDescription)", error)
    }
  }
  
  @objc
  func createProduct(_ skuid: String, barcodePos: String, productName: String, merchantId: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let channel = channel else {
      rejecter("NOT_INITIALIZED", "gRPC client not initialized", nil)
      return
    }
    
    // สร้าง gRPC client และเรียก RPC
    // let client = Product_ProductServiceClient(channel: channel)
    // var request = Product_CreateProductRequest()
    // request.skuid = skuid
    // request.barcodePos = barcodePos
    // request.productName = productName
    // request.merchantID = merchantId
    
    // let call = client.createProduct(request)
    
    // call.response.whenComplete { result in
    //   switch result {
    //   case .success(let response):
    //     let resultDict: [String: Any] = [
    //       "success": response.success,
    //       "message": response.message,
    //       "skuid": response.skuid
    //     ]
    //     resolver(resultDict)
    //   case .failure(let error):
    //     rejecter("GRPC_ERROR", "gRPC call failed: \(error.localizedDescription)", error)
    //   }
    // }
    
    // Placeholder for now
    let resultDict: [String: Any] = [
      "success": true,
      "message": "Product created (iOS stub)",
      "skuid": skuid
    ]
    resolver(resultDict)
  }
  
  @objc
  func shutdown(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    channel?.close().whenComplete { _ in
      self.channel = nil
    }
    
    do {
      try group?.syncShutdownGracefully()
      group = nil
      resolver(true)
    } catch {
      rejecter("SHUTDOWN_ERROR", "Failed to shutdown: \(error.localizedDescription)", error)
    }
  }
}
