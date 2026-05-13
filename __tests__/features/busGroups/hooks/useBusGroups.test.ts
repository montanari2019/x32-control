import { act, renderHook, waitFor } from '@testing-library/react-native';
import { MCA_DEFAULT_RAW_VALUE } from '@features/busGroups/services/McaChannelFaderService';
import { BusGroupsState } from '@features/busGroups/types/busGroups.types';
import { useBusGroups } from '@features/busGroups/hooks/useBusGroups';
import { busMixChannelStore } from '@features/busMix/services/BusMixChannelStore';
import { Channel } from '@features/busMix/types/Channel';

const TEST_CONSOLE_IP = '192.168.10.50';
const TEST_BUS_ID = 3;

const connectBusGroupsMock = jest.fn(async () => undefined);
const startHeartbeatMock = jest.fn(() => undefined);
const fetchInitialStateMock = jest.fn<Promise<BusGroupsState>, [number]>();
const disconnectBusGroupsMock = jest.fn(() => undefined);
const setBusMasterFaderMock = jest.fn(async () => undefined);
const setBusMasterOnMock = jest.fn(async () => undefined);

const connectBusMixMock = jest.fn(async () => undefined);
const loadChannelsMock = jest.fn<Promise<Channel[]>, [number]>();
const disconnectBusMixMock = jest.fn(() => undefined);
const setChannelFaderInBusMock = jest.fn(async () => undefined);
const setChannelOnInBusMock = jest.fn(async () => undefined);

const getDcaStateMock = jest.fn(async () => null);
const saveDcaStateMock = jest.fn(async () => undefined);
const clearDcaStateMock = jest.fn(async () => undefined);

jest.mock('@features/busGroups/services/X32BusGroupsService', () => ({
  X32BusGroupsService: jest.fn().mockImplementation(() => ({
    connect: connectBusGroupsMock,
    startHeartbeat: startHeartbeatMock,
    fetchInitialState: fetchInitialStateMock,
    disconnect: disconnectBusGroupsMock,
    setBusMasterFader: setBusMasterFaderMock,
    setBusMasterOn: setBusMasterOnMock,
  })),
}));

jest.mock('@features/busMix/services/BusMixService', () => ({
  BusMixService: jest.fn().mockImplementation(() => ({
    connect: connectBusMixMock,
    loadChannels: loadChannelsMock,
    disconnect: disconnectBusMixMock,
    setChannelFaderInBus: setChannelFaderInBusMock,
    setChannelOnInBus: setChannelOnInBusMock,
  })),
}));

jest.mock('@features/busGroups/services/BusGroupsSecureStoreService', () => ({
  BusGroupsSecureStoreService: jest.fn().mockImplementation(() => ({
    getDcaState: getDcaStateMock,
    saveDcaState: saveDcaStateMock,
    clearDcaState: clearDcaStateMock,
  })),
}));

jest.mock('@features/busGroups/hooks/useOscSubscription', () => ({
  useOscSubscription: jest.fn(() => undefined),
}));

jest.mock('@shared/mixer/mock/mockMixerProvider', () => ({
  getMockProviderForIp: jest.fn(() => null),
  isDemoConsoleIp: jest.fn(() => false),
  isMockConsoleIp: jest.fn(() => false),
}));

const createChannel = (overrides: Partial<Channel> = {}): Channel => ({
  id: 'ch-1',
  kind: 'channel',
  number: 1,
  sourceNumber: 1,
  label: 'CH 01',
  name: 'Lead Vox',
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

const createInitialState = (): BusGroupsState => ({
  busId: TEST_BUS_ID,
  masterFaderRaw: 0.7,
  masterMuted: false,
  mcas: [
    {
      id: 'mca-1',
      dcaNumber: 1,
      name: 'MCA 1',
      colorToken: 'blue',
      faderRawValue: 0.75,
      isMuted: false,
      assignedChannels: [
        {
          channelId: 1,
          channelName: 'Kick',
          channelLabel: 'CH 01',
          channelType: 'channel',
        },
      ],
      assignedChannelIds: [1],
    },
    {
      id: 'mca-2',
      dcaNumber: 2,
      name: 'MCA 2',
      colorToken: 'green',
      faderRawValue: 0.75,
      isMuted: false,
      assignedChannels: [],
      assignedChannelIds: [],
    },
  ],
  isConnected: true,
  isLoading: false,
  error: null,
});

describe('useBusGroups', () => {
  const initialChannels = [
    createChannel({
      id: 'ch-1',
      number: 1,
      sourceNumber: 1,
      name: 'Kick',
      faderRaw: 0.5,
      faderDb: -10,
      localFaderRaw: 0.5,
      remoteFaderRaw: 0.5,
      level: 0.5,
    }),
    createChannel({
      id: 'ch-2',
      number: 2,
      sourceNumber: 2,
      name: 'Snare',
      faderRaw: 0.25,
      faderDb: -30,
      localFaderRaw: 0.25,
      remoteFaderRaw: 0.25,
      level: 0.25,
    }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    busMixChannelStore.clearConsole(TEST_CONSOLE_IP);
    fetchInitialStateMock.mockResolvedValue(createInitialState());
    loadChannelsMock.mockResolvedValue(initialChannels.map((channel) => ({ ...channel })));
    getDcaStateMock.mockResolvedValue(null);
    saveDcaStateMock.mockResolvedValue(undefined);
  });

  it('starts app MCAs empty when there is no stored device state', async () => {
    const { result, unmount } = renderHook(() => useBusGroups(TEST_CONSOLE_IP, TEST_BUS_ID));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.mcas[0]?.assignedChannels).toEqual([]);
    expect(result.current.mcas[0]?.assignedChannelIds).toEqual([]);
    expect(result.current.mcas[0]?.faderRawValue).toBe(MCA_DEFAULT_RAW_VALUE);
    expect(result.current.mcas[0]?.isMuted).toBe(false);

    unmount();
  });

  it('recalculates the MCA fader immediately when new channels are assigned', async () => {
    const { result, unmount } = renderHook(() => useBusGroups(TEST_CONSOLE_IP, TEST_BUS_ID));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.toggleMcaChannelAssignment(1, initialChannels[0]!);
    });

    expect(result.current.mcas[0]?.faderRawValue).toBeCloseTo(0.5, 5);

    act(() => {
      result.current.toggleMcaChannelAssignment(1, initialChannels[1]!);
    });

    expect(result.current.mcas[0]?.assignedChannelIds).toEqual([1, 2]);
    expect(result.current.mcas[0]?.faderRawValue).toBeCloseTo(0.375, 5);

    unmount();
  });

  it('lets the updated MCA composition resync from the store even right after a local fader move', async () => {
    const { result, unmount } = renderHook(() => useBusGroups(TEST_CONSOLE_IP, TEST_BUS_ID));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.toggleMcaChannelAssignment(1, initialChannels[0]!);
    });

    act(() => {
      result.current.setMcaFader(1, 0.82);
    });

    act(() => {
      result.current.toggleMcaChannelAssignment(1, initialChannels[1]!);
    });

    act(() => {
      busMixChannelStore.setChannels(TEST_CONSOLE_IP, TEST_BUS_ID, [
        createChannel({
          id: 'ch-1',
          number: 1,
          sourceNumber: 1,
          name: 'Kick',
          faderRaw: 0.6,
          faderDb: -6,
          localFaderRaw: 0.6,
          remoteFaderRaw: 0.6,
          level: 0.6,
        }),
        createChannel({
          id: 'ch-2',
          number: 2,
          sourceNumber: 2,
          name: 'Snare',
          faderRaw: 0.2,
          faderDb: -42,
          localFaderRaw: 0.2,
          remoteFaderRaw: 0.2,
          level: 0.2,
        }),
      ]);
    });

    expect(result.current.mcas[0]?.assignedChannelIds).toEqual([1, 2]);
    expect(result.current.mcas[0]?.faderRawValue).toBeCloseTo(0.4, 5);

    unmount();
  });

  it('returns the MCA fader to the default value when all assigned channels are cleared', async () => {
    const { result, unmount } = renderHook(() => useBusGroups(TEST_CONSOLE_IP, TEST_BUS_ID));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.toggleMcaChannelAssignment(1, initialChannels[0]!);
    });

    act(() => {
      result.current.clearMcaChannels(1);
    });

    expect(result.current.mcas[0]?.assignedChannelIds).toEqual([]);
    expect(result.current.mcas[0]?.assignedChannels).toEqual([]);
    expect(result.current.mcas[0]?.faderRawValue).toBe(MCA_DEFAULT_RAW_VALUE);

    unmount();
  });

  it('connects the bus mix service even when the shared channel store already has cached channels', async () => {
    busMixChannelStore.setChannels(
      TEST_CONSOLE_IP,
      TEST_BUS_ID,
      initialChannels.map((channel) => ({ ...channel })),
    );

    const { result, unmount } = renderHook(() => useBusGroups(TEST_CONSOLE_IP, TEST_BUS_ID));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(connectBusMixMock).toHaveBeenCalledWith(TEST_CONSOLE_IP);
    expect(loadChannelsMock).not.toHaveBeenCalled();

    unmount();
  });

  it('derives the MCA mute state from the current states of its assigned channels', async () => {
    const { result, unmount } = renderHook(() => useBusGroups(TEST_CONSOLE_IP, TEST_BUS_ID));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.toggleMcaChannelAssignment(1, initialChannels[0]!);
    });

    act(() => {
      result.current.toggleMcaChannelAssignment(1, initialChannels[1]!);
    });

    act(() => {
      busMixChannelStore.setChannels(TEST_CONSOLE_IP, TEST_BUS_ID, [
        createChannel({
          id: 'ch-1',
          number: 1,
          sourceNumber: 1,
          name: 'Kick',
          on: false,
        }),
        createChannel({
          id: 'ch-2',
          number: 2,
          sourceNumber: 2,
          name: 'Snare',
          on: false,
        }),
      ]);
    });

    expect(result.current.mcas[0]?.isMuted).toBe(true);

    act(() => {
      busMixChannelStore.setChannels(TEST_CONSOLE_IP, TEST_BUS_ID, [
        createChannel({
          id: 'ch-1',
          number: 1,
          sourceNumber: 1,
          name: 'Kick',
          on: true,
        }),
        createChannel({
          id: 'ch-2',
          number: 2,
          sourceNumber: 2,
          name: 'Snare',
          on: false,
        }),
      ]);
    });

    expect(result.current.mcas[0]?.isMuted).toBe(false);

    unmount();
  });
});
