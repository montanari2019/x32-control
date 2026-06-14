import React, { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '@app/navigation/RootNavigator';
import { Button } from '@shared/components/Button';
import { LoadingState } from '@shared/components/LoadingState';
import { useModal } from '@shared/components/Modal';
import { Screen } from '@shared/components/Screen';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import Toast from '@shared/components/Toast';
import { ConsoleCard } from '../components/ConsoleCard';
import { useConsoleDiscovery } from '../hooks/useConsoleDiscovery';
import { ConsoleDevice } from '../types/ConsoleDevice';

type Props = NativeStackScreenProps<RootStackParamList, 'ConsoleDiscovery'>;

export const ConsoleDiscoveryScreen = ({ navigation }: Props): JSX.Element => {
  const { devices, error, isSearching, scan } = useConsoleDiscovery();
  const { showModal } = useModal();
  const { t } = useTranslation();

  useEffect(() => {
    if (!error) {
      return;
    }

    showModal(Toast, {
      title: t('consoleDiscovery.failureTitle'),
      message: error,
      variant: 'error',
    });
  }, [error, showModal, t]);

  const openConsole = (device: ConsoleDevice): void => {
    navigation.navigate('BusSelection', {
      consoleIp: device.ip,
      consoleName: device.name,
    });
  };

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{t('consoleDiscovery.heroBadge')}</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.title}>{t('consoleDiscovery.title')}</Text>
          <Text style={styles.subtitle}>{t('consoleDiscovery.subtitle')}</Text>
        </View>

        <Button title={t('consoleDiscovery.searchButton')} onPress={scan} loading={isSearching} />
      </View>

      {isSearching ? <LoadingState label={t('consoleDiscovery.searching')} /> : null}

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
    backgroundColor: colors.background.primary,
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
    backgroundColor: colors.background.primary,
    borderColor: colors.border.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    padding: spacing.xl,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  screen: {
    backgroundColor: colors.background.primary,
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
