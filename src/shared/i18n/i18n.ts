import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import { resources } from './resources';
import { DEFAULT_LOCALE, SupportedLocale, resolveSupportedLocale } from './locales';

const getDeviceLocale = (): SupportedLocale => resolveSupportedLocale(RNLocalize.getLocales());

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    fallbackLng: DEFAULT_LOCALE,
    interpolation: {
      escapeValue: false,
    },
    lng: getDeviceLocale(),
    resources,
  });
}

export const syncI18nWithDeviceLocale = (): void => {
  const nextLocale = getDeviceLocale();
  if (i18next.language !== nextLocale) {
    i18next.changeLanguage(nextLocale).catch(() => undefined);
  }
};

export const getCurrentLocale = (): SupportedLocale =>
  resolveSupportedLocale([i18next.resolvedLanguage || i18next.language || DEFAULT_LOCALE]);

export { i18next };

