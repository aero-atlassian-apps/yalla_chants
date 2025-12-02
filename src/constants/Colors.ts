import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';

// Premium Stadium-Themed Color Palette
const shade = (hex: string, pct: number) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const t = pct < 0 ? 0 : 255;
    const p = Math.abs(pct) / 100;
    const nr = Math.round((t - r) * p + r);
    const ng = Math.round((t - g) * p + g);
    const nb = Math.round((t - b) * p + b);
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
};

const baseGold = {
    gold: '#d4a574',
    goldLight: '#e6c488',
    goldBright: '#f4c542',
    goldMuted: '#8a7355',
    goldDim: '#6b5d48',
};

const buildPalette = (primaryHex: string) => ({
    primary: primaryHex,
    primaryDark: shade(primaryHex, -20),
    primaryLight: shade(primaryHex, 15),

    // Golden Tones - Primary Text & Accents (NO WHITE/GREY)
    gold: baseGold.gold,
    goldLight: baseGold.goldLight,
    goldBright: baseGold.goldBright,
    goldMuted: baseGold.goldMuted,
    goldDim: baseGold.goldDim,

    // Accent - Keep bright gold as primary accent
    accent: baseGold.goldBright,
    accentDark: '#d9a72f',

    // Secondary - Deep Forest Green (Stadium Night)
    secondary: '#0a2e1f',
    secondaryDark: '#081f16',

    // Backgrounds - Layered Dark Greens
    background: '#0a2e1f',
    backgroundAlt: '#0d3d2a',

    // Surface - Dark Green Cards
    surface: '#1a4d3a',
    surfaceLight: '#245a45',
    surfaceDark: '#0f3828',

    // Text - ALL GOLDEN (NO WHITE/GREY)
    text: baseGold.gold,
    textSecondary: baseGold.goldLight,
    textTertiary: baseGold.goldMuted,
    textDim: baseGold.goldDim,
    textGold: baseGold.goldBright,

    // Status Colors (with golden tones)
    error: '#E74C3C',             // Red for errors
    success: primaryHex,
    warning: '#f4c542',           // Bright gold for warning
    info: '#3498DB',              // Blue for info

    // Borders & Shadows
    border: '#245a45',
    borderLight: 'rgba(212, 165, 116, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.8)',
    shadowLight: 'rgba(0, 0, 0, 0.6)',

    // Tab Bar
    tabBar: {
        active: baseGold.gold,
        inactive: baseGold.goldMuted,
        background: 'rgba(10, 46, 31, 0.98)',
    },

    // Player
    playerBackground: '#0d3d2a',
    playerProgress: baseGold.goldBright,

    // Utilities
    white: baseGold.gold,
    black: '#081f16',
    transparent: 'transparent',

    // Patterns & Overlays
    mosaicPattern: primaryHex,
    overlay: 'rgba(10, 46, 31, 0.85)',
    overlayDark: 'rgba(8, 31, 22, 0.92)',
});

export const useColors = () => {
    const scheme = useColorScheme();
    const { primaryColor } = useThemeStore();
    const palette = buildPalette(primaryColor);
    return scheme === 'dark' ? palette : palette;
};
