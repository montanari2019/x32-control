import { decodeMeter1BlobForChannel } from '../../../../src/features/busMix/utils/meterDecoder';

const createShortMeter1Blob = (values: number[]): Uint8Array => {
  const buffer = new ArrayBuffer(4 + values.length * 2);
  const view = new DataView(buffer);

  view.setInt32(0, values.length, false);
  values.forEach((value, index) => {
    view.setInt16(4 + index * 2, value * 256, true);
  });

  return new Uint8Array(buffer);
};

const createFloatMeter1Blob = (values: number[]): Uint8Array => {
  const buffer = new ArrayBuffer(8 + values.length * 4);
  const view = new DataView(buffer);

  view.setInt32(0, values.length * 4, false);
  view.setInt32(4, values.length, false);
  values.forEach((value, index) => {
    view.setFloat32(8 + index * 4, value, true);
  });

  return new Uint8Array(buffer);
};

describe('decodeMeter1BlobForChannel', () => {
  it('extracts the dbfs value from the X32 float blob for the requested channel', () => {
    const blob = createFloatMeter1Blob([-60, -42, -18, -6]);

    expect(decodeMeter1BlobForChannel(blob, 1).preFadeDbfs).toBe(-60);
    expect(decodeMeter1BlobForChannel(blob, 2).preFadeDbfs).toBe(-42);
    expect(decodeMeter1BlobForChannel(blob, 3).postFadeDbfs).toBe(-18);
    expect(decodeMeter1BlobForChannel(blob, 4).postFadeDbfs).toBe(-6);
  });

  it('keeps compatibility with short-based meter blobs', () => {
    const blob = createShortMeter1Blob([-60, -42, -18, -6]);

    expect(decodeMeter1BlobForChannel(blob, 1).preFadeDbfs).toBe(-60);
    expect(decodeMeter1BlobForChannel(blob, 4).postFadeDbfs).toBe(-6);
  });

  it('falls back to silence when the channel is not present in the blob', () => {
    const blob = createFloatMeter1Blob([-12]);

    expect(decodeMeter1BlobForChannel(blob, 2).preFadeDbfs).toBe(-60);
  });
});
