import { BusGroupsService } from '@features/busGroups/services/BusGroupsService';
import type { BusGroupsState } from '@features/busGroups/types/busGroups.types';
import type { ConsoleAdapterFactory } from '@shared/console/ConsoleAdapterFactory';
import type { IConsoleAdapter } from '@shared/console/IConsoleAdapter';

const createState = (): BusGroupsState => ({
  busId: 4,
  masterFaderRaw: 0.7,
  masterMuted: false,
  mcas: [],
  isConnected: true,
  isLoading: false,
  error: null,
});

const createAdapter = (): jest.Mocked<IConsoleAdapter> =>
  ({
    kind: 'x32',
    endpoint: { ip: '192.168.10.50', kind: 'x32' },
    connect: jest.fn(async () => undefined),
    disconnect: jest.fn(),
    startHeartbeat: jest.fn(),
    stopHeartbeat: jest.fn(),
    getBuses: jest.fn(),
    getBusGroupsState: jest.fn(async () => createState()),
    getChannels: jest.fn(),
    loadChannelsWithCache: jest.fn(),
    fetchChannelLinkMap: jest.fn(),
    loadChannelFaders: jest.fn(),
    setChannelFader: jest.fn(),
    setChannelOn: jest.fn(),
    setChannelPan: jest.fn(),
    setDcaFader: jest.fn(async () => undefined),
    setDcaOn: jest.fn(async () => undefined),
    setBusMasterFader: jest.fn(async () => undefined),
    setBusMasterOn: jest.fn(async () => undefined),
    subscribeChannelLevel: jest.fn(),
    subscribeChannelOn: jest.fn(),
    subscribeChannelPan: jest.fn(),
    subscribeMeter: jest.fn(),
    subscribeBusMasterMeter: jest.fn(() => jest.fn()),
    subscribeDcaFader: jest.fn(() => jest.fn()),
    subscribeDcaOn: jest.fn(() => jest.fn()),
    subscribeBusMasterFader: jest.fn(() => jest.fn()),
    subscribeBusMasterOn: jest.fn(() => jest.fn()),
  }) as unknown as jest.Mocked<IConsoleAdapter>;

describe('BusGroupsService', () => {
  it('creates an adapter for the console endpoint and reuses it for the same IP', async () => {
    const adapter = createAdapter();
    const adapterFactory = {
      createAdapter: jest.fn(() => adapter),
    } as unknown as jest.Mocked<ConsoleAdapterFactory>;
    const service = new BusGroupsService(undefined, adapterFactory);

    await service.connect('192.168.10.50');
    await service.connect('192.168.10.50');

    expect(adapterFactory.createAdapter).toHaveBeenCalledTimes(1);
    expect(adapterFactory.createAdapter).toHaveBeenCalledWith({ ip: '192.168.10.50' });
    expect(adapter.connect).toHaveBeenCalledTimes(1);

    service.disconnect();

    expect(adapter.disconnect).toHaveBeenCalledTimes(1);
  });

  it('delegates BusGroups reads, writes, lifecycle, and subscriptions to the adapter', async () => {
    const adapter = createAdapter();
    const adapterFactory = {
      createAdapter: jest.fn(() => adapter),
    } as unknown as jest.Mocked<ConsoleAdapterFactory>;
    const service = new BusGroupsService(undefined, adapterFactory);
    const listener = jest.fn();

    await service.connect('192.168.10.50');

    service.startHeartbeat();
    service.stopHeartbeat();
    await service.fetchInitialState(4);
    await service.setDcaFader(1, 0.5);
    await service.setDcaOn(1, true);
    await service.setBusMasterFader(4, 0.75);
    await service.setBusMasterOn(4, false);
    service.subscribeToDcaFader(1, listener);
    service.subscribeToDcaOn(1, listener);
    service.subscribeToBusMasterFader(4, listener);
    service.subscribeToBusMasterOn(4, listener);
    service.subscribeToBusMasterMeter(4, listener);

    expect(adapter.startHeartbeat).toHaveBeenCalledTimes(1);
    expect(adapter.stopHeartbeat).toHaveBeenCalledTimes(1);
    expect(adapter.getBusGroupsState).toHaveBeenCalledWith(4);
    expect(adapter.setDcaFader).toHaveBeenCalledWith(1, 0.5);
    expect(adapter.setDcaOn).toHaveBeenCalledWith(1, true);
    expect(adapter.setBusMasterFader).toHaveBeenCalledWith(4, 0.75);
    expect(adapter.setBusMasterOn).toHaveBeenCalledWith(4, false);
    expect(adapter.subscribeDcaFader).toHaveBeenCalledWith(1, listener);
    expect(adapter.subscribeDcaOn).toHaveBeenCalledWith(1, listener);
    expect(adapter.subscribeBusMasterFader).toHaveBeenCalledWith(4, listener);
    expect(adapter.subscribeBusMasterOn).toHaveBeenCalledWith(4, listener);
    expect(adapter.subscribeBusMasterMeter).toHaveBeenCalledWith(4, listener);
  });

  it('keeps injected client support isolated to the adapter factory compatibility path', () => {
    const adapter = createAdapter();
    const adapterFactory = {
      createAdapter: jest.fn(() => adapter),
    } as unknown as jest.Mocked<ConsoleAdapterFactory>;
    const client = {} as never;
    const service = new BusGroupsService(client, adapterFactory);

    service.subscribeToBusMasterMeter(4, jest.fn());

    expect(adapterFactory.createAdapter).toHaveBeenCalledWith(
      { ip: '0.0.0.0', kind: 'x32' },
      { client, useSharedLease: false },
    );
    expect(adapter.subscribeBusMasterMeter).toHaveBeenCalledWith(4, expect.any(Function));
  });

  it('throws when used before connection without an injected client', () => {
    const service = new BusGroupsService();

    expect(() => service.startHeartbeat()).toThrow('Console adapter is not connected.');
  });
});
