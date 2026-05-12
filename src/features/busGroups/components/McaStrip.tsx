import React from 'react';
import { colors } from '@shared/theme/colors';
import { LANDSCAPE_FADER_DRAG_SENSITIVITY } from '@shared/utils/faderInteraction';
import { McaGroup } from '../types/busGroups.types';
import { GroupStrip } from './GroupStrip';

type McaStripProps = {
  compact?: boolean;
  mca: McaGroup;
  onFaderChange: (value: number) => void;
  onPress: () => void;
  onToggleMute: () => void;
  stripHeight?: number;
};

export const McaStrip = ({
  compact = false,
  mca,
  onFaderChange,
  onPress,
  onToggleMute,
  stripHeight,
}: McaStripProps): JSX.Element => (
  <GroupStrip
    accentColor={colors.mca[mca.colorToken]}
    assignmentCount={mca.assignedChannels.length}
    compact={compact}
    dragSensitivity={LANDSCAPE_FADER_DRAG_SENSITIVITY}
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
