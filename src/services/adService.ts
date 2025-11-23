// src/services/adService.ts
import { Platform } from 'react-native';

class AdService {
    private isInitialized = false;
    private appOpenAd: any = null;
    private interstitialAd: any = null;
    private rewardedAd: any = null;

    async initialize() {
        // Skip initialization on web
        if (Platform.OS === 'web') {
            console.log('[AdService] Web platform - AdMob not available');
            return;
        }

        if (this.isInitialized) return;

        try {
            // Dynamic import to avoid bundling on web
            const MobileAds = await import('react-native-google-mobile-ads');
            await MobileAds.default().initialize();
            this.isInitialized = true;
            console.log('[AdService] Initialized');
        } catch (error) {
            console.error('[AdService] Initialization failed:', error);
        }
    }

    async showAppOpenAd() {
        if (Platform.OS === 'web') return;

        try {
            const MobileAds = await import('react-native-google-mobile-ads');
            const { AppOpenAd, TestIds, AdEventType } = MobileAds;

            const adUnitId = __DEV__
                ? TestIds.APP_OPEN
                : 'ca-app-pub-8144091641472082/1234567890';

            this.appOpenAd = AppOpenAd.createForAdRequest(adUnitId);

            this.appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
                this.appOpenAd?.show();
            });

            this.appOpenAd.load();
        } catch (error) {
            console.error('[AdService] App Open Ad error:', error);
        }
    }

    async showInterstitialAd() {
        if (Platform.OS === 'web') return;

        try {
            const MobileAds = await import('react-native-google-mobile-ads');
            const { InterstitialAd, TestIds, AdEventType } = MobileAds;

            const adUnitId = __DEV__
                ? TestIds.INTERSTITIAL
                : 'ca-app-pub-8144091641472082/9876543210';

            this.interstitialAd = InterstitialAd.createForAdRequest(adUnitId);

            this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
                this.interstitialAd?.show();
            });

            this.interstitialAd.load();
        } catch (error) {
            console.error('[AdService] Interstitial Ad error:', error);
        }
    }

    async showRewardedAd(): Promise<boolean> {
        if (Platform.OS === 'web') return false;

        try {
            const MobileAds = await import('react-native-google-mobile-ads');
            const { RewardedAd, TestIds, AdEventType, RewardedAdEventType } = MobileAds;

            const adUnitId = __DEV__
                ? TestIds.REWARDED
                : 'ca-app-pub-8144091641472082/1122334455';

            return new Promise((resolve) => {
                this.rewardedAd = RewardedAd.createForAdRequest(adUnitId);

                this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
                    resolve(true);
                });

                this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
                    resolve(false);
                });

                this.rewardedAd.addAdEventListener(AdEventType.LOADED, () => {
                    this.rewardedAd?.show();
                });

                this.rewardedAd.load();
            });
        } catch (error) {
            console.error('[AdService] Rewarded Ad error:', error);
            return false;
        }
    }

    async cleanup() {
        if (Platform.OS === 'web') return;

        this.appOpenAd = null;
        this.interstitialAd = null;
        this.rewardedAd = null;
    }
}

export const adService = new AdService();
