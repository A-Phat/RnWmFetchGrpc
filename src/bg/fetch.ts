import BackgroundFetch from 'react-native-background-fetch'
import syncProductsOnce from '../features/syncProducts'

export default async function registerBackgroundFetch() {
  console.log('\n==============================')
  console.log('[BackgroundFetch] 🟦 Initializing background task...')
  console.log('==============================\n')

  const status = await BackgroundFetch.status()
  switch (status) {
    case BackgroundFetch.STATUS_RESTRICTED:
      console.log('[BackgroundFetch] ⚠️  Restricted by OS (battery / policy)')
      break
    case BackgroundFetch.STATUS_DENIED:
      console.log('[BackgroundFetch] ❌  Permission denied by user')
      break
    case BackgroundFetch.STATUS_AVAILABLE:
      console.log('[BackgroundFetch] ✅  Available & ready')
      break
  }

  await BackgroundFetch.configure(
    {
      minimumFetchInterval: 15,     // Android: real-world min ~15 min
      stopOnTerminate: false,       // Keep running when app killed
      startOnBoot: true,            // Restart after reboot
      enableHeadless: true,         // Allow JS task to run in headless mode
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
    },
    async (taskId) => {
      console.log('\n--------------------------------')
      console.log(`[BackgroundFetch] 🔔 Event received → ${taskId}`)
      console.log('--------------------------------\n')

      const start = Date.now()

      try {
        console.log('[BackgroundFetch] ⏳ Starting syncProductsOnce...')
        await syncProductsOnce()
        console.log('[BackgroundFetch] ✅ syncProductsOnce completed')
      } catch (err: any) {
        console.error('[BackgroundFetch] ❌ Task error:', err?.message ?? err)
      } finally {
        const elapsed = ((Date.now() - start) / 1000).toFixed(2)
        console.log(`[BackgroundFetch] ⏱️ Finished in ${elapsed}s`)
        BackgroundFetch.finish(taskId)
      }
    },
    async (taskId) => {
      console.warn(`[BackgroundFetch] ⚠️ Timeout for ${taskId}`)
      BackgroundFetch.finish(taskId)
    }
  )

  const started = await BackgroundFetch.start()
  console.log(`[BackgroundFetch] 🚀 Started successfully? ${started}\n`)
}
