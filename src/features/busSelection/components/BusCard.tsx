import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import { Bus } from '../types/Bus';

type BusCardProps = {
  bus: Bus;
  onPress: (bus: Bus) => void;
};

export const BusCard = ({ bus, onPress }: BusCardProps): JSX.Element => (
  <Pressable
    onPress={() => onPress(bus)}
    style={({ pressed }) => [styles.card, pressed && styles.pressed]}
  >
    <View>
      <Text style={styles.label}>{bus.label}</Text>
      <Text style={styles.name}>{bus.name}</Text>
    </View>
    <Text style={styles.arrow}>›</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  arrow: {
    color: colors.primary,
    fontSize: 34,
    lineHeight: 34,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  pressed: {
    opacity: 0.8,
  },
});
