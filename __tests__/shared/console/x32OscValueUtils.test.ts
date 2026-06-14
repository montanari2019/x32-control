import {
  getBlobArg,
  parseBusColor,
  parseNodeFloat01,
  parseNodeInt,
  parseNodeResponseValues,
  splitNodeValueString,
} from '@shared/console/adapters/x32/X32Adapter/x32OscValueUtils';

describe('x32OscValueUtils', () => {
  it('splits /node string values while preserving quoted names', () => {
    expect(splitNodeValueString('"Lead Vox" 1 0.5 OFF')).toEqual(['Lead Vox', '1', '0.5', 'OFF']);
  });

  it('parses /node responses with and without echoed node paths', () => {
    expect(
      parseNodeResponseValues(
        {
          address: '/node',
          args: ['ch/01/config', '"Kick In" 0 2'],
        },
        'ch/01/config',
      ),
    ).toEqual(['Kick In', '0', '2']);

    expect(
      parseNodeResponseValues(
        {
          address: '/node',
          args: ['"Kick Out" 0 3'],
        },
        'ch/02/config',
      ),
    ).toEqual(['Kick Out', '0', '3']);
  });

  it('normalizes node numeric values with fallbacks', () => {
    expect(parseNodeFloat01('0.75')).toBe(0.75);
    expect(parseNodeFloat01('2')).toBe(1);
    expect(parseNodeFloat01('nope', 0.25)).toBe(0.25);

    expect(parseNodeInt('12')).toBe(12);
    expect(parseNodeInt('nope', 7)).toBe(7);
  });

  it('extracts blob args and parses X32 bus colors', () => {
    const blob = new Uint8Array([1, 2, 3]);

    expect(getBlobArg({ address: '/meters/1', args: [blob] })).toBe(blob);
    expect(getBlobArg({ address: '/meters/1', args: ['not-a-blob'] })).toBeNull();

    expect(parseBusColor({ address: '/bus/01/config/color', args: ['RD'] })).toBe('RD');
    expect(parseBusColor({ address: '/bus/01/config/color', args: [3] })).toBe(3);
    expect(parseBusColor({ address: '/bus/01/config/color', args: ['invalid'] })).toBeUndefined();
  });
});

