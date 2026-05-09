import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import {
  ChannelMeterValues,
  dbfsToMeterHeight,
  getMeterFillRatios,
  METER_YELLOW_MAX_DB,
} from '../utils/meterDecoder';
import { PeakHoldState, updatePeakHold } from '../utils/peakHold';
import { getMeterSegmentLayout, MeterSegments } from './MeterSegments';

type ChannelVuMeterProps = {
  channelId: number;
  height: number;
  width: number;
  registerMeterListener: (
    channelId: number,
    listener: (values: ChannelMeterValues) => void,
  ) => () => void;
};

const METER_RISE_DELTA_THRESHOLD = 0.008;
const METER_FALL_DURATION_MS = 75;
const CLIP_FADE_DURATION_MS = 100;
const PEAK_HOLD_FRAMES = 8;
const PEAK_DECAY_PER_FRAME_DB = 3;

const ChannelVuMeterComponent = ({
  channelId,
  height,
  width,
  registerMeterListener,
}: ChannelVuMeterProps): JSX.Element => {
  const greenScale = useRef(new Animated.Value(0)).current;
  const yellowScale = useRef(new Animated.Value(0)).current;
  const redScale = useRef(new Animated.Value(0)).current;
  const peakOffset = useRef(new Animated.Value(0)).current;
  const clipOpacity = useRef(new Animated.Value(0)).current;
  const peakStateRef = useRef<PeakHoldState>({ peakDb: -60, peakHoldFrames: 0 });
  const currentFillRatiosRef = useRef({ green: 0, red: 0, yellow: 0 });
  const currentClipOpacityRef = useRef(0);
  const currentPeakPxRef = useRef(0);
  const segmentLayout = getMeterSegmentLayout(height);
  const [greenSegment, yellowSegment, redSegment] = segmentLayout;
  const greenTranslateY = greenScale.interpolate({
    inputRange: [0, 1],
    outputRange: [greenSegment.segmentHeight / 2, 0],
  });
  const yellowTranslateY = yellowScale.interpolate({
    inputRange: [0, 1],
    outputRange: [yellowSegment.segmentHeight / 2, 0],
  });
  const redTranslateY = redScale.interpolate({
    inputRange: [0, 1],
    outputRange: [redSegment.segmentHeight / 2, 0],
  });

  const syncFillScale = useCallback(
    (animatedValue: Animated.Value, nextRatio: number, previousRatio: number) => {
      const delta = Math.abs(nextRatio - previousRatio);
      animatedValue.stopAnimation();

      if (nextRatio >= previousRatio || delta < METER_RISE_DELTA_THRESHOLD) {
        animatedValue.setValue(nextRatio);
        return;
      }

      Animated.timing(animatedValue, {
        toValue: nextRatio,
        duration: METER_FALL_DURATION_MS,
        useNativeDriver: true,
      }).start();
    },
    [],
  );

  const updateMeter = useCallback(
    (values: ChannelMeterValues) => {
      const nextFillRatios = getMeterFillRatios(values.preFadeDbfs);
      const previousFillRatios = currentFillRatiosRef.current;
      const nextPeakState = updatePeakHold(
        values.preFadeDbfs,
        peakStateRef.current,
        PEAK_HOLD_FRAMES,
        PEAK_DECAY_PER_FRAME_DB,
      );
      peakStateRef.current = nextPeakState;
      const nextPeakPx = dbfsToMeterHeight(nextPeakState.peakDb) * height;
      const nextClipOpacity = values.preFadeDbfs > METER_YELLOW_MAX_DB ? 1 : 0;

      syncFillScale(greenScale, nextFillRatios.green, previousFillRatios.green);
      syncFillScale(yellowScale, nextFillRatios.yellow, previousFillRatios.yellow);
      syncFillScale(redScale, nextFillRatios.red, previousFillRatios.red);

      if (Math.abs(nextPeakPx - currentPeakPxRef.current) >= 0.5) {
        peakOffset.setValue(nextPeakPx);
        currentPeakPxRef.current = nextPeakPx;
      }

      if (nextClipOpacity !== currentClipOpacityRef.current) {
        clipOpacity.stopAnimation();
        if (nextClipOpacity === 1) {
          clipOpacity.setValue(1);
        } else {
          Animated.timing(clipOpacity, {
            toValue: 0,
            duration: CLIP_FADE_DURATION_MS,
            useNativeDriver: true,
          }).start();
        }
        currentClipOpacityRef.current = nextClipOpacity;
      }

      currentFillRatiosRef.current = nextFillRatios;
    },
    [clipOpacity, greenScale, height, peakOffset, redScale, syncFillScale, yellowScale],
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
          styles.activeSegment,
          {
            backgroundColor: colors.meter.green,
            bottom: greenSegment.bottom,
            height: greenSegment.segmentHeight,
            transform: [{ translateY: greenTranslateY }, { scaleY: greenScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.activeSegment,
          {
            backgroundColor: colors.meter.yellow,
            bottom: yellowSegment.bottom,
            height: yellowSegment.segmentHeight,
            transform: [{ translateY: yellowTranslateY }, { scaleY: yellowScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.activeSegment,
          {
            backgroundColor: colors.meter.red,
            bottom: redSegment.bottom,
            height: redSegment.segmentHeight,
            transform: [{ translateY: redTranslateY }, { scaleY: redScale }],
          },
        ]}
      />
      <Animated.View style={[styles.peakMarker, { bottom: peakOffset }]} />
      <Animated.View style={[styles.clip, { opacity: clipOpacity }]} />
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
  activeSegment: {
    left: 0,
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
