import { useAuthStore } from '../store/authStore'
import { supabase } from './supabase'

export const handleAuthExpired = (error: any) => {
  try {
    const code = error?.code
    const msg = String(error?.message || '')
    if (code === 'PGRST303' || /JWT\s+expired/i.test(msg)) {
      supabase.auth.signOut().catch(() => {})
      const { signInAnonymously } = useAuthStore.getState() as any
      if (typeof signInAnonymously === 'function') {
        signInAnonymously()
      }
      return true
    }
  } catch {}
  return false
}
