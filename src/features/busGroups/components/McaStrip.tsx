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

const MCA_FADER_DRAG_SENSITIVITY = 0.45;

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
    dragSensitivity={MCA_FADER_DRAG_SENSITIVITY}
    isFaderDisabled={mca.assignedChannels.length === 0}
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
