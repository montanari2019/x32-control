import {
  decodeMeter1BlobForChannel,
  decodeMeter13BlobForChannel,
} from '../../../../src/features/busMix/utils/meterDecoder';

const createShortMeter1Blob = (values: number[]): Uint8Array => {
  const buffer = new ArrayBuffer(4 + values.length * 2);
  const view = new DataView(buffer);

  view.setInt32(0, values.length, false);
  values.forEach((value, index) => {
    view.setInt16(4 + index * 2, value * 256, true);
  });

  return new Uint8Array(buffer);
};

const createFloatMeter1Blob = (linearValues: number[]): Uint8Array => {
  const buffer = new ArrayBuffer(8 + linearValues.length * 4);
  const view = new DataView(buffer);

  view.setInt32(0, linearValues.length * 4, false);
  view.setInt32(4, linearValues.length, false);
  linearValues.forEach((value, index) => {
    view.setFloat32(8 + index * 4, value, true);
  });

  return new Uint8Array(buffer);
};

const createMeter13Blob = (linearValues: number[]): Uint8Array =>
  createFloatMeter1Blob(linearValues);

describe('decodeMeter1BlobForChannel', () => {
  it('decodes linear float blob (LE) to dBFS', () => {
    const blob = createFloatMeter1Blob([0.001, 0.316, 0.5, 1.0]);

    expect(decodeMeter1BlobForChannel(blob, 1).preFadeDbfs).toBeCloseTo(-60, 0);
    expect(decodeMeter1BlobForChannel(blob, 2).preFadeDbfs).toBeCloseTo(-10, 0);
    expect(decodeMeter1BlobForChannel(blob, 3).preFadeDbfs).toBeCloseTo(-6, 0);
    expect(decodeMeter1BlobForChannel(blob, 4).preFadeDbfs).toBeCloseTo(0, 0);
  });

  it('keeps compatibility with short-based meter blobs (int16 LE)', () => {
    const blob = createShortMeter1Blob([-60, -42, -18, -6]);

    expect(decodeMeter1BlobForChannel(blob, 1).preFadeDbfs).toBe(-60);
    expect(decodeMeter1BlobForChannel(blob, 4).postFadeDbfs).toBe(-6);
  });

  it('falls back to silence when channel is out of range', () => {
    const blob = createFloatMeter1Blob([0.5]);

    expect(decodeMeter1BlobForChannel(blob, 2).preFadeDbfs).toBe(-60);
  });
});

describe('decodeMeter13BlobForChannel', () => {
  it('decodes AUX01 (channelId=33, index=32) correctly', () => {
    const values = new Array(48).fill(0.001);
    values[32] = 0.316;
    const blob = createMeter13Blob(values);

    expect(decodeMeter13BlobForChannel(blob, 33).preFadeDbfs).toBeCloseTo(-10, 0);
    expect(decodeMeter13BlobForChannel(blob, 34).preFadeDbfs).toBeCloseTo(-60, 0);
  });

  it('decodes FX Return 01 (channelId=41, index=40) correctly', () => {
    const values = new Array(48).fill(0.001);
    values[40] = 1.0;
    const blob = createMeter13Blob(values);

    expect(decodeMeter13BlobForChannel(blob, 41).preFadeDbfs).toBeCloseTo(0, 0);
  });

  it('returns silence for blob too short', () => {
    const blob = new Uint8Array(4);

    expect(decodeMeter13BlobForChannel(blob, 33).preFadeDbfs).toBe(-60);
  });
});
