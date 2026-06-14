jest.mock('react-native-localize', () => ({
  getLocales: () => [
    {
      countryCode: 'US',
      isRTL: false,
      languageCode: 'en',
      languageTag: 'en-US',
    },
  ],
}));

