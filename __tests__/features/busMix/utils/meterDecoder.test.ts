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

  it('decodes CH17 (digital AES50, index 16) correctly from 96-float blob', () => {
    const values = new Array(96).fill(0.001);
    values[16] = 0.35;
    const blob = createFloatMeterBlob(values);

    expect(decodeMeter1BlobForChannel(blob, 17).preFadeDbfs).toBeCloseTo(-9, 0);
    expect(decodeMeter1BlobForChannel(blob, 16).preFadeDbfs).toBeCloseTo(-60, 0);
  });

  it('does not read count header as a float', () => {
    const values = new Array(96).fill(0.001);
    values[0] = 1.0;
    const blob = createFloatMeterBlob(values);

    expect(decodeMeter1BlobForChannel(blob, 1).preFadeDbfs).toBeCloseTo(0, 1);
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
});
