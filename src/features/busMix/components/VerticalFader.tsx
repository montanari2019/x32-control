import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  PanResponderGestureState,
  PanResponderInstance,
  StyleSheet,
  View,
} from 'react-native';
import { FaderDbScale } from '@shared/components/FaderDbScale';
import { colors } from '@shared/theme/colors';
import { spacing } from '@shared/theme/spacing';
import { x32DbToRaw } from '@shared/utils/faderDb';

type VerticalFaderProps = {
  dragSensitivity?: number;
  level: number;
  height: number;
  onChange: (level: number) => void;
  onChangeEnd: (level: number) => void;
};

const FADER_MIN_DB = -60;
const FADER_MAX_DB = 10;
const RAW_MIN = x32DbToRaw(FADER_MIN_DB);
const RAW_MAX = x32DbToRaw(FADER_MAX_DB);
const THUMB_HEIGHT = 36;
const VERTICAL_INSET = 8;

const positionToRaw = (position: number): number => {
  const clamped = Math.max(0, Math.min(1, position));
  return RAW_MIN + clamped * (RAW_MAX - RAW_MIN);
};

const rawToPosition = (raw: number): number => {
  const clamped = Math.max(RAW_MIN, Math.min(RAW_MAX, raw));
  return (clamped - RAW_MIN) / (RAW_MAX - RAW_MIN);
};

export const VerticalFader = ({
  dragSensitivity = 1,
  level,
  height,
  onChange,
  onChangeEnd,
}: VerticalFaderProps): JSX.Element => {
  const trackHeight = Math.max(1, height - VERTICAL_INSET * 2);
  const available = Math.max(1, trackHeight - THUMB_HEIGHT);
  const zeroMarkTop = (1 - rawToPosition(x32DbToRaw(0))) * trackHeight;
  const animatedY = useRef(new Animated.Value(0)).current;
  const availableRef = useRef(available);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const onChangeRef = useRef(onChange);
  const onChangeEndRef = useRef(onChangeEnd);
  const dragSensitivityRef = useRef(dragSensitivity);

  useEffect(() => {
    availableRef.current = available;
  }, [available]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onChangeEndRef.current = onChangeEnd;
  }, [onChangeEnd]);

  useEffect(() => {
    dragSensitivityRef.current = dragSensitivity;
  }, [dragSensitivity]);

  const updateFromY = useCallback(
    (y: number, emitEnd = false): void => {
      const currentAvailable = availableRef.current;
      const clampedY = Math.max(0, Math.min(currentAvailable, y));
      const position = 1 - clampedY / currentAvailable;
      const nextLevel = positionToRaw(position);
      currentY.current = clampedY;
      animatedY.setValue(clampedY);
      if (emitEnd) {
        onChangeEndRef.current(nextLevel);
      } else {
        onChangeRef.current(nextLevel);
      }
    },
    [animatedY],
  );

  const panResponder: PanResponderInstance = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          isDragging.current = true;
          startY.current = currentY.current;
        },
        onPanResponderMove: (_event, gestureState: PanResponderGestureState) => {
          updateFromY(startY.current + gestureState.dy * dragSensitivityRef.current);
        },
        onPanResponderRelease: (_event, gestureState: PanResponderGestureState) => {
          updateFromY(startY.current + gestureState.dy * dragSensitivityRef.current, true);
          isDragging.current = false;
        },
        onPanResponderTerminate: () => {
          isDragging.current = false;
        },
        onShouldBlockNativeResponder: () => true,
      }),
    [updateFromY],
  );

  useEffect(() => {
    if (isDragging.current) {
      return;
    }

    const position = rawToPosition(level);
    const nextY = (1 - position) * available;
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
  }, [animatedY, available, level]);

  return (
    <View style={[styles.container, { height }]} {...panResponder.panHandlers}>
      <View style={styles.trackBounds}>
        <View style={styles.track} />
        <View style={[styles.zeroMark, { top: zeroMarkTop }]} />
        <View style={[styles.dbScale, { height: trackHeight }]}>
          <FaderDbScale height={trackHeight} />
        </View>
        <Animated.View style={[styles.thumb, { transform: [{ translateY: animatedY }] }]}>
          <View style={styles.thumbHighlight} />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    paddingVertical: VERTICAL_INSET,
    position: 'relative',
    width: 40,
  },
  dbScale: {
    left: '50%',
    marginLeft: spacing.xxs,
    position: 'absolute',
    top: 0,
  },
  track: {
    backgroundColor: colors.fader.track,
    borderRadius: 6,
    flex: 1,
    width: 8,
  },
  thumb: {
    backgroundColor: colors.fader.thumb,
    borderRadius: 8,
    borderColor: colors.fader.zeroMark,
    borderWidth: 1,
    elevation: 2,
    height: THUMB_HEIGHT,
    left: 2,
    position: 'absolute',
    right: 2,
    shadowColor: colors.fader.thumbShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.65,
    shadowRadius: 6,
    top: 0,
    zIndex: 2,
  },
  thumbHighlight: {
    backgroundColor: colors.fader.thumbHighlight,
    borderRadius: 4,
    height: 5,
    marginHorizontal: 6,
    marginTop: 4,
  },
  trackBounds: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  zeroMark: {
    backgroundColor: colors.fader.zeroMark,
    height: 2,
    left: 8,
    position: 'absolute',
    right: 8,
  },
});
