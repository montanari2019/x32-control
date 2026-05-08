import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  PanResponderGestureState,
  PanResponderInstance,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '@shared/theme/colors';
import { x32DbToRaw } from '@shared/utils/faderDb';
import {
  ChannelMeterValues,
  meterValueToPercent,
  SILENCE_DBFS,
  smoothMeterValue,
} from '../utils/meterDecoder';

type VerticalFaderProps = {
  level: number;
  height: number;
  meterChannelId?: number;
  registerMeterListener?: (
    channelId: number,
    listener: (values: ChannelMeterValues) => void,
  ) => () => void;
  onChange: (level: number) => void;
  onChangeEnd: (level: number) => void;
};

const FADER_MIN_DB = -60;
const FADER_MAX_DB = 10;
const RAW_MIN = x32DbToRaw(FADER_MIN_DB);
const RAW_MAX = x32DbToRaw(FADER_MAX_DB);
const THUMB_HEIGHT = 36;
const METER_FRAME_MS = 33;
const METER_STALE_TIMEOUT_MS = 600;
const METER_ATTACK = 0.6;
const METER_RELEASE = 0.2;

const positionToRaw = (position: number): number => {
  const clamped = Math.max(0, Math.min(1, position));
  return RAW_MIN + clamped * (RAW_MAX - RAW_MIN);
};

const rawToPosition = (raw: number): number => {
  const clamped = Math.max(RAW_MIN, Math.min(RAW_MAX, raw));
  return (clamped - RAW_MIN) / (RAW_MAX - RAW_MIN);
};

export const VerticalFader = ({
  level,
  height,
  meterChannelId,
  registerMeterListener,
  onChange,
  onChangeEnd,
}: VerticalFaderProps): JSX.Element => {
  const available = Math.max(1, height - THUMB_HEIGHT);
  const zeroMarkTop = (1 - rawToPosition(x32DbToRaw(0))) * height;
  const animatedY = useRef(new Animated.Value(0)).current;
  const meterHeight = useRef(new Animated.Value(0)).current;
  const availableRef = useRef(available);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const lastMeterUpdateRef = useRef(0);
  const latestMeterDbfsRef = useRef(SILENCE_DBFS);
  const currentMeterPercentRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const onChangeEndRef = useRef(onChangeEnd);

  useEffect(() => {
    availableRef.current = available;
  }, [available]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onChangeEndRef.current = onChangeEnd;
  }, [onChangeEnd]);

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
        onPanResponderGrant: () => {
          isDragging.current = true;
          startY.current = currentY.current;
        },
        onPanResponderMove: (_event, gestureState: PanResponderGestureState) => {
          updateFromY(startY.current + gestureState.dy);
        },
        onPanResponderRelease: (_event, gestureState: PanResponderGestureState) => {
          updateFromY(startY.current + gestureState.dy, true);
          isDragging.current = false;
        },
        onPanResponderTerminate: () => {
          isDragging.current = false;
        },
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

  useEffect(() => {
    if (!meterChannelId || !registerMeterListener) {
      meterHeight.setValue(0);
      return undefined;
    }

    // Previously we rendered on every OSC packet. A paced loop keeps the meter stable and avoids
    // stale values hanging on screen when packets drop.
    const unsubscribe = registerMeterListener(meterChannelId, (values) => {
      latestMeterDbfsRef.current = values.preFadeDbfs;
      lastMeterUpdateRef.current = Date.now();
    });

    const interval = setInterval(() => {
      const now = Date.now();
      const isStale = now - lastMeterUpdateRef.current > METER_STALE_TIMEOUT_MS;
      const targetDbfs = isStale ? SILENCE_DBFS : latestMeterDbfsRef.current;
      const targetPercent = meterValueToPercent(targetDbfs);
      const nextPercent = smoothMeterValue(
        currentMeterPercentRef.current,
        targetPercent,
        METER_ATTACK,
        METER_RELEASE,
      );

      currentMeterPercentRef.current = nextPercent;
      meterHeight.setValue(nextPercent * height);
    }, METER_FRAME_MS);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [height, meterChannelId, meterHeight, registerMeterListener]);

  return (
    <View style={[styles.container, { height }]} {...panResponder.panHandlers}>
      <View style={styles.track}>
        <Animated.View style={[styles.inputMeter, { height: meterHeight }]} />
      </View>
      <View style={[styles.zeroMark, { top: zeroMarkTop }]} />
      <Animated.View style={[styles.thumb, { transform: [{ translateY: animatedY }] }]}>
        <View style={styles.thumbHighlight} />
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
    width: 40,
  },
  track: {
    backgroundColor: colors.fader.track,
    borderRadius: 6,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    width: 8,
  },
  inputMeter: {
    backgroundColor: colors.meter.green,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
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
  zeroMark: {
    backgroundColor: colors.fader.zeroMark,
    height: 2,
    left: 8,
    position: 'absolute',
    right: 8,
  },
});
