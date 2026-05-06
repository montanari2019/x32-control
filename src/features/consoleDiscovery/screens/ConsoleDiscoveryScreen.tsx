import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Platform, StyleSheet, Text, TextInput, ToastAndroid, View } from 'react-native';
import { RootStackParamList } from '@app/navigation/RootNavigator';
import { Button } from '@shared/components/Button';
import { LoadingState } from '@shared/components/LoadingState';
import { Screen } from '@shared/components/Screen';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { ConsoleCard } from '../components/ConsoleCard';
import { useConsoleDiscovery } from '../hooks/useConsoleDiscovery';
import { ConsoleDevice } from '../types/ConsoleDevice';

type Props = NativeStackScreenProps<RootStackParamList, 'ConsoleDiscovery'>;

export const ConsoleDiscoveryScreen = ({ navigation }: Props): JSX.Element => {
  const { devices, error, isSearching, scan, validateManualIp } = useConsoleDiscovery();
  const [manualIp, setManualIp] = useState('');

  useEffect(() => {
    if (!error) {
      return;
    }

    if (Platform.OS === 'android') {
      ToastAndroid.show(error, ToastAndroid.LONG);
      return;
    }

    Alert.alert('Nao foi possivel localizar o console', error);
  }, [error]);

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
    <Screen scroll style={styles.screen}>
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>Descoberta de console</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.title}>Controle BUS/AUX</Text>
          <Text style={styles.subtitle}>
            Conecte o celular na mesma rede Ethernet ou Wi-Fi da X32/M32 para localizar a mesa e
            entrar no monitor correto.
          </Text>
        </View>

        <Button title="Buscar mesas na rede" onPress={scan} loading={isSearching} />
      </View>

      <View style={styles.manualCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>Acesso direto</Text>
          <Text style={styles.sectionTitle}>Conexao manual</Text>
          <Text style={styles.sectionDescription}>
            Se a busca automatica nao encontrar a mesa, informe o IP manualmente.
          </Text>
        </View>

        <View style={styles.manualRow}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            onChangeText={setManualIp}
            placeholder="192.168.1.100"
            placeholderTextColor={colors.text.secondary}
            style={styles.input}
            value={manualIp}
          />
          <Button
            title="Entrar"
            onPress={connectManual}
            loading={isSearching}
            variant="secondary"
            style={styles.okButton}
          />
        </View>
      </View>

      {isSearching ? <LoadingState label="Procurando consoles via /info..." /> : null}

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
    gap: spacing.sm,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface.glassOverlay,
    borderColor: colors.border.subtle,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  heroBadgeText: {
    color: colors.accent.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroCard: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    padding: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface.screen,
    borderColor: colors.border.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text.primary,
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  manualCard: {
    backgroundColor: colors.surface.elevated,
    borderColor: colors.border.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  manualRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  okButton: {
    minWidth: 96,
  },
  screen: {
    backgroundColor: colors.background.deep,
  },
  sectionDescription: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionEyebrow: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  title: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '900',
  },
});
