import React from 'react';
import { colors } from '@shared/theme/colors';
import { McaGroup } from '../types/busGroups.types';
import { GroupStrip } from './GroupStrip';

type McaStripProps = {
  mca: McaGroup;
  onFaderChange: (value: number) => void;
  onPress: () => void;
  onToggleMute: () => void;
  stripHeight?: number;
};

export const McaStrip = ({
  mca,
  onFaderChange,
  onPress,
  onToggleMute,
  stripHeight,
}: McaStripProps): JSX.Element => (
  <GroupStrip
    accentColor={colors.mca[mca.colorToken]}
    assignmentCount={mca.assignedChannels.length}
    isMuted={mca.isMuted}
    label="MCA"
    name={mca.name}
    onFaderChange={onFaderChange}
    onPress={onPress}
    onToggleMute={onToggleMute}
    stripHeight={stripHeight}
    value={mca.faderRawValue}
  />
);
