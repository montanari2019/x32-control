import type { ChannelKind } from '@features/busMix/types/Channel';
import { X32Protocol } from '@shared/osc/X32Protocol';

export type X32SourceDefinition = {
  kind: ChannelKind;
  count: number;
  labelPrefix: string;
  idPrefix: string;
  absoluteOffset: number;
  backgroundOpacity: number;
  nodePrefix: string;
  mixBusOffsetBase: number;
  getNamePath: (sourceNumber: number) => string;
  getColorPath: (sourceNumber: number) => string;
  getLevelPath: (sourceNumber: number, bus: number) => string;
  getOnPath: (sourceNumber: number, bus: number) => string;
  getPanPath: (sourceNumber: number, bus: number) => string;
};

export const X32_SOURCE_DEFINITIONS: X32SourceDefinition[] = [
  {
    kind: 'channel',
    count: 32,
    labelPrefix: 'CH',
    idPrefix: 'ch',
    absoluteOffset: 0,
    backgroundOpacity: 0.2,
    nodePrefix: 'ch',
    mixBusOffsetBase: 4,
    getNamePath: X32Protocol.getChannelNamePath,
    getColorPath: X32Protocol.getChannelColorPath,
    getLevelPath: X32Protocol.getBusSendLevelPath,
    getOnPath: X32Protocol.getBusSendOnPath,
    getPanPath: X32Protocol.getBusSendPanPath,
  },
  {
    kind: 'aux',
    count: 8,
    labelPrefix: 'AUX',
    idPrefix: 'aux',
    absoluteOffset: 32,
    backgroundOpacity: 0.2,
    nodePrefix: 'auxin',
    mixBusOffsetBase: 3,
    getNamePath: X32Protocol.getAuxInNamePath,
    getColorPath: X32Protocol.getAuxInColorPath,
    getLevelPath: X32Protocol.getAuxInBusSendLevelPath,
    getOnPath: X32Protocol.getAuxInBusSendOnPath,
    getPanPath: X32Protocol.getAuxInBusSendPanPath,
  },
  {
    kind: 'fxReturn',
    count: 8,
    labelPrefix: 'FX',
    idPrefix: 'fxrtn',
    absoluteOffset: 40,
    backgroundOpacity: 0.4,
    nodePrefix: 'fxrtn',
    mixBusOffsetBase: 3,
    getNamePath: X32Protocol.getFxReturnNamePath,
    getColorPath: X32Protocol.getFxReturnColorPath,
    getLevelPath: X32Protocol.getFxReturnBusSendLevelPath,
    getOnPath: X32Protocol.getFxReturnBusSendOnPath,
    getPanPath: X32Protocol.getFxReturnBusSendPanPath,
  },
];

export const getX32SourceDefinition = (kind: ChannelKind): X32SourceDefinition => {
  const source = X32_SOURCE_DEFINITIONS.find((item) => item.kind === kind);
  if (!source) {
    throw new Error(`Unsupported bus mix source: ${kind}`);
  }

  return source;
};
