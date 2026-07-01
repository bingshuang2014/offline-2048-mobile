/**
 * Root Layout for Expo Router
 *
 * This is the main layout that wraps all screens.
 * All routes in the app/ directory are rendered through this layout.
 * Handles database initialization before rendering the app.
 */

import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { initSchema } from '../src/lib/db-expo';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('[RootLayout] 🚀 Starting database initialization...');
        // Initialize database schema before showing any screens
        await initSchema();
        setIsReady(true);
        console.log('[RootLayout] ✅ Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
      }
    }
    prepare();
  }, []);

  // Show loading screen while database initializes
  if (!isReady) {
    if (initError) {
      return (
        <View style={styles.loadingContainer}>
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>初始化失败</Text>
            <Text style={styles.errorMessage}>{initError}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d97706" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="game" />
      <Stack.Screen name="players" />
      <Stack.Screen name="history" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf8ef',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#78716c',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    maxWidth: '80%',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#991b1b',
    textAlign: 'center',
  },
});
