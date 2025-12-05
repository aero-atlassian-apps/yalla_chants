// metro.config.js
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

config.resolver.platforms = ['web', 'ios', 'android']
config.resolver.unstable_enablePackageExports = true
config.watchFolders = [
  __dirname,
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, 'assets') // Add this line
]
// Ensure web-specific extensions are considered first
config.resolver.sourceExts = Array.from(new Set([
  ...(config.resolver.sourceExts || []),
  'web.tsx', 'web.ts', 'web.jsx', 'web.js'
]))

module.exports = config
