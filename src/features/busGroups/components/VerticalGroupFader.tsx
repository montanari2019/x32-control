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
import { radius } from '@shared/theme/radius';
import { clamp } from '@shared/utils/clamp';
import { clampFader, faderToPosition, positionToFader } from '../utils/audio';

type VerticalGroupFaderProps = {
  accentColor: string;
  isMaster?: boolean;
  onFaderChange: (value: number) => void;
  trackHeight?: number;
  value: number;
};

const THUMB_HEIGHT = 34;
const TRACK_EDGE_PADDING = THUMB_HEIGHT / 2;
const THUMB_BOTTOM_GUARD = 8;

export const VerticalGroupFader = ({
  accentColor,
  isMaster = false,
  onFaderChange,
  trackHeight = 300,
  value,
}: VerticalGroupFaderProps): JSX.Element => {
  const availableHeight = Math.max(1, trackHeight - THUMB_HEIGHT - THUMB_BOTTOM_GUARD);
  const animatedY = useRef(new Animated.Value(0)).current;
  const currentY = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const updateFromPosition = useCallback(
    (nextY: number): void => {
      const clampedY = clamp(nextY, 0, availableHeight);
      currentY.current = clampedY;
      animatedY.setValue(clampedY);
      onFaderChange(clampFader(positionToFader(clampedY, availableHeight)));
    },
    [animatedY, availableHeight, onFaderChange],
  );

  const responder: PanResponderInstance = useMemo(
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
          updateFromPosition(startY.current + gestureState.dy);
        },
        onPanResponderRelease: (_event, gestureState: PanResponderGestureState) => {
          updateFromPosition(startY.current + gestureState.dy);
          isDragging.current = false;
        },
        onPanResponderTerminate: () => {
          isDragging.current = false;
        },
        onShouldBlockNativeResponder: () => true,
      }),
    [updateFromPosition],
  );

  useEffect(() => {
    if (isDragging.current) {
      return;
    }

    const nextY = faderToPosition(clampFader(value), availableHeight);
    currentY.current = nextY;
    Animated.spring(animatedY, {
      toValue: nextY,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  }, [animatedY, availableHeight, value]);

  return (
    <View style={[styles.container, { height: trackHeight }]} {...responder.panHandlers}>
      <View
        style={[
          styles.track,
          isMaster ? styles.masterTrack : styles.mcaTrack,
          { backgroundColor: isMaster ? colors.master.track : colors.surface.control },
          { marginBottom: TRACK_EDGE_PADDING + THUMB_BOTTOM_GUARD, marginTop: TRACK_EDGE_PADDING },
        ]}
      />
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
  masterThumb: {
    left: 10,
    right: 10,
  },
  masterTrack: {
    width: 6,
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
  },
});
