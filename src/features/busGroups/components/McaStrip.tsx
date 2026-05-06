import React from 'react';
import { colors } from '@shared/theme/colors';
import { McaGroup } from '../types/busGroups.types';
import { GroupStrip } from './GroupStrip';

type McaStripProps = {
  mca: McaGroup;
  onFaderChange: (value: number) => void;
  onToggleMute: () => void;
};

export const McaStrip = ({ mca, onFaderChange, onToggleMute }: McaStripProps): JSX.Element => (
  <GroupStrip
    accentColor={colors.mca[mca.colorToken]}
    assignmentCount={mca.assignedChannelIds.length}
    isMuted={mca.isMuted}
    label={`MCA ${mca.dcaNumber.toString().padStart(2, '0')}`}
    name={mca.name}
    onFaderChange={onFaderChange}
    onToggleMute={onToggleMute}
    value={mca.faderRawValue}
  />
);
