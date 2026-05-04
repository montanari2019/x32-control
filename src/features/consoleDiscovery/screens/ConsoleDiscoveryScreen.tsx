import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { RootStackParamList } from '@app/navigation/RootNavigator';
import { Button } from '@shared/components/Button';
import { ErrorState } from '@shared/components/ErrorState';
import { LoadingState } from '@shared/components/LoadingState';
import { Screen } from '@shared/components/Screen';
import { colors } from '@shared/theme/colors';
import { ConsoleCard } from '../components/ConsoleCard';
import { useConsoleDiscovery } from '../hooks/useConsoleDiscovery';
import { ConsoleDevice } from '../types/ConsoleDevice';

type Props = NativeStackScreenProps<RootStackParamList, 'ConsoleDiscovery'>;

export const ConsoleDiscoveryScreen = ({ navigation }: Props): JSX.Element => {
  const { devices, error, isSearching, scan, validateManualIp } =
    useConsoleDiscovery();
  const [manualIp, setManualIp] = useState('');

  const openConsole = (device: ConsoleDevice): void => {
    navigation.navigate('BusSelection', {
      consoleIp: device.ip,
      consoleName: device.name,
    });
  };

  const connectManual = async (): Promise<void> => {
    const device = await validateManualIp(manualIp);
    if (device) {
      openConsole(device);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Text style={styles.title}>Controle BUS/AUX</Text>
        <Text style={styles.subtitle}>
          Conecte o celular na mesma rede Ethernet/Wi-Fi da X32/M32.
        </Text>
      </View>

      <Button
        title="Buscar mesas na rede"
        onPress={scan}
        loading={isSearching}
      />

      <View style={styles.manual}>
        <Text style={styles.sectionTitle}>Conexao manual</Text>
        <View style={styles.manualRow}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            onChangeText={setManualIp}
            placeholder="192.168.1.100"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={manualIp}
          />
          <Button
            title="OK"
            onPress={connectManual}
            loading={isSearching}
            style={styles.okButton}
          />
        </View>
      </View>

      {isSearching ? (
        <LoadingState label="Procurando consoles via /info..." />
      ) : null}
      {error ? (
        <ErrorState
          message={error}
          actionLabel="Tentar novamente"
          onAction={scan}
        />
      ) : null}

      <View style={styles.list}>
        {devices.map((device) => (
          <ConsoleCard key={device.id} device={device} onPress={openConsole} />
        ))}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: {
    gap: 8,
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  list: {
    gap: 12,
    marginTop: 16,
  },
  manual: {
    gap: 10,
    marginTop: 22,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 10,
  },
  okButton: {
    minWidth: 72,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
});
