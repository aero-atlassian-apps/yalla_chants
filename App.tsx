import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { View, AppState, AppStateStatus } from 'react-native';
import { adService } from './src/services/adService';
import { enableScreens } from 'react-native-screens';
import * as Network from 'expo-network';
import { useNetworkStore } from './src/store/networkStore';
import { OfflineBanner } from './src/components/OfflineBanner';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { initSentry } from './src/services/sentryService';
import './src/i18n/i18n'; // Initialize i18n

export default function App() {
  const appState = useRef(AppState.currentState);

  enableScreens();
  const { setOnline, isOnline } = useNetworkStore();

  useEffect(() => {

    // Initialize Sentry for crash reporting
    initSentry();

    // Initialize AdMob
    adService.initialize();

    // Show App Open Ad on first launch
    setTimeout(() => {
      adService.showAppOpenAd();
    }, 1000);

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        adService.showAppOpenAd();
      }
      appState.current = nextAppState;
    });

    const check = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        const online = !!state.isConnected && (state.isInternetReachable === true || state.isInternetReachable === undefined);
        setOnline(online);
      } catch { }
    };
    check();
    const interval = setInterval(check, 4000);

    return () => {
      subscription.remove();
      adService.cleanup();
      clearInterval(interval);
    };
  }, []);

  return (
    <ErrorBoundary>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          {!isOnline && <OfflineBanner />}
          <RootNavigator />
        </SafeAreaProvider>
      </View>
    </ErrorBoundary>
  );
}
