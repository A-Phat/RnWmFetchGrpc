import React, { useEffect, useCallback, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl,
  StatusBar,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import './bg/headless'; // 🧠 สำคัญ: ต้อง import ให้ RN รู้จัก headless task
import registerBackgroundFetch, { SYNC_COMPLETED_EVENT } from './bg/fetch';
import BackgroundFetch from 'react-native-background-fetch';
import { insertMockProducts } from './scripts/mockProducts';
import { database } from './db';
import Product from './db/models/Product';
import { Q } from '@nozbe/watermelondb';

interface ProductStats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  sending: number;
}

export default function App() {
  const isInitializedRef = useRef(false);
  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    pending: 0,
    sent: 0,
    failed: 0,
    sending: 0,
  });
  const [products, setProducts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Load product statistics
  const loadStats = useCallback(async () => {
    try {
      const productsCollection = database.get<Product>('products');
      
      const [total, pending, sent, failed, sending] = await Promise.all([
        productsCollection.query().fetchCount(),
        productsCollection.query(Q.where('status', 'PENDING')).fetchCount(),
        productsCollection.query(Q.where('status', 'SENT')).fetchCount(),
        productsCollection.query(Q.where('status', 'FAILED')).fetchCount(),
        productsCollection.query(Q.where('status', 'SENDING')).fetchCount(),
      ]);

      setStats({ total, pending, sent, failed, sending });

      // Load product list
      const allProducts = await productsCollection.query().fetch();
      setProducts(allProducts.map((p: any) => ({
        id: p.id,
        skuid: p.skuid,
        name: p.product_name,
        status: p.status,
        merchant: p.merchant_id,
        error: p.last_error,
      })));
    } catch (error) {
      console.error('[App] Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    // Prevent double initialization in dev mode (React 18+ strict mode)
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Initialize database and background fetch asynchronously
    const initializeApp = async () => {
      try {
        // Reset database in dev (move to dev-only flag in production)
        if (__DEV__) {
          await database.write(async () => {
            await database.unsafeResetDatabase()
          })
        }
        
        // Insert mock data and register background task
        await insertMockProducts();
        await registerBackgroundFetch();
        
        // Load initial stats
        await loadStats();
      } catch (error) {
        console.error('[App] Initialization error:', error);
      }
    };

    initializeApp();

    // 🔔 Listen for background sync completion events
    const subscription = DeviceEventEmitter.addListener(
      SYNC_COMPLETED_EVENT,
      async (data: { success: boolean; timestamp: number; error?: string }) => {
        console.log('[App] 🔔 Received sync event:', data);
        
        // Auto-refresh UI เมื่อ background task ทำงานเสร็จ
        await loadStats();
        setLastSync(new Date(data.timestamp));
        
        if (data.success) {
          console.log('[App] ✅ UI refreshed after background sync');
        } else {
          console.log('[App] ⚠️ UI refreshed after failed sync:', data.error);
        }
      }
    );

    // Cleanup listener on unmount
    return () => {
      subscription.remove();
    };
  }, [loadStats]); // Include loadStats dependency

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  // Memoize callback to prevent recreation on every render
  const testFetch = useCallback(async () => {
    try {
      const started = await BackgroundFetch.start();
      console.log('[BackgroundFetch] 🚀 Started?', started);
      
      await BackgroundFetch.scheduleTask({
        taskId: 'test-fetch',
        delay: 5000, // trigger หลัง 5 วิ
        forceAlarmManager: true,
        periodic: false,
      });
      
      setLastSync(new Date());
      console.log('[Test] ✅ Scheduled test-fetch (5s)');
      
      // Refresh stats after a delay
      setTimeout(() => loadStats(), 6000);
    } catch (error) {
      console.error('[Test] ❌ Failed to schedule task:', error);
    }
  }, [loadStats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#FFA500';
      case 'SENDING': return '#2196F3';
      case 'SENT': return '#4CAF50';
      case 'FAILED': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'SENDING': return '📤';
      case 'SENT': return '✅';
      case 'FAILED': return '❌';
      default: return '❓';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>gRPC Sync Manager</Text>
        <Text style={styles.headerSubtitle}>WatermelonDB + BackgroundFetch</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#2196F3' }]}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#FFA500' }]}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.statNumber}>{stats.sent}</Text>
            <Text style={styles.statLabel}>Sent</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#F44336' }]}>
            <Text style={styles.statNumber}>{stats.failed}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>

        {/* Sync Button */}
        <TouchableOpacity style={styles.syncButton} onPress={testFetch}>
          <Text style={styles.syncButtonIcon}>�</Text>
          <Text style={styles.syncButtonText}>Trigger Background Sync</Text>
          <Text style={styles.syncButtonSubtext}>(5 seconds delay)</Text>
        </TouchableOpacity>

        {/* Last Sync Info */}
        {lastSync && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Last sync triggered: {lastSync.toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* Products List */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Products ({products.length})</Text>
          
          {products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productHeader}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productSku}>SKU: {product.skuid}</Text>
                  <Text style={styles.productMerchant}>Merchant: {product.merchant}</Text>
                </View>
                
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(product.status) }]}>
                  <Text style={styles.statusIcon}>{getStatusIcon(product.status)}</Text>
                  <Text style={styles.statusText}>{product.status}</Text>
                </View>
              </View>
              
              {product.error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {product.error}</Text>
                </View>
              )}
            </View>
          ))}
          
          {products.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No products found</Text>
              <Text style={styles.emptyStateSubtext}>Pull to refresh</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b0b0b0',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  syncButton: {
    backgroundColor: '#6c5ce7',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  syncButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  syncButtonSubtext: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    color: '#1976D2',
    fontSize: 14,
  },
  productsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  productMerchant: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusIcon: {
    fontSize: 14,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#bbb',
  },
});
