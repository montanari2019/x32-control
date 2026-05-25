import { useEffect, useRef } from 'react';
import { BusMixService } from '../services/BusMixService';
import { Channel } from '../types/Channel';

export type BusMixRemoteFaderSubscriptionHealthUpdate =
  | { type: 'set'; subscribedPathCount: number; at: number }
  | { type: 'subscribe'; at: number }
  | { type: 'renew'; at: number }
  | { type: 'event'; at: number };

type UseBusMixRemoteFaderSubscriptionParams = {
  busNumber: number;
  channels: Channel[];
  visibleChannelIds: ReadonlySet<string>;
  service: BusMixService;
  onRemoteLevel: (channelNumber: number, level: number) => void;
  onHealthChange: (update: BusMixRemoteFaderSubscriptionHealthUpdate) => void;
};

export const selectVisibleFaderSubscriptionChannels = (
  channels: Channel[],
  visibleChannelIds: ReadonlySet<string>,
): Channel[] => channels.filter((channel) => visibleChannelIds.has(channel.id));

const buildVisibleKey = (visibleChannelIds: ReadonlySet<string>): string =>
  Array.from(visibleChannelIds).sort().join(',');

const buildChannelSubscriptionKey = (channels: Channel[]): string =>
  channels
    .map((channel) => `${channel.id}:${channel.number}:${channel.kind}:${channel.sourceNumber}`)
    .join('|');

export const useBusMixRemoteFaderSubscription = ({
  busNumber,
  channels,
  visibleChannelIds,
  service,
  onRemoteLevel,
  onHealthChange,
}: UseBusMixRemoteFaderSubscriptionParams): void => {
  const channelsRef = useRef(channels);
  const visibleChannelIdsRef = useRef(visibleChannelIds);
  channelsRef.current = channels;
  visibleChannelIdsRef.current = visibleChannelIds;

  const visibleKey = buildVisibleKey(visibleChannelIds);
  const channelSubscriptionKey = buildChannelSubscriptionKey(channels);

  useEffect(() => {
    const visibleChannels = selectVisibleFaderSubscriptionChannels(
      channelsRef.current,
      visibleChannelIdsRef.current,
    );
    const now = Date.now();

    onHealthChange({
      type: 'set',
      subscribedPathCount: visibleChannels.length,
      at: now,
    });

    if (visibleChannels.length === 0) {
      return undefined;
    }

    const unsubscribers = visibleChannels.map((channel) =>
      service.subscribeChannelLevelUpdates(
        channel,
        busNumber,
        (level) => {
          onHealthChange({ type: 'event', at: Date.now() });
          onRemoteLevel(channel.number, level);
        },
        {
          onSubscribe: () => onHealthChange({ type: 'subscribe', at: Date.now() }),
          onRenew: () => onHealthChange({ type: 'renew', at: Date.now() }),
        },
      ),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [
    busNumber,
    channelSubscriptionKey,
    onHealthChange,
    onRemoteLevel,
    service,
    visibleKey,
  ]);
};
