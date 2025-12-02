// src/components/AdBanner.web.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { adService } from '../services/adService';
import { adStore } from '../store/adStore';
import { adAnalyticsService } from '../services/adAnalyticsService';
import { analyticsService } from '../services/analyticsService';

/**
 * Web version of AdBanner - renders nothing or placeholder
 * AdMob is not available on web
 */
export const AdBanner: React.FC<{ adUnitId: string }> = ({ adUnitId }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        adService.initialize();
        if (typeof document !== 'undefined' && containerRef.current) {
            if (!adStore.canShowSlot('web_banner', adUnitId)) return;
            const ins = document.createElement('ins');
            ins.className = 'adsbygoogle';
            ins.style.display = 'block';
            ins.setAttribute('data-ad-client', (process.env.EXPO_PUBLIC_ADSENSE_CLIENT as string) || '');
            ins.setAttribute('data-ad-slot', adUnitId);
            ins.setAttribute('data-ad-format', 'auto');
            ins.setAttribute('data-full-width-responsive', 'true');
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(ins);
            adService.push();

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        analyticsService.trackAdImpression('web_banner', adUnitId);
                        adAnalyticsService.recordImpression('web_banner', adUnitId);
                        adStore.recordSlot('web_banner', adUnitId);
                    }
                });
            }, { threshold: 0.5 });
            observer.observe(ins);
            ins.addEventListener('click', () => {
                analyticsService.trackAdClick('web_banner', adUnitId);
                adAnalyticsService.recordClick('web_banner', adUnitId);
            });
            return () => observer.disconnect();
        }
    }, [adUnitId]);

    return (
        <View style={styles.container}>
            {/* @ts-ignore web-only */}
            <div ref={containerRef} style={{ width: '100%' }} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
});
