import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius } from '@shared/theme/radius';
import { colors } from '@shared/theme/colors';
import {
  ChannelMeterValues,
  getMeterFillRatios,
  METER_GREEN_MAX_DB,
  METER_MAX_DBFS,
  METER_MIN_DBFS,
  METER_YELLOW_MAX_DB,
} from '../utils/meterDecoder';

type ChannelVuMeterProps = {
  channelId: number;
  height: number;
  width: number;
  registerMeterListener: (
    channelId: number,
    listener: (values: ChannelMeterValues) => void,
  ) => () => void;
};

const METER_SEGMENT_HEIGHT = 4.82;
const METER_SEGMENT_GAP = 1;
const METER_VERTICAL_INSET = 8;

type MeterZoneSegmentCounts = {
  green: number;
  red: number;
  yellow: number;
};

const getMeterSegmentCount = (height: number): number =>
  Math.max(
    1,
    Math.floor((height + METER_SEGMENT_GAP) / (METER_SEGMENT_HEIGHT + METER_SEGMENT_GAP)),
  );

const getZoneSegmentCounts = (segmentCount: number): MeterZoneSegmentCounts => {
  if (segmentCount <= 2) {
    return { green: segmentCount, red: 0, yellow: 0 };
  }

  const totalRange = METER_MAX_DBFS - METER_MIN_DBFS;
  const yellowRange = METER_YELLOW_MAX_DB - METER_GREEN_MAX_DB;
  const redRange = METER_MAX_DBFS - METER_YELLOW_MAX_DB;
  const red =
    segmentCount >= 8 ? Math.max(2, Math.round((segmentCount * redRange) / totalRange)) : 1;
  const yellow = Math.max(1, Math.round((segmentCount * yellowRange) / totalRange));
  const green = Math.max(1, segmentCount - yellow - red);

  return {
    green,
    red: Math.max(0, segmentCount - green - yellow),
    yellow,
  };
};

const getZoneActiveCount = (ratio: number, segmentCount: number): number =>
  Math.min(segmentCount, Math.max(0, Math.floor(ratio * segmentCount + 0.0001)));

const getActiveSegmentCount = (dbfs: number, zoneCounts: MeterZoneSegmentCounts): number => {
  const ratios = getMeterFillRatios(dbfs);

  return (
    getZoneActiveCount(ratios.green, zoneCounts.green) +
    getZoneActiveCount(ratios.yellow, zoneCounts.yellow) +
    getZoneActiveCount(ratios.red, zoneCounts.red)
  );
};

const toPercent = (ratio: number): `${number}%` => `${ratio * 100}%` as `${number}%`;

const ChannelVuMeterComponent = ({
  channelId,
  height,
  width,
  registerMeterListener,
}: ChannelVuMeterProps): JSX.Element => {
  const meterHeight = Math.max(1, height - METER_VERTICAL_INSET * 2);
  const segmentCount = getMeterSegmentCount(meterHeight);
  const zoneCounts = useMemo(() => getZoneSegmentCounts(segmentCount), [segmentCount]);
  const [activeSegmentCount, setActiveSegmentCount] = useState(0);
  const activeSegmentCountRef = useRef(0);

  useEffect(() => {
    const nextActiveSegmentCount = getActiveSegmentCount(METER_MIN_DBFS, zoneCounts);
    activeSegmentCountRef.current = nextActiveSegmentCount;
    setActiveSegmentCount(nextActiveSegmentCount);
  }, [zoneCounts]);

  const updateMeter = useCallback(
    (values: ChannelMeterValues) => {
      const nextActiveSegmentCount = getActiveSegmentCount(values.preFadeDbfs, zoneCounts);
      if (nextActiveSegmentCount !== activeSegmentCountRef.current) {
        activeSegmentCountRef.current = nextActiveSegmentCount;
        setActiveSegmentCount(nextActiveSegmentCount);
      }
    },
    [zoneCounts],
  );

  useEffect(
    () => registerMeterListener(channelId, updateMeter),
    [channelId, registerMeterListener, updateMeter],
  );

  const totalSegments = Math.max(1, zoneCounts.green + zoneCounts.yellow + zoneCounts.red);
  const activeGreenSegments = Math.min(activeSegmentCount, zoneCounts.green);
  const activeYellowSegments = Math.min(
    Math.max(0, activeSegmentCount - zoneCounts.green),
    zoneCounts.yellow,
  );
  const activeRedSegments = Math.max(0, activeSegmentCount - zoneCounts.green - zoneCounts.yellow);
  const greenRatio = activeGreenSegments / totalSegments;
  const yellowRatio = activeYellowSegments / totalSegments;
  const redRatio = activeRedSegments / totalSegments;

  return (
    <View pointerEvents="none" style={[styles.container, { height, width }]}>
      <View style={styles.track}>
        <View style={[styles.fillBase, styles.fillGreen, { height: toPercent(greenRatio) }]} />
        {yellowRatio > 0 ? (
          <View
            style={[
              styles.fillBase,
              styles.fillYellow,
              {
                bottom: toPercent(greenRatio),
                height: toPercent(yellowRatio),
              },
            ]}
          />
        ) : null}
        {redRatio > 0 ? (
          <View
            style={[
              styles.fillBase,
              styles.fillRed,
              {
                bottom: toPercent(greenRatio + yellowRatio),
                height: toPercent(redRatio),
              },
            ]}
          />
        ) : null}
      </View>
    </View>
  );
};

export const ChannelVuMeter = React.memo(
  ChannelVuMeterComponent,
  (prev, next) =>
    prev.channelId === next.channelId &&
    prev.height === next.height &&
    prev.width === next.width &&
    prev.registerMeterListener === next.registerMeterListener,
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: METER_VERTICAL_INSET,
  },
  fillBase: {
    borderRadius: radius.xs,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  fillGreen: {
    backgroundColor: colors.meter.green,
  },
  fillRed: {
    backgroundColor: colors.meter.red,
  },
  fillYellow: {
    backgroundColor: colors.meter.yellow,
  },
  track: {
    backgroundColor: colors.meter.background,
    borderRadius: radius.xs,
    flex: 1,
    position: 'relative',
    width: '100%',
  },
});
