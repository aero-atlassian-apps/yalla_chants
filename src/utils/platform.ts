// src/utils/platform.ts
import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/**
 * Check if running as PWA (installed on home screen)
 */
export const isPWA = (): boolean => {
    if (!isWeb) return false;

    // Check if running in standalone mode (iOS)
    if (typeof window !== 'undefined') {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true
        );
    }

    return false;
};

/**
 * Check if iOS Safari
 */
export const isIOSSafari = (): boolean => {
    if (!isWeb || typeof window === 'undefined') return false;

    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const webkit = /WebKit/.test(ua);
    const notChrome = !/CriOS/.test(ua);

    return iOS && webkit && notChrome;
};

/**
 * Show install prompt for PWA
 */
export const showInstallPrompt = (): void => {
    if (isIOSSafari() && !isPWA()) {
        // Show iOS-specific install instructions
        alert(
            'To install Yalla Chant:\n\n' +
            '1. Tap the Share button (square with arrow)\n' +
            '2. Scroll down and tap "Add to Home Screen"\n' +
            '3. Tap "Add" in the top right'
        );
    }
};
