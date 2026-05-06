import { clamp } from '@shared/utils/clamp';

export type MeterZone = 'clip-danger' | 'hot' | 'nominal' | 'low' | 'silent';

export type ChannelMeterValues = {
  preFadeDbfs: number;
  postFadeDbfs: number;
  gateGrDb: number;
  dynGrDb: number;
  preFadeDb: number;
  postFadeDb: number;
};

export const METER_MARKS = ['0', '-6', '-12', '-18', '-24', '-36', '-48', '-60'];

const MIN_DBFS = -60;
const MAX_DBFS = 10;
export const SILENCE_DBFS = MIN_DBFS;

const linearToDb = (linear: number): number => {
  if (!Number.isFinite(linear) || linear <= 0) return MIN_DBFS;
  return clamp(20 * Math.log10(linear), MIN_DBFS, MAX_DBFS);
};

const makeSilence = (): ChannelMeterValues => ({
  preFadeDbfs: SILENCE_DBFS,
  postFadeDbfs: SILENCE_DBFS,
  gateGrDb: 0,
  dynGrDb: 0,
  preFadeDb: SILENCE_DBFS,
  postFadeDb: SILENCE_DBFS,
});

const makeValues = (preFadeDbfs: number): ChannelMeterValues => ({
  preFadeDbfs,
  postFadeDbfs: preFadeDbfs,
  gateGrDb: 0,
  dynGrDb: 0,
  preFadeDb: preFadeDbfs,
  postFadeDb: preFadeDbfs,
});

export const decodeMeterBlob = (blob: Uint8Array): ChannelMeterValues => {
  if (blob.byteLength < 10) return makeSilence();
  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  const preFadeDbfs = view.getInt16(4, true) / 256.0;
  const postFadeDbfs = view.getInt16(12, true) / 256.0;
  return {
    preFadeDbfs,
    postFadeDbfs,
    gateGrDb: view.getInt16(8, true) / 256.0,
    dynGrDb: view.getInt16(10, true) / 256.0,
    preFadeDb: preFadeDbfs,
    postFadeDb: postFadeDbfs,
  };
};

/**
 * Decode a single channel from the /meters/1 blob.
 *
 * X32 blob formats (both start with a 4-byte LE int32 count header):
 *   A) count × int16 LE — value / 256.0 = dBFS directly
 *   B) count × float32 LE — linear 0..1 value, convert with 20*log10
 *
 * channelId is 1-based (CH01 = 1, CH32 = 32).
 */
export const decodeMeter1BlobForChannel = (
  blob: Uint8Array,
  channelId: number,
): ChannelMeterValues => {
  if (blob.byteLength < 4) return makeSilence();

  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  const index = channelId - 1;
  if (index < 0) return makeSilence();

  const countHeader = view.getInt32(0, true);

  // Format A: 4-byte LE count + count × int16 LE (value/256 = dBFS)
  if (countHeader > 0 && countHeader <= 512 && blob.byteLength === 4 + countHeader * 2) {
    if (index >= countHeader) return makeSilence();
    const db = view.getInt16(4 + index * 2, true) / 256.0;
    return makeValues(clamp(db, MIN_DBFS, MAX_DBFS));
  }

  // Format B: 4-byte LE count + count × float32 LE (linear → dBFS)
  if (countHeader > 0 && countHeader <= 256 && blob.byteLength === 4 + countHeader * 4) {
    if (index >= countHeader) return makeSilence();
    const linear = view.getFloat32(4 + index * 4, true);
    return makeValues(linearToDb(linear));
  }

  // Format C: no header — raw int16 LE values
  const rawCount = Math.floor(blob.byteLength / 2);
  if (index < rawCount) {
    const db = view.getInt16(index * 2, true) / 256.0;
    return makeValues(clamp(db, MIN_DBFS, MAX_DBFS));
  }

  return makeSilence();
};

export const clampMeterValue = (dbfs: number): number => clamp(dbfs, MIN_DBFS, MAX_DBFS);

export const meterValueToPercent = (dbfs: number): number => {
  const clamped = clampMeterValue(dbfs);
  return (clamped - MIN_DBFS) / (MAX_DBFS - MIN_DBFS);
};

export const smoothMeterValue = (
  current: number,
  target: number,
  attack = 0.55,
  release = 0.18,
): number => {
  const ratio = target >= current ? attack : release;
  return current + (target - current) * ratio;
};

export const dbfsToMeterHeight = (dbfs: number): number => meterValueToPercent(dbfs);

export const getMeterZone = (dbfs: number): MeterZone => {
  if (dbfs > 8) return 'clip-danger';
  if (dbfs > -2) return 'hot';
  if (dbfs >= -24) return 'nominal';
  if (dbfs >= -48) return 'low';
  return 'silent';
};

export const normalizeX32MeterValue = (dbfs: number): number => clampMeterValue(dbfs);
export const dbToMeterHeight = dbfsToMeterHeight;
