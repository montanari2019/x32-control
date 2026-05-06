export type McaColorToken = 'blue' | 'green' | 'yellow' | 'pink' | 'purple';

export type McaGroup = {
  id: string;
  dcaNumber: number;
  name: string;
  colorToken: McaColorToken;
  faderRawValue: number;
  isMuted: boolean;
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
