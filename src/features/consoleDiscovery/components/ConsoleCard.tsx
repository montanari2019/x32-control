import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { ConsoleDevice } from '../types/ConsoleDevice';

type ConsoleCardProps = {
  device: ConsoleDevice;
  onPress: (device: ConsoleDevice) => void;
};

export const ConsoleCard = ({ device, onPress }: ConsoleCardProps): JSX.Element => (
  <Pressable
    onPress={() => onPress(device)}
    style={({ pressed }) => [styles.card, pressed && styles.pressed]}
  >
    <View style={styles.top}>
      <View>
        <Text style={styles.eyebrow}>Console disponivel</Text>
        <Text style={styles.name}>{device.name}</Text>
        <Text style={styles.meta}>{device.model}</Text>
      </View>
      <View style={styles.statusPill}>
        <View
          style={[
            styles.dot,
            device.status === 'connected' ? styles.connected : styles.disconnected,
          ]}
        />
        <Text style={styles.statusText}>{device.status}</Text>
      </View>
    </View>
    <Text style={styles.ip}>
      {device.ip}:{device.port}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.elevated,
    borderColor: colors.border.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  connected: {
    backgroundColor: colors.status.success,
  },
  disconnected: {
    backgroundColor: colors.status.danger,
  },
  dot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  eyebrow: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  ip: {
    color: colors.accent.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: colors.text.secondary,
    fontSize: 13,
    marginTop: 4,
  },
  name: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.84,
  },
  statusPill: {
    alignItems: 'center',
    backgroundColor: colors.surface.screen,
    borderColor: colors.border.subtle,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  top: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
