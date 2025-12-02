module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx|js)'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|expo|@react-navigation|@react-native|@expo|react-native-mmkv)/)'
  ],
  setupFilesAfterEnv: [],
};
