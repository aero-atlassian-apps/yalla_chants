import { createMMKV } from 'react-native-mmkv'

const storage = createMMKV({ id: 'yalla-chants-ads' })

type AdType = 'app_open' | 'interstitial' | 'rewarded' | 'web_banner'

const COUNT_KEY = 'ad_counts'
const LAST_KEY = 'ad_last'
const SLOT_COUNT_KEY = 'ad_slot_counts'
const SLOT_LAST_KEY = 'ad_slot_last'

function getCounts(): Record<AdType, number> {
  const s = storage.getString(COUNT_KEY)
  return s ? JSON.parse(s) : { app_open: 0, interstitial: 0, rewarded: 0, web_banner: 0 }
}

function getLast(): Record<AdType, number> {
  const s = storage.getString(LAST_KEY)
  return s ? JSON.parse(s) : { app_open: 0, interstitial: 0, rewarded: 0, web_banner: 0 }
}

export const adStore = {
  canShow(type: AdType): boolean {
    const counts = getCounts()
    const last = getLast()
    const now = Date.now()

    if (type === 'app_open') {
      // once per launch; allow if not shown in last 10 minutes
      return now - (last.app_open || 0) > 10 * 60 * 1000
    }
    if (type === 'interstitial') {
      // max 2 per session, min interval 3 minutes
      const c = counts.interstitial || 0
      if (c >= 2) return false
      return now - (last.interstitial || 0) > 3 * 60 * 1000
    }
    if (type === 'rewarded') {
      // user-initiated, allow; optionally enforce 30s interval
      return now - (last.rewarded || 0) > 30 * 1000
    }
    if (type === 'web_banner') {
      // banners are passive; limit impressions via viewability analytics instead
      return true
    }
    return true
  },
  record(type: AdType) {
    const counts = getCounts()
    const last = getLast()
    counts[type] = (counts[type] || 0) + 1
    last[type] = Date.now()
    storage.set(COUNT_KEY, JSON.stringify(counts))
    storage.set(LAST_KEY, JSON.stringify(last))
  }
  ,
  canShowSlot(type: AdType, slot: string): boolean {
    const countsStr = storage.getString(SLOT_COUNT_KEY)
    const lastStr = storage.getString(SLOT_LAST_KEY)
    const counts: Record<string, number> = countsStr ? JSON.parse(countsStr) : {}
    const last: Record<string, number> = lastStr ? JSON.parse(lastStr) : {}
    const now = Date.now()
    if (type !== 'web_banner') return true
    const key = `banner:${slot}`
    const c = counts[key] || 0
    if (c >= 3) return false // cap 3 impressions per session per slot
    return now - (last[key] || 0) > 60 * 1000 // at least 60s between impressions per slot
  },
  recordSlot(type: AdType, slot: string) {
    const countsStr = storage.getString(SLOT_COUNT_KEY)
    const lastStr = storage.getString(SLOT_LAST_KEY)
    const counts: Record<string, number> = countsStr ? JSON.parse(countsStr) : {}
    const last: Record<string, number> = lastStr ? JSON.parse(lastStr) : {}
    const key = `${type}:${slot}`
    counts[key] = (counts[key] || 0) + 1
    last[key] = Date.now()
    storage.set(SLOT_COUNT_KEY, JSON.stringify(counts))
    storage.set(SLOT_LAST_KEY, JSON.stringify(last))
  }
}

