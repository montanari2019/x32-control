export const SUPPORTED_LOCALES = ['en', 'pt-BR', 'es'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type LocaleCandidate = {
  languageTag?: string;
  languageCode?: string;
  countryCode?: string;
};

export const DEFAULT_LOCALE: SupportedLocale = 'en';

const normalizeTag = (value: string): string => value.trim().replace('_', '-').toLowerCase();

export const resolveSupportedLocale = (
  candidates: readonly LocaleCandidate[] | readonly string[] | undefined,
): SupportedLocale => {
  if (!candidates || candidates.length === 0) {
    return DEFAULT_LOCALE;
  }

  for (const candidate of candidates) {
    const rawTag =
      typeof candidate === 'string'
        ? candidate
        : candidate.languageTag ||
          [candidate.languageCode, candidate.countryCode].filter(Boolean).join('-');

    if (!rawTag) {
      continue;
    }

    const tag = normalizeTag(rawTag);

    if (tag === 'pt' || tag.startsWith('pt-')) {
      return 'pt-BR';
    }

    if (tag === 'es' || tag.startsWith('es-')) {
      return 'es';
    }

    if (tag === 'en' || tag.startsWith('en-')) {
      return 'en';
    }
  }

  return DEFAULT_LOCALE;
};

