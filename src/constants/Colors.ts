import { useColorScheme } from 'react-native';

// Premium Stadium-Themed Color Palette
export const Colors = {
    // Primary - Rich Forest Green
    primary: '#1D6F42',           // Rich forest green for main elements
    primaryDark: '#0F4D33',       // Deep forest green for backgrounds
    primaryLight: '#2A8F5A',      // Lighter green for hover states

    // Accent - Vibrant Emerald (Interactive Elements)
    accent: '#3CC47C',            // Bright emerald for CTAs, progress bars
    accentDark: '#2ECC71',        // Darker accent for pressed states

    // Secondary - Metallic Gold
    secondary: '#FFD700',         // Metallic gold for highlights, active states
    secondaryDark: '#E5BE01',     // Warm gold for variation

    // Background
    background: '#0F4D33',        // Deep forest green base
    backgroundAlt: '#1A5C3A',     // Alternative background shade

    // Surface
    surface: 'rgba(29, 111, 66, 0.8)',      // Glassmorphism green
    surfaceLight: 'rgba(255, 255, 255, 0.1)',
    surfaceDark: 'rgba(15, 77, 51, 0.95)',

    // Text
    text: '#FFFFFF',              // Primary text (white)
    textSecondary: '#E0E0E0',     // Secondary text (off-white)
    textTertiary: '#C0C0C0',      // Tertiary text (light gray)
    textDim: '#A0A0A0',           // Dimmed text
    textGold: '#FFD700',          // Gold text for highlights

    // Status Colors
    error: '#FF4444',
    success: '#3CC47C',           // Using accent green for success
    warning: '#FFA500',
    info: '#3498DB',

    // Borders & Shadows
    border: 'rgba(255, 215, 0, 0.3)',      // Subtle gold border
    borderLight: 'rgba(255, 255, 255, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(0, 0, 0, 0.3)',

    // Tab Bar
    tabBar: {
        active: '#FFD700',                  // Gold for active tab
        inactive: '#C0C0C0',                // Light gray for inactive
        background: 'rgba(15, 77, 51, 0.98)',
    },

    // Player
    playerBackground: '#0F4D33',
    playerProgress: '#3CC47C',    // Accent green for progress bar

    // Utilities
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Patterns & Overlays
    mosaicPattern: '#1D6F42',
    overlay: 'rgba(15, 77, 51, 0.7)',
    overlayDark: 'rgba(0, 0, 0, 0.6)',
};

export const LightColors = Colors;
export const DarkColors = Colors;

export const useColors = () => {
    const scheme = useColorScheme();
    return scheme === 'dark' ? DarkColors : LightColors;
};
