import {
  BusGroupsState,
  McaAssignedChannel,
  McaGroup,
} from '@features/busGroups/types/busGroups.types';
import { Channel, ChannelKind } from '@features/busMix/types/Channel';
import { ChannelMeterValues } from '@features/busMix/utils/meterDecoder';
import { Bus } from '@features/busSelection/types/Bus';
import { ConsoleDevice } from '@features/consoleDiscovery/types/ConsoleDevice';
import { MixerControlProvider } from '@shared/mixer/MixerControlProvider';
import { clamp } from '@shared/utils/clamp';
import { x32RawToDb } from '@shared/utils/faderDb';

export const DEV_MOCK_CONSOLE_IP = '10.254.254.10';
export const DEMO_CONSOLE_IP = '0.0.0.0';
export const DEMO_CONSOLE_ID = 'demo-console';
const DEV_MOCK_CONSOLE_ID = 'dev-mock-console';

const BUS_NAMES = [
  'Voz Principal',
  'Backing',
  'Guitarra',
  'Baixo',
  'Bateria',
  'Keys',
  'Click',
  'Playback',
  'Talkback',
  'FX 1',
  'FX 2',
  'Percussao',
  'Horns',
  'Strings',
  'MD',
  'Ambiencia',
];

const MCA_DEFINITIONS = [
  { dcaNumber: 1, colorToken: 'red' as const, name: 'Bateria', channels: [1, 2, 3, 4, 5, 6] },
  { dcaNumber: 2, colorToken: 'green' as const, name: 'Baixo', channels: [7, 8] },
  { dcaNumber: 3, colorToken: 'yellow' as const, name: 'Guitarras', channels: [9, 10, 11, 12] },
  { dcaNumber: 4, colorToken: 'pink' as const, name: 'Vocais', channels: [13, 14, 15, 16, 17] },
  { dcaNumber: 5, colorToken: 'purple' as const, name: 'Playback', channels: [18, 19, 20, 21] },
  { dcaNumber: 6, colorToken: 'cyan' as const, name: 'Keys', channels: [22, 23, 24] },
  { dcaNumber: 7, colorToken: 'blue' as const, name: 'Percussao', channels: [25, 26] },
  { dcaNumber: 8, colorToken: 'amber' as const, name: 'Ambiencia', channels: [27, 28, 30, 31] },
];

const CHANNEL_NAMES = [
  'Kick',
  'Snare',
  'Hi-Hat',
  'Tom 1',
  'Tom 2',
  'Overheads',
  'Bass DI',
  'Bass Mic',
  'Gtr L',
  'Gtr R',
  'Aco 1',
  'Aco 2',
  'Lead Vox',
  'Bgv 1',
  'Bgv 2',
  'Bgv 3',
  'Bgv 4',
  'Tracks L',
  'Tracks R',
  'Click',
  'Guide',
  'Keys L',
  'Keys R',
  'Pad',
  'Perc 1',
  'Perc 2',
  'FX Return 1',
  'FX Return 2',
  'Talkback',
  'Amb L',
  'Amb R',
  'Spare',
];

const AUX_NAMES = ['Aux 1', 'Aux 2', 'Aux 3', 'Aux 4', 'Aux 5', 'Aux 6', 'USB L', 'USB R'];

const FX_RETURN_NAMES = [
  'FX 1 L',
  'FX 1 R',
  'FX 2 L',
  'FX 2 R',
  'FX 3 L',
  'FX 3 R',
  'FX 4 L',
  'FX 4 R',
];

type Listener<T> = (value: T) => void;

const createBusList = (): Bus[] =>
  BUS_NAMES.map((name, index) => ({
    number: index + 1,
    label: `Bus ${(index + 1).toString().padStart(2, '0')}`,
    name,
  }));

const createChannelForBus = (
  busId: number,
  number: number,
  sourceNumber: number,
  kind: ChannelKind,
  labelPrefix: string,
  idPrefix: string,
  name: string,
  backgroundOpacity: number,
  meterChannelId?: number,
): Channel => {
  const baseLevel = 0.18 + ((number * 7 + busId * 5) % 50) / 100;
  const basePan = number % 2 === 0 ? 0.6 : 0.4;

  return {
    id: `bus-${busId}-${idPrefix}-${sourceNumber}`,
    kind,
    number,
    sourceNumber,
    label: `${labelPrefix} ${sourceNumber.toString().padStart(2, '0')}`,
    name,
    color: (number % 15) + 1,
    backgroundOpacity,
    meterChannelId,
    faderRaw: clamp(baseLevel),
    faderDb: x32RawToDb(baseLevel),
    localFaderRaw: clamp(baseLevel),
    remoteFaderRaw: clamp(baseLevel),
    isDirty: false,
    lastLocalChangeAt: 0,
    meterDbfs: -60,
    visualMeterDbfs: -60,
    level: clamp(baseLevel),
    signalLevel: 0,
    pan: clamp(basePan),
    on: number % 9 !== 0,
  };
};

const createChannelsForBus = (busId: number): Channel[] => [
  ...Array.from({ length: 32 }, (_, index) => {
    const sourceNumber = index + 1;
    return createChannelForBus(
      busId,
      sourceNumber,
      sourceNumber,
      'channel',
      'CH',
      'ch',
      CHANNEL_NAMES[index] ?? `Channel ${sourceNumber}`,
      0.2,
      sourceNumber,
    );
  }),
  ...Array.from({ length: 8 }, (_, index) => {
    const sourceNumber = index + 1;
    return createChannelForBus(
      busId,
      32 + sourceNumber,
      sourceNumber,
      'aux',
      'AUX',
      'aux',
      AUX_NAMES[index] ?? `Aux ${sourceNumber}`,
      0.2,
      32 + sourceNumber,
    );
  }),
  ...Array.from({ length: 8 }, (_, index) => {
    const sourceNumber = index + 1;
    return createChannelForBus(
      busId,
      40 + sourceNumber,
      sourceNumber,
      'fxReturn',
      'FX',
      'fxrtn',
      FX_RETURN_NAMES[index] ?? `FX Return ${sourceNumber}`,
      0.3,
      40 + sourceNumber,
    );
  }),
];

const createDcaGroups = (): McaGroup[] =>
  MCA_DEFINITIONS.map((definition, index) => {
    const assignedChannels: McaAssignedChannel[] = definition.channels.map((channelId) => ({
      channelId,
      channelLabel: `CH ${channelId.toString().padStart(2, '0')}`,
      channelName: CHANNEL_NAMES[channelId - 1] ?? `Channel ${channelId}`,
      channelType: 'channel',
    }));

    return {
      id: `mca-${definition.dcaNumber}`,
      dcaNumber: definition.dcaNumber,
      name: `MCA ${definition.dcaNumber}`,
      colorToken: definition.colorToken,
      faderRawValue: clamp(0.45 + index * 0.08),
      isMuted: false,
      assignedChannels,
      assignedChannelIds: [...definition.channels],
    };
  });

export class MockMixerProvider implements MixerControlProvider {
  private readonly console: ConsoleDevice = {
    id: DEV_MOCK_CONSOLE_ID,
    ip: DEV_MOCK_CONSOLE_IP,
    port: 10023,
    name: 'X32 Dev Mock',
    model: 'X32 Development Console',
    status: 'connected',
    firmware: 'mock-1.0.0',
  };

  private readonly buses = createBusList();
  private readonly busChannels = new Map<number, Channel[]>(
    this.buses.map((bus) => [bus.number, createChannelsForBus(bus.number)]),
  );
  private readonly busMaster = new Map<number, { faderRawValue: number; isMuted: boolean }>(
    this.buses.map((bus, index) => [
      bus.number,
      {
        faderRawValue: clamp(0.62 - index * 0.015),
        isMuted: false,
      },
    ]),
  );
  private readonly mcas = createDcaGroups();

  private readonly channelLevelListeners = new Map<string, Set<Listener<number>>>();
  private readonly meterListeners = new Map<number, Set<Listener<ChannelMeterValues>>>();
  private readonly dcaFaderListeners = new Map<number, Set<Listener<number>>>();
  private readonly dcaOnListeners = new Map<number, Set<Listener<boolean>>>();
  private readonly masterFaderListeners = new Map<number, Set<Listener<number>>>();
  private readonly masterOnListeners = new Map<number, Set<Listener<boolean>>>();

  private meterInterval?: ReturnType<typeof setInterval>;

  async connect(_consoleIp: string): Promise<void> {
    return Promise.resolve();
  }

  disconnect(): void {
    if (this.meterInterval) {
      clearInterval(this.meterInterval);
      this.meterInterval = undefined;
    }
  }

  async scanConsoles(): Promise<ConsoleDevice[]> {
    return [this.cloneConsole(this.console)];
  }

  async getBuses(): Promise<Bus[]> {
    return this.buses.map((bus) => ({ ...bus }));
  }

  async getBusGroupsState(busId: number): Promise<BusGroupsState> {
    const master = this.busMaster.get(busId) ?? { faderRawValue: 0.6, isMuted: false };

    return {
      busId,
      masterFaderRaw: master.faderRawValue,
      masterMuted: master.isMuted,
      mcas: this.mcas.map((mca) => ({
        ...mca,
        assignedChannels: mca.assignedChannels.map((channel) => ({ ...channel })),
        assignedChannelIds: [...mca.assignedChannelIds],
      })),
      isConnected: true,
      isLoading: false,
      error: null,
    };
  }

  async getChannels(busId: number): Promise<Channel[]> {
    return (this.busChannels.get(busId) ?? []).map((channel) => ({ ...channel }));
  }

  async setChannelFader(channelId: number, busId: number, value: number): Promise<void> {
    const channel = this.getMutableChannel(busId, channelId);
    if (!channel) {
      return;
    }

    channel.faderRaw = clamp(value);
    channel.faderDb = x32RawToDb(channel.faderRaw);
    channel.localFaderRaw = channel.faderRaw;
    channel.remoteFaderRaw = channel.faderRaw;
    channel.isDirty = false;
    channel.level = channel.faderRaw;
    this.emitChannelLevel(channelId, busId, channel.faderRaw);
  }

  async setChannelPan(channelId: number, busId: number, value: number): Promise<void> {
    const channel = this.getMutableChannel(busId, channelId);
    if (!channel) {
      return;
    }

    channel.pan = clamp(value);
  }

  async setChannelOn(channelId: number, busId: number, isOn: boolean): Promise<void> {
    const channel = this.getMutableChannel(busId, channelId);
    if (!channel) {
      return;
    }

    channel.on = isOn;
    this.syncMcaMuteStatesForBus(busId);
  }

  async setDcaFader(dcaNumber: number, value: number): Promise<void> {
    const mca = this.mcas.find((item) => item.dcaNumber === dcaNumber);
    if (!mca) {
      return;
    }

    mca.faderRawValue = clamp(value);
    this.dcaFaderListeners.get(dcaNumber)?.forEach((listener) => listener(mca.faderRawValue));
  }

  async setDcaOn(dcaNumber: number, isOn: boolean): Promise<void> {
    const mca = this.mcas.find((item) => item.dcaNumber === dcaNumber);
    if (!mca) {
      return;
    }

    mca.isMuted = !isOn;
    this.dcaOnListeners.get(dcaNumber)?.forEach((listener) => listener(mca.isMuted));
  }

  setMcaFaderValue(dcaNumber: number, value: number): void {
    const mca = this.mcas.find((item) => item.dcaNumber === dcaNumber);
    if (!mca) {
      return;
    }

    mca.faderRawValue = clamp(value);
  }

  setMcaMuted(dcaNumber: number, isMuted: boolean): void {
    const mca = this.mcas.find((item) => item.dcaNumber === dcaNumber);
    if (!mca) {
      return;
    }

    mca.isMuted = isMuted;
  }

  async setBusMasterFader(busId: number, value: number): Promise<void> {
    const master = this.busMaster.get(busId);
    if (!master) {
      return;
    }

    master.faderRawValue = clamp(value);
    this.masterFaderListeners.get(busId)?.forEach((listener) => listener(master.faderRawValue));
  }

  async setBusMasterOn(busId: number, isOn: boolean): Promise<void> {
    const master = this.busMaster.get(busId);
    if (!master) {
      return;
    }

    master.isMuted = !isOn;
    this.masterOnListeners.get(busId)?.forEach((listener) => listener(master.isMuted));
  }

  subscribeChannelLevel(channelId: number, busId: number, listener: Listener<number>): () => void {
    const key = this.getChannelBusKey(channelId, busId);
    const listeners = this.channelLevelListeners.get(key) ?? new Set<Listener<number>>();
    listeners.add(listener);
    this.channelLevelListeners.set(key, listeners);

    const channel = this.getMutableChannel(busId, channelId);
    if (channel) {
      listener(channel.faderRaw);
    }

    return () => listeners.delete(listener);
  }

  subscribeMeter(channelId: number, listener: Listener<ChannelMeterValues>): () => void {
    const listeners = this.meterListeners.get(channelId) ?? new Set<Listener<ChannelMeterValues>>();
    listeners.add(listener);
    this.meterListeners.set(channelId, listeners);
    listener(this.getMeterValues(channelId));
    this.ensureMeterLoop();

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.meterListeners.delete(channelId);
      }

      if (this.meterListeners.size === 0 && this.meterInterval) {
        clearInterval(this.meterInterval);
        this.meterInterval = undefined;
      }
    };
  }

  subscribeDcaFader(dcaNumber: number, listener: Listener<number>): () => void {
    return this.addListener(this.dcaFaderListeners, dcaNumber, listener, () => {
      const mca = this.mcas.find((item) => item.dcaNumber === dcaNumber);
      return mca?.faderRawValue ?? 0;
    });
  }

  subscribeDcaOn(dcaNumber: number, listener: Listener<boolean>): () => void {
    return this.addListener(this.dcaOnListeners, dcaNumber, listener, () => {
      const mca = this.mcas.find((item) => item.dcaNumber === dcaNumber);
      return mca?.isMuted ?? false;
    });
  }

  subscribeBusMasterFader(busId: number, listener: Listener<number>): () => void {
    return this.addListener(this.masterFaderListeners, busId, listener, () => {
      return this.busMaster.get(busId)?.faderRawValue ?? 0;
    });
  }

  subscribeBusMasterOn(busId: number, listener: Listener<boolean>): () => void {
    return this.addListener(this.masterOnListeners, busId, listener, () => {
      return this.busMaster.get(busId)?.isMuted ?? false;
    });
  }

  private addListener<T>(
    map: Map<number, Set<Listener<T>>>,
    key: number,
    listener: Listener<T>,
    getInitialValue: () => T,
  ): () => void {
    const listeners = map.get(key) ?? new Set<Listener<T>>();
    listeners.add(listener);
    map.set(key, listeners);
    listener(getInitialValue());

    return () => listeners.delete(listener);
  }

  private ensureMeterLoop(): void {
    if (this.meterInterval) {
      return;
    }

    this.meterInterval = setInterval(() => {
      this.meterListeners.forEach((listeners, channelId) => {
        const values = this.getMeterValues(channelId);
        listeners.forEach((listener) => listener(values));
      });
    }, 120);
  }

  private getMeterValues(channelId: number): ChannelMeterValues {
    const now = Date.now() / 1000;
    const channel = this.findChannelAcrossBuses(channelId);
    const baseLevel = channel?.faderRaw ?? 0.5;
    const isOn = channel?.on ?? true;
    const dcaGain = this.getDcaGainForChannel(channelId);
    const phase = channelId * 0.37;
    const wobble = (Math.sin(now * 2.4 + phase) + 1) / 2;

    const preFadeDb = -58 + wobble * 52 * Math.max(baseLevel, 0.15);
    const postFactor = isOn ? baseLevel * dcaGain : 0;
    const postFadeDb = postFactor <= 0.001 ? -60 : -55 + wobble * 58 * postFactor;
    const preFadeDbfs = clamp(preFadeDb, -60, 2);
    const postFadeDbfs = clamp(postFadeDb, -60, 2);

    return {
      preFadeDbfs,
      postFadeDbfs,
      preFadeDb: preFadeDbfs,
      postFadeDb: postFadeDbfs,
      gateGrDb: clamp(-12 + Math.sin(now * 1.6 + phase) * 6, -24, 0),
      dynGrDb: clamp(-7 + Math.cos(now * 1.2 + phase) * 5, -18, 0),
    };
  }

  private getDcaGainForChannel(channelId: number): number {
    const matching = this.mcas.filter((mca) => mca.assignedChannelIds.includes(channelId));
    if (matching.length === 0) {
      return 1;
    }

    if (matching.some((mca) => mca.isMuted)) {
      return 0;
    }

    return matching.reduce((acc, mca) => acc * Math.max(mca.faderRawValue, 0.15), 1);
  }

  private syncMcaMuteStatesForBus(busId: number): void {
    this.mcas.forEach((mca) => {
      const assignedChannels = (this.busChannels.get(busId) ?? []).filter((channel) =>
        mca.assignedChannelIds.includes(channel.number),
      );

      mca.isMuted = assignedChannels.length > 0 && assignedChannels.every((channel) => !channel.on);
    });
  }

  private emitChannelLevel(channelId: number, busId: number, value: number): void {
    this.channelLevelListeners
      .get(this.getChannelBusKey(channelId, busId))
      ?.forEach((listener) => listener(value));
  }

  private getMutableChannel(busId: number, channelId: number): Channel | undefined {
    return this.busChannels.get(busId)?.find((channel) => channel.number === channelId);
  }

  private findChannelAcrossBuses(channelId: number): Channel | undefined {
    for (const channels of this.busChannels.values()) {
      const found = channels.find((channel) => channel.number === channelId);
      if (found) {
        return found;
      }
    }

    return undefined;
  }

  private getChannelBusKey(channelId: number, busId: number): string {
    return `${busId}:${channelId}`;
  }

  private cloneConsole(consoleDevice: ConsoleDevice): ConsoleDevice {
    return { ...consoleDevice };
  }
}

export const mockMixerProvider = new MockMixerProvider();

export const isDemoConsoleIp = (consoleIp: string): boolean => consoleIp === DEMO_CONSOLE_IP;

export const isMockConsoleIp = (consoleIp: string): boolean =>
  consoleIp === DEV_MOCK_CONSOLE_IP || isDemoConsoleIp(consoleIp);

/**
 * Retorna o provider mock correto baseado no IP.
 * O `require` lazy evita dependencia circular entre os providers mock e demo.
 */
export const getMockProviderForIp = (consoleIp: string): MixerControlProvider => {
  if (isDemoConsoleIp(consoleIp)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { demoMixerProvider } =
      require('./demoMixerProvider') as typeof import('./demoMixerProvider');
    return demoMixerProvider;
  }

  return mockMixerProvider;
};

export const getMockConsoleDevice = (): ConsoleDevice => ({
  id: DEV_MOCK_CONSOLE_ID,
  ip: DEV_MOCK_CONSOLE_IP,
  port: 10023,
  name: 'X32 Dev Mock',
  model: 'X32 Development Console',
  status: 'connected',
  firmware: 'mock-1.0.0',
});
