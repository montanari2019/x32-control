import { OscDecoder } from '../../../src/shared/osc/OscDecoder';
import { OscEncoder } from '../../../src/shared/osc/OscEncoder';

describe('OscEncoder', () => {
  it('encodes OSC address, type tags and arguments', () => {
    const encoded = OscEncoder.encode({
      address: '/ch/01/mix/03/level',
      args: [0.72],
    });
    const decoded = OscDecoder.decode(encoded);

    expect(decoded.address).toBe('/ch/01/mix/03/level');
    expect(decoded.args[0]).toBeCloseTo(0.72, 5);
  });

  it('supports strings, integers and booleans', () => {
    const decoded = OscDecoder.decode(
      OscEncoder.encode({ address: '/test', args: ['X32', 1, true, false] }),
    );

    expect(decoded.args).toEqual(['X32', 1, true, false]);
  });
});
