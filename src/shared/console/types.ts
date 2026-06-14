import type { BusGroupsState } from '@features/busGroups/types/busGroups.types';
import type { Channel } from '@features/busMix/types/Channel';
import type { ChannelMeterValues } from '@features/busMix/utils/meterDecoder';
import type { Bus } from '@features/busSelection/types/Bus';
import type { ConsoleDevice } from '@features/consoleDiscovery/types/ConsoleDevice';

export type Unsubscribe = () => void;

export type ConsoleBus = Bus;
export type ConsoleChannel = Channel;
export type ConsoleBusGroupsState = BusGroupsState;
export type ConsoleMeterValues = ChannelMeterValues;
export type ConsoleDiscoveryDevice = ConsoleDevice;

export type ConsoleChannelRef = Pick<Channel, 'kind' | 'number' | 'sourceNumber'>;
