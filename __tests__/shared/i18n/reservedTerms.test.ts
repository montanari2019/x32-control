import { RESERVED_I18N_TERMS } from '@shared/i18n/reservedTerms';

describe('RESERVED_I18N_TERMS', () => {
  it('protects product and audio-domain terms', () => {
    expect(RESERVED_I18N_TERMS).toEqual(
      expect.arrayContaining([
        'Tacimix',
        'Presets',
        'BUS',
        'MCA',
        'CH',
        'AUX',
        'FX',
        'X32',
        'M32',
        'OSC',
        'UDP',
      ]),
    );
  });
});

