import { BusMixChannelStore } from '@features/busMix/services/BusMixChannelStore';
import { Channel } from '@features/busMix/types/Channel';

const createChannel = (overrides: Partial<Channel> = {}): Channel => ({
  id: 'ch-1',
  kind: 'channel',
  number: 1,
  sourceNumber: 1,
  label: 'CH 01',
  name: 'Vocal',
  color: 0,
  backgroundOpacity: 0.2,
  meterChannelId: 1,
  faderRaw: 0.75,
  faderDb: 0,
  localFaderRaw: 0.75,
  remoteFaderRaw: 0.75,
  isDirty: false,
  lastLocalChangeAt: 0,
  meterDbfs: -60,
  visualMeterDbfs: -60,
  level: 0.75,
  signalLevel: 0,
  pan: 0.5,
  on: true,
  ...overrides,
});

describe('BusMixChannelStore', () => {
  it('reuses one in-flight channel load for the same console and bus', async () => {
    const store = new BusMixChannelStore();
    const channels = [createChannel()];
    const loader = jest.fn(
      () =>
        new Promise<Channel[]>((resolve) => {
          setTimeout(() => resolve(channels), 10);
        }),
    );

    const [firstLoad, secondLoad] = await Promise.all([
      store.loadChannels('192.168.0.10', 1, loader),
      store.loadChannels('192.168.0.10', 1, loader),
    ]);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(firstLoad).toEqual(channels);
    expect(secondLoad).toEqual(channels);
  });

  it('serves cached channels without calling the loader again', async () => {
    const store = new BusMixChannelStore();
    const loader = jest.fn(async () => [createChannel()]);

    await store.loadChannels('192.168.0.10', 1, loader);
    await store.loadChannels('192.168.0.10', 1, loader);

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('notifies subscribers when shared channels change', async () => {
    const store = new BusMixChannelStore();
    const listener = jest.fn();

    store.subscribe('192.168.0.10', 1, listener);
    store.setChannels('192.168.0.10', 1, [createChannel({ name: 'Lead' })]);
    store.updateChannels('192.168.0.10', 1, (current) =>
      current.map((channel) => ({ ...channel, on: false })),
    );

    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: 'Lead', on: false }),
    ]);
  });
});
