import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { View, AppState, AppStateStatus, Platform } from 'react-native';
import { adService } from './src/services/adService';
import { enableScreens } from 'react-native-screens';
import * as Network from 'expo-network';
import * as Linking from 'expo-linking';
import { useNetworkStore } from './src/store/networkStore';
import { OfflineBanner } from './src/components/OfflineBanner';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initSentry } from './src/services/sentryService';
import { InstallPrompt } from './src/components/InstallPrompt';
import { sharingService } from './src/services/sharingService';
import './src/i18n/i18n'; // Initialize i18n
import { playbackService } from './src/services/playbackService';

export default function App() {
  const appState = useRef(AppState.currentState);

  enableScreens();
  const { setOnline, isOnline } = useNetworkStore();

  useEffect(() => {

    // Initialize Sentry for crash reporting
    initSentry();

    // Initialize AdMob (only on native platforms)
    if (Platform.OS !== 'web') {
      adService.initialize();
      playbackService.setup();

      // Show App Open Ad on first launch
      setTimeout(() => {
        adService.showAppOpenAd();
      }, 1000);
    }

    // Handle deep links
    const handleDeepLink = async (url: string) => {
      console.log('[DeepLink] Received:', url);
      const linkData = await sharingService.handleDeepLink(url);

      if (linkData) {
        console.log('[DeepLink] Parsed:', linkData);
        // Track link open for analytics
        if (linkData.id) {
          await sharingService.trackLinkOpen(linkData.type, linkData.id);
        }
        // Navigation will be handled by LinkingConfiguration
      }
    };

    // Get initial URL (app opened from link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for deep links while app is running
    const deepLinkSubscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (Platform.OS !== 'web' && appState.current.match(/inactive|background/) && nextAppState === 'active') {
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
      deepLinkSubscription.remove();
      appStateSubscription.remove();
      if (Platform.OS !== 'web') {
        adService.cleanup();
      }
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
          {Platform.OS === 'web' && <InstallPrompt />}
        </SafeAreaProvider>
      </View>
    </ErrorBoundary>
  );
}
