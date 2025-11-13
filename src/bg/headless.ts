import BackgroundFetch from 'react-native-background-fetch'
import syncProductsOnce from '../features/syncProducts'

const HeadlessTask = async (event: any) => {
  const { taskId } = event
  console.log('[HeadlessTask]  Received:', taskId)
  
  try {
    await syncProductsOnce()
    console.log('[HeadlessTask]  syncProductsOnce completed')
  } catch (e: any) {
    console.error('[HeadlessTask]  Failed:', e?.message || e)
  } finally {
    BackgroundFetch.finish(taskId)
  }
}

BackgroundFetch.registerHeadlessTask(HeadlessTask)
