import { clamp } from './clamp';

const MIN_DB = -90;
const MAX_DB = 10;

const SCALE_POINTS = [
  { db: MIN_DB, pos: 0 },
  { db: -60, pos: 0.06 },
  { db: -40, pos: 0.14 },
  { db: -30, pos: 0.24 },
  { db: -20, pos: 0.36 },
  { db: -10, pos: 0.5 },
  { db: -5, pos: 0.58 },
  { db: 0, pos: 0.68 },
  { db: 5, pos: 0.84 },
  { db: MAX_DB, pos: 1 },
];

const interpolate = (a: number, b: number, t: number): number => a + (b - a) * t;

export const normalizeDbToTrack = (db: number): number => {
  if (!Number.isFinite(db)) {
    return 0;
  }

  const clamped = clamp(db, MIN_DB, MAX_DB);
  for (let i = 0; i < SCALE_POINTS.length - 1; i += 1) {
    const current = SCALE_POINTS[i];
    const next = SCALE_POINTS[i + 1];
    if (clamped >= current.db && clamped <= next.db) {
      const t = (clamped - current.db) / (next.db - current.db);
      return interpolate(current.pos, next.pos, t);
    }
  }

  return 1;
};

export const denormalizeTrackToDb = (position: number): number => {
  const clamped = clamp(position, 0, 1);
  for (let i = 0; i < SCALE_POINTS.length - 1; i += 1) {
    const current = SCALE_POINTS[i];
    const next = SCALE_POINTS[i + 1];
    if (clamped >= current.pos && clamped <= next.pos) {
      const t = (clamped - current.pos) / (next.pos - current.pos);
      return interpolate(current.db, next.db, t);
    }
  }

  return MAX_DB;
};

export const dbToLevel = (db: number): number => {
  if (!Number.isFinite(db)) {
    return 0;
  }

  const clamped = clamp(db, MIN_DB, MAX_DB);
  if (clamped <= MIN_DB) {
    return 0;
  }

  return clamp(Math.pow(10, (clamped - MAX_DB) / 20), 0, 1);
};

export const formatDbLabel = (db: number): string => {
  if (!Number.isFinite(db)) {
    return '-∞';
  }

  return db > 0 ? `+${db}` : `${db}`;
};

export const getDbScaleMarks = (): { db: number; position: number; label: string }[] => [
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
];
