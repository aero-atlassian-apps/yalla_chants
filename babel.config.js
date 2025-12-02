module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo', '@babel/preset-typescript'],
        plugins: [
            // Fix for require issues in Hermes
            ['@babel/plugin-transform-modules-commonjs', {
                strictMode: false,
            }],
            ['@babel/plugin-transform-runtime', {
                helpers: true,
                regenerator: true,
                corejs: false,
            }],
            // 'react-native-reanimated/plugin', // Temporarily disabled - package removed
        ],
    };
};
