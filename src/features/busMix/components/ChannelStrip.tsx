import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { formatDbLabel } from '@shared/utils/faderDb';
import { levelToDb } from '@shared/utils/levelToDb';
import { Channel } from '../types/Channel';
import { ChannelMeterValues } from '../utils/meterDecoder';
import { ChannelVuMeter } from './ChannelVuMeter';
import { ChannelNamePlate } from './ChannelNamePlate';
import { MuteButton } from './MuteButton';
import { VerticalFader } from './VerticalFader';

type ChannelStripProps = {
    channel: Channel;
    registerMeterListener: (
        channelId: number,
        listener: (values: ChannelMeterValues) => void,
    ) => () => void;
    onToggleMute: () => void;
    onFaderChange: (value: number) => void;
    onFaderChangeEnd: (value: number) => void;
    onPressBadge: () => void;
};

export const ChannelStrip = ({
    channel,
    registerMeterListener,
    onToggleMute,
    onFaderChange,
    onFaderChangeEnd,
    onPressBadge,
}: ChannelStripProps): JSX.Element => {
    const dbValue = levelToDb(channel.level);
    const [faderHeight, setFaderHeight] = useState(240);

    const handleLayout = (event: LayoutChangeEvent): void => {
        const nextHeight = Math.max(180, Math.floor(event.nativeEvent.layout.height));
        setFaderHeight(nextHeight);
    };

    return (
        <View style={styles.container}>
            <ChannelNamePlate
                label={channel.label}
                name={channel.name}
                color={channel.color}
                onPress={onPressBadge}
            />

            <View style={styles.stripBody} onLayout={handleLayout}>
                <View style={styles.faderRow}>
                    <ChannelVuMeter
                        channelId={channel.number}
                        height={faderHeight}
                        width={10}
                        registerMeterListener={registerMeterListener}
                    />
                    <VerticalFader
                        level={channel.level}
                        height={faderHeight}
                        onChange={onFaderChange}
                        onChangeEnd={onFaderChangeEnd}
                    />
                </View>
            </View>

            <View style={styles.footer}>
                <MuteButton isMuted={!channel.on} onToggle={onToggleMute} />
                <Text style={styles.dbValue}>{formatDbLabel(dbValue)} dB</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        backgroundColor: colors.surface.channelStrip,
        borderColor: colors.border.subtle,
        borderRadius: radius.md,
        borderWidth: 1,
        gap: spacing.xxs,
        padding: spacing.xs,
        width: 72,
    },
    dbValue: {
        color: colors.text.muted,
        fontSize: 11,
        fontWeight: '700',
    },
    footer: {
        alignItems: 'center',
        gap: spacing.xxs,
    },
    faderRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 4,
    },
    stripBody: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        paddingVertical: spacing.xs,
        width: '100%',
    },
});
