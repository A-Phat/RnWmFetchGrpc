import NetInfo from '@react-native-community/netinfo'
import { database } from '../db'
import productClient from '../grpc/client'
import Product from '../db/models/Product'

/**
 * Sync local products (pending) to gRPC backend.
 */
async function syncProductsOnce() {
    console.log('[syncProductsOnce] ⏳ Checking network...')
    const state = await NetInfo.fetch()
    const online = !!state.isConnected && !!state.isInternetReachable
    if (!online) {
        console.log('[syncProductsOnce] 📴 Offline, skip.')
        return
    }

    const products = database.get<Product>('products')
    const rows = await products.query().fetch()
    console.log(`[syncProductsOnce] Found ${rows.length} products`)

    for (const row of rows) {
        try {
            // สมมติคุณเพิ่มฟิลด์สถานะไว้ใน schema เช่น 'status' = 'PENDING' | 'SENT'
            if ((row as any).status !== 'PENDING') continue
            await database.write(async () => {
                await row.update((p: any) => { p.status = 'SENDING' })
            })

            const req = {
                skuid: (row as any).skuid,
                barcodePos: (row as any).barcode_pos,
                productName: (row as any).product_name,
                merchantId: (row as any).merchant_id,
            }

            const res = await productClient.createProduct(req)
            console.log('[syncProductsOnce] ✅ Sent:', res)
            await database.write(async () => {
                await row.update((p: any) => { p.status = 'SENT' })
            })
        } catch (e: any) {
            console.error('[syncProductsOnce] ❌ Error:', e.message)
            await database.write(async () => {
                await row.update((p: any) => {
                    p.status = 'FAILED'
                    p.last_error = String(e?.message ?? e)
                })
            })

        }
    }
}

export default syncProductsOnce;
