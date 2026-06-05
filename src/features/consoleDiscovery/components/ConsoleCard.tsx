import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DEMO_CONSOLE_ID } from '@shared/mixer/mock/mockMixerProvider';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { ConsoleDevice } from '../types/ConsoleDevice';

type ConsoleCardProps = {
  device: ConsoleDevice;
  onPress: (device: ConsoleDevice) => void;
};

export const ConsoleCard = ({ device, onPress }: ConsoleCardProps): JSX.Element => {
  const isDemo = device.id === DEMO_CONSOLE_ID;
  const { t } = useTranslation();
  const model = isDemo ? t('consoleDiscovery.demoModel') : device.model;

  return (
    <Pressable
      onPress={() => onPress(device)}
      style={({ pressed }) => [styles.card, isDemo && styles.demoCard, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View>
          {isDemo ? (
            <Text style={styles.demoBadge}>DEMO</Text>
          ) : (
            <Text style={styles.eyebrow}>{t('consoleDiscovery.availableConsole')}</Text>
          )}
          <Text style={styles.name}>{device.name}</Text>
          <Text style={styles.meta}>{model}</Text>
        </View>
        <View style={styles.statusPill}>
          <View
            style={[
              styles.dot,
              device.status === 'connected' ? styles.connected : styles.disconnected,
            ]}
          />
          <Text style={styles.statusText}>{isDemo ? 'demo' : device.status}</Text>
        </View>
      </View>
      {!isDemo ? (
        <Text style={styles.ip}>
          {device.ip}:{device.port}
        </Text>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  demoBadge: {
    color: colors.accent.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  demoCard: {
    borderColor: colors.accent.primary,
    borderStyle: 'dashed',
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
    backgroundColor: colors.background.primary,
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
