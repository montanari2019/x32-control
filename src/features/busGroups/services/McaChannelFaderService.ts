import { BusMixService } from '@features/busMix/services/BusMixService';
import { busMixChannelStore } from '@features/busMix/services/BusMixChannelStore';
import { Channel } from '@features/busMix/types/Channel';
import { clamp } from '@shared/utils/clamp';
import { x32DbToRaw, x32RawToDb } from '@shared/utils/faderDb';
import { McaAssignedChannel } from '../types/busGroups.types';

// Espelha absoluteOffset de SOURCE_DEFINITIONS em BusMixService
const KIND_ABSOLUTE_OFFSET: Record<McaAssignedChannel['channelType'], number> = {
  channel: 0,
  aux: 32,
  fxReturn: 40,
};

export const MCA_DEFAULT_RAW_VALUE = 0.75;
const NEGATIVE_INFINITY_DB = -90;

/**
 * Constrói um Channel mínimo a partir de McaAssignedChannel para uso
 * quando o busMixChannelStore ainda não possui dados daquele canal.
 * Contém apenas os campos necessários para setChannelOnInBus funcionar
 * corretamente (kind e sourceNumber). Os demais campos usam defaults seguros.
 */
const buildFallbackChannel = (assigned: McaAssignedChannel): Channel => {
  const kind = assigned.channelType;
  const absoluteOffset = KIND_ABSOLUTE_OFFSET[kind];
  const sourceNumber = assigned.channelId - absoluteOffset;
  const label =
    assigned.channelLabel ??
    assigned.channelName ??
    `CH ${assigned.channelId.toString().padStart(2, '0')}`;

  return {
    id: `${kind}-${sourceNumber}`,
    kind,
    number: assigned.channelId,
    sourceNumber,
    label,
    name: assigned.channelName ?? label,
    backgroundOpacity: 0.2,
    faderRaw: MCA_DEFAULT_RAW_VALUE,
    faderDb: x32RawToDb(MCA_DEFAULT_RAW_VALUE),
    localFaderRaw: MCA_DEFAULT_RAW_VALUE,
    remoteFaderRaw: MCA_DEFAULT_RAW_VALUE,
    isDirty: false,
    lastLocalChangeAt: 0,
    meterDbfs: -60,
    visualMeterDbfs: -60,
    level: MCA_DEFAULT_RAW_VALUE,
    signalLevel: 0,
    pan: 0.5,
    on: true,
  };
};

const toFiniteDb = (rawValue: number): number => {
  const dbValue = x32RawToDb(rawValue);
  return dbValue === '-inf' ? NEGATIVE_INFINITY_DB : dbValue;
};

export class McaChannelFaderService {
  constructor(private readonly busMixService: BusMixService) {}

  computeAverageRaw(
    consoleIp: string,
    busId: number,
    assignedChannels: McaAssignedChannel[],
  ): number {
    const matchedChannels = this.getMatchedChannels(consoleIp, busId, assignedChannels);
    if (matchedChannels.length === 0) {
      return MCA_DEFAULT_RAW_VALUE;
    }

    const sum = matchedChannels.reduce((accumulator, channel) => accumulator + channel.faderRaw, 0);
    return sum / matchedChannels.length;
  }

  async applyProportionalFader(
    consoleIp: string,
    busId: number,
    assignedChannels: McaAssignedChannel[],
    previousMcaRaw: number,
    nextMcaRaw: number,
  ): Promise<void> {
    const matchedChannels = this.getMatchedChannels(consoleIp, busId, assignedChannels);
    if (matchedChannels.length === 0) {
      return;
    }

    const deltaDb = toFiniteDb(nextMcaRaw) - toFiniteDb(previousMcaRaw);
    if (deltaDb === 0) {
      return;
    }

    const changedAt = Date.now();
    const channelUpdates = matchedChannels.map((channel) => {
      const currentDb = toFiniteDb(channel.faderRaw);
      const nextRaw = clamp(x32DbToRaw(currentDb + deltaDb));

      return {
        channel,
        nextRaw,
      };
    });

    busMixChannelStore.updateChannels(consoleIp, busId, (currentChannels) =>
      currentChannels.map((channel) => {
        const update = channelUpdates.find((item) => item.channel.number === channel.number);
        if (!update) {
          return channel;
        }

        return {
          ...channel,
          faderRaw: update.nextRaw,
          faderDb: x32RawToDb(update.nextRaw),
          localFaderRaw: update.nextRaw,
          remoteFaderRaw: update.nextRaw,
          level: update.nextRaw,
          isDirty: false,
          lastLocalChangeAt: changedAt,
        };
      }),
    );

    await Promise.all(
      channelUpdates.map(({ channel, nextRaw }) =>
        this.busMixService.setChannelFaderInBus(channel, busId, nextRaw),
      ),
    );
  }

  async applyMuteToChannels(
    consoleIp: string,
    busId: number,
    assignedChannels: McaAssignedChannel[],
    isMuted: boolean,
  ): Promise<void> {
    if (assignedChannels.length === 0) {
      return;
    }

    const storeChannels = busMixChannelStore.getSnapshot(consoleIp, busId);
    const storeById = new Map(storeChannels.map((ch) => [ch.number, ch]));

    const channels: Channel[] = assignedChannels.map(
      (assigned) => storeById.get(assigned.channelId) ?? buildFallbackChannel(assigned),
    );

    const nextOn = !isMuted;

    busMixChannelStore.updateChannels(consoleIp, busId, (currentChannels) =>
      currentChannels.map((channel) => {
        const isAssigned = assignedChannels.some(
          (assigned) => assigned.channelId === channel.number,
        );
        return isAssigned ? { ...channel, on: nextOn } : channel;
      }),
    );

    await Promise.all(
      channels.map((channel) => this.busMixService.setChannelOnInBus(channel, busId, nextOn)),
    );
  }

  private getMatchedChannels(
    consoleIp: string,
    busId: number,
    assignedChannels: McaAssignedChannel[],
  ): Channel[] {
    if (assignedChannels.length === 0) {
      return [];
    }

    const assignedIds = new Set(assignedChannels.map((channel) => channel.channelId));
    return busMixChannelStore
      .getSnapshot(consoleIp, busId)
      .filter((channel) => assignedIds.has(channel.number));
  }
}
