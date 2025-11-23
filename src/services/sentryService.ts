// Sentry Configuration for Yalla Chant App
// This file will be used to initialize Sentry when you create a Sentry account
// For now, this is a placeholder

import * as Sentry from '@sentry/react-native';

export const initSentry = () => {
    // TODO: Replace with your actual Sentry DSN from https://sentry.io
    // You'll need to:
    // 1. Create a Sentry account at https://sentry.io
    // 2. Create a new React Native project
    // 3. Copy the DSN from your project settings
    // 4. Replace SENTRY_DSN_PLACEHOLDER below with your actual DSN

    const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || 'SENTRY_DSN_PLACEHOLDER';

    if (SENTRY_DSN === 'SENTRY_DSN_PLACEHOLDER') {
        console.warn('[Sentry] No DSN configured. Crash reporting disabled. Visit https://sentry.io to set up crash reporting.');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        debug: __DEV__,
        environment: __DEV__ ? 'development' : 'production',
        enabled: !__DEV__, // Only enable in production
        tracesSampleRate: 1.0, // Adjust this for performance monitoring
    });

    console.log('[Sentry] Initialized successfully');
};

export { Sentry };
