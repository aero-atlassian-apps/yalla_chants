import { Platform } from 'react-native';
import mobileAds, {
    BannerAd,
    BannerAdSize,
    TestIds,
    InterstitialAd,
    RewardedAd,
    RewardedAdEventType,
    AdEventType,
    AppOpenAd,
} from 'react-native-google-mobile-ads';

// Ad Unit IDs
export const AD_UNITS = {
    android: {
        banner: __DEV__ ? TestIds.BANNER : 'ca-app-pub-8144091641472082/8636093981',
        interstitial: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-8144091641472082/9224634385',
        rewarded: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-8144091641472082/5828314857',
        appOpen: __DEV__ ? TestIds.APP_OPEN : 'ca-app-pub-8144091641472082/7392677965',
    },
    ios: {
        banner: __DEV__ ? TestIds.BANNER : 'ca-app-pub-8144091641472082/4132089808',
        interstitial: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-8144091641472082/6887898046',
        rewarded: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-8144091641472082/6566681456',
        appOpen: __DEV__ ? TestIds.APP_OPEN : 'ca-app-pub-8144091641472082/1529977191',
    },
};

// Get ad unit for current platform
export const getAdUnitId = (adType: 'banner' | 'interstitial' | 'rewarded' | 'appOpen'): string => {
    return Platform.OS === 'ios' ? AD_UNITS.ios[adType] : AD_UNITS.android[adType];
};

// Ad placement configuration
export const AD_PLACEMENT = {
    homeScreen: true,
    searchScreen: true,
    libraryScreen: false, // Premium users only
    afterChants: 5, // Show interstitial after every 5 chants
    uploadLimit: 3, // Show rewarded ad for extra uploads
};

class AdService {
    private interstitialAd: InterstitialAd | null = null;
    private rewardedAd: RewardedAd | null = null;
    private appOpenAd: AppOpenAd | null = null;
    private interstitialLoaded = false;
    private rewardedLoaded = false;
    private appOpenLoaded = false;
    private lastInterstitialShown = 0;
    private lastAppOpenShown = 0;
    private chantsPlayedCount = 0;

    // Initialize AdMob
    async initialize(): Promise<void> {
        try {
            await mobileAds().initialize();
            console.log('AdMob initialized');

            // Preload ads
            this.loadInterstitialAd();
            this.loadRewardedAd();
            this.loadAppOpenAd();
        } catch (error) {
            console.error('Error initializing AdMob:', error);
        }
    }

    // Load interstitial ad
    private loadInterstitialAd(): void {
        this.interstitialAd = InterstitialAd.createForAdRequest(
            getAdUnitId('interstitial'),
            {
                requestNonPersonalizedAdsOnly: false,
            }
        );

        this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
            this.interstitialLoaded = true;
            console.log('Interstitial ad loaded');
        });

        this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
            this.interstitialLoaded = false;
            // Reload for next time
            setTimeout(() => this.loadInterstitialAd(), 1000);
        });

        this.interstitialAd.load();
    }

    // Load rewarded ad
    private loadRewardedAd(): void {
        this.rewardedAd = RewardedAd.createForAdRequest(
            getAdUnitId('rewarded'),
            {
                requestNonPersonalizedAdsOnly: false,
            }
        );

        this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
            this.rewardedLoaded = true;
            console.log('Rewarded ad loaded');
        });

        this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
            console.log('User earned reward:', reward);
        });

        this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
            this.rewardedLoaded = false;
            // Reload for next time
            setTimeout(() => this.loadRewardedAd(), 1000);
        });

        this.rewardedAd.load();
    }

    // Load app open ad
    private loadAppOpenAd(): void {
        this.appOpenAd = AppOpenAd.createForAdRequest(
            getAdUnitId('appOpen'),
            {
                requestNonPersonalizedAdsOnly: false,
            }
        );

        this.appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
            this.appOpenLoaded = true;
            console.log('App Open ad loaded');
        });

        this.appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
            this.appOpenLoaded = false;
            // Reload for next time
            setTimeout(() => this.loadAppOpenAd(), 1000);
        });

        this.appOpenAd.load();
    }

    // Show interstitial ad
    async showInterstitialAd(): Promise<boolean> {
        const now = Date.now();
        const MIN_INTERVAL = 5 * 60 * 1000; // 5 minutes

        // Check frequency capping
        if (now - this.lastInterstitialShown < MIN_INTERVAL) {
            console.log('Interstitial ad shown recently, skipping');
            return false;
        }

        if (this.interstitialLoaded && this.interstitialAd) {
            try {
                await this.interstitialAd.show();
                this.lastInterstitialShown = now;
                return true;
            } catch (error) {
                console.error('Error showing interstitial ad:', error);
                return false;
            }
        }

        return false;
    }

    // Show rewarded ad
    async showRewardedAd(
        onRewarded: () => void,
        onFailed?: () => void
    ): Promise<void> {
        if (!this.rewardedLoaded || !this.rewardedAd) {
            console.log('Rewarded ad not ready');
            onFailed?.();
            return;
        }

        try {
            // Add one-time listener for reward
            const unsubscribe = this.rewardedAd.addAdEventListener(
                RewardedAdEventType.EARNED_REWARD,
                () => {
                    onRewarded();
                    unsubscribe();
                }
            );

            await this.rewardedAd.show();
        } catch (error) {
            console.error('Error showing rewarded ad:', error);
            onFailed?.();
        }
    }

    // Track chant played and show ad if needed
    trackChantPlayed(isPremiumUser: boolean): void {
        if (isPremiumUser) {
            return; // No ads for premium users
        }

        this.chantsPlayedCount++;

        if (this.chantsPlayedCount >= AD_PLACEMENT.afterChants) {
            this.showInterstitialAd();
            this.chantsPlayedCount = 0;
        }
    }

    // Check if banner should be shown
    shouldShowBanner(screen: string, isPremiumUser: boolean): boolean {
        if (isPremiumUser) {
            return false;
        }

        switch (screen) {
            case 'home':
                return AD_PLACEMENT.homeScreen;
            case 'search':
                return AD_PLACEMENT.searchScreen;
            case 'library':
                return AD_PLACEMENT.libraryScreen;
            default:
                return false;
        }
    }

    // Cleanup
    cleanup(): void {
        this.interstitialAd = null;
        this.rewardedAd = null;
        this.appOpenAd = null;
    }

    // Show app open ad
    async showAppOpenAd(): Promise<boolean> {
        const now = Date.now();
        const MIN_INTERVAL = 60 * 60 * 1000; // 1 hour

        // Check frequency capping
        if (now - this.lastAppOpenShown < MIN_INTERVAL) {
            console.log('App Open ad shown recently, skipping');
            return false;
        }

        if (this.appOpenLoaded && this.appOpenAd) {
            try {
                await this.appOpenAd.show();
                this.lastAppOpenShown = now;
                return true;
            } catch (error) {
                console.error('Error showing app open ad:', error);
                return false;
            }
        }

        return false;
    }
}

export const adService = new AdService();
