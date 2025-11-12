import NetInfo from '@react-native-community/netinfo'
import { database } from '../db'
import { productClient } from '../grpc/client'

export async function syncOrdersOnce() {
  console.log('[syncOrdersOnce] ⏳ Checking network...')
  const state = await NetInfo.fetch()
  const online = !!state.isConnected && !!state.isInternetReachable
  if (!online) {
    console.log('[syncOrdersOnce] 📴 Offline, skip.')
    return
  }

  const orders = database.get('orders')
  const rows = await orders.query().fetch()
  const pending = rows.filter((r: any) => r.status === 'PENDING')
  console.log(`[syncOrdersOnce] Found ${pending.length} pending orders`)

  for (const row of pending) {
    try {
      await row.update((o: any) => { o.status = 'SENDING' })
      const req = JSON.parse((row as any).payload)
      await productClient.createProduct(req)
      await row.update((o: any) => { o.status = 'SENT' })
    } catch (e: any) {
      console.error('[syncOrdersOnce] ❌ Error:', e.message)
      await row.update((o: any) => {
        o.status = 'FAILED'
        o.lastError = String(e?.message ?? e)
      })
    }
  }
}
