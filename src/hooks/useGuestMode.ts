import { useEffect } from 'react';
import { useGuestStore } from '../store/guestStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { supabase } from '../services/supabase';

export const useGuestMode = () => {
    const { isGuest, selectedCountryId } = useGuestStore();
    const { session } = useAuthStore();
    const { loadForUser } = useThemeStore();

    useEffect(() => {
        const loadGuestTheme = async () => {
            if (isGuest && selectedCountryId) {
                try {
                    const { data: country, error } = await supabase
                        .from('countries')
                        .select('theme_primary_color')
                        .eq('id', selectedCountryId)
                        .single();

                    if (!error && country?.theme_primary_color) {
                        useThemeStore.getState().setPrimaryColor(country.theme_primary_color);
                    }
                } catch (error) {
                    console.error('Error loading guest theme:', error);
                }
            }
        };

        loadGuestTheme();
    }, [isGuest, selectedCountryId]);

    const isGuestMode = isGuest && !session;
    const shouldShowCountrySelector = isGuestMode && !selectedCountryId;

    return {
        isGuestMode,
        shouldShowCountrySelector,
        selectedCountryId,
        loadGuestTheme: () => loadForUser('guest') // Trigger theme reload
    };
};