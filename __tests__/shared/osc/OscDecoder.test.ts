import { Buffer } from 'buffer';
import { AppError } from '../../../src/shared/errors/AppError';
import { OscDecoder } from '../../../src/shared/osc/OscDecoder';
import { OscEncoder } from '../../../src/shared/osc/OscEncoder';

describe('OscDecoder', () => {
  it('decodes a valid OSC message', () => {
    const message = OscDecoder.decode(
      OscEncoder.encode({ address: '/status', args: ['active'] }),
    );

    expect(message).toEqual({ address: '/status', args: ['active'] });
  });

  it('throws for invalid OSC payloads', () => {
    expect(() => OscDecoder.decode(Buffer.from('bad'))).toThrow(AppError);
  });
});
