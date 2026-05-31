import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
  PanResponderInstance,
  StyleSheet,
  View,
} from 'react-native';
import { FaderDbScale } from '@shared/components/FaderDbScale';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { clamp } from '@shared/utils/clamp';
import {
  clampMeterValue,
  METER_GREEN_MAX_DB,
  METER_MAX_DBFS,
  METER_MIN_DBFS,
  METER_YELLOW_MAX_DB,
} from '@features/busMix/utils/meterDecoder';
import { clampFader, faderToPosition, positionToFader } from '../utils/audio';

type VerticalGroupFaderProps = {
  accentColor: string;
  disabled?: boolean;
  dragSensitivity?: number;
  isMaster?: boolean;
  meterDbfs?: number;
  onFaderChange: (value: number) => void;
  onInteractionEnd?: () => void;
  onInteractionStart?: () => void;
  trackHeight?: number;
  value: number;
};

const THUMB_HEIGHT = 34;
const TRACK_EDGE_PADDING = THUMB_HEIGHT / 2;
const THUMB_BOTTOM_GUARD = 8;
const TRACK_TOUCH_WIDTH = 24;
const METER_TOTAL_RANGE = METER_MAX_DBFS - METER_MIN_DBFS;

type MeterLayerRatios = {
  green: number;
  red: number;
  yellow: number;
};

const toPercent = (ratio: number): `${number}%` => `${ratio * 100}%` as `${number}%`;

const getMeterZoneRatio = (dbfs: number, min: number, max: number): number => {
  const clampedDbfs = clampMeterValue(dbfs);
  return clamp(clampedDbfs - min, 0, max - min) / METER_TOTAL_RANGE;
};

const getMeterLayerRatios = (dbfs: number): MeterLayerRatios => ({
  green: getMeterZoneRatio(dbfs, METER_MIN_DBFS, METER_GREEN_MAX_DB),
  yellow: getMeterZoneRatio(dbfs, METER_GREEN_MAX_DB, METER_YELLOW_MAX_DB),
  red: getMeterZoneRatio(dbfs, METER_YELLOW_MAX_DB, METER_MAX_DBFS),
});

const renderMasterMeterFill = (
  isMaster: boolean,
  meterDbfs: number | undefined,
): JSX.Element | null => {
  if (!isMaster || meterDbfs == null) {
    return null;
  }

  const ratios = getMeterLayerRatios(meterDbfs);

  return (
    <View pointerEvents="none" style={styles.meterFillContainer}>
      <View
        style={[styles.meterFillBase, styles.meterFillGreen, { height: toPercent(ratios.green) }]}
      />
      <View
        style={[
          styles.meterFillBase,
          styles.meterFillYellow,
          {
            bottom: toPercent(ratios.green),
            height: toPercent(ratios.yellow),
          },
        ]}
      />
      <View
        style={[
          styles.meterFillBase,
          styles.meterFillRed,
          {
            bottom: toPercent(ratios.green + ratios.yellow),
            height: toPercent(ratios.red),
          },
        ]}
      />
    </View>
  );
};

export const VerticalGroupFader = ({
  accentColor,
  disabled = false,
  dragSensitivity = 1,
  isMaster = false,
  meterDbfs,
  onFaderChange,
  onInteractionEnd,
  onInteractionStart,
  trackHeight = 300,
  value,
}: VerticalGroupFaderProps): JSX.Element => {
  const availableHeight = Math.max(1, trackHeight - THUMB_HEIGHT - THUMB_BOTTOM_GUARD);
  const animatedY = useRef(new Animated.Value(0)).current;
  const currentY = useRef(0);
  const layoutWidth = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const onFaderChangeRef = useRef(onFaderChange);
  useEffect(() => {
    onFaderChangeRef.current = onFaderChange;
  }, [onFaderChange]);

  const onInteractionEndRef = useRef(onInteractionEnd);
  useEffect(() => {
    onInteractionEndRef.current = onInteractionEnd;
  }, [onInteractionEnd]);

  const onInteractionStartRef = useRef(onInteractionStart);
  useEffect(() => {
    onInteractionStartRef.current = onInteractionStart;
  }, [onInteractionStart]);

  const availableHeightRef = useRef(availableHeight);
  useEffect(() => {
    availableHeightRef.current = availableHeight;
  }, [availableHeight]);

  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const dragSensitivityRef = useRef(dragSensitivity);
  useEffect(() => {
    dragSensitivityRef.current = dragSensitivity;
  }, [dragSensitivity]);

  const handleLayout = useCallback((event: LayoutChangeEvent): void => {
    layoutWidth.current = event.nativeEvent.layout.width;
  }, []);

  const isInsideInteractiveArea = useCallback(
    (x: number, y: number): boolean => {
      if (disabledRef.current) {
        return false;
      }

      const width = layoutWidth.current || 70;
      const centerX = width / 2;
      const isOnThumb = y >= currentY.current && y <= currentY.current + THUMB_HEIGHT;
      const isOnTrack =
        Math.abs(x - centerX) <= TRACK_TOUCH_WIDTH / 2 &&
        y >= TRACK_EDGE_PADDING &&
        y <= trackHeight - TRACK_EDGE_PADDING;

      return isOnThumb || isOnTrack;
    },
    [trackHeight],
  );

  const updateFromPosition = useCallback(
    (nextY: number): void => {
      if (disabledRef.current) {
        return;
      }

      const currentAvailable = availableHeightRef.current;
      const clampedY = clamp(nextY, 0, currentAvailable);
      currentY.current = clampedY;
      animatedY.setValue(clampedY);
      onFaderChangeRef.current(clampFader(positionToFader(clampedY, currentAvailable)));
    },
    [animatedY],
  );

  const responder: PanResponderInstance = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (event) =>
          isInsideInteractiveArea(event.nativeEvent.locationX, event.nativeEvent.locationY),
        onMoveShouldSetPanResponder: (event) =>
          isInsideInteractiveArea(event.nativeEvent.locationX, event.nativeEvent.locationY),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          isDragging.current = true;
          startY.current = currentY.current;
          onInteractionStartRef.current?.();
        },
        onPanResponderMove: (_event, gestureState: PanResponderGestureState) => {
          updateFromPosition(startY.current + gestureState.dy * dragSensitivityRef.current);
        },
        onPanResponderRelease: (_event, gestureState: PanResponderGestureState) => {
          updateFromPosition(startY.current + gestureState.dy * dragSensitivityRef.current);
          isDragging.current = false;
          onInteractionEndRef.current?.();
        },
        onPanResponderTerminate: () => {
          isDragging.current = false;
          onInteractionEndRef.current?.();
        },
        onShouldBlockNativeResponder: () => true,
      }),
    [isInsideInteractiveArea, updateFromPosition],
  );

  useEffect(() => {
    if (isDragging.current) {
      return;
    }

    const nextY = faderToPosition(clampFader(value), availableHeight);
    const diff = Math.abs(nextY - currentY.current);
    currentY.current = nextY;

    animatedY.stopAnimation();

    if (diff < 1) {
      animatedY.setValue(nextY);
      return;
    }

    Animated.timing(animatedY, {
      toValue: nextY,
      duration: diff < 8 ? 40 : 80,
      useNativeDriver: true,
    }).start();
  }, [animatedY, availableHeight, value]);

  return (
    <View
      style={[styles.container, { height: trackHeight }, disabled ? styles.disabled : undefined]}
      onLayout={handleLayout}
      {...(disabled ? {} : responder.panHandlers)}
    >
      <View
        style={[
          styles.track,
          isMaster ? styles.masterTrack : styles.mcaTrack,
          { backgroundColor: isMaster ? colors.master.track : colors.surface.control },
          { marginBottom: TRACK_EDGE_PADDING + THUMB_BOTTOM_GUARD, marginTop: TRACK_EDGE_PADDING },
        ]}
      >
        {renderMasterMeterFill(isMaster, meterDbfs)}
      </View>
      <View
        style={[
          styles.dbScale,
          {
            height: availableHeight,
            top: TRACK_EDGE_PADDING,
          },
        ]}
      >
        <FaderDbScale height={availableHeight} />
      </View>
      <Animated.View
        style={[
          styles.thumb,
          isMaster ? styles.masterThumb : styles.mcaThumb,
          {
            backgroundColor: isMaster ? colors.master.thumb : accentColor,
            borderColor: isMaster ? colors.master.label : accentColor,
            transform: [{ translateY: animatedY }],
          },
        ]}
      >
        <View style={styles.thumbLine} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
    width: '100%',
  },
  disabled: {
    opacity: 0.4,
  },
  dbScale: {
    left: '50%',
    marginLeft: spacing.xxs,
    position: 'absolute',
  },
  masterThumb: {
    left: 8,
    right: 8,
  },
  masterTrack: {
    width: 5,
  },
  meterFillBase: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  meterFillContainer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  meterFillGreen: {
    backgroundColor: colors.meter.green,
  },
  meterFillRed: {
    backgroundColor: colors.meter.red,
  },
  meterFillYellow: {
    backgroundColor: colors.meter.yellow,
  },
  mcaThumb: {
    left: 8,
    right: 8,
  },
  mcaTrack: {
    width: 5,
  },
  thumb: {
    borderRadius: radius.sm,
    borderWidth: 1,
    elevation: 3,
    height: THUMB_HEIGHT,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    top: 0,
    zIndex: 2,
  },
  thumbLine: {
    backgroundColor: 'rgba(7, 16, 29, 0.55)',
    height: 2,
    left: 8,
    marginTop: THUMB_HEIGHT / 2 - 1,
    position: 'absolute',
    right: 8,
  },
  track: {
    borderRadius: radius.pill,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
});
