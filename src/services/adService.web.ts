declare global {
  interface Window { adsbygoogle: any[] }
}

class AdService {
  private isInitialized = false
  private clientId: string | null = null

  async initialize(clientId?: string) {
    if (this.isInitialized) return
    this.clientId = clientId || (process.env.EXPO_PUBLIC_ADSENSE_CLIENT as string) || null
    if (!this.clientId) {
      console.warn('[AdService:web] Missing AdSense client id')
      return
    }
    if (typeof window !== 'undefined') {
      const existing = document.querySelector('script[data-adsbygoogle]') as HTMLScriptElement
      if (!existing) {
        const s = document.createElement('script')
        s.setAttribute('data-adsbygoogle', 'true')
        s.async = true
        s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.clientId}`
        s.crossOrigin = 'anonymous'
        document.head.appendChild(s)
      }
      window.adsbygoogle = window.adsbygoogle || []
      this.isInitialized = true
    }
  }

  push() {
    if (typeof window !== 'undefined') {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    }
  }

  async showAppOpenAd() {}
  async showInterstitialAd() {}
  async showRewardedAd(): Promise<boolean> { return false }
  cleanup() { this.isInitialized = false }
}

export const adService = new AdService()
