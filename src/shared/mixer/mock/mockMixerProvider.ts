import { BusGroupsState, McaGroup } from '@features/busGroups/types/busGroups.types';
import { Channel } from '@features/busMix/types/Channel';
import { ChannelMeterValues } from '@features/busMix/utils/meterDecoder';
import { Bus } from '@features/busSelection/types/Bus';
import { ConsoleDevice } from '@features/consoleDiscovery/types/ConsoleDevice';
import { MixerControlProvider } from '@shared/mixer/MixerControlProvider';
import { clamp } from '@shared/utils/clamp';

export const DEV_MOCK_CONSOLE_IP = '10.254.254.10';
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
  { dcaNumber: 1, colorToken: 'blue' as const, name: 'Bateria', channels: [1, 2, 3, 4, 5, 6] },
  { dcaNumber: 2, colorToken: 'green' as const, name: 'Baixo', channels: [7, 8] },
  { dcaNumber: 3, colorToken: 'yellow' as const, name: 'Guitarras', channels: [9, 10, 11, 12] },
  { dcaNumber: 4, colorToken: 'pink' as const, name: 'Vocais', channels: [13, 14, 15, 16, 17] },
  { dcaNumber: 5, colorToken: 'purple' as const, name: 'Playback', channels: [18, 19, 20, 21] },
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

type Listener<T> = (value: T) => void;

const createBusList = (): Bus[] =>
  BUS_NAMES.map((name, index) => ({
    number: index + 1,
    label: `Bus ${(index + 1).toString().padStart(2, '0')}`,
    name,
  }));

const createChannelsForBus = (busId: number): Channel[] =>
  Array.from({ length: 32 }, (_, index) => {
    const number = index + 1;
    const baseLevel = 0.18 + ((number * 7 + busId * 5) % 50) / 100;
    const basePan = number % 2 === 0 ? 0.6 : 0.4;

    return {
      id: `bus-${busId}-ch-${number}`,
      number,
      label: `CH ${number.toString().padStart(2, '0')}`,
      name: CHANNEL_NAMES[index] ?? `Channel ${number}`,
      color: (number % 15) + 1,
      level: clamp(baseLevel),
      signalLevel: 0,
      pan: clamp(basePan),
      on: number % 9 !== 0,
    };
  });

const createDcaGroups = (): McaGroup[] =>
  MCA_DEFINITIONS.map((definition, index) => ({
    id: `mca-${definition.dcaNumber}`,
    dcaNumber: definition.dcaNumber,
    name: definition.name,
    colorToken: definition.colorToken,
    faderRawValue: clamp(0.45 + index * 0.08),
    isMuted: false,
    assignedChannelIds: [...definition.channels],
  }));

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

    channel.level = clamp(value);
    this.emitChannelLevel(channelId, busId, channel.level);
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
      listener(channel.level);
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
    const baseLevel = channel?.level ?? 0.5;
    const isOn = channel?.on ?? true;
    const dcaGain = this.getDcaGainForChannel(channelId);
    const phase = channelId * 0.37;
    const wobble = (Math.sin(now * 2.4 + phase) + 1) / 2;

    const preFadeDb = -58 + wobble * 52 * Math.max(baseLevel, 0.15);
    const postFactor = isOn ? baseLevel * dcaGain : 0;
    const postFadeDb = postFactor <= 0.001 ? -60 : -55 + wobble * 58 * postFactor;

    return {
      preFadeDb: clamp(preFadeDb, -60, 2),
      postFadeDb: clamp(postFadeDb, -60, 2),
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

export const isMockConsoleIp = (_consoleIp: string): boolean => false;

export const getMockConsoleDevice = (): ConsoleDevice => ({
  id: DEV_MOCK_CONSOLE_ID,
  ip: DEV_MOCK_CONSOLE_IP,
  port: 10023,
  name: 'X32 Dev Mock',
  model: 'X32 Development Console',
  status: 'connected',
  firmware: 'mock-1.0.0',
});
