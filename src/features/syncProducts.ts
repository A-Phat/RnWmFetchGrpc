import NetInfo from '@react-native-community/netinfo'
import { database } from '../db'
import nativeGrpcClient from '../grpc/nativeClient'
import Product from '../db/models/Product'
import { Q } from '@nozbe/watermelondb'

// Constants
const GRPC_HOST = '10.0.2.2'
const GRPC_PORT = 5000
const BATCH_SIZE = 10 // Process products in batches
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // ms

/**
 * Sync local products (pending) to gRPC backend using Native Bridge.
 * Optimized with batch processing, connection reuse, and better error handling.
 */
async function syncProductsOnce() {
    console.log('[syncProductsOnce] ⏳ Checking network...')
    
    // Early return for offline
    const state = await NetInfo.fetch()
    const online = !!state.isConnected && !!state.isInternetReachable
    if (!online) {
        console.log('[syncProductsOnce] 📴 Offline, skip.')
        return { success: false, reason: 'offline' }
    }

    // Initialize Native gRPC client once (reuse connection)
    try {
        await nativeGrpcClient.initialize(GRPC_HOST, GRPC_PORT)
    } catch (error) {
        console.error('[syncProductsOnce] ❌ Failed to initialize gRPC client:', error)
        return { success: false, reason: 'grpc_init_failed' }
    }

    // Optimized query: filter PENDING products at database level
    const products = database.get<Product>('products')
    const pendingRows = await products
        .query(Q.where('status', 'PENDING'))
        .fetch()
    
    if (pendingRows.length === 0) {
        console.log('[syncProductsOnce] ✅ No pending products to sync')
        return { success: true, synced: 0 }
    }

    console.log(`[syncProductsOnce] Found ${pendingRows.length} pending products`)

    let successCount = 0
    let failCount = 0

    // Process in batches to reduce memory pressure
    for (let i = 0; i < pendingRows.length; i += BATCH_SIZE) {
        const batch = pendingRows.slice(i, i + BATCH_SIZE)
        
        // Process batch concurrently (parallel requests)
        const results = await Promise.allSettled(
            batch.map(row => syncSingleProduct(row))
        )

        results.forEach((result, idx) => {
            if (result.status === 'fulfilled' && result.value) {
                successCount++
            } else {
                failCount++
                console.error(`[syncProductsOnce] Batch item ${i + idx} failed:`, 
                    result.status === 'rejected' ? result.reason : 'unknown')
            }
        })
    }

    console.log(`[syncProductsOnce] ✅ Complete: ${successCount} success, ${failCount} failed`)
    return { success: true, synced: successCount, failed: failCount }
}

/**
 * Sync a single product with retry logic
 */
async function syncSingleProduct(row: Product, retryCount = 0): Promise<boolean> {
    try {
        const rowData = row as any
        
        // Batch database writes together
        await database.write(async () => {
            await row.update(p => { (p as any).status = 'SENDING' })
        })

        // Send to gRPC with timeout
        await Promise.race([
            nativeGrpcClient.createProduct({
                skuid: rowData.skuid,
                barcodePos: rowData.barcode_pos,
                productName: rowData.product_name,
                merchantId: rowData.merchant_id,
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 10000)
            )
        ])

        // Update success status
        await database.write(async () => {
            await row.update(p => { (p as any).status = 'SENT' })
        })

        return true
    } catch (error: any) {
        // Retry logic for transient failures
        if (retryCount < MAX_RETRIES && isRetryableError(error)) {
            console.warn(`[syncProduct] Retry ${retryCount + 1}/${MAX_RETRIES} for ${(row as any).skuid}`)
            await delay(RETRY_DELAY * (retryCount + 1)) // Exponential backoff
            return syncSingleProduct(row, retryCount + 1)
        }

        // Mark as failed
        console.error(`[syncProduct] ❌ Failed ${(row as any).skuid}:`, error?.message || error)
        await database.write(async () => {
            await row.update(p => {
                (p as any).status = 'FAILED'
                ;(p as any).last_error = String(error?.message || error)
            })
        })
        return false
    }
}

/**
 * Check if error is retryable (network issues, timeouts)
 */
function isRetryableError(error: any): boolean {
    const message = error?.message?.toLowerCase() || ''
    return message.includes('timeout') || 
           message.includes('network') || 
           message.includes('econnreset') ||
           message.includes('enotfound')
}

/**
 * Delay helper for retry backoff
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export default syncProductsOnce;
