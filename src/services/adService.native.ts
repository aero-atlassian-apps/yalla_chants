import { Platform } from 'react-native'
import { adStore } from '../store/adStore'

let MobileAds: any = null
let AppOpenAd: any = null
let InterstitialAd: any = null
let RewardedAd: any = null
let TestIds: any = null
let AdEventType: any = null
let RewardedAdEventType: any = null

try {
  const adsModule = require('react-native-google-mobile-ads')
  MobileAds = adsModule.default
  AppOpenAd = adsModule.AppOpenAd
  InterstitialAd = adsModule.InterstitialAd
  RewardedAd = adsModule.RewardedAd
  TestIds = adsModule.TestIds
  AdEventType = adsModule.AdEventType
  RewardedAdEventType = adsModule.RewardedAdEventType
} catch (error) {
  console.log('[AdService] react-native-google-mobile-ads not available on this platform')
}

class AdService {
  private isInitialized = false
  private appOpenAd: any = null
  private interstitialAd: any = null
  private rewardedAd: any = null

  async initialize() {
    if (Platform.OS === 'web' || !MobileAds) {
      console.log('[AdService] Web platform or AdMob not available')
      return
    }
    if (this.isInitialized) return
    try {
      await MobileAds().initialize()
      this.isInitialized = true
      console.log('[AdService] Initialized')
    } catch (error) {
      console.error('[AdService] Initialization failed:', error)
    }
  }

  async showAppOpenAd() {
    if (Platform.OS === 'web' || !AppOpenAd || !AdEventType) return
    if (!adStore.canShow('app_open')) return
    try {
      const adUnitId = __DEV__ ? TestIds.APP_OPEN : 'ca-app-pub-8144091641472082/1234567890'
      this.appOpenAd = AppOpenAd.createForAdRequest(adUnitId)
      this.appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
        this.appOpenAd?.show()
        adStore.record('app_open')
      })
      this.appOpenAd.load()
    } catch (error) {
      console.error('[AdService] App Open Ad error:', error)
    }
  }

  async showInterstitialAd() {
    if (Platform.OS === 'web' || !InterstitialAd || !AdEventType) return
    if (!adStore.canShow('interstitial')) return
    try {
      const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-8144091641472082/9876543210'
      this.interstitialAd = InterstitialAd.createForAdRequest(adUnitId)
      this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        this.interstitialAd?.show()
        adStore.record('interstitial')
      })
      this.interstitialAd.load()
    } catch (error) {
      console.error('[AdService] Interstitial Ad error:', error)
    }
  }

  async showRewardedAd(): Promise<boolean> {
    if (Platform.OS === 'web' || !RewardedAd || !AdEventType || !RewardedAdEventType) return false
    try {
      const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-8144091641472082/1122334455'
      return new Promise((resolve) => {
        this.rewardedAd = RewardedAd.createForAdRequest(adUnitId)
        this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          resolve(true)
          adStore.record('rewarded')
        })
        this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
          resolve(false)
        })
        this.rewardedAd.addAdEventListener(AdEventType.LOADED, () => {
          this.rewardedAd?.show()
        })
        this.rewardedAd.load()
      })
    } catch (error) {
      console.error('[AdService] Rewarded Ad error:', error)
      return false
    }
  }

  cleanup() {
    try {
      this.appOpenAd = null
      this.interstitialAd = null
      this.rewardedAd = null
      this.isInitialized = false
    } catch {}
  }
}

export const adService = new AdService()
