import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { colors } from '@shared/theme/colors';
import { ChannelMeterValues, dbToMeterHeight } from '../utils/meterDecoder';
import { PeakHoldState, updatePeakHold } from '../utils/peakHold';
import { MeterSegments } from './MeterSegments';

type ChannelVuMeterProps = {
    channelId: number;
    height: number;
    width: number;
    registerMeterListener: (channelId: number, listener: (values: ChannelMeterValues) => void) => () => void;
};

export const ChannelVuMeter = ({
    channelId,
    height,
    width,
    registerMeterListener,
}: ChannelVuMeterProps): JSX.Element => {
    const meterHeight = useSharedValue(0);
    const peakHeight = useSharedValue(0);
    const clipActive = useSharedValue(0);
    const peakStateRef = useRef<PeakHoldState>({ peakDb: -60, peakHoldFrames: 0 });

    const updateMeter = useCallback(
        (values: ChannelMeterValues) => {
            const nextLevel = dbToMeterHeight(values.postFadeDb);
            const nextPeakState = updatePeakHold(values.preFadeDb, peakStateRef.current);
            peakStateRef.current = nextPeakState;
            const nextPeak = dbToMeterHeight(nextPeakState.peakDb);

            const isAttack = nextLevel > meterHeight.value;
            meterHeight.value = withTiming(nextLevel, {
                duration: isAttack ? 5 : 200,
                easing: Easing.out(Easing.ease),
            });

            peakHeight.value = withTiming(nextPeak, { duration: 80 });
            clipActive.value = values.postFadeDb >= 0 ? 1 : 0;
        },
        [clipActive, meterHeight, peakHeight],
    );

    useEffect(() => registerMeterListener(channelId, updateMeter), [
        channelId,
        registerMeterListener,
        updateMeter,
    ]);

    const barStyle = useAnimatedStyle(() => ({
        height: meterHeight.value * height,
    }));

    const peakStyle = useAnimatedStyle(() => ({
        bottom: peakHeight.value * height,
    }));

    const clipStyle = useAnimatedStyle(() => ({
        opacity: clipActive.value ? 1 : 0.2,
    }));

    return (
        <View style={[styles.container, { height, width }]}>
            <MeterSegments height={height} width={width} variant="off" />
            <Animated.View style={[styles.activeMask, barStyle]}>
                <MeterSegments height={height} width={width} variant="active" />
            </Animated.View>
            <Animated.View style={[styles.peakMarker, peakStyle]} />
            <Animated.View style={[styles.clip, clipStyle]} />
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
