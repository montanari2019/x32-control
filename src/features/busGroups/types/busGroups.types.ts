export type McaColorToken =
  | 'blue'
  | 'green'
  | 'yellow'
  | 'pink'
  | 'purple'
  | 'cyan'
  | 'red'
  | 'amber';

export type McaAssignedChannel = {
  channelId: number;
  channelName?: string;
  channelLabel?: string;
  channelType: 'channel' | 'aux' | 'fxReturn';
};

export type McaGroup = {
  id: string;
  dcaNumber: number;
  name: string;
  colorToken: McaColorToken;
  faderRawValue: number;
  isMuted: boolean;
  assignedChannels: McaAssignedChannel[];
  assignedChannelIds: number[];
};

export type BusGroupsState = {
  busId: number;
  masterFaderRaw: number;
  masterMuted: boolean;
  mcas: McaGroup[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
};
