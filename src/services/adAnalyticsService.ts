import { supabase } from './supabase'
import { Platform } from 'react-native'

class AdAnalyticsService {
  async recordImpression(type: string, slot: string) {
    try {
      await supabase.from('ad_events').insert({
        event_type: 'impression',
        ad_type: type,
        ad_slot: slot,
        platform: Platform.OS,
        occurred_at: new Date().toISOString()
      })
    } catch {}
  }
  async recordClick(type: string, slot: string) {
    try {
      await supabase.from('ad_events').insert({
        event_type: 'click',
        ad_type: type,
        ad_slot: slot,
        platform: Platform.OS,
        occurred_at: new Date().toISOString()
      })
    } catch {}
  }
}

export const adAnalyticsService = new AdAnalyticsService()

