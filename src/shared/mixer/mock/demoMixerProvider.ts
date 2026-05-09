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
import { DEMO_CONSOLE_ID, DEMO_CONSOLE_IP } from './mockMixerProvider';

const DEMO_BUS_NAMES = [
  'In-Ear Vocal',
  'In-Ear Banda',
  'Retorno Palco',
  'Monitor Bateria',
  'Monitor Baixo',
  'Frente de Casa',
  'Click',
  'Gravacao',
];

const DEMO_CHANNEL_NAMES = [
  'Kick',
  'Snare',
  'Hi-Hat',
  'Overhead',
  'Bass DI',
  'Guitarra',
  'Lead Vox',
  'Bgv 1',
  'Keys L',
  'Keys R',
  'Playback L',
  'Playback R',
  'FX Return 1',
  'FX Return 2',
  'Talkback',
  'Spare',
];

type DemoMcaDefinition = {
  channels: number[];
  colorToken: McaGroup['colorToken'];
  dcaNumber: number;
  name: string;
};

const DEMO_MCA_DEFINITIONS: DemoMcaDefinition[] = [
  {
    dcaNumber: 1,
    colorToken: 'blue' as const,
    name: 'MCA 1',
    channels: [],
  },
  {
    dcaNumber: 2,
    colorToken: 'green' as const,
    name: 'MCA 2',
    channels: [],
  },
  {
    dcaNumber: 3,
    colorToken: 'pink' as const,
    name: 'MCA 3',
    channels: [],
  },
  {
    dcaNumber: 4,
    colorToken: 'yellow' as const,
    name: 'MCA 4',
    channels: [],
  },
  {
    dcaNumber: 5,
    colorToken: 'purple' as const,
    name: 'MCA 5',
    channels: [],
  },
];

const normalizeDemoMcaName = (dcaNumber: number, name: string): string => {
  const normalizedName = name.trim().replace(/\s+/g, ' ');
  return normalizedName || `MCA ${dcaNumber}`;
};

const createDemoBusList = (): Bus[] =>
  DEMO_BUS_NAMES.map((name, index) => ({
    number: index + 1,
    label: `Bus ${(index + 1).toString().padStart(2, '0')}`,
    name,
  }));

const createDemoChannel = (
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
  const baseLevel = 0.55 + ((number * 13 + busId * 7) % 30) / 100;
  const basePan = number % 3 === 0 ? 0.65 : number % 3 === 1 ? 0.35 : 0.5;

  return {
    id: `demo-bus-${busId}-${idPrefix}-${sourceNumber}`,
    kind,
    number,
    sourceNumber,
    label: `${labelPrefix} ${sourceNumber.toString().padStart(2, '0')}`,
    name,
    color: (number % 8) + 1,
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
    on: number % 7 !== 0,
  };
};

const createDemoChannelsForBus = (busId: number): Channel[] => [
  ...Array.from({ length: 16 }, (_, index) => {
    const sourceNumber = index + 1;
    return createDemoChannel(
      busId,
      sourceNumber,
      sourceNumber,
      'channel',
      'CH',
      'ch',
      DEMO_CHANNEL_NAMES[index] ?? `Canal ${sourceNumber}`,
      0.2,
      sourceNumber,
    );
  }),
  ...Array.from({ length: 4 }, (_, index) => {
    const sourceNumber = index + 1;
    return createDemoChannel(
      busId,
      32 + sourceNumber,
      sourceNumber,
      'aux',
      'AUX',
      'aux',
      `Aux ${sourceNumber}`,
      0.15,
    );
  }),
  ...Array.from({ length: 4 }, (_, index) => {
    const sourceNumber = index + 1;
    return createDemoChannel(
      busId,
      40 + sourceNumber,
      sourceNumber,
      'fxReturn',
      'FX',
      'fxrtn',
      `FX ${sourceNumber} ${index % 2 === 0 ? 'L' : 'R'}`,
      0.3,
    );
  }),
];

const createDemoMcaGroups = (): McaGroup[] =>
  DEMO_MCA_DEFINITIONS.map((definition, index) => {
    const assignedChannels: McaAssignedChannel[] = definition.channels.map((channelId) => ({
      channelId,
      channelLabel: `CH ${channelId.toString().padStart(2, '0')}`,
      channelName: DEMO_CHANNEL_NAMES[channelId - 1] ?? `Canal ${channelId}`,
      channelType: 'channel',
    }));

    return {
      id: `demo-mca-${definition.dcaNumber}`,
      dcaNumber: definition.dcaNumber,
      name: definition.name,
      colorToken: definition.colorToken,
      faderRawValue: clamp(0.6 + index * 0.04),
      isMuted: false,
      assignedChannels,
      assignedChannelIds: [...definition.channels],
    };
  });

type Listener<T> = (value: T) => void;

const DEMO_METER_INTERVAL_MS = 66;

const pseudoRandom = (seed: number): number => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

export class DemoMixerProvider implements MixerControlProvider {
  private readonly consoleDevice: ConsoleDevice = {
    id: DEMO_CONSOLE_ID,
    ip: DEMO_CONSOLE_IP,
    port: 10023,
    name: 'Demo - X32 Control',
    model: 'Console de Demonstracao',
    status: 'connected',
    firmware: 'demo-1.0',
  };

  private readonly buses = createDemoBusList();
  private readonly busChannels = new Map<number, Channel[]>(
    this.buses.map((bus) => [bus.number, createDemoChannelsForBus(bus.number)]),
  );
  private readonly busMasters = new Map<number, { faderRawValue: number; isMuted: boolean }>(
    this.buses.map((bus, index) => [
      bus.number,
      { faderRawValue: clamp(0.7 - index * 0.02), isMuted: false },
    ]),
  );
  private mcas = createDemoMcaGroups();

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
    return [{ ...this.consoleDevice }];
  }

  async getBuses(): Promise<Bus[]> {
    return this.buses.map((bus) => ({ ...bus }));
  }

  async getBusGroupsState(busId: number): Promise<BusGroupsState> {
    const master = this.busMasters.get(busId) ?? { faderRawValue: 0.65, isMuted: false };
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

    const clamped = clamp(value);
    channel.faderRaw = clamped;
    channel.faderDb = x32RawToDb(clamped);
    channel.localFaderRaw = clamped;
    channel.remoteFaderRaw = clamped;
    channel.level = clamped;
    channel.isDirty = false;
    this.emitChannelLevel(channelId, busId, clamped);
  }

  async setChannelPan(channelId: number, busId: number, value: number): Promise<void> {
    const channel = this.getMutableChannel(busId, channelId);
    if (channel) {
      channel.pan = clamp(value, 0, 1);
    }
  }

  async setChannelOn(channelId: number, busId: number, isOn: boolean): Promise<void> {
    const channel = this.getMutableChannel(busId, channelId);
    if (channel) {
      channel.on = isOn;
    }
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
    const master = this.busMasters.get(busId);
    if (!master) {
      return;
    }

    master.faderRawValue = clamp(value);
    this.masterFaderListeners.get(busId)?.forEach((listener) => listener(master.faderRawValue));
  }

  async setBusMasterOn(busId: number, isOn: boolean): Promise<void> {
    const master = this.busMasters.get(busId);
    if (!master) {
      return;
    }

    master.isMuted = !isOn;
    this.masterOnListeners.get(busId)?.forEach((listener) => listener(master.isMuted));
  }

  subscribeChannelLevel(channelId: number, busId: number, listener: Listener<number>): () => void {
    const key = this.channelBusKey(channelId, busId);
    const set = this.channelLevelListeners.get(key) ?? new Set<Listener<number>>();
    set.add(listener);
    this.channelLevelListeners.set(key, set);

    const channel = this.getMutableChannel(busId, channelId);
    if (channel) {
      listener(channel.faderRaw);
    }

    return () => {
      set.delete(listener);
    };
  }

  subscribeMeter(channelId: number, listener: Listener<ChannelMeterValues>): () => void {
    const set = this.meterListeners.get(channelId) ?? new Set<Listener<ChannelMeterValues>>();
    set.add(listener);
    this.meterListeners.set(channelId, set);
    listener(this.computeMeterValues(channelId));
    this.ensureMeterLoop();

    return () => {
      set.delete(listener);
      if (set.size === 0) {
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
      return this.mcas.find((mca) => mca.dcaNumber === dcaNumber)?.faderRawValue ?? 0;
    });
  }

  subscribeDcaOn(dcaNumber: number, listener: Listener<boolean>): () => void {
    return this.addListener(this.dcaOnListeners, dcaNumber, listener, () => {
      return this.mcas.find((mca) => mca.dcaNumber === dcaNumber)?.isMuted ?? false;
    });
  }

  subscribeBusMasterFader(busId: number, listener: Listener<number>): () => void {
    return this.addListener(this.masterFaderListeners, busId, listener, () => {
      return this.busMasters.get(busId)?.faderRawValue ?? 0;
    });
  }

  subscribeBusMasterOn(busId: number, listener: Listener<boolean>): () => void {
    return this.addListener(this.masterOnListeners, busId, listener, () => {
      return this.busMasters.get(busId)?.isMuted ?? false;
    });
  }

  renameMca(dcaNumber: number, name: string): void {
    const mca = this.mcas.find((item) => item.dcaNumber === dcaNumber);
    if (!mca) {
      return;
    }

    mca.name = normalizeDemoMcaName(dcaNumber, name);
  }

  setMcaAssignedChannels(dcaNumber: number, assignedChannels: McaAssignedChannel[]): void {
    const mca = this.mcas.find((item) => item.dcaNumber === dcaNumber);
    if (!mca) {
      return;
    }

    mca.assignedChannels = assignedChannels.map((channel) => ({ ...channel }));
    mca.assignedChannelIds = assignedChannels.map((channel) => channel.channelId);
  }

  private addListener<T>(
    map: Map<number, Set<Listener<T>>>,
    key: number,
    listener: Listener<T>,
    getInitial: () => T,
  ): () => void {
    const set = map.get(key) ?? new Set<Listener<T>>();
    set.add(listener);
    map.set(key, set);
    listener(getInitial());
    return () => {
      set.delete(listener);
    };
  }

  private ensureMeterLoop(): void {
    if (this.meterInterval) {
      return;
    }

    this.meterInterval = setInterval(() => {
      this.meterListeners.forEach((listeners, channelId) => {
        const values = this.computeMeterValues(channelId);
        listeners.forEach((listener) => listener(values));
      });
    }, DEMO_METER_INTERVAL_MS);
  }

  private computeMeterValues(channelId: number): ChannelMeterValues {
    const now = Date.now();
    const channel = this.findChannelAcrossBuses(channelId);
    const baseLevel = channel?.faderRaw ?? 0.5;
    const isOn = channel?.on ?? true;
    const dcaGain = this.getDcaGainForChannel(channelId);
    const activity = Math.max(baseLevel, 0.16);
    const frameBucket = Math.floor(now / DEMO_METER_INTERVAL_MS);
    const burst = pseudoRandom(channelId * 17 + frameBucket * 13);
    const accent = pseudoRandom(channelId * 31 + frameBucket * 7);
    const drop = pseudoRandom(channelId * 47 + Math.floor(frameBucket / 2) * 5);

    const floorDb = -58 + activity * 10;
    const rangeDb = 18 + activity * 32;
    let preFadeDb = floorDb + burst * rangeDb;

    if (accent > 0.86) {
      preFadeDb += 5 + activity * 4;
    }

    if (accent > 0.985) {
      preFadeDb += 7 + activity * 6;
    }

    if (drop < 0.12) {
      preFadeDb -= 8 + (1 - activity) * 8;
    }

    preFadeDb = isOn ? clamp(preFadeDb, -60, 10) : -60;

    const postFactor = isOn ? Math.max(activity * dcaGain, 0) : 0;
    const postFadeDb =
      postFactor <= 0.001
        ? -60
        : clamp(preFadeDb + 20 * Math.log10(Math.max(postFactor, 0.08)), -60, 10);
    const gateGrDb = isOn ? clamp(-2 - pseudoRandom(channelId * 59 + frameBucket) * 6, -10, 0) : 0;
    const dynGrDb = isOn
      ? clamp(-1 - pseudoRandom(channelId * 71 + frameBucket * 3) * 5, -9, 0)
      : 0;

    return {
      preFadeDbfs: preFadeDb,
      postFadeDbfs: postFadeDb,
      preFadeDb,
      postFadeDb,
      gateGrDb,
      dynGrDb,
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
    return matching.reduce((acc, mca) => acc * Math.max(mca.faderRawValue, 0.1), 1);
  }

  private emitChannelLevel(channelId: number, busId: number, value: number): void {
    this.channelLevelListeners
      .get(this.channelBusKey(channelId, busId))
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

  private channelBusKey(channelId: number, busId: number): string {
    return `${busId}:${channelId}`;
  }
}

export const demoMixerProvider = new DemoMixerProvider();
