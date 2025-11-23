// src/components/ads/BannerAd.tsx
import React from 'react';
import { Platform, View } from 'react-native';

interface BannerAdProps {
    adUnitId: string;
}

export const BannerAd: React.FC<BannerAdProps> = ({ adUnitId }) => {
    // Don't render anything on web
    if (Platform.OS === 'web') {
        return null;
    }

    // On native, dynamically load and render the ad
    // This will be handled by the native implementation
    // For now, return null as a placeholder
    return <View style={{ height: 50 }} />;
};
