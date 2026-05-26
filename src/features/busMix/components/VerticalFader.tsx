import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  onInteractionEnd?: () => void;
  onInteractionStart?: () => void;
};

const FADER_MIN_DB = -60;
const FADER_MAX_DB = 10;
const RAW_MIN = x32DbToRaw(FADER_MIN_DB);
const RAW_MAX = x32DbToRaw(FADER_MAX_DB);
const THUMB_WIDTH = 36;
const THUMB_HEIGHT = 52;
const THUMB_RADIUS = 15;
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
  onInteractionEnd,
  onInteractionStart,
}: VerticalFaderProps): JSX.Element => {
  const trackHeight = Math.max(1, height - VERTICAL_INSET * 2);
  const available = Math.max(1, trackHeight - THUMB_HEIGHT);
  const zeroMarkTop = (1 - rawToPosition(x32DbToRaw(0))) * trackHeight;
  const animatedY = useRef(new Animated.Value(0)).current;
  const availableRef = useRef(available);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const [isThumbPressed, setIsThumbPressed] = useState(false);
  const onChangeRef = useRef(onChange);
  const onChangeEndRef = useRef(onChangeEnd);
  const onInteractionEndRef = useRef(onInteractionEnd);
  const onInteractionStartRef = useRef(onInteractionStart);
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
    onInteractionEndRef.current = onInteractionEnd;
  }, [onInteractionEnd]);

  useEffect(() => {
    onInteractionStartRef.current = onInteractionStart;
  }, [onInteractionStart]);

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
          setIsThumbPressed(true);
          startY.current = currentY.current;
          onInteractionStartRef.current?.();
        },
        onPanResponderMove: (_event, gestureState: PanResponderGestureState) => {
          updateFromY(startY.current + gestureState.dy * dragSensitivityRef.current);
        },
        onPanResponderRelease: (_event, gestureState: PanResponderGestureState) => {
          updateFromY(startY.current + gestureState.dy * dragSensitivityRef.current, true);
          isDragging.current = false;
          setIsThumbPressed(false);
          onInteractionEndRef.current?.();
        },
        onPanResponderTerminate: () => {
          isDragging.current = false;
          setIsThumbPressed(false);
          onInteractionEndRef.current?.();
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
    <View style={[styles.container, { height }]}>
      <View style={styles.trackBounds}>
        <View style={styles.track} />
        <View style={[styles.zeroMark, { top: zeroMarkTop }]} />
        <View style={[styles.dbScale, { height: trackHeight }]}>
          <FaderDbScale height={trackHeight} />
        </View>
        <Animated.View
          style={[
            styles.thumb,
            isThumbPressed && styles.thumbPressed,
            { transform: [{ translateY: animatedY }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View pointerEvents="none" style={styles.thumbSurface}>
            <View style={styles.thumbLeftShade} />
            <View style={styles.thumbRightShade} />
            <View style={styles.thumbTopLight} />
            <View style={styles.thumbBottomShade} />
            <View style={[styles.thumbGroove, styles.thumbGrooveTopFirst]} />
            <View style={[styles.thumbGroove, styles.thumbGrooveTopSecond]} />
            <View style={styles.thumbCenterLine} />
            <View style={[styles.thumbGroove, styles.thumbGrooveBottomFirst]} />
            <View style={[styles.thumbGroove, styles.thumbGrooveBottomSecond]} />
          </View>
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
    width: 46,
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
    backgroundColor: '#CFCFCF',
    borderRadius: THUMB_RADIUS,
    elevation: 8,
    height: THUMB_HEIGHT,
    left: '50%',
    marginLeft: -THUMB_WIDTH / 2,
    opacity: 0.8,
    overflow: 'visible',
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.42,
    shadowRadius: 11,
    top: 0,
    width: THUMB_WIDTH,
    zIndex: 3,
  },
  thumbBottomShade: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderBottomLeftRadius: THUMB_RADIUS,
    borderBottomRightRadius: THUMB_RADIUS,
    bottom: 0,
    height: 16,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  thumbCenterLine: {
    alignSelf: 'center',
    backgroundColor: '#8A8A84',
    borderRadius: 1,
    height: 2,
    position: 'absolute',
    top: 25,
    width: 25,
  },
  thumbGroove: {
    alignSelf: 'center',
    backgroundColor: '#C8C8C2',
    borderBottomColor: 'rgba(255, 255, 255, 0.65)',
    borderBottomWidth: 1,
    borderRadius: 2,
    borderTopColor: 'rgba(0, 0, 0, 0.18)',
    borderTopWidth: 1,
    height: 4,
    position: 'absolute',
    width: 24,
  },
  thumbGrooveBottomFirst: {
    top: 34,
  },
  thumbGrooveBottomSecond: {
    top: 41,
  },
  thumbGrooveTopFirst: {
    top: 10,
  },
  thumbGrooveTopSecond: {
    top: 17,
  },
  thumbLeftShade: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderBottomLeftRadius: THUMB_RADIUS,
    borderTopLeftRadius: THUMB_RADIUS,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 8,
  },
  thumbPressed: {
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 7,
  },
  thumbRightShade: {
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
    borderBottomRightRadius: THUMB_RADIUS,
    borderTopRightRadius: THUMB_RADIUS,
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 9,
  },
  thumbSurface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#CFCFCF',
    borderColor: '#CFCFC8',
    borderRadius: THUMB_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbTopLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderTopLeftRadius: THUMB_RADIUS,
    borderTopRightRadius: THUMB_RADIUS,
    height: 16,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
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
