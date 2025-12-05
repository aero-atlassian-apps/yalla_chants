import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { useGuestStore } from './guestStore';

interface ThemeState {
    primaryColor: string;
    initialized: boolean;
    setPrimaryColor: (hex: string) => void;
    setDefaultColor: () => void;
    loadForUser: (userId: string) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
    primaryColor: '#1DB954',
    initialized: false,
    setPrimaryColor: (hex) => set({ primaryColor: hex }),
    setDefaultColor: () => set({ primaryColor: '#1DB954' }),
    loadForUser: async (userId: string) => {
        try {
            // First check if user is guest and has selected country
            const { isGuest, selectedCountryId } = useGuestStore.getState();
            
            if (isGuest && selectedCountryId) {
                // Load guest country theme
                const { data: country, error: countryError } = await supabase
                    .from('countries')
                    .select('theme_primary_color')
                    .eq('id', selectedCountryId)
                    .single();

                if (!countryError && country?.theme_primary_color) {
                    set({ primaryColor: country.theme_primary_color, initialized: true });
                    return;
                }
            }

            // If not guest or no guest country, load from user profile
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
