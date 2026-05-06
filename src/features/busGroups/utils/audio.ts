import { clamp } from '@shared/utils/clamp';

export function faderToDb(faderValue: number): number {
  const clamped = clamp(faderValue);
  if (clamped === 0) {
    return -90;
  }

  if (clamped < 0.5) {
    return -90 + clamped * 2 * 60;
  }

  if (clamped < 0.75) {
    return -30 + (clamped - 0.5) * 4 * 30;
  }

  return (clamped - 0.75) * 4 * 10;
}

export function dbToFader(db: number): number {
  const clamped = clamp(db, -90, 10);
  if (clamped <= -90) {
    return 0;
  }

  if (clamped <= -30) {
    return (clamped + 90) / 120;
  }

  if (clamped <= 0) {
    return 0.5 + (clamped + 30) / 120;
  }

  return 0.75 + clamped / 40;
}

export function positionToFader(positionY: number, trackHeight: number): number {
  return 1 - clamp(positionY / Math.max(trackHeight, 1));
}

export function faderToPosition(faderValue: number, trackHeight: number): number {
  return (1 - clamp(faderValue)) * trackHeight;
}

export function formatDb(db: number): string {
  if (db <= -90) {
    return '-∞';
  }

  if (db > 0) {
    return `+${db.toFixed(1)}dB`;
  }

  return `${db.toFixed(1)}dB`;
}

export function clampFader(value: number): number {
  return clamp(value);
}
