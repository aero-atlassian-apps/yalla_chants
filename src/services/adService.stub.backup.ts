import { Platform } from 'react-native';

// Temporary stub until react-native-google-mobile-ads is installed
// This file will be replaced once dependencies are installed

// Ad Unit IDs (Update with your actual IDs)
export const AD_UNITS = {
    android: {
        banner: 'ca-app-pub-xxxxx/xxxxx',
        interstitial: 'ca-app-pub-xxxxx/xxxxx',
        rewarded: 'ca-app-pub-xxxxx/xxxxx',
    },
    ios: {
        banner: 'ca-app-pub-xxxxx/xxxxx',
        interstitial: 'ca-app-pub-xxxxx/xxxxx',
        rewarded: 'ca-app-pub-xxxxx/xxxxx',
    },
};

// Get ad unit for current platform
export const getAdUnitId = (adType: 'banner' | 'interstitial' | 'rewarded'): string => {
    return Platform.OS === 'ios' ? AD_UNITS.ios[adType] : AD_UNITS.android[adType];
};

// Ad placement configuration
export const AD_PLACEMENT = {
    homeScreen: true,
    searchScreen: true,
    libraryScreen: false,
    afterChants: 5,
    uploadLimit: 3,
};

class AdService {
    private chantsPlayedCount = 0;

    // Initialize AdMob
    async initialize(): Promise<void> {
        console.log('AdMob stub - initialize called');
    }

    // Show interstitial ad
    async showInterstitialAd(): Promise<boolean> {
        console.log('AdMob stub - showInterstitialAd called');
        return false;
    }

    // Show rewarded ad
    async showRewardedAd(
        onRewarded: () => void,
        onFailed?: () => void
    ): Promise<void> {
        console.log('AdMob stub - showRewardedAd called');
        onFailed?.();
    }

    // Track chant played and show ad if needed
    trackChantPlayed(isPremiumUser: boolean): void {
        if (isPremiumUser) {
            return;
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
        console.log('AdMob stub - cleanup called');
    }
}

export const adService = new AdService();
