import React, { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, View } from 'react-native';
import { RootStackParamList } from '@app/navigation/RootNavigator';
import Toast from '@shared/components/Toast';
import { ErrorState } from '@shared/components/ErrorState';
import { LoadingState } from '@shared/components/LoadingState';
import { useModal } from '@shared/components/Modal';
import { Screen } from '@shared/components/Screen';
import { colors } from '@shared/theme/colors';
import { spacing } from '@shared/theme/spacing';
import { BusGroupsFooter } from './components/BusGroupsFooter';
import { BusGroupsHeader } from './components/BusGroupsHeader';
import { MasterStrip } from './components/MasterStrip';
import { McaStrip } from './components/McaStrip';
import { useBusGroups } from './hooks/useBusGroups';

type Props = NativeStackScreenProps<RootStackParamList, 'BusGroups'>;

export const BusGroupsScreen = ({ navigation, route }: Props): JSX.Element => {
  const { consoleIp, busNumber, busName, linkedBusNumber } = route.params;
  const { showModal } = useModal();
  const {
    masterFaderRaw,
    masterMuted,
    mcas,
    isLoading,
    error,
    reload,
    setMasterFader,
    toggleMasterMute,
    setMcaFader,
    toggleMcaMute,
  } = useBusGroups(consoleIp, busNumber);

  useEffect(() => {
    if (!error) {
      return;
    }

    showModal(Toast, {
      title: 'Falha no controle de grupos',
      message: error,
      variant: 'error',
    });
  }, [error, showModal]);

  const showPlaceholderToast = (title: string): void => {
    showModal(Toast, {
      title,
      message: 'Este controle ainda nao foi conectado a uma acao da mesa.',
      variant: 'warning',
    });
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.content}>
        <BusGroupsHeader
          onBack={() => navigation.goBack()}
          onChannels={() =>
            navigation.push('BusMix', {
              consoleIp,
              busNumber,
              busName,
              linkedBusNumber,
            })
          }
        />

        {isLoading ? <LoadingState label="Lendo DCA, mute e master da mesa..." /> : null}
        {!isLoading && error ? (
          <View style={styles.errorBlock}>
            <ErrorState message={error} actionLabel="Recarregar" onAction={reload} />
          </View>
        ) : null}

        {!isLoading ? (
          <ScrollView
            horizontal
            contentContainerStyle={styles.strips}
            showsHorizontalScrollIndicator={false}
          >
            <MasterStrip
              busId={busNumber}
              busName={busName}
              isMuted={masterMuted}
              onFaderChange={setMasterFader}
              onToggleMute={toggleMasterMute}
              value={masterFaderRaw}
            />

            {mcas.map((mca) => (
              <McaStrip
                key={mca.id}
                mca={mca}
                onFaderChange={(value) => setMcaFader(mca.dcaNumber, value)}
                onToggleMute={() => toggleMcaMute(mca.dcaNumber)}
              />
            ))}
          </ScrollView>
        ) : null}

        <BusGroupsFooter
          onPressPresets={() => showPlaceholderToast('Presets em breve')}
          onPressSettings={() => showPlaceholderToast('Configuracoes em breve')}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.lg,
  },
  errorBlock: {
    paddingHorizontal: spacing.sm,
  },
  screen: {
    backgroundColor: colors.background.deep,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  strips: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});
