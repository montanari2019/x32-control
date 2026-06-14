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

export const METER_MIN_DBFS = -60;
export const METER_MAX_DBFS = 10;
export const METER_GREEN_MAX_DB = -2;
export const METER_YELLOW_MAX_DB = 8;
export const SILENCE_DBFS = METER_MIN_DBFS;

const X32_BLOB_COUNT_HEADER_SIZE = 4;

const linearToDb = (linear: number): number => {
  if (!Number.isFinite(linear) || linear <= 0) {
    return METER_MIN_DBFS;
  }

  return clamp(20 * Math.log10(linear), METER_MIN_DBFS, METER_MAX_DBFS);
};

const decodeFloatDbValue = (value: number): number => {
  if (value >= 0) {
    return linearToDb(value);
  }

  return clamp(value, METER_MIN_DBFS, METER_MAX_DBFS);
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

const decodeIndexedFloatMeterBlob = (blob: Uint8Array, index: number): ChannelMeterValues => {
  if (index < 0) {
    return makeSilence();
  }

  const dataOffset = X32_BLOB_COUNT_HEADER_SIZE;
  const minBlobSize = dataOffset + 4;
  if (blob.byteLength < minBlobSize) {
    return makeSilence();
  }

  const dataBytes = blob.byteLength - dataOffset;
  if (dataBytes % 4 !== 0) {
    return makeSilence();
  }

  const floatCount = dataBytes / 4;
  if (index >= floatCount) {
    return makeSilence();
  }

  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  const linear = view.getFloat32(dataOffset + index * 4, true);
  return makeValues(decodeFloatDbValue(linear));
};

export const decodeMeterBlob = (blob: Uint8Array): ChannelMeterValues => {
  if (blob.byteLength < 10) {
    return makeSilence();
  }

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

export const decodeMeter1BlobForChannel = (
  blob: Uint8Array,
  channelId: number,
): ChannelMeterValues => {
  return decodeIndexedFloatMeterBlob(blob, channelId - 1);
};

export const decodeMeter13BlobForChannel = (
  blob: Uint8Array,
  channelId: number,
): ChannelMeterValues => {
  return decodeIndexedFloatMeterBlob(blob, channelId - 1);
};

export const decodeMeter2BlobForBusMaster = (
  blob: Uint8Array,
  busId: number,
): ChannelMeterValues => {
  if (busId < 1 || busId > 16) {
    return makeSilence();
  }

  return decodeIndexedFloatMeterBlob(blob, busId - 1);
};

export const clampMeterValue = (dbfs: number): number =>
  clamp(dbfs, METER_MIN_DBFS, METER_MAX_DBFS);

export const meterValueToPercent = (dbfs: number): number => {
  const clamped = clampMeterValue(dbfs);
  return (clamped - METER_MIN_DBFS) / (METER_MAX_DBFS - METER_MIN_DBFS);
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

const rangeFillRatio = (dbfs: number, min: number, max: number): number => {
  if (max <= min) {
    return 0;
  }

  return clamp((clampMeterValue(dbfs) - min) / (max - min), 0, 1);
};

export const getMeterFillRatios = (
  dbfs: number,
): { green: number; red: number; yellow: number } => ({
  green: rangeFillRatio(dbfs, METER_MIN_DBFS, METER_GREEN_MAX_DB),
  yellow: rangeFillRatio(dbfs, METER_GREEN_MAX_DB, METER_YELLOW_MAX_DB),
  red: rangeFillRatio(dbfs, METER_YELLOW_MAX_DB, METER_MAX_DBFS),
});

export const getMeterZone = (dbfs: number): MeterZone => {
  if (dbfs > METER_YELLOW_MAX_DB) return 'clip-danger';
  if (dbfs > METER_GREEN_MAX_DB) return 'hot';
  if (dbfs >= -24) return 'nominal';
  if (dbfs >= -48) return 'low';
  return 'silent';
};

export const normalizeX32MeterValue = (dbfs: number): number => clampMeterValue(dbfs);
export const dbToMeterHeight = dbfsToMeterHeight;
