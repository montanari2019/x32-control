import type {
  BusGroupsState,
  McaGroup,
} from '@features/busGroups/types/busGroups.types';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { clamp } from '@shared/utils/clamp';
import { X32AdapterContext } from './X32AdapterContext';
import { DCA_NUMBERS, MCA_COLOR_TOKENS } from './X32AdapterConstants';
import { asNumber } from './x32OscValueUtils';
import { buildAssignedChannelsFromIds, isChannelInDca } from './x32BusGroupsUtils';

export class X32BusGroupsAdapter {
  constructor(private readonly context: X32AdapterContext) {}

  async getBusGroupsState(busId: number): Promise<BusGroupsState> {
    await this.context.client.send(X32Protocol.getXRemotePath());

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

  async setDcaFader(dcaNumber: number, value: number): Promise<void> {
    await this.context.client.send(X32Protocol.getDcaFaderPath(dcaNumber), [
      { type: 'f', value: clamp(value) },
    ]);
  }

  async setDcaOn(dcaNumber: number, isOn: boolean): Promise<void> {
    await this.context.client.send(X32Protocol.getDcaOnPath(dcaNumber), [isOn ? 1 : 0]);
  }

  async setBusMasterFader(busId: number, value: number): Promise<void> {
    await this.context.client.send(X32Protocol.getBusMasterFaderPath(busId), [
      { type: 'f', value: clamp(value) },
    ]);
  }

  async setBusMasterOn(busId: number, isOn: boolean): Promise<void> {
    await this.context.client.send(X32Protocol.getBusMasterOnPath(busId), [isOn ? 1 : 0]);
  }

  subscribeDcaFader(dcaNumber: number, listener: (value: number) => void): () => void {
    return this.context.client.subscribe(X32Protocol.getDcaFaderPath(dcaNumber), (message) => {
      listener(clamp(asNumber(message, 0)));
    });
  }

  subscribeDcaOn(dcaNumber: number, listener: (isMuted: boolean) => void): () => void {
    return this.context.client.subscribe(X32Protocol.getDcaOnPath(dcaNumber), (message) => {
      listener(asNumber(message, 1) === 0);
    });
  }

  subscribeBusMasterFader(busId: number, listener: (value: number) => void): () => void {
    return this.context.client.subscribe(X32Protocol.getBusMasterFaderPath(busId), (message) => {
      listener(clamp(asNumber(message, 0)));
    });
  }

  subscribeBusMasterOn(busId: number, listener: (isMuted: boolean) => void): () => void {
    return this.context.client.subscribe(X32Protocol.getBusMasterOnPath(busId), (message) => {
      listener(asNumber(message, 1) === 0);
    });
  }

  private async safeRequestFloat(path: string, fallback: number): Promise<number> {
    try {
      return clamp(asNumber(await this.context.client.request(path, [], 1200), fallback));
    } catch {
      return fallback;
    }
  }

  private async safeRequestInt(path: string, fallback: number): Promise<number> {
    try {
      return Math.round(asNumber(await this.context.client.request(path, [], 1200), fallback));
    } catch {
      return fallback;
    }
  }
}

