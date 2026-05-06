import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@shared/theme/colors';

type SignalMeterProps = {
    level: number;
    height: number;
};

const SEGMENTS = 22;
const RED_SEGMENTS = 3;
const YELLOW_SEGMENTS = 4;

const clampLevel = (value: number): number => Math.max(0, Math.min(1, value));

export const SignalMeter = ({ level, height }: SignalMeterProps): JSX.Element => {
    const [displayLevel, setDisplayLevel] = useState(level);
    const rafRef = useRef<number>();

    useEffect(() => {
        const target = clampLevel(level);

        const step = () => {
            setDisplayLevel((current) => {
                const delta = target - current;
                if (Math.abs(delta) < 0.01) {
                    return target;
                }

                const next = current + delta * (delta > 0 ? 0.35 : 0.12);
                return clampLevel(next);
            });
            rafRef.current = requestAnimationFrame(step);
        };

        rafRef.current = requestAnimationFrame(step);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [level]);

    const activeCount = Math.round(displayLevel * SEGMENTS);

    return (
        <View style={[styles.container, { height }]}>
            {Array.from({ length: SEGMENTS }).map((_, index) => {
                const reversedIndex = SEGMENTS - 1 - index;
                const isActive = reversedIndex < activeCount;
                const segmentStyle = isActive
                    ? reversedIndex < RED_SEGMENTS
                        ? styles.red
                        : reversedIndex < RED_SEGMENTS + YELLOW_SEGMENTS
                            ? styles.yellow
                            : styles.green
                    : styles.off;
                return <View key={`seg-${index}`} style={[styles.segment, segmentStyle]} />;
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'space-between',
        width: 10,
    },
    green: {
        backgroundColor: colors.meter.green,
    },
    off: {
        backgroundColor: colors.meter.off,
    },
    red: {
        backgroundColor: colors.meter.red,
    },
    segment: {
        borderRadius: 2,
        flex: 1,
        marginVertical: 1,
    },
    yellow: {
        backgroundColor: colors.meter.yellow,
    },
});
