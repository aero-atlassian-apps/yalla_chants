import { useColorScheme } from 'react-native';

export const LightColors = {
    primary: '#D4AF37', // Gold
    secondary: '#800020', // Burgundy/Dark Red
    background: '#FFFFFF', // White background
    surface: '#FFFFFF', // White surface
    surfaceHighlight: '#F5F5F5', // Very light grey/white for highlights
    text: '#2B0202', // Dark Red/Black for text on white
    textSecondary: '#800020', // Burgundy for secondary text
    tabBar: '#2B0202', // Keep Dark Red for tab bar
    success: '#D4AF37', // Gold
    error: '#FF4444',
    white: '#FFFFFF',
    black: '#2B0202',
    transparent: 'transparent',
    playerBackground: '#4A0404', // Deep Dark Red for Player
    mosaicPattern: '#800020', // Dark Red for mosaic pattern
};

export const DarkColors = {
    primary: '#D4AF37', // Gold
    secondary: '#800020', // Burgundy
    background: '#2B0202', // Very deep red/almost black-red for dark mode
    surface: '#4A0404',
    surfaceHighlight: '#5C0505',
    text: '#FFFFFF',
    textSecondary: '#D4AF37', // Gold
    tabBar: '#1A0101',
    success: '#D4AF37',
    error: '#FF4444',
    white: '#FFFFFF',
    black: '#000000', // Keep true black for dark mode deep shadows if needed, but generally avoid.
    transparent: 'transparent',
    playerBackground: '#4A0404',
    mosaicPattern: '#800020',
};

export const useColors = () => {
    const scheme = useColorScheme();
    return scheme === 'dark' ? DarkColors : LightColors;
};
