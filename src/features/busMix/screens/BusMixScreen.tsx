import React, { useCallback, useMemo, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, LayoutChangeEvent, ListRenderItemInfo, StyleSheet, View } from 'react-native';
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
import { ChannelMeterValues } from '../utils/meterDecoder';

type Props = NativeStackScreenProps<RootStackParamList, 'BusMix'>;

const CHANNEL_STRIP_WIDTH = 86;
const CHANNEL_STRIP_GAP = 1;
const CHANNEL_ITEM_LENGTH = CHANNEL_STRIP_WIDTH + CHANNEL_STRIP_GAP;
const STRIP_FIXED_OVERHEAD = 160;

type BusMixChannelItemProps = {
  channel: Channel;
  faderHeight: number;
  registerMeterListener: (
    channelId: number,
    listener: (values: ChannelMeterValues) => void,
  ) => () => void;
  onChangeLevel: (channelNumber: number, level: number) => void;
  onChangeLevelEnd: (channelNumber: number, level: number) => void;
  onOpenPan: (channelNumber: number) => void;
  onToggleMute: (channelNumber: number) => void;
};

const BusMixChannelItemComponent = ({
  channel,
  faderHeight,
  registerMeterListener,
  onChangeLevel,
  onChangeLevelEnd,
  onOpenPan,
  onToggleMute,
}: BusMixChannelItemProps): JSX.Element => {
  const handleToggleMute = useCallback(
    () => onToggleMute(channel.number),
    [channel.number, onToggleMute],
  );
  const handleFaderChange = useCallback(
    (level: number) => onChangeLevel(channel.number, level),
    [channel.number, onChangeLevel],
  );
  const handleFaderChangeEnd = useCallback(
    (level: number) => onChangeLevelEnd(channel.number, level),
    [channel.number, onChangeLevelEnd],
  );
  const handlePressBadge = useCallback(
    () => onOpenPan(channel.number),
    [channel.number, onOpenPan],
  );

  return (
    <ChannelStrip
      channel={channel}
      faderHeight={faderHeight}
      registerMeterListener={registerMeterListener}
      onToggleMute={handleToggleMute}
      onFaderChange={handleFaderChange}
      onFaderChangeEnd={handleFaderChangeEnd}
      onPressBadge={handlePressBadge}
    />
  );
};

const BusMixChannelItem = React.memo(
  BusMixChannelItemComponent,
  (prev, next) =>
    prev.channel.id === next.channel.id &&
    prev.channel.number === next.channel.number &&
    prev.channel.label === next.channel.label &&
    prev.channel.name === next.channel.name &&
    prev.channel.color === next.channel.color &&
    prev.channel.backgroundOpacity === next.channel.backgroundOpacity &&
    prev.channel.meterChannelId === next.channel.meterChannelId &&
    prev.channel.localFaderRaw === next.channel.localFaderRaw &&
    prev.channel.on === next.channel.on &&
    prev.channel.pan === next.channel.pan &&
    prev.faderHeight === next.faderHeight &&
    prev.registerMeterListener === next.registerMeterListener &&
    prev.onChangeLevel === next.onChangeLevel &&
    prev.onChangeLevelEnd === next.onChangeLevelEnd &&
    prev.onOpenPan === next.onOpenPan &&
    prev.onToggleMute === next.onToggleMute,
);

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
    deletePreset,
    restorePreset,
  } = useBusMix(consoleIp, busNumber);
  const { showModal } = useModal();
  const { registerMeterListener } = useMeterSubscription(consoleIp, !isLoading);
  const [faderHeight, setFaderHeight] = useState(240);
  const channelsRef = useRef<Channel[]>(channels);
  channelsRef.current = channels;

  const subtitle = useMemo(() => {
    const busLabel = `BUS ${busNumber.toString().padStart(2, '0')}`;
    if (linkedBusNumber) {
      return `${busLabel}/${linkedBusNumber.toString().padStart(2, '0')} · ${busName}`;
    }
    return `${busLabel} · ${busName}`;
  }, [busName, busNumber, linkedBusNumber]);

  const openPanModal = useCallback(
    (channelNumber: number): void => {
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
    },
    [getPanPercent, setPan, showModal],
  );

  const openPresetsModal = useCallback((): void => {
    showModal(BusMixPresetsModal, {
      presets,
      maxPresets: MAX_BUS_MIX_PRESETS,
      isRestoringPreset,
      onRefreshPresets: refreshPresets,
      onCreatePreset: createPreset,
      onOverwritePreset: overwritePreset,
      onDeletePreset: deletePreset,
      onRestorePreset: restorePreset,
    });
  }, [
    createPreset,
    deletePreset,
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

  const keyExtractor = useCallback((item: Channel): string => item.id, []);

  const getChannelItemLayout = useCallback(
    (_data: ArrayLike<Channel> | null | undefined, index: number) => ({
      length: CHANNEL_ITEM_LENGTH,
      offset: CHANNEL_ITEM_LENGTH * index,
      index,
    }),
    [],
  );

  const handleListLayout = useCallback((event: LayoutChangeEvent): void => {
    const nextHeight = Math.max(
      120,
      Math.floor(event.nativeEvent.layout.height) - STRIP_FIXED_OVERHEAD,
    );
    setFaderHeight((current) => (current === nextHeight ? current : nextHeight));
  }, []);

  const renderChannel = useCallback(
    ({ item }: ListRenderItemInfo<Channel>) => (
      <BusMixChannelItem
        channel={item}
        faderHeight={faderHeight}
        registerMeterListener={registerMeterListener}
        onToggleMute={handleToggleMute}
        onChangeLevel={handleFaderChange}
        onChangeLevelEnd={handleFaderChangeEnd}
        onOpenPan={openPanModal}
      />
    ),
    [
      handleFaderChange,
      handleFaderChangeEnd,
      handleToggleMute,
      faderHeight,
      openPanModal,
      registerMeterListener,
    ],
  );

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
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={renderChannel}
        getItemLayout={getChannelItemLayout}
        onLayout={handleListLayout}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        removeClippedSubviews
        updateCellsBatchingPeriod={16}
        windowSize={5}
        decelerationRate="fast"
        disableIntervalMomentum={false}
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
