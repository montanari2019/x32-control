import {
  decodeMeter1BlobForChannel,
  decodeMeter13BlobForChannel,
} from '../../../../src/features/busMix/utils/meterDecoder';

const createFloatMeterBlob = (linearValues: number[]): Uint8Array => {
  const count = linearValues.length;
  const buffer = new ArrayBuffer(4 + count * 4);
  const view = new DataView(buffer);

  view.setUint32(0, count, true);
  linearValues.forEach((value, index) => {
    view.setFloat32(4 + index * 4, value, true);
  });

  return new Uint8Array(buffer);
};

describe('decodeMeter1BlobForChannel', () => {
  it('decodes float32 LE blob with count header - format delivered by OscDecoder from X32', () => {
    const blob = createFloatMeterBlob([0.001, 0.316, 0.5, 1.0]);

    expect(decodeMeter1BlobForChannel(blob, 1).preFadeDbfs).toBeCloseTo(-60, 0);
    expect(decodeMeter1BlobForChannel(blob, 2).preFadeDbfs).toBeCloseTo(-10, 0);
    expect(decodeMeter1BlobForChannel(blob, 3).preFadeDbfs).toBeCloseTo(-6, 0);
    expect(decodeMeter1BlobForChannel(blob, 4).preFadeDbfs).toBeCloseTo(0, 1);
  });

  it('returns silence for channels beyond blob size', () => {
    const blob = createFloatMeterBlob([0.5]);

    expect(decodeMeter1BlobForChannel(blob, 2).preFadeDbfs).toBe(-60);
  });

  it('returns silence for blob without count header (too small)', () => {
    expect(decodeMeter1BlobForChannel(new Uint8Array(0), 1).preFadeDbfs).toBe(-60);
    expect(decodeMeter1BlobForChannel(new Uint8Array(4), 1).preFadeDbfs).toBe(-60);
    expect(decodeMeter1BlobForChannel(new Uint8Array(7), 1).preFadeDbfs).toBe(-60);
  });

  it('decodes CH17-CH22 (digital AES50 range, indexes 16-21) correctly from 96-float blob', () => {
    const values = new Array(96).fill(0.001);
    values[16] = 0.35;
    values[17] = 0.4;
    values[18] = 0.45;
    values[19] = 0.5;
    values[20] = 0.55;
    values[21] = 0.6;
    const blob = createFloatMeterBlob(values);

    expect(decodeMeter1BlobForChannel(blob, 17).preFadeDbfs).toBeCloseTo(-9, 0);
    expect(decodeMeter1BlobForChannel(blob, 18).preFadeDbfs).toBeCloseTo(-8, 0);
    expect(decodeMeter1BlobForChannel(blob, 19).preFadeDbfs).toBeCloseTo(-7, 0);
    expect(decodeMeter1BlobForChannel(blob, 20).preFadeDbfs).toBeCloseTo(-6, 0);
    expect(decodeMeter1BlobForChannel(blob, 21).preFadeDbfs).toBeCloseTo(-5, 0);
    expect(decodeMeter1BlobForChannel(blob, 22).preFadeDbfs).toBeCloseTo(-4, 0);
  });

  it('does not read count header as a float', () => {
    const values = new Array(96).fill(0.001);
    values[0] = 1.0;
    const blob = createFloatMeterBlob(values);

    expect(decodeMeter1BlobForChannel(blob, 1).preFadeDbfs).toBeCloseTo(0, 1);
  });

  it('keeps CH01, CH16, CH17, and CH32 mapped to the first 32 /meters/1 floats', () => {
    const values = new Array(96).fill(0.001);
    values[0] = 0.25;
    values[15] = 0.35;
    values[16] = 0.45;
    values[31] = 0.55;
    values[32] = 1.0;
    const blob = createFloatMeterBlob(values);

    expect(decodeMeter1BlobForChannel(blob, 1).preFadeDbfs).toBeCloseTo(-12, 0);
    expect(decodeMeter1BlobForChannel(blob, 16).preFadeDbfs).toBeCloseTo(-9, 0);
    expect(decodeMeter1BlobForChannel(blob, 17).preFadeDbfs).toBeCloseTo(-7, 0);
    expect(decodeMeter1BlobForChannel(blob, 32).preFadeDbfs).toBeCloseTo(-5, 0);
  });

  it('decodes X32 linear headroom values above unity', () => {
    const blob = createFloatMeterBlob([2.0]);

    expect(decodeMeter1BlobForChannel(blob, 1).preFadeDbfs).toBeCloseTo(6, 0);
  });
});

describe('decodeMeter13BlobForChannel', () => {
  it('decodes AUX01 (channelId=33, index=32) from 48-float blob with count header', () => {
    const values = new Array(48).fill(0.001);
    values[32] = 0.316;
    const blob = createFloatMeterBlob(values);

    expect(decodeMeter13BlobForChannel(blob, 33).preFadeDbfs).toBeCloseTo(-10, 0);
    expect(decodeMeter13BlobForChannel(blob, 34).preFadeDbfs).toBeCloseTo(-60, 0);
  });

  it('decodes FX Return 01 (channelId=41, index=40) correctly', () => {
    const values = new Array(48).fill(0.001);
    values[40] = 1.0;
    const blob = createFloatMeterBlob(values);

    expect(decodeMeter13BlobForChannel(blob, 41).preFadeDbfs).toBeCloseTo(0, 1);
  });

  it('returns silence for blob too short (missing count header)', () => {
    expect(decodeMeter13BlobForChannel(new Uint8Array(3), 33).preFadeDbfs).toBe(-60);
    expect(decodeMeter13BlobForChannel(new Uint8Array(4), 33).preFadeDbfs).toBe(-60);
  });

  it('returns silence for index out of range', () => {
    const blob = createFloatMeterBlob(new Array(48).fill(0.5));

    expect(decodeMeter13BlobForChannel(blob, 49).preFadeDbfs).toBe(-60);
  });

  it('maps AUX and FX Return boundaries inside the 48-float /meters/13 blob', () => {
    const values = new Array(48).fill(0.001);
    // /meters/13: indexes 0..31 are inputs, 32..39 are AUX, 40..47 are stereo FX returns.
    values[32] = 0.25;
    values[39] = 0.35;
    values[40] = 0.45;
    values[47] = 0.55;
    const blob = createFloatMeterBlob(values);

    expect(decodeMeter13BlobForChannel(blob, 33).preFadeDbfs).toBeCloseTo(-12, 0);
    expect(decodeMeter13BlobForChannel(blob, 40).preFadeDbfs).toBeCloseTo(-9, 0);
    expect(decodeMeter13BlobForChannel(blob, 41).preFadeDbfs).toBeCloseTo(-7, 0);
    expect(decodeMeter13BlobForChannel(blob, 48).preFadeDbfs).toBeCloseTo(-5, 0);
  });
});
