import React from 'react';
import { GroupStrip } from './GroupStrip';

type MasterStripProps = {
  busId: number;
  busName: string;
  compact?: boolean;
  dragSensitivity?: number;
  isMuted: boolean;
  meterDbfs?: number;
  onFaderChange: (value: number) => void;
  onFaderInteractionEnd?: () => void;
  onFaderInteractionStart?: () => void;
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
  meterDbfs,
  onFaderChange,
  onFaderInteractionEnd,
  onFaderInteractionStart,
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
    meterDbfs={meterDbfs}
    name={busName}
    onFaderChange={onFaderChange}
    onFaderInteractionEnd={onFaderInteractionEnd}
    onFaderInteractionStart={onFaderInteractionStart}
    onToggleMute={onToggleMute}
    stripHeight={stripHeight}
    value={value}
  />
);
