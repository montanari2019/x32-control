import React, { useCallback, useMemo, useRef } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, View } from 'react-native';
import { RootStackParamList } from '@app/navigation/RootNavigator';
import { ErrorState } from '@shared/components/ErrorState';
import { LoadingState } from '@shared/components/LoadingState';
import { useModal } from '@shared/components/Modal';
import { Screen } from '@shared/components/Screen';
import { colors } from '@shared/theme/colors';
import { spacing } from '@shared/theme/spacing';
import { MAX_BUS_MIX_PRESETS } from '../services/BusMixPresetService';
import { BusMixPresetRestoreOverlay } from '../components/BusMixPresetRestoreOverlay';
import { BusMixPresetsModal } from '../components/BusMixPresetsModal';
import { ChannelStrip } from '../components/ChannelStrip';
import { PanControlModal } from '../components/PanControlModal';
import { PersonalMixHeader } from '../components/PersonalMixHeader';
import { useBusMix } from '../hooks/useBusMix';
import { useMeterSubscription } from '../hooks/useMeterSubscription';
import { Channel } from '../types/Channel';

type Props = NativeStackScreenProps<RootStackParamList, 'BusMix'>;

export const BusMixScreen = ({ route, navigation }: Props) => {
  const { consoleIp, busName, busNumber, linkedBusNumber } = route.params;
  const {
    channels,
    error,
    isLoading,
    refresh,
    sendLevelOnly,
    setLevel,
    setPan,
    toggleOn,
    getPanPercent,
    presets,
    isRestoringPreset,
    refreshPresets,
    createPreset,
    overwritePreset,
    restorePreset,
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

  const openPanModal = useCallback((channelNumber: number): void => {
    const channel = channelsRef.current.find((item) => item.number === channelNumber);
    if (!channel) {
      return;
    }

    showModal(PanControlModal, {
      channelLabel: channel.label,
      channelName: channel.name,
      value: getPanPercent(channel.pan),
      onChange: (value) => setPan(channelNumber, value),
    });
  }, [getPanPercent, setPan, showModal]);

  const openPresetsModal = useCallback((): void => {
    showModal(BusMixPresetsModal, {
      presets,
      maxPresets: MAX_BUS_MIX_PRESETS,
      isRestoringPreset,
      onRefreshPresets: refreshPresets,
      onCreatePreset: createPreset,
      onOverwritePreset: overwritePreset,
      onRestorePreset: restorePreset,
    });
  }, [
    createPreset,
    isRestoringPreset,
    overwritePreset,
    presets,
    refreshPresets,
    restorePreset,
    showModal,
  ]);

  const handleFaderChange = useCallback(
    (channelNumber: number, level: number): void => sendLevelOnly(channelNumber, level),
    [sendLevelOnly],
  );

  const handleFaderChangeEnd = useCallback(
    (channelNumber: number, level: number): void => setLevel(channelNumber, level),
    [setLevel],
  );

  const handleToggleMute = useCallback(
    (channelNumber: number): void => {
      toggleOn(channelNumber).catch(() => undefined);
    },
    [toggleOn],
  );

  const renderChannel = useCallback(({ item }: { item: Channel }) => (
    <ChannelStrip
      channel={item}
      registerMeterListener={registerMeterListener}
      onToggleMute={() => handleToggleMute(item.number)}
      onFaderChange={(level) => handleFaderChange(item.number, level)}
      onFaderChangeEnd={(level) => handleFaderChangeEnd(item.number, level)}
      onPressBadge={() => openPanModal(item.number)}
    />
  ), [
    handleFaderChange,
    handleFaderChangeEnd,
    handleToggleMute,
    openPanModal,
    registerMeterListener,
  ]);

  if (isLoading) {
    return (
      <Screen style={styles.screen}>
        <PersonalMixHeader
          title="Personal Mix Channel"
          subtitle={subtitle}
          onBack={() => navigation.goBack()}
          onAction={openPresetsModal}
          actionLabel="Presets"
          isActionDisabled={isRestoringPreset}
        />
        <LoadingState label="Carregando canais, cores e niveis..." />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <PersonalMixHeader
        title="Personal Mix Channel"
        subtitle={subtitle}
        onBack={() => navigation.goBack()}
        onAction={openPresetsModal}
        actionLabel="Presets"
        isActionDisabled={isRestoringPreset}
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

      {isRestoringPreset ? <BusMixPresetRestoreOverlay /> : null}
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
