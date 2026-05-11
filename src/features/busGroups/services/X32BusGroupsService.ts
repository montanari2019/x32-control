import { AppError } from '@shared/errors/AppError';
import { MixerControlProvider } from '@shared/mixer/MixerControlProvider';
import {
  getMockProviderForIp,
  isMockConsoleIp,
  mockMixerProvider,
} from '@shared/mixer/mock/mockMixerProvider';
import { OscClient } from '@shared/osc/OscClient';
import { OscMessage } from '@shared/osc/OscMessage';
import { acquireSharedOscClient } from '@shared/osc/SharedOscClient';
import type { SharedOscClientLease } from '@shared/osc/SharedOscClient';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { clamp } from '@shared/utils/clamp';
import {
  BusGroupsState,
  McaAssignedChannel,
  McaColorToken,
  McaGroup,
} from '../types/busGroups.types';

const DCA_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const MCA_COLOR_TOKENS: Record<(typeof DCA_NUMBERS)[number], McaColorToken> = {
  1: 'red',
  2: 'green',
  3: 'yellow',
  4: 'pink',
  5: 'purple',
  6: 'cyan',
  7: 'blue',
  8: 'amber',
};

const asNumber = (message: OscMessage, fallback: number): number => {
  const value = message.args[0];
  return typeof value === 'number' ? value : fallback;
};

const asString = (message: OscMessage, fallback: string): string => {
  const value = message.args[0];
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
};

export const isChannelInDca = (dcaBitmask: number, dcaIndex: number): boolean => {
  const divisor = 2 ** (dcaIndex - 1);
  return Math.floor(dcaBitmask / divisor) % 2 === 1;
};

const buildAssignedChannelsFromIds = (channelIds: number[]): McaAssignedChannel[] =>
  channelIds.map((channelId) => ({
    channelId,
    channelName: `CH ${channelId.toString().padStart(2, '0')}`,
    channelLabel: `CH ${channelId.toString().padStart(2, '0')}`,
    channelType: 'channel',
  }));

export class X32BusGroupsService {
  private client: OscClient;
  private connectedConsoleIp?: string;
  private sharedLease?: SharedOscClientLease;
  private useMockProvider = false;
  private mockProvider: MixerControlProvider = mockMixerProvider;

  constructor(client = new OscClient()) {
    this.client = client;
  }

  async connect(consoleIp: string): Promise<void> {
    if (this.useMockProvider) {
      this.mockProvider.disconnect();
    }

    this.useMockProvider = isMockConsoleIp(consoleIp);
    if (this.useMockProvider) {
      this.client.stopXRemoteKeepAlive();
      this.sharedLease?.release();
      this.sharedLease = undefined;
      this.connectedConsoleIp = undefined;
      this.mockProvider = getMockProviderForIp(consoleIp);
      await this.mockProvider.connect(consoleIp);
      return;
    }

    if (this.sharedLease && this.connectedConsoleIp === consoleIp) {
      return;
    }

    this.sharedLease?.release();
    this.sharedLease = undefined;
    this.connectedConsoleIp = undefined;
    this.sharedLease = await acquireSharedOscClient(consoleIp);
    this.connectedConsoleIp = consoleIp;
    this.client = this.sharedLease.client;
  }

  disconnect(): void {
    if (this.useMockProvider) {
      this.mockProvider.disconnect();
      this.useMockProvider = false;
      this.connectedConsoleIp = undefined;
      return;
    }

    this.stopHeartbeat();
    this.sharedLease?.release();
    this.sharedLease = undefined;
    this.connectedConsoleIp = undefined;
  }

  startHeartbeat(): void {
    if (this.useMockProvider) {
      return;
    }

    this.client.startXRemoteKeepAlive();
  }

  stopHeartbeat(): void {
    if (this.useMockProvider) {
      return;
    }

    this.client.stopXRemoteKeepAlive();
  }

  async fetchInitialState(busId: number): Promise<BusGroupsState> {
    if (this.useMockProvider) {
      return this.mockProvider.getBusGroupsState(busId);
    }

    await this.client.send(X32Protocol.getXRemotePath());

    const dcaStates = await Promise.all(
      DCA_NUMBERS.map(async (dcaNumber) => {
        const [faderRawValue, isOn] = await Promise.all([
          this.safeRequestFloat(X32Protocol.getDcaFaderPath(dcaNumber), 0),
          this.safeRequestInt(X32Protocol.getDcaOnPath(dcaNumber), 1),
        ]);
        return { dcaNumber, faderRawValue, isOn, name: `MCA ${dcaNumber}` };
      }),
    );

    const [masterFaderRaw, masterOn, channelAssignments] = await Promise.all([
      this.safeRequestFloat(X32Protocol.getBusMasterFaderPath(busId), 0),
      this.safeRequestInt(X32Protocol.getBusMasterOnPath(busId), 1),
      Promise.all(
        Array.from({ length: 32 }, async (_, index) => ({
          channelId: index + 1,
          dcaBitmask: await this.safeRequestInt(
            X32Protocol.getChannelDcaAssignmentPath(index + 1),
            0,
          ),
        })),
      ),
    ]);

    const mcas: McaGroup[] = dcaStates.map((dcaState) => {
      const assignedChannelIds = channelAssignments
        .filter((assignment) => isChannelInDca(assignment.dcaBitmask, dcaState.dcaNumber))
        .map((assignment) => assignment.channelId);

      return {
        id: `mca-${dcaState.dcaNumber}`,
        dcaNumber: dcaState.dcaNumber,
        name: dcaState.name,
        colorToken: MCA_COLOR_TOKENS[dcaState.dcaNumber],
        faderRawValue: dcaState.faderRawValue,
        isMuted: dcaState.isOn === 0,
        assignedChannels: buildAssignedChannelsFromIds(assignedChannelIds),
        assignedChannelIds,
      };
    });

    return {
      busId,
      masterFaderRaw,
      masterMuted: masterOn === 0,
      mcas,
      isConnected: true,
      isLoading: false,
      error: null,
    };
  }

  subscribeToDcaFader(dcaNumber: number, listener: (value: number) => void): () => void {
    if (this.useMockProvider) {
      return this.mockProvider.subscribeDcaFader(dcaNumber, listener);
    }

    return this.client.subscribe(X32Protocol.getDcaFaderPath(dcaNumber), (message) => {
      listener(clamp(asNumber(message, 0)));
    });
  }

  subscribeToDcaOn(dcaNumber: number, listener: (isMuted: boolean) => void): () => void {
    if (this.useMockProvider) {
      return this.mockProvider.subscribeDcaOn(dcaNumber, listener);
    }

    return this.client.subscribe(X32Protocol.getDcaOnPath(dcaNumber), (message) => {
      listener(asNumber(message, 1) === 0);
    });
  }

  subscribeToBusMasterFader(busId: number, listener: (value: number) => void): () => void {
    if (this.useMockProvider) {
      return this.mockProvider.subscribeBusMasterFader(busId, listener);
    }

    return this.client.subscribe(X32Protocol.getBusMasterFaderPath(busId), (message) => {
      listener(clamp(asNumber(message, 0)));
    });
  }

  subscribeToBusMasterOn(busId: number, listener: (isMuted: boolean) => void): () => void {
    if (this.useMockProvider) {
      return this.mockProvider.subscribeBusMasterOn(busId, listener);
    }

    return this.client.subscribe(X32Protocol.getBusMasterOnPath(busId), (message) => {
      listener(asNumber(message, 1) === 0);
    });
  }

  async setDcaFader(dcaNumber: number, value: number): Promise<void> {
    if (this.useMockProvider) {
      await this.mockProvider.setDcaFader(dcaNumber, value);
      return;
    }

    await this.client.send(X32Protocol.getDcaFaderPath(dcaNumber), [
      { type: 'f', value: clamp(value) },
    ]);
  }

  async setDcaOn(dcaNumber: number, isOn: boolean): Promise<void> {
    if (this.useMockProvider) {
      await this.mockProvider.setDcaOn(dcaNumber, isOn);
      return;
    }

    await this.client.send(X32Protocol.getDcaOnPath(dcaNumber), [isOn ? 1 : 0]);
  }

  async setBusMasterFader(busId: number, value: number): Promise<void> {
    if (this.useMockProvider) {
      await this.mockProvider.setBusMasterFader(busId, value);
      return;
    }

    await this.client.send(X32Protocol.getBusMasterFaderPath(busId), [
      { type: 'f', value: clamp(value) },
    ]);
  }

  async setBusMasterOn(busId: number, isOn: boolean): Promise<void> {
    if (this.useMockProvider) {
      await this.mockProvider.setBusMasterOn(busId, isOn);
      return;
    }

    await this.client.send(X32Protocol.getBusMasterOnPath(busId), [isOn ? 1 : 0]);
  }

  private async safeRequestFloat(path: string, fallback: number): Promise<number> {
    try {
      return clamp(asNumber(await this.client.request<OscMessage>(path, [], 1200), fallback));
    } catch {
      return fallback;
    }
  }

  private async safeRequestInt(path: string, fallback: number): Promise<number> {
    try {
      return Math.round(asNumber(await this.client.request<OscMessage>(path, [], 1200), fallback));
    } catch {
      return fallback;
    }
  }

  private async safeRequestString(path: string, fallback: string): Promise<string> {
    try {
      return asString(await this.client.request<OscMessage>(path, [], 1200), fallback);
    } catch (error) {
      if (error instanceof AppError) {
        return fallback;
      }

      return fallback;
    }
  }
}
