# Native gRPC Setup Guide

## ✅ สิ่งที่ทำเสร็จแล้ว

### Android
1. ✅ เพิ่ม Protobuf Gradle Plugin
2. ✅ Copy `.proto` files ไปที่ `android/app/src/main/proto/`
3. ✅ สร้าง `GrpcModule.kt` และ `GrpcPackage.kt`
4. ✅ Register GrpcPackage ใน `MainApplication.kt`
5. ✅ เพิ่ม gRPC dependencies

### iOS
1. ✅ สร้าง `GrpcModule.swift` และ `GrpcModule.m`
2. ✅ เพิ่ม gRPC-Swift ใน Podfile

### TypeScript
1. ✅ สร้าง `nativeClient.ts` - Interface สำหรับเรียก Native Module
2. ✅ อัพเดท `syncProducts.ts` ให้ใช้ Native gRPC Client

---

## 📋 ขั้นตอนการ Build

### สำหรับ Android:

```bash
# 1. Build project เพื่อ generate gRPC stubs จาก .proto
cd android
./gradlew clean build

# หากเกิด error ให้ลอง:
./gradlew generateDebugProto

# 2. กลับไปที่ root และ run app
cd ..
npx react-native run-android
```

**Generated files จะอยู่ที่:**
- `android/app/build/generated/source/proto/debug/grpc/`
- `android/app/build/generated/source/proto/debug/javalite/`

### สำหรับ iOS:

```bash
# 1. Install CocoaPods
cd ios
pod install

# 2. Generate Swift protobuf (ต้องติดตั้ง swift-protobuf และ grpc-swift ก่อน)
# brew install swift-protobuf grpc-swift

# 3. Generate proto files (ต้องทำด้วยมือหรือใช้ script)
# protoc --swift_out=. --grpc-swift_out=. product.proto

# 4. กลับไปที่ root และ run
cd ..
npx react-native run-ios
```

---

## 🔧 Troubleshooting

### Android: หาก generated stubs ไม่ขึ้น
```bash
cd android
./gradlew clean
./gradlew generateDebugProto
./gradlew assembleDebug
```

### iOS: หากต้องการ generate Swift proto files
1. ติดตั้ง tools:
   ```bash
   brew install swift-protobuf
   brew install grpc-swift
   ```

2. สร้าง script สำหรับ generate:
   ```bash
   protoc --proto_path=../src/grpc/protos \
          --swift_out=ios/RnWmFetchGrpc \
          --grpc-swift_out=ios/RnWmFetchGrpc \
          product.proto
   ```

### หาก Native Module ไม่เจอ
- **Android**: ตรวจสอบว่า `GrpcPackage()` ถูก add ใน `MainApplication.kt` แล้ว
- **iOS**: ตรวจสอบว่า `GrpcModule.m` และ `GrpcModule.swift` อยู่ใน Xcode project

---

## 📝 การใช้งาน

```typescript
import nativeGrpcClient from './grpc/nativeClient';

// Initialize
await nativeGrpcClient.initialize('10.0.2.2', 5000);

// Call gRPC method
const result = await nativeGrpcClient.createProduct({
  skuid: 'SKU123',
  barcodePos: '1234567890',
  productName: 'Product Name',
  merchantId: 'MERCHANT001',
});

console.log('✅ Response:', result);

// Cleanup
await nativeGrpcClient.shutdown();
```

---

## 🎯 สิ่งที่ต้องทำเพิ่มเติม (Optional)

### สำหรับ iOS:
- [ ] Generate Swift protobuf files จาก `product.proto`
- [ ] เพิ่ม generated files เข้า Xcode project
- [ ] Uncomment โค้ดใน `GrpcModule.swift` ที่ใช้ generated client

### สำหรับ Production:
- [ ] เปลี่ยนจาก `usePlaintext()` เป็น TLS
- [ ] เพิ่ม error handling ที่ดีขึ้น
- [ ] เพิ่ม retry logic
- [ ] เพิ่ม connection pooling
- [ ] เพิ่ม timeout configuration

---

## 🔄 เปรียบเทียบ Connect Protocol vs Native gRPC

| Feature | Connect Protocol | Native gRPC |
|---------|-----------------|-------------|
| Protocol | HTTP/1.1 + JSON | HTTP/2 + Binary |
| Setup | ง่าย (JS only) | ซับซ้อน (Native + JS) |
| Performance | ดี | ดีกว่า |
| Streaming | Limited | Full Support |
| Maintenance | ง่าย | ยาก (2 platforms) |
| File Size | เล็ก | ใหญ่กว่า |

---

## 📚 Resources

- [gRPC-Java Documentation](https://grpc.io/docs/languages/java/)
- [gRPC-Swift Documentation](https://github.com/grpc/grpc-swift)
- [React Native Native Modules](https://reactnative.dev/docs/native-modules-intro)
- [Protobuf Gradle Plugin](https://github.com/google/protobuf-gradle-plugin)
