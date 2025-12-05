import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GuestState {
    selectedCountryId: string | null;
    isGuest: boolean;
    setGuestCountry: (countryId: string) => Promise<void>;
    setIsGuest: (isGuest: boolean) => void;
    loadGuestState: () => Promise<void>;
    clearGuestState: () => Promise<void>;
}

const GUEST_COUNTRY_KEY = '@yalla_chants_guest_country';
const IS_GUEST_KEY = '@yalla_chants_is_guest';

export const useGuestStore = create<GuestState>((set) => ({
    selectedCountryId: null,
    isGuest: false,
    
    setGuestCountry: async (countryId: string) => {
        try {
            await AsyncStorage.setItem(GUEST_COUNTRY_KEY, countryId);
            set({ selectedCountryId: countryId });
        } catch (error) {
            console.error('Error saving guest country:', error);
        }
    },
    
    setIsGuest: (isGuest: boolean) => {
        set({ isGuest });
        AsyncStorage.setItem(IS_GUEST_KEY, JSON.stringify(isGuest)).catch(console.error);
    },
    
    loadGuestState: async () => {
        try {
            const [countryId, isGuestStr] = await Promise.all([
                AsyncStorage.getItem(GUEST_COUNTRY_KEY),
                AsyncStorage.getItem(IS_GUEST_KEY)
            ]);
            
            set({
                selectedCountryId: countryId,
                isGuest: isGuestStr === 'true'
            });
        } catch (error) {
            console.error('Error loading guest state:', error);
        }
    },
    
    clearGuestState: async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(GUEST_COUNTRY_KEY),
                AsyncStorage.removeItem(IS_GUEST_KEY)
            ]);
            set({ selectedCountryId: null, isGuest: false });
        } catch (error) {
            console.error('Error clearing guest state:', error);
        }
    }
}));