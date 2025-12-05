import { useEffect } from 'react';
import { useGuestStore } from '../store/guestStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { changeLanguage } from '../i18n/i18n';
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
                        .select('theme_primary_color, primary_languages')
                        .eq('id', selectedCountryId)
                        .single();

                    if (!error && country) {
                        if (country.theme_primary_color) {
                            useThemeStore.getState().setPrimaryColor(country.theme_primary_color);
                        }
                        const langs = Array.isArray(country.primary_languages) ? country.primary_languages : [];
                        const preferred = (langs[0] || 'en').toLowerCase();
                        const supported = ['en', 'fr', 'pt', 'ar'];
                        const nextLang = supported.includes(preferred) ? preferred : 'en';
                        await changeLanguage(nextLang);
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
