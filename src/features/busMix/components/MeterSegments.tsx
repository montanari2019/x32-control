import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@shared/theme/colors';

type Segment = {
  min: number;
  max: number;
  active: string;
  off: string;
};

type MeterSegmentsProps = {
  height: number;
  width: number;
  variant: 'active' | 'off';
};

const SEGMENTS: Segment[] = [
  { min: -60, max: -2, active: colors.meter.green, off: colors.meter.segmentOff.green },
  { min: -2, max: 8, active: colors.meter.yellow, off: colors.meter.segmentOff.yellow },
  { min: 8, max: 10, active: colors.meter.red, off: colors.meter.segmentOff.red },
];

const GAP = 1;
const TOTAL_RANGE = 70;

export const MeterSegments = ({ height, width, variant }: MeterSegmentsProps): JSX.Element => {
  const totalGap = GAP * (SEGMENTS.length - 1);
  const availableHeight = Math.max(1, height - totalGap);
  const visualSegments = [...SEGMENTS].reverse();

  return (
    <View style={[styles.container, { height, width }]}>
      {visualSegments.map((segment, index) => {
        const range = segment.max - segment.min;
        const segmentHeight = Math.max(1, (availableHeight * range) / TOTAL_RANGE);
        const backgroundColor = variant === 'active' ? segment.active : segment.off;
        const isLast = index === visualSegments.length - 1;
        const dynamicStyle = {
          height: segmentHeight,
          backgroundColor,
        };

        return (
          <View
            key={`${segment.min}-${segment.max}-${variant}`}
            style={[styles.segment, dynamicStyle, !isLast && styles.segmentSpacing]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-end',
  },
  segment: {
    borderRadius: 2,
    width: '100%',
  },
  segmentSpacing: {
    marginBottom: GAP,
  },
});
