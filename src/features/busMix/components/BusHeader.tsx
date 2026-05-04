import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';

type BusHeaderProps = {
  consoleIp: string;
  busName: string;
  busNumber: number;
};

export const BusHeader = ({
  consoleIp,
  busName,
  busNumber,
}: BusHeaderProps): JSX.Element => (
  <View style={styles.container}>
    <View>
      <Text style={styles.kicker}>
        BUS {busNumber.toString().padStart(2, '0')}
      </Text>
      <Text style={styles.title}>{busName}</Text>
    </View>
    <Text style={styles.ip}>{consoleIp}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  ip: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
  },
});
