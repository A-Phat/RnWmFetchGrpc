import NetInfo from '@react-native-community/netinfo'
import { database } from '../db'
import nativeGrpcClient from '../grpc/nativeClient'
import Product from '../db/models/Product'

/**
 * Sync local products (pending) to gRPC backend using Native Bridge.
 */
async function syncProductsOnce() {
    console.log('[syncProductsOnce] ⏳ Checking network...')
    const state = await NetInfo.fetch()
    const online = !!state.isConnected && !!state.isInternetReachable
    if (!online) {
        console.log('[syncProductsOnce] 📴 Offline, skip.')
        return
    }

    // Initialize Native gRPC client
    await nativeGrpcClient.initialize('10.0.2.2', 5000)

    const products = database.get<Product>('products')
    const rows = await products.query().fetch()
    console.log(`[syncProductsOnce] Found ${rows.length} products`)

    for (const row of rows) {
        try {
            console.log('Processing product ID:', (row as any).id)
            console.log('Product data:', {
                skuid: (row as any).skuid,
                barcode_pos: (row as any).barcode_pos,
                product_name: (row as any).product_name,
                merchant_id: (row as any).merchant_id,
            })
            // สมมติคุณเพิ่มฟิลด์สถานะไว้ใน schema เช่น 'status' = 'PENDING' | 'SENT'
            if ((row as any).status !== 'PENDING') continue
            await database.write(async () => {
                await row.update((p: any) => { p.status = 'SENDING' })
            })

            // 🔧 เรียกผ่าน Native gRPC Client
            const res = await nativeGrpcClient.createProduct({
                skuid: (row as any).skuid,
                barcodePos: (row as any).barcode_pos,
                productName: (row as any).product_name,
                merchantId: (row as any).merchant_id,
            })

            console.log('[syncProductsOnce] ✅ Sent via Native gRPC:', res)
            await database.write(async () => {
                await row.update((p: any) => { p.status = 'SENT' })
            })
        } catch (error: any) {
            console.error('[syncProductsOnce] ❌ Error:', error?.message || error)
            await database.write(async () => {
                await row.update((p: any) => {
                    p.status = 'FAILED'
                    p.last_error = String(error?.message || error)
                })
            })
        }
    }
}

export default syncProductsOnce;
