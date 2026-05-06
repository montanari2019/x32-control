import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';
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
        <Text style={styles.name}>{device.name}</Text>
        <Text style={styles.meta}>{device.model}</Text>
      </View>
      <View style={styles.status}>
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
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
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
  ip: {
    color: colors.accent.primary,
    fontSize: 14,
    fontWeight: '600',
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
    opacity: 0.78,
  },
  status: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  statusText: {
    color: colors.text.secondary,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  top: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
