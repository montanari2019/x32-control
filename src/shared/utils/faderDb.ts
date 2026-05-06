import { clamp } from './clamp';

const MIN_DB = -90;
const MAX_DB = 10;
const NEG_INF = '-inf';

export type X32FaderDb = number | typeof NEG_INF;

export const x32RawToDb = (raw: number): X32FaderDb => {
  const clamped = clamp(raw, 0, 1);

  if (clamped <= 0) return NEG_INF;

  if (clamped <= 0.25) {
    // -90 dB → -30 dB
    return -90 + (clamped / 0.25) * 60;
  }

  if (clamped <= 0.5) {
    // -30 dB → -10 dB
    return -30 + ((clamped - 0.25) / 0.25) * 20;
  }

  if (clamped <= 0.75) {
    // -10 dB → 0 dB
    return -10 + ((clamped - 0.5) / 0.25) * 10;
  }

  // 0 dB → +10 dB
  return ((clamped - 0.75) / 0.25) * 10;
};

export const x32DbToRaw = (db: X32FaderDb): number => {
  if (db === NEG_INF || !Number.isFinite(db)) {
    return 0;
  }

  const clamped = clamp(db, MIN_DB, MAX_DB);

  if (clamped <= -90) return 0;

  if (clamped <= -30) {
    // -90 → -30 maps to 0 → 0.25
    return ((clamped + 90) / 60) * 0.25;
  }

  if (clamped <= -10) {
    // -30 → -10 maps to 0.25 → 0.5
    return 0.25 + ((clamped + 30) / 20) * 0.25;
  }

  if (clamped <= 0) {
    // -10 → 0 maps to 0.5 → 0.75
    return 0.5 + ((clamped + 10) / 10) * 0.25;
  }

  // 0 → +10 maps to 0.75 → 1.0
  return 0.75 + (clamped / 10) * 0.25;
};

export const normalizeDbToTrack = (db: X32FaderDb): number => x32DbToRaw(db);

export const denormalizeTrackToDb = (position: number): X32FaderDb => x32RawToDb(position);

export const dbToLevel = (db: X32FaderDb): number => x32DbToRaw(db);

export const formatDbLabel = (db: X32FaderDb): string => {
  if (db === NEG_INF || !Number.isFinite(db)) {
    return '-\u221e';
  }

  const rounded = Math.round(db * 10) / 10;
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
};

export const getDbScaleMarks = (): { db: X32FaderDb; position: number; label: string }[] => [
  { db: 10, position: normalizeDbToTrack(10), label: '+10' },
  { db: 5, position: normalizeDbToTrack(5), label: '+5' },
  { db: 0, position: normalizeDbToTrack(0), label: '0' },
  { db: -5, position: normalizeDbToTrack(-5), label: '-5' },
  { db: -10, position: normalizeDbToTrack(-10), label: '-10' },
  { db: -20, position: normalizeDbToTrack(-20), label: '-20' },
  { db: -30, position: normalizeDbToTrack(-30), label: '-30' },
  { db: -40, position: normalizeDbToTrack(-40), label: '-40' },
  { db: -50, position: normalizeDbToTrack(-50), label: '-50' },
  { db: -60, position: normalizeDbToTrack(-60), label: '-60' },
  { db: NEG_INF, position: 0, label: '-\u221e' },
];
