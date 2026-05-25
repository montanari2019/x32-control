import { selectVisibleFaderSubscriptionChannels } from '@features/busMix/hooks/useBusMixRemoteFaderSubscription';
import { Channel } from '@features/busMix/types/Channel';

const createChannel = (overrides: Partial<Channel> = {}): Channel => ({
  id: 'ch-1',
  kind: 'channel',
  number: 1,
  sourceNumber: 1,
  label: 'CH 01',
  name: 'CH 01',
  color: 0,
  backgroundOpacity: 0.2,
  meterChannelId: 1,
  faderRaw: 0.5,
  faderDb: 0,
  localFaderRaw: 0.5,
  remoteFaderRaw: 0.5,
  isDirty: false,
  lastLocalChangeAt: 0,
  meterDbfs: -60,
  visualMeterDbfs: -60,
  level: 0.5,
  signalLevel: 0,
  pan: 0.5,
  on: true,
  ...overrides,
});

describe('selectVisibleFaderSubscriptionChannels', () => {
  it('returns only currently visible BusMix channels for fader subscriptions', () => {
    const channels = [
      createChannel({ id: 'ch-17', number: 17, sourceNumber: 17 }),
      createChannel({ id: 'ch-18', number: 18, sourceNumber: 18 }),
      createChannel({ id: 'aux-1', kind: 'aux', number: 33, sourceNumber: 1 }),
    ];

    expect(
      selectVisibleFaderSubscriptionChannels(channels, new Set(['ch-17', 'aux-1'])).map(
        (channel) => channel.id,
      ),
    ).toEqual(['ch-17', 'aux-1']);
  });

  it('does not subscribe invisible channels', () => {
    const channels = [
      createChannel({ id: 'ch-17', number: 17, sourceNumber: 17 }),
      createChannel({ id: 'ch-18', number: 18, sourceNumber: 18 }),
    ];

    expect(selectVisibleFaderSubscriptionChannels(channels, new Set(['ch-19']))).toEqual([]);
  });
});
