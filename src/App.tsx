import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import './bg/headless'; // 🧠 สำคัญ: ต้อง import ให้ RN รู้จัก headless task
import { registerBackgroundFetch } from './bg/fetch';
import BackgroundFetch from 'react-native-background-fetch';
import { insertMockProducts } from './scripts/mockProducts';
import { database } from './db';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

database.write(async () => {
  await database.unsafeResetDatabase() // ⚠️ ใช้เฉพาะ dev
})

export default function App() {
  useEffect(() => {
    insertMockProducts();
    registerBackgroundFetch();
  }, []);

  const testFetch = async () => {
    const started = await BackgroundFetch.start();
    console.log('[BackgroundFetch] 🚀 Started?', started);
    BackgroundFetch.scheduleTask({
      taskId: 'test-fetch',
      delay: 5000, // trigger หลัง 5 วิ
      forceAlarmManager: true,
      periodic: false,
    });
    console.log('[Test] ✅ Scheduled test-fetch (5s)');
  };

  return (
    <View style={styles.container}>
      <Text>BackgroundFetch + WatermelonDB + gRPC ✅</Text>
      <Button title="🔁 Trigger BackgroundFetch (5s)" onPress={testFetch} />
    </View>
  );
}
