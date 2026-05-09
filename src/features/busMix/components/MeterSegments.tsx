import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import {
  METER_GREEN_MAX_DB,
  METER_MAX_DBFS,
  METER_MIN_DBFS,
  METER_YELLOW_MAX_DB,
} from '../utils/meterDecoder';

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

export const METER_SEGMENT_GAP = 1;

const SEGMENTS: Segment[] = [
  {
    min: METER_MIN_DBFS,
    max: METER_GREEN_MAX_DB,
    active: colors.meter.green,
    off: colors.meter.off,
  },
  {
    min: METER_GREEN_MAX_DB,
    max: METER_YELLOW_MAX_DB,
    active: colors.meter.yellow,
    off: colors.meter.off,
  },
  {
    min: METER_YELLOW_MAX_DB,
    max: METER_MAX_DBFS,
    active: colors.meter.red,
    off: colors.meter.off,
  },
];

const TOTAL_RANGE = METER_MAX_DBFS - METER_MIN_DBFS;

export type MeterSegmentLayout = Segment & {
  bottom: number;
  segmentHeight: number;
};

export const getMeterSegmentLayout = (height: number): MeterSegmentLayout[] => {
  const totalGap = METER_SEGMENT_GAP * (SEGMENTS.length - 1);
  const availableHeight = Math.max(1, height - totalGap);
  let nextBottom = 0;

  return SEGMENTS.map((segment, index) => {
    const range = segment.max - segment.min;
    const segmentHeight = Math.max(1, (availableHeight * range) / TOTAL_RANGE);
    const layout: MeterSegmentLayout = {
      ...segment,
      bottom: nextBottom,
      segmentHeight,
    };

    nextBottom += segmentHeight + (index < SEGMENTS.length - 1 ? METER_SEGMENT_GAP : 0);
    return layout;
  });
};

export const MeterSegments = ({ height, width, variant }: MeterSegmentsProps): JSX.Element => {
  const visualSegments = [...getMeterSegmentLayout(height)].reverse();

  return (
    <View style={[styles.container, { height, width }]}>
      {visualSegments.map((segment, index) => {
        const backgroundColor = variant === 'active' ? segment.active : segment.off;
        const isLast = index === visualSegments.length - 1;
        const dynamicStyle = {
          height: segment.segmentHeight,
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
    marginBottom: METER_SEGMENT_GAP,
  },
});
