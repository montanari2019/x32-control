import { resources } from '@shared/i18n/resources';
import { RESERVED_I18N_TERMS } from '@shared/i18n/reservedTerms';

const flattenKeys = (value: unknown, prefix = ''): string[] => {
  if (!value || typeof value !== 'object') {
    return [prefix];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
};

const getValueAtPath = (value: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, value);

describe('i18n resources', () => {
  const englishKeys = flattenKeys(resources.en.translation);

  it('keeps the same translation keys in every supported locale', () => {
    expect(flattenKeys(resources['pt-BR'].translation).sort()).toEqual(englishKeys.sort());
    expect(flattenKeys(resources.es.translation).sort()).toEqual(englishKeys.sort());
  });

  it('keeps explicitly reserved terms documented and stable in representative strings', () => {
    const protectedTerms = ['Presets', 'BUS', 'MCA', 'CH', 'AUX', 'FX', 'X32', 'M32', 'OSC', 'UDP'];
    expect(RESERVED_I18N_TERMS).toEqual(expect.arrayContaining(protectedTerms));

    for (const locale of ['en', 'pt-BR', 'es'] as const) {
      expect(resources[locale].translation.busMix.actionPresets).toBe('Presets');
      expect(resources[locale].translation.consoleDiscovery.title).toContain('BUS/AUX');
      expect(resources[locale].translation.consoleDiscovery.subtitle).toContain('X32/M32');
      expect(resources[locale].translation.busGroups.mcaNamePlaceholder).toContain('MCA');
      expect(resources[locale].translation.errors.invalidOscString).toContain('OSC');
      expect(resources[locale].translation.errors.udpTransport).toContain('UDP');
    }
  });

  it('defines all translated leaf values as strings', () => {
    for (const locale of ['en', 'pt-BR', 'es'] as const) {
      flattenKeys(resources[locale].translation).forEach((key) => {
        expect(typeof getValueAtPath(resources[locale].translation, key)).toBe('string');
      });
    }
  });
});
