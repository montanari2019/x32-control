import Slider from '@react-native-community/slider';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import { levelToDb } from '@shared/utils/levelToDb';
import { mapX32ColorToUiColor } from '@shared/x32/channelColor';
import { Channel } from '../types/Channel';

type ChannelFaderProps = {
  channel: Channel;
  onLevelChange: (level: number) => void;
  onToggleOn: () => void;
};

const formatDb = (level: number): string => {
  const db = levelToDb(level);
  return Number.isFinite(db) ? `${db.toFixed(1)} dB` : '-inf dB';
};

export const ChannelFader = ({
  channel,
  onLevelChange,
  onToggleOn,
}: ChannelFaderProps): JSX.Element => {
  const accentColor =
    channel.color == null
      ? colors.mixer.neutralFader
      : mapX32ColorToUiColor(channel.color).backgroundColor;

  return (
    <View style={styles.card}>
      <View style={styles.channelInfo}>
        <View style={[styles.colorStrip, { backgroundColor: accentColor }]} />
        <View style={styles.textBlock}>
          <Text style={styles.label}>{channel.label}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {channel.name}
          </Text>
        </View>
      </View>

      <View style={styles.faderBlock}>
        <Slider
          minimumValue={0}
          maximumValue={1}
          step={0.001}
          value={channel.level}
          onValueChange={onLevelChange}
          minimumTrackTintColor={accentColor}
          maximumTrackTintColor={colors.mixer.track}
          thumbTintColor={accentColor}
        />
        <Text style={styles.value}>
          {Math.round(channel.level * 100)}% · {formatDb(channel.level)}
        </Text>
      </View>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: channel.on }}
        onPress={onToggleOn}
        style={[styles.onButton, channel.on ? styles.onActive : styles.onMuted]}
      >
        <Text style={styles.onText}>{channel.on ? 'ON' : 'MUTE'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.elevated,
    borderColor: colors.border.primary,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  channelInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  colorStrip: {
    borderRadius: 3,
    height: 42,
    width: 6,
  },
  faderBlock: {
    gap: 4,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '800',
  },
  name: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  onActive: {
    backgroundColor: colors.status.success,
  },
  onButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 8,
    minWidth: 74,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  onMuted: {
    backgroundColor: colors.status.danger,
  },
  onText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '900',
  },
  textBlock: {
    flex: 1,
  },
  value: {
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: 'right',
  },
});
