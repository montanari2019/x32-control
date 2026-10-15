module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@app': './src/app',
          '@assets': './src/assets',
          '@shared': './src/shared',
          '@features': './src/features',
        },
      },
    ],
  ],
};
