import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAdUnitId } from '../../services/adService';

interface BannerAdComponentProps {
    size?: BannerAdSize;
}

import { useColors } from '../../constants/Colors';

export const BannerAdComponent: React.FC<BannerAdComponentProps> = ({
    size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
}) => {
    const insets = useSafeAreaInsets();
    const Colors = useColors();
    const styles = createStyles(Colors);

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <BannerAd
                unitId={getAdUnitId('banner')}
                size={size}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: false,
                }}
                onAdLoaded={() => {
                    console.log('Banner ad loaded');
                }}
                onAdFailedToLoad={(error) => {
                    console.error('Banner ad failed to load:', error);
                }}
            />
        </View>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.surfaceHighlight,
    },
});
