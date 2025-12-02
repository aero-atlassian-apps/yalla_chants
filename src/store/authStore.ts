import { create } from 'zustand';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { supabase, SupabaseUrl } from '../services/supabase';
import { fetchWithTimeout } from '../services/fetchWithTimeout';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    initialized: boolean;
    isGuest: boolean;
    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signInAnonymously: () => Promise<void>;
    signUp: (email: string, password: string, countryCode?: string) => Promise<{ error: any; data?: any }>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    session: null,
    isGuest: false,
    loading: true,
    initialized: false,

    initialize: async () => {
        try {
            try {
                const host = (() => {
                    try { return new URL(SupabaseUrl).hostname; } catch { return SupabaseUrl; }
                })();
                console.log('[auth:init]', { supabaseHost: host });
                if (Platform.OS !== 'web') {
                    await fetchWithTimeout(SupabaseUrl, { method: 'HEAD' }).catch(() => { });
                }
            } catch { }
            const { data: { session } } = await supabase.auth.getSession();
            set({ session, user: session?.user ?? null, initialized: true, loading: false, isGuest: false });
            if (session?.expires_at) {
                console.log('[auth:session]', { hasSession: true, expiresAt: session.expires_at });
            } else {
                console.log('[auth:session]', { hasSession: !!session });
            }

            supabase.auth.onAuthStateChange((_event, session) => {
                console.log('[auth:event]', { event: _event, hasSession: !!session });
                set({ session, user: session?.user ?? null, isGuest: false });
            });
        } catch (error) {
            set({ initialized: true, loading: false });
        }
    },

    signIn: async (email, password) => {
        set({ loading: true });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        set({ loading: false, isGuest: false });
        return { error };
    },

    signInAnonymously: async () => {
        set({ loading: true });
        // Simulate a delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        set({
            user: null,
            session: null,
            isGuest: true,
            loading: false
        });
    },

    signUp: async (email, password, countryCode) => {
        set({ loading: true });
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: countryCode ? { country_code: countryCode } : {} } });
        set({ loading: false, isGuest: false });
        return { error, data };
    },

    signOut: async () => {
        set({ loading: true });
        await supabase.auth.signOut();
        set({ session: null, user: null, isGuest: false, loading: false });
    },
}));
