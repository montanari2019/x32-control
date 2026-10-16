import React from 'react';
import { useValueStore } from '@shared/hooks/useValueStore';
import type { ValueStore } from '@shared/utils/valueStore';
import { GroupStrip } from './GroupStrip';

type MasterStripProps = {
  busId: number;
  busName: string;
  compact?: boolean;
  dragSensitivity?: number;
  isMuted: boolean;
  meterStore: ValueStore<number>;
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
  meterStore,
  onFaderChange,
  onFaderInteractionEnd,
  onFaderInteractionStart,
  onToggleMute,
  stripHeight,
  value,
}: MasterStripProps): JSX.Element => {
  // The meter lives in an external store so its ~20 Hz updates re-render only this strip.
  const meterDbfs = useValueStore(meterStore);

  return (
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
};
