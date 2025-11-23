// src/components/AdBanner.web.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Web version of AdBanner - renders nothing or placeholder
 * AdMob is not available on web
 */
export const AdBanner: React.FC<{ adUnitId: string }> = () => {
    // Return null to hide ads on web
    // Or return a placeholder for web-based ads (Google AdSense, etc.)
    return null;
};

const styles = StyleSheet.create({
    container: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
});
