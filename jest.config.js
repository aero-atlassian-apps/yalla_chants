module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx|js)'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|expo|@react-navigation|@react-native|@expo|react-native-mmkv|expo-modules-core|react-native-track-player|react-native-url-polyfill)/)'
  ],
  setupFilesAfterEnv: [],
};
