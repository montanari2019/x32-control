import React, { useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '@shared/theme/colors';
import { mapX32ColorToUiColor } from '@shared/x32/channelColor';
import { Bus } from '../types/Bus';

type BusCardProps = {
  bus: Bus;
  onPress: (bus: Bus) => void;
  accentColor: string;
  style?: ViewStyle;
};

const withAlpha = (hexColor: string, alpha: string): string =>
  /^#[0-9a-f]{6}$/i.test(hexColor) ? `${hexColor}${alpha}` : hexColor;

const hasConfiguredBusColor = (color: Bus['color']): boolean => {
  if (color == null) {
    return false;
  }

  if (typeof color === 'number') {
    return color !== 0 && color !== 8;
  }

  return color !== 'OFF' && color !== 'OFFi';
};

export const BusCard = ({ bus, onPress, accentColor, style }: BusCardProps): JSX.Element => {
  const scale = useRef(new Animated.Value(1)).current;

  const animationConfig = useMemo(() => ({ useNativeDriver: true, speed: 30, bounciness: 0 }), []);
  const busColor = hasConfiguredBusColor(bus.color)
    ? mapX32ColorToUiColor(bus.color ?? 'OFF')
    : undefined;
  const busTitleColor = busColor?.backgroundColor ?? colors.text.primary;
  const busBackgroundColor = busColor
    ? withAlpha(busColor.backgroundColor, busColor.isInverted ? '26' : '33')
    : colors.surface.elevated;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${bus.name} (${bus.label})`}
      onPress={() => onPress(bus)}
      onPressIn={() => {
        Animated.spring(scale, { toValue: 0.985, ...animationConfig }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, { toValue: 1, ...animationConfig }).start();
      }}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed, style]}
    >
      <Animated.View
        style={[styles.card, { backgroundColor: busBackgroundColor }, { transform: [{ scale }] }]}
      >
        <View pointerEvents="none" style={styles.glassOverlay} />

        <View style={styles.topRow}>
          <Text style={[styles.name, { color: busTitleColor }]} numberOfLines={1}>
            {bus.name}
          </Text>
          <View style={styles.rightMeta}>
            {bus.isStereoLinked ? (
              <View style={styles.stereoBadge}>
                <Text style={styles.stereoBadgeText}>ST</Text>
              </View>
            ) : null}
            <Text style={styles.busId}>{bus.label}</Text>
          </View>
        </View>

        <Text style={styles.channels} numberOfLines={1}>
          Canais: CH 01–32
        </Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  busId: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.surface.elevated,
    borderRadius: 14,
    gap: 10,
    overflow: 'hidden',
    padding: 14,
    position: 'relative',
  },
  channels: {
    color: colors.text.tertiary,
    fontSize: 12,
    fontWeight: '700',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface.glassOverlay,
  },
  name: {
    color: colors.text.primary,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    paddingRight: 12,
  },
  pressed: {
    opacity: 0.92,
  },
  rightMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  stereoBadge: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.subtle,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stereoBadgeText: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pressable: {
    alignSelf: 'stretch',
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
