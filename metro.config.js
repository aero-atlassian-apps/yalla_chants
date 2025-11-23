// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable web support with proper platform resolution
config.resolver.platforms = ['web', 'ios', 'android'];

// Ensure .web.tsx/.web.ts files are resolved first for web platform
config.resolver.sourceExts = ['web.tsx', 'web.ts', 'web.jsx', 'web.js', ...config.resolver.sourceExts];

module.exports = config;
