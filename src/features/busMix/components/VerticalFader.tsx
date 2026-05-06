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
import { dbToLevel, denormalizeTrackToDb, normalizeDbToTrack } from '@shared/utils/faderDb';
import { levelToDb } from '@shared/utils/levelToDb';

type VerticalFaderProps = {
  level: number;
  height: number;
  onChange: (level: number) => void;
  onChangeEnd: (level: number) => void;
};

const THUMB_HEIGHT = 28;

export const VerticalFader = ({
  level,
  height,
  onChange,
  onChangeEnd,
}: VerticalFaderProps): JSX.Element => {
  const available = Math.max(1, height - THUMB_HEIGHT);
  const zeroMarkTop = (1 - normalizeDbToTrack(0)) * height;
  const animatedY = useRef(new Animated.Value(0)).current;
  const currentY = useRef(0);
  const startY = useRef(0);

  const updateFromY = useCallback(
    (y: number, emitEnd = false): void => {
      const clampedY = Math.max(0, Math.min(available, y));
      const position = 1 - clampedY / available;
      const db = denormalizeTrackToDb(position);
      const nextLevel = dbToLevel(db);
      currentY.current = clampedY;
      if (emitEnd) {
        onChangeEnd(nextLevel);
      } else {
        onChange(nextLevel);
      }
    },
    [available, onChange, onChangeEnd],
  );

  const panResponder: PanResponderInstance = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          startY.current = currentY.current;
          const pressY = event.nativeEvent.locationY - THUMB_HEIGHT / 2;
          updateFromY(pressY);
        },
        onPanResponderMove: (_event, gestureState: PanResponderGestureState) => {
          updateFromY(startY.current + gestureState.dy);
        },
        onPanResponderRelease: (_event, gestureState: PanResponderGestureState) => {
          updateFromY(startY.current + gestureState.dy, true);
        },
      }),
    [updateFromY],
  );

  useEffect(() => {
    const db = levelToDb(level);
    const position = normalizeDbToTrack(db);
    const nextY = (1 - position) * available;
    currentY.current = nextY;
    Animated.spring(animatedY, {
      toValue: nextY,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  }, [animatedY, available, level]);

  return (
    <View style={[styles.container, { height }]} {...panResponder.panHandlers}>
      <View style={styles.track} />
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
    width: 34,
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
    left: 4,
    position: 'absolute',
    right: 4,
    shadowColor: colors.fader.thumbShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.65,
    shadowRadius: 6,
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
