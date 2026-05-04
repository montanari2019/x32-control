import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '@app/navigation/RootNavigator';
import { ErrorState } from '@shared/components/ErrorState';
import { LoadingState } from '@shared/components/LoadingState';
import { Screen } from '@shared/components/Screen';
import { colors } from '@shared/theme/colors';
import { BusCard } from '../components/BusCard';
import { useBusSelection } from '../hooks/useBusSelection';
import { Bus } from '../types/Bus';

type Props = NativeStackScreenProps<RootStackParamList, 'BusSelection'>;

export const BusSelectionScreen = ({
  navigation,
  route,
}: Props): JSX.Element => {
  const { consoleIp, consoleName } = route.params;
  const { buses, error, isLoading, reload } = useBusSelection(consoleIp);

  const openBus = (bus: Bus): void => {
    navigation.navigate('BusMix', {
      consoleIp,
      busNumber: bus.number,
      busName: bus.name,
    });
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.console}>{consoleName}</Text>
        <Text style={styles.ip}>{consoleIp}</Text>
      </View>

      {isLoading ? <LoadingState label="Lendo nomes dos BUS..." /> : null}
      {error ? (
        <ErrorState
          message={error}
          actionLabel="Recarregar"
          onAction={reload}
        />
      ) : null}

      <View style={styles.grid}>
        {buses.map((bus) => (
          <BusCard key={bus.number} bus={bus} onPress={openBus} />
        ))}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  console: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  grid: {
    gap: 12,
    marginTop: 16,
  },
  header: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 16,
  },
  ip: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
