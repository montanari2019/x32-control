import { DEFAULT_LOCALE, resolveSupportedLocale } from '@shared/i18n/locales';

describe('resolveSupportedLocale', () => {
  it('uses English for English language tags', () => {
    expect(resolveSupportedLocale(['en-US'])).toBe('en');
    expect(resolveSupportedLocale([{ languageTag: 'en-GB' }])).toBe('en');
  });

  it('maps Portuguese variants to Brazilian Portuguese', () => {
    expect(resolveSupportedLocale(['pt'])).toBe('pt-BR');
    expect(resolveSupportedLocale(['pt-PT'])).toBe('pt-BR');
    expect(resolveSupportedLocale([{ languageCode: 'pt', countryCode: 'BR' }])).toBe('pt-BR');
  });

  it('maps Spanish variants to Spanish', () => {
    expect(resolveSupportedLocale(['es'])).toBe('es');
    expect(resolveSupportedLocale(['es-MX'])).toBe('es');
  });

  it('uses the first supported locale from the preferred list', () => {
    expect(resolveSupportedLocale(['fr-FR', 'es-ES', 'en-US'])).toBe('es');
  });

  it('falls back to English when nothing is supported', () => {
    expect(resolveSupportedLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(resolveSupportedLocale([])).toBe(DEFAULT_LOCALE);
    expect(resolveSupportedLocale(['fr-FR'])).toBe(DEFAULT_LOCALE);
  });
});

