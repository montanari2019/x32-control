import type { OscMessage } from '@shared/osc/OscMessage';
import type { X32ChannelColor } from '@shared/x32/channelColor';
import { clamp } from '@shared/utils/clamp';
import { X32_BUS_COLORS } from './X32AdapterConstants';

export const two = (value: number): string => value.toString().padStart(2, '0');

export const asString = (message: OscMessage, fallback: string): string => {
  const value = message.args[0];
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
};

export const asNumber = (message: OscMessage, fallback: number): number => {
  const value = message.args[0];
  return typeof value === 'number' ? value : fallback;
};

export const getBlobArg = (message: OscMessage): Uint8Array | null => {
  const [first] = message.args;
  return first instanceof Uint8Array ? first : null;
};

export const parseBusColor = (message: OscMessage): X32ChannelColor | number | undefined => {
  const value = message.args[0];
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    if (X32_BUS_COLORS.has(normalized as X32ChannelColor)) {
      return normalized as X32ChannelColor;
    }
  }

  return undefined;
};

export const sanitizeNodeValue = (value: string): string => value.replace(/^"|"$/g, '').trim();

export const splitNodeValueString = (value: string): string[] => {
  const values: string[] = [];
  let current = '';
  let isQuoted = false;

  for (const char of value.trim()) {
    if (char === '"') {
      isQuoted = !isQuoted;
      continue;
    }

    if (/\s/.test(char) && !isQuoted) {
      if (current.length > 0) {
        values.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    values.push(current);
  }

  return values;
};

export const oscArgToNodeValue = (value: OscMessage['args'][number]): string | undefined => {
  if (typeof value === 'string') {
    return sanitizeNodeValue(value);
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  return undefined;
};

export const normalizeNodePath = (value: string): string => value.replace(/^\//, '');

export const parseNodeResponseValues = (message: OscMessage, nodePath: string): string[] => {
  if (message.args.length === 0) {
    return [];
  }

  const firstValue = oscArgToNodeValue(message.args[0]);
  const hasNodeEcho =
    firstValue !== undefined &&
    normalizeNodePath(firstValue) === normalizeNodePath(nodePath) &&
    message.args.length > 1;
  const valueArgs = hasNodeEcho ? message.args.slice(1) : message.args;

  if (valueArgs.length === 1 && typeof valueArgs[0] === 'string') {
    return splitNodeValueString(valueArgs[0]);
  }

  return valueArgs.map(oscArgToNodeValue).filter((value): value is string => value !== undefined);
};

export const parseNodeFloat01 = (value: string | undefined, fallback = 0): number => {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? clamp(parsed, 0, 1) : fallback;
};

export const parseNodeInt = (value: string | undefined, fallback = 0): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

