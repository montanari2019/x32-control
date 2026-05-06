import React, { useMemo, useRef } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, View } from 'react-native';
import { RootStackParamList } from '@app/navigation/RootNavigator';
import { ErrorState } from '@shared/components/ErrorState';
import { LoadingState } from '@shared/components/LoadingState';
import { useModal } from '@shared/components/Modal';
import { Screen } from '@shared/components/Screen';
import { colors } from '@shared/theme/colors';
import { spacing } from '@shared/theme/spacing';
import { ChannelStrip } from '../components/ChannelStrip';
import { PanControlModal } from '../components/PanControlModal';
import { PersonalMixHeader } from '../components/PersonalMixHeader';
import { useBusMix } from '../hooks/useBusMix';
import { useMeterSubscription } from '../hooks/useMeterSubscription';
import { Channel } from '../types/Channel';

type Props = NativeStackScreenProps<RootStackParamList, 'BusMix'>;

export const BusMixScreen = ({ route, navigation }: Props): JSX.Element => {
  const { consoleIp, busName, busNumber, linkedBusNumber } = route.params;
  const {
    channels,
    error,
    isLoading,
    hasPendingChanges,
    isSaving,
    refresh,
    save,
    setLevel,
    setPan,
    toggleOn,
    getPanPercent,
  } = useBusMix(consoleIp, busNumber);
  const { showModal } = useModal();
  const { registerMeterListener } = useMeterSubscription(consoleIp);
  const channelsRef = useRef<Channel[]>(channels);
  channelsRef.current = channels;

  const subtitle = useMemo(() => {
    const busLabel = `BUS ${busNumber.toString().padStart(2, '0')}`;
    if (linkedBusNumber) {
      return `${busLabel}/${linkedBusNumber.toString().padStart(2, '0')} · ${busName}`;
    }
    return `${busLabel} · ${busName}`;
  }, [busName, busNumber, linkedBusNumber]);

  if (isLoading) {
    return (
      <Screen style={styles.screen}>
        <PersonalMixHeader
          title="Personal Mix Channel"
          subtitle={subtitle}
          onBack={() => navigation.goBack()}
          onSave={save}
          isSaving={isSaving}
          isSaveDisabled={!hasPendingChanges}
        />
        <LoadingState label="Carregando canais, cores e niveis..." />
      </Screen>
    );
  }

  const openPanModal = (channelNumber: number): void => {
    showModal(({ visible, onDismiss }) => {
      const channel = channelsRef.current.find((item) => item.number === channelNumber);
      if (!channel) {
        return null;
      }

      return (
        <PanControlModal
          visible={visible}
          onDismiss={onDismiss}
          onDismissEnd={onDismiss}
          channelLabel={channel.label}
          channelName={channel.name}
          value={getPanPercent(channel.pan)}
          onChange={(value) => setPan(channelNumber, value)}
        />
      );
    });
  };

  const renderChannel = ({ item }: { item: Channel }): JSX.Element => (
    <ChannelStrip
      channel={item}
      registerMeterListener={registerMeterListener}
      onToggleMute={() => {
        toggleOn(item.number).catch(() => undefined);
      }}
      onFaderChange={(level) => setLevel(item.number, level)}
      onFaderChangeEnd={(level) => setLevel(item.number, level)}
      onPressBadge={() => openPanModal(item.number)}
    />
  );

  return (
    <Screen style={styles.screen}>
      <PersonalMixHeader
        title="Personal Mix Channel"
        subtitle={subtitle}
        onBack={() => navigation.goBack()}
        onSave={save}
        isSaving={isSaving}
        isSaveDisabled={!hasPendingChanges}
      />

      {error ? (
        <View style={styles.errorBlock}>
          <ErrorState message={error} actionLabel="Recarregar" onAction={refresh} />
        </View>
      ) : null}

      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={renderChannel}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  errorBlock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  list: {
    gap: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  screen: {
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    backgroundColor: colors.background.deep,
  },
});
