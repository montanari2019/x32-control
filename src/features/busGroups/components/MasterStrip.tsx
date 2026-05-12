import React from 'react';
import { GroupStrip } from './GroupStrip';

type MasterStripProps = {
  busId: number;
  busName: string;
  compact?: boolean;
  dragSensitivity?: number;
  isMuted: boolean;
  onFaderChange: (value: number) => void;
  onToggleMute: () => void;
  stripHeight?: number;
  value: number;
};

export const MasterStrip = ({
  busId,
  busName,
  compact = false,
  dragSensitivity,
  isMuted,
  onFaderChange,
  onToggleMute,
  stripHeight,
  value,
}: MasterStripProps): JSX.Element => (
  <GroupStrip
    accentColor="#D8DDE5"
    compact={compact}
    dragSensitivity={dragSensitivity}
    isMaster
    isMuted={isMuted}
    label={`BUS ${busId.toString().padStart(2, '0')}`}
    name={busName}
    onFaderChange={onFaderChange}
    onToggleMute={onToggleMute}
    stripHeight={stripHeight}
    value={value}
  />
);
