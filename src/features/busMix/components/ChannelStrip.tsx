import React, { useCallback, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { formatDbLabel, x32RawToDb } from '@shared/utils/faderDb';
import { mapX32ColorToUiColor } from '@shared/x32/channelColor';
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

const withAlpha = (hexColor: string, alphaHex: string): string =>
  /^#[0-9A-Fa-f]{6}$/.test(hexColor) ? `${hexColor}${alphaHex}` : hexColor;

const opacityToAlphaHex = (opacity: number): string =>
  Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

const ChannelStripComponent = ({
  channel,
  registerMeterListener,
  onToggleMute,
  onFaderChange,
  onFaderChangeEnd,
  onPressBadge,
}: ChannelStripProps): JSX.Element => {
  const faderDb = x32RawToDb(channel.localFaderRaw);
  const channelColor = mapX32ColorToUiColor(channel.color ?? 0).backgroundColor;
  const backgroundColor = withAlpha(channelColor, opacityToAlphaHex(channel.backgroundOpacity));
  const [faderHeight, setFaderHeight] = useState(240);
  const faderHeightRef = useRef(240);

  const handleLayout = useCallback((event: LayoutChangeEvent): void => {
    const nextHeight = Math.max(180, Math.floor(event.nativeEvent.layout.height));
    if (nextHeight === faderHeightRef.current) {
      return;
    }

    faderHeightRef.current = nextHeight;
    setFaderHeight(nextHeight);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ChannelNamePlate
        label={channel.label}
        name={channel.name}
        color={channel.color}
        onPress={onPressBadge}
      />

      <View style={styles.stripBody} onLayout={handleLayout}>
        <View style={styles.faderRow}>
          {channel.meterChannelId ? (
            <ChannelVuMeter
              channelId={channel.meterChannelId}
              height={faderHeight}
              width={10}
              registerMeterListener={registerMeterListener}
            />
          ) : (
            <View style={[styles.meterPlaceholder, { height: faderHeight, width: 10 }]} />
          )}
          <VerticalFader
            level={channel.localFaderRaw}
            height={faderHeight}
            meterChannelId={channel.meterChannelId}
            registerMeterListener={registerMeterListener}
            onChange={onFaderChange}
            onChangeEnd={onFaderChangeEnd}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <MuteButton isMuted={!channel.on} onToggle={onToggleMute} />
        <Text style={styles.dbValue}>{formatDbLabel(faderDb)} dB</Text>
      </View>
    </View>
  );
};

export const ChannelStrip = React.memo(
  ChannelStripComponent,
  (prev, next) =>
    prev.channel.localFaderRaw === next.channel.localFaderRaw &&
    prev.channel.on === next.channel.on &&
    prev.channel.name === next.channel.name &&
    prev.channel.label === next.channel.label &&
    prev.channel.color === next.channel.color &&
    prev.channel.number === next.channel.number &&
    prev.channel.backgroundOpacity === next.channel.backgroundOpacity &&
    prev.channel.meterChannelId === next.channel.meterChannelId &&
    prev.registerMeterListener === next.registerMeterListener &&
    prev.onToggleMute === next.onToggleMute &&
    prev.onFaderChange === next.onFaderChange &&
    prev.onFaderChangeEnd === next.onFaderChangeEnd &&
    prev.onPressBadge === next.onPressBadge,
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    borderWidth: 1.5,
    gap: spacing.xxs,
    padding: spacing.xs,
    width: 86,
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
  meterPlaceholder: {
    backgroundColor: colors.meter.background,
    borderRadius: 3,
    opacity: 0.55,
  },
  stripBody: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    width: '100%',
  },
});
