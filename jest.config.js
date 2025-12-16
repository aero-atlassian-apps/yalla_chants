module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx|js)'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|expo|@react-navigation|@react-native|@expo|react-native-mmkv|expo-modules-core|react-native-track-player|react-native-url-polyfill|expo-haptics|expo-asset|expo-font|expo-constants|@sentry|expo-linking|expo-file-system|expo-status-bar|expo-keep-awake|expo-modules-core|@react-native-community|@react-native)/)'
  ],
  setupFilesAfterEnv: [],
};
