import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import { ChannelMeterValues, dbfsToMeterHeight } from '../utils/meterDecoder';
import { PeakHoldState, updatePeakHold } from '../utils/peakHold';
import { MeterSegments } from './MeterSegments';

type ChannelVuMeterProps = {
  channelId: number;
  height: number;
  width: number;
  registerMeterListener: (
    channelId: number,
    listener: (values: ChannelMeterValues) => void,
  ) => () => void;
};

export const ChannelVuMeter = ({
  channelId,
  height,
  width,
  registerMeterListener,
}: ChannelVuMeterProps): JSX.Element => {
  const meterScale = useRef(new Animated.Value(0)).current;
  const peakOffset = useRef(new Animated.Value(0)).current;
  const clipOpacity = useRef(new Animated.Value(0.2)).current;
  const peakStateRef = useRef<PeakHoldState>({ peakDb: -60, peakHoldFrames: 0 });
  const currentLevelRef = useRef(0);
  const currentClipOpacityRef = useRef(0.2);
  const currentPeakPxRef = useRef(0);
  const meterTranslateY = meterScale.interpolate({
    inputRange: [0, 1],
    outputRange: [height / 2, 0],
  });

  const updateMeter = useCallback(
    (values: ChannelMeterValues) => {
      const nextLevel = dbfsToMeterHeight(values.preFadeDbfs);
      const prevLevel = currentLevelRef.current;
      const delta = Math.abs(nextLevel - currentLevelRef.current);
      const nextPeakState = updatePeakHold(values.preFadeDbfs, peakStateRef.current);
      peakStateRef.current = nextPeakState;
      const nextPeakPx = dbfsToMeterHeight(nextPeakState.peakDb) * height;
      const isRising = nextLevel > prevLevel;
      const nextClipOpacity = values.preFadeDbfs > 8 ? 1 : 0;

      if (delta < 0.015) {
        meterScale.setValue(nextLevel);
      } else {
        meterScale.stopAnimation();
        Animated.timing(meterScale, {
          toValue: nextLevel,
          duration: isRising ? 5 : 160,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }

      if (Math.abs(nextPeakPx - currentPeakPxRef.current) >= 0.5) {
        peakOffset.setValue(nextPeakPx);
        currentPeakPxRef.current = nextPeakPx;
      }

      if (nextClipOpacity !== currentClipOpacityRef.current) {
        clipOpacity.stopAnimation();
        Animated.timing(clipOpacity, {
          toValue: nextClipOpacity,
          duration: nextClipOpacity === 1 ? 0 : 200,
          useNativeDriver: true,
        }).start();
        currentClipOpacityRef.current = nextClipOpacity;
      }

      currentLevelRef.current = nextLevel;
    },
    [clipOpacity, height, meterScale, peakOffset],
  );

  useEffect(
    () => registerMeterListener(channelId, updateMeter),
    [channelId, registerMeterListener, updateMeter],
  );

  return (
    <View style={[styles.container, { height, width }]}>
      <MeterSegments height={height} width={width} variant="off" />
      <Animated.View
        style={[
          styles.activeMask,
          {
            transform: [{ translateY: meterTranslateY }, { scaleY: meterScale }],
          },
        ]}
      >
        <MeterSegments height={height} width={width} variant="active" />
      </Animated.View>
      <Animated.View style={[styles.peakMarker, { bottom: peakOffset }]} />
      <Animated.View style={[styles.clip, { opacity: clipOpacity }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  activeMask: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  clip: {
    backgroundColor: colors.meter.clip,
    borderRadius: 3,
    height: 6,
    left: 1,
    position: 'absolute',
    right: 1,
    top: 0,
  },
  container: {
    backgroundColor: colors.meter.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  peakMarker: {
    backgroundColor: colors.meter.peak,
    height: 2,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
