import { clamp } from '@shared/utils/clamp';
import { formatDbLabel, X32FaderDb, x32DbToRaw, x32RawToDb } from '@shared/utils/faderDb';

export function faderToDb(faderValue: number): X32FaderDb {
  return x32RawToDb(faderValue);
}

export function dbToFader(db: X32FaderDb): number {
  return x32DbToRaw(db);
}

export function positionToFader(positionY: number, trackHeight: number): number {
  return 1 - clamp(positionY / Math.max(trackHeight, 1));
}

export function faderToPosition(faderValue: number, trackHeight: number): number {
  return (1 - clamp(faderValue)) * trackHeight;
}

export function formatDb(db: X32FaderDb): string {
  return `${formatDbLabel(db)}dB`;
}

export function clampFader(value: number): number {
  return clamp(value);
}
