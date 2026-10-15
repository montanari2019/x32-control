import {
  ChannelMeterValues,
  decodeMeter1BlobForChannel,
  decodeMeter13BlobForChannel,
} from './meterDecoder';

export type MeterStreamId = 'meters1' | 'meters13';
export type MeterListener = (values: ChannelMeterValues) => void;

export const isInputChannelMeterId = (channelId: number): boolean =>
  channelId >= 1 && channelId <= 32;

export const isAuxFxMeterId = (channelId: number): boolean =>
  channelId >= 33 && channelId <= 48;

export const getMeterStreamForChannelId = (channelId: number): MeterStreamId | undefined => {
  if (isInputChannelMeterId(channelId)) {
    return 'meters1';
  }

  if (isAuxFxMeterId(channelId)) {
    return 'meters13';
  }

  return undefined;
};

export const decodeMeterStreamBlobForChannel = (
  streamId: MeterStreamId,
  blob: Uint8Array,
  channelId: number,
): ChannelMeterValues | undefined => {
  if (streamId === 'meters1') {
    return isInputChannelMeterId(channelId)
      ? decodeMeter1BlobForChannel(blob, channelId)
      : undefined;
  }

  return isAuxFxMeterId(channelId) ? decodeMeter13BlobForChannel(blob, channelId) : undefined;
};

export const dispatchMeterStreamBlob = (
  streamId: MeterStreamId,
  blob: Uint8Array,
  listenersByChannelId: Map<number, Set<MeterListener>>,
): void => {
  listenersByChannelId.forEach((listeners, channelId) => {
    if (listeners.size === 0) {
      return;
    }

    const values = decodeMeterStreamBlobForChannel(streamId, blob, channelId);
    if (!values) {
      return;
    }

    listeners.forEach((listener) => listener(values));
  });
};
