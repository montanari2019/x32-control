import type { McaColorToken } from '@features/busGroups/types/busGroups.types';
import type { X32ChannelColor } from '@shared/x32/channelColor';

export const REQUEST_TIMEOUT_MS = 600;
export const REQUEST_RETRIES = 1;
export const EXPECTED_CHANNEL_COUNT = 48;
export const DCA_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const BUS_MASTER_METER_RENEW_INTERVAL_MS = 8000;
export const METER_RENEW_INTERVAL_MS = 8000;
export const METER_REQUEST_THROTTLE_MS = 1000;

export const DEFAULT_BUS_NAMES = ['Guitarra', 'Baixo', 'Bateria', 'Vocal', 'Click', 'Playback'];

export const X32_BUS_COLORS = new Set<X32ChannelColor>([
  'OFF',
  'RD',
  'GN',
  'YE',
  'BL',
  'MG',
  'CY',
  'WH',
]);

export const MCA_COLOR_TOKENS: Record<(typeof DCA_NUMBERS)[number], McaColorToken> = {
  1: 'red',
  2: 'green',
  3: 'yellow',
  4: 'pink',
  5: 'purple',
  6: 'cyan',
  7: 'blue',
  8: 'amber',
};

