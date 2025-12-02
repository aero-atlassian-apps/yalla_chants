import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface ThemeState {
    primaryColor: string;
    initialized: boolean;
    setPrimaryColor: (hex: string) => void;
    loadForUser: (userId: string) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
    primaryColor: '#1DB954',
    initialized: false,
    setPrimaryColor: (hex) => set({ primaryColor: hex }),
    loadForUser: async (userId: string) => {
        try {
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('country_id')
                .eq('id', userId)
                .single();

            if (profileError) {
                set({ initialized: true });
                return;
            }

            const countryId = profile?.country_id;
            if (!countryId) {
                set({ initialized: true });
                return;
            }

            const { data: country, error: countryError } = await supabase
                .from('countries')
                .select('theme_primary_color')
                .eq('id', countryId)
                .single();

            if (countryError) {
                set({ initialized: true });
                return;
            }

            const hex = country?.theme_primary_color || '#1DB954';
            set({ primaryColor: hex, initialized: true });
        } catch {
            set({ initialized: true });
        }
    },
}));
