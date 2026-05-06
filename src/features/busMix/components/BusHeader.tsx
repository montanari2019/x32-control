import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';

type BusHeaderProps = {
  consoleIp: string;
  busName: string;
  busNumber: number;
  linkedBusNumber?: number;
};

export const BusHeader = ({
  consoleIp,
  busName,
  busNumber,
  linkedBusNumber,
}: BusHeaderProps): JSX.Element => (
  <View style={styles.container}>
    <View>
      <Text style={styles.kicker}>
        BUS {busNumber.toString().padStart(2, '0')}
        {linkedBusNumber ? `/${linkedBusNumber.toString().padStart(2, '0')}` : ''}
      </Text>
      <Text style={styles.title}>{busName}</Text>
    </View>
    <Text style={styles.ip}>{consoleIp}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.elevated,
    borderColor: colors.border.primary,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  ip: {
    color: colors.accent.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  kicker: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  title: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
  },
});
