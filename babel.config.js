module.exports = (api) => {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'react' }]],
    // `react-native-reanimated/plugin` precisa ser SEMPRE o último plugin.
    plugins: ['react-native-reanimated/plugin'],
  };
};
