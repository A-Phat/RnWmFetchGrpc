import BackgroundFetch from 'react-native-background-fetch'
import { syncOrdersOnce } from '../features/syncOrders'

const HeadlessTask = async (event: any) => {
  const { taskId } = event
  console.log('[HeadlessTask] 🔔 Received:', taskId)
  try {
    await syncOrdersOnce()
    console.log('[HeadlessTask] ✅ syncOrdersOnce done')
  } catch (e) {
    console.error('[HeadlessTask] ❌ Failed', e)
  } finally {
    BackgroundFetch.finish(taskId)
  }
}

// 🧠 Register Headless Task
BackgroundFetch.registerHeadlessTask(HeadlessTask)
