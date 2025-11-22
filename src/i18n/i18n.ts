import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import ar from './locales/ar.json';

const LANGUAGE_STORAGE_KEY = '@yalla_chants_language';

// Language resources
const resources = {
    en: { translation: en },
    fr: { translation: fr },
    pt: { translation: pt },
    ar: { translation: ar },
};

// Get stored language or device locale
const getInitialLanguage = async (): Promise<string> => {
    try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (storedLanguage) {
            return storedLanguage;
        }

        // Get device locale
        const deviceLocale = Localization.getLocales()[0];
        const languageCode = deviceLocale.languageCode || 'en';

        // Map language codes to supported languages
        const supportedLanguages = ['en', 'fr', 'pt', 'ar'];
        return supportedLanguages.includes(languageCode) ? languageCode : 'en';
    } catch (error) {
        console.error('Error getting initial language:', error);
        return 'en';
    }
};

// Initialize i18next
const initI18n = async () => {
    const initialLanguage = await getInitialLanguage();

    i18n
        .use(initReactI18next)
        .init({
            resources,
            lng: initialLanguage,
            fallbackLng: 'en',
            interpolation: {
                escapeValue: false,
            },
            react: {
                useSuspense: false,
            },
        } as any);
};

// Change language and persist
export const changeLanguage = async (languageCode: string) => {
    try {
        await i18n.changeLanguage(languageCode);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    } catch (error) {
        console.error('Error changing language:', error);
    }
};

// Check if language is RTL
export const isRTL = (languageCode?: string): boolean => {
    const lang = languageCode || i18n.language;
    return lang === 'ar';
};

// Initialize on import
initI18n();

export default i18n;
