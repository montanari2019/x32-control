import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import { RootStackParamList } from '@app/navigation/RootNavigator';
import Toast from '@shared/components/Toast';
import { ErrorState } from '@shared/components/ErrorState';
import { LoadingState } from '@shared/components/LoadingState';
import { useModal } from '@shared/components/Modal';
import { Screen } from '@shared/components/Screen';
import { colors } from '@shared/theme/colors';
import { spacing } from '@shared/theme/spacing';
import { BusGroupsHeader } from './components/BusGroupsHeader';
import { McaChannelSelectionModal } from './components/McaChannelSelectionModal';
import { MasterStrip } from './components/MasterStrip';
import { McaStrip } from './components/McaStrip';
import { useBusGroups } from './hooks/useBusGroups';

type Props = NativeStackScreenProps<RootStackParamList, 'BusGroups'>;

export const BusGroupsScreen = ({ navigation, route }: Props): JSX.Element => {
  const { consoleIp, busNumber, busName, linkedBusNumber } = route.params;
  const { showModal } = useModal();
  const [stripsHeight, setStripsHeight] = useState(0);
  const {
    masterFaderRaw,
    masterMuted,
    mcas,
    availableChannels,
    isLoading,
    error,
    reload,
    setMasterFader,
    toggleMasterMute,
    setMcaFader,
    toggleMcaMute,
    toggleMcaChannelAssignment,
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

  const handleStripsAreaLayout = (event: LayoutChangeEvent): void => {
    setStripsHeight(Math.max(320, Math.floor(event.nativeEvent.layout.height)));
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
          <View style={styles.stripsArea} onLayout={handleStripsAreaLayout}>
            <ScrollView
              horizontal
              contentContainerStyle={[
                styles.strips,
                stripsHeight > 0 ? { minHeight: stripsHeight } : undefined,
              ]}
              showsHorizontalScrollIndicator={false}
              style={styles.stripsScroll}
            >
              <MasterStrip
                busId={busNumber}
                busName={busName}
                isMuted={masterMuted}
                onFaderChange={setMasterFader}
                onToggleMute={toggleMasterMute}
                stripHeight={stripsHeight}
                value={masterFaderRaw}
              />

              {mcas.map((mca) => (
                <McaStrip
                  key={mca.id}
                  mca={mca}
                  onFaderChange={(value) => setMcaFader(mca.dcaNumber, value)}
                  onPress={() =>
                    showModal(McaChannelSelectionModal, {
                      accentColor: colors.mca[mca.colorToken],
                      channels: availableChannels,
                      mca,
                      onToggleChannel: (channel) =>
                        toggleMcaChannelAssignment(mca.dcaNumber, channel),
                    })
                  }
                  onToggleMute={() => toggleMcaMute(mca.dcaNumber)}
                  stripHeight={stripsHeight}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
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
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  stripsArea: {
    flex: 1,
    minHeight: 0,
  },
  stripsScroll: {
    flex: 1,
  },
  strips: {
    alignItems: 'stretch',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
});
