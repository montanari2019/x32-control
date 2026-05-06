import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import { ChannelMeterValues, dbToMeterHeight } from '../utils/meterDecoder';
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
  const meterHeight = useRef(new Animated.Value(0)).current;
  const peakOffset = useRef(new Animated.Value(0)).current;
  const clipOpacity = useRef(new Animated.Value(0.2)).current;
  const peakStateRef = useRef<PeakHoldState>({ peakDb: -60, peakHoldFrames: 0 });
  const currentLevelRef = useRef(0);

  const updateMeter = useCallback(
    (values: ChannelMeterValues) => {
      const nextLevel = dbToMeterHeight(values.postFadeDb);
      const nextPeakState = updatePeakHold(values.preFadeDb, peakStateRef.current);
      peakStateRef.current = nextPeakState;
      const nextPeak = dbToMeterHeight(nextPeakState.peakDb);

      Animated.timing(meterHeight, {
        toValue: nextLevel * height,
        duration: nextLevel > currentLevelRef.current ? 5 : 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();

      Animated.timing(peakOffset, {
        toValue: nextPeak * height,
        duration: 80,
        useNativeDriver: false,
      }).start();

      Animated.timing(clipOpacity, {
        toValue: values.postFadeDb >= 0 ? 1 : 0.2,
        duration: 80,
        useNativeDriver: false,
      }).start();

      currentLevelRef.current = nextLevel;
    },
    [clipOpacity, height, meterHeight, peakOffset],
  );

  useEffect(
    () => registerMeterListener(channelId, updateMeter),
    [channelId, registerMeterListener, updateMeter],
  );

  return (
    <View style={[styles.container, { height, width }]}>
      <MeterSegments height={height} width={width} variant="off" />
      <Animated.View style={[styles.activeMask, { height: meterHeight }]}>
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
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
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
