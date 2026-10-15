import { OscClient } from '@shared/osc/OscClient';
import { OscArg, OscMessage } from '@shared/osc/OscMessage';
import { X32Protocol } from '@shared/osc/X32Protocol';

export type BusLinkPair = {
  pairKey: string;
  leftBusId: number;
  rightBusId: number;
};

export type BusStereoLinkMap = Record<string, boolean>;

let cachedStereoLinkMap: BusStereoLinkMap | undefined;

export const getBusLinkPairs = (): BusLinkPair[] =>
  Array.from({ length: 8 }, (_, index) => {
    const leftBusId = index * 2 + 1;
    const rightBusId = leftBusId + 1;
    return {
      pairKey: `${leftBusId}-${rightBusId}`,
      leftBusId,
      rightBusId,
    };
  });

export const parseBusLinkValue = (value: OscArg): boolean | undefined => {
  if (typeof value === 'number') {
    return value > 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'on') return true;
    if (normalized === 'off') return false;
    if (normalized === '1') return true;
    if (normalized === '0') return false;
  }

  return undefined;
};

export const fetchBusStereoLinkMap = async (
  client: OscClient,
  timeoutMs = 800,
): Promise<BusStereoLinkMap | undefined> => {
  const pairs = getBusLinkPairs();

  const responses = await Promise.all(
    pairs.map(async (pair) => {
      try {
        const message = await client.request<OscMessage>(
          X32Protocol.getBusStereoLinkPath(pair.leftBusId, pair.rightBusId),
          [],
          timeoutMs,
        );

        return {
          pair,
          parsed: parseBusLinkValue(message.args[0] ?? null),
        };
      } catch {
        return {
          pair,
          parsed: undefined,
        };
      }
    }),
  );

  const map: BusStereoLinkMap = {};
  for (const { pair, parsed } of responses) {
    if (typeof parsed === 'boolean') {
      map[pair.pairKey] = parsed;
    }
  }

  return Object.keys(map).length > 0 ? map : undefined;
};

export const getCachedBusStereoLinkMap = (): BusStereoLinkMap | undefined => cachedStereoLinkMap;

export const setCachedBusStereoLinkMap = (map: BusStereoLinkMap): void => {
  cachedStereoLinkMap = map;
};

const stripStereoSuffix = (name: string): string | undefined => {
  const trimmed = name.trim();
  if (!trimmed) return undefined;

  const patterns: RegExp[] = [/\s*\(?(l|r)\)?$/i, /\s*(left|right)$/i, /\s*[-_](l|r)$/i];

  for (const pattern of patterns) {
    if (pattern.test(trimmed)) {
      const base = trimmed.replace(pattern, '').trim();
      return base.length > 0 ? base : undefined;
    }
  }

  return undefined;
};

export const normalizeStereoBusName = (
  leftName: string,
  rightName: string,
): {
  name: string;
  normalized: boolean;
} => {
  const left = leftName.trim();
  const right = rightName.trim();

  if (left && left === right) {
    return { name: left, normalized: true };
  }

  const baseLeft = stripStereoSuffix(left);
  const baseRight = stripStereoSuffix(right);

  if (baseLeft && baseRight && baseLeft === baseRight) {
    return { name: baseLeft, normalized: true };
  }

  if (baseLeft && (!baseRight || baseLeft === right)) {
    return { name: `${baseLeft} L/R`, normalized: false };
  }

  if (left) {
    return { name: `${left} L/R`, normalized: false };
  }

  return { name: 'Monitor L/R', normalized: false };
};
