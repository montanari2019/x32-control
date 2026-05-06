import React from 'react';
import { GroupStrip } from './GroupStrip';

type MasterStripProps = {
  busId: number;
  busName: string;
  isMuted: boolean;
  onFaderChange: (value: number) => void;
  onToggleMute: () => void;
  value: number;
};

export const MasterStrip = ({
  busId,
  busName,
  isMuted,
  onFaderChange,
  onToggleMute,
  value,
}: MasterStripProps): JSX.Element => (
  <GroupStrip
    accentColor="#D8DDE5"
    isMaster
    isMuted={isMuted}
    label={`BUS ${busId.toString().padStart(2, '0')}`}
    name={busName}
    onFaderChange={onFaderChange}
    onToggleMute={onToggleMute}
    value={value}
  />
);
