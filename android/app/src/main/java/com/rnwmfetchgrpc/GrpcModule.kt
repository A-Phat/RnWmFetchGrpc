package com.rnwmfetchgrpc

import com.facebook.react.bridge.*
import io.grpc.ManagedChannel
import io.grpc.ManagedChannelBuilder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import com.rnwmfetchgrpc.grpc.ProductServiceGrpc
import com.rnwmfetchgrpc.grpc.CreateProductRequest
import com.rnwmfetchgrpc.grpc.CreateProductResponse

class GrpcModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val scope = CoroutineScope(Dispatchers.IO)
    private var channel: ManagedChannel? = null
    
    override fun getName(): String = "GrpcModule"
    
    @ReactMethod
    fun initialize(host: String, port: Int, promise: Promise) {
        try {
            channel = ManagedChannelBuilder
                .forAddress(host, port)
                .usePlaintext() // Use TLS in production
                .build()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", "Failed to initialize gRPC: ${e.message}", e)
        }
    }
    
    @ReactMethod
    fun createProduct(
        skuid: String?,
        barcodePos: String?,
        productName: String?,
        merchantId: String?,
        promise: Promise
    ) {
        scope.launch {
            try {
                val currentChannel = channel
                if (currentChannel == null) {
                    withContext(Dispatchers.Main) {
                        promise.reject("NOT_INITIALIZED", "gRPC client not initialized")
                    }
                    return@launch
                }
                
                // สร้าง gRPC stub และเรียก RPC
                val stub = ProductServiceGrpc.newBlockingStub(currentChannel)
                val request = CreateProductRequest.newBuilder()
                    .setSkuid(skuid ?: "")
                    .setBarcodePos(barcodePos ?: "")
                    .setProductName(productName ?: "")
                    .setMerchantId(merchantId ?: "")
                    .build()
                    
                val response: CreateProductResponse = stub.createProduct(request)
                
                withContext(Dispatchers.Main) {
                    val result = Arguments.createMap().apply {
                        putBoolean("success", response.success)
                        putString("message", response.message)
                        putString("skuid", response.skuid)
                    }
                    promise.resolve(result)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("GRPC_ERROR", "gRPC call failed: ${e.message}", e)
                }
            }
        }
    }
    
    @ReactMethod
    fun shutdown(promise: Promise) {
        try {
            channel?.shutdown()
            channel = null
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SHUTDOWN_ERROR", "Failed to shutdown: ${e.message}", e)
        }
    }
}
