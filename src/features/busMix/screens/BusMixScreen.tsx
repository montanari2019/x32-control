import React, { useCallback, useMemo, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  FlatList,
  LayoutChangeEvent,
  ListRenderItemInfo,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import type { ViewToken, ViewabilityConfig } from 'react-native';
import { RootStackParamList } from '@app/navigation/RootNavigator';
import { ErrorState } from '@shared/components/ErrorState';
import { LoadingState } from '@shared/components/LoadingState';
import { useModal } from '@shared/components/Modal';
import { Screen } from '@shared/components/Screen';
import { colors } from '@shared/theme/colors';
import { spacing } from '@shared/theme/spacing';
import { LANDSCAPE_FADER_DRAG_SENSITIVITY } from '@shared/utils/faderInteraction';
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
const STRIP_FIXED_OVERHEAD_COMPACT = 136;

type BusMixChannelItemProps = {
  channel: Channel;
  dragSensitivity?: number;
  faderHeight: number;
  isVisible: boolean;
  registerMeterListener: (
    channelId: number,
    listener: (values: ChannelMeterValues) => void,
  ) => () => void;
  onChangeLevel: (channelNumber: number, level: number) => void;
  onChangeLevelEnd: (channelNumber: number, level: number) => void;
  onFaderInteractionEnd: () => void;
  onFaderInteractionStart: () => void;
  onOpenPan: (channelNumber: number) => void;
  onToggleMute: (channelNumber: number) => void;
};

const BusMixChannelItemComponent = ({
  channel,
  dragSensitivity,
  faderHeight,
  isVisible,
  registerMeterListener,
  onChangeLevel,
  onChangeLevelEnd,
  onFaderInteractionEnd,
  onFaderInteractionStart,
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
      dragSensitivity={dragSensitivity}
      faderHeight={faderHeight}
      isVisible={isVisible}
      registerMeterListener={registerMeterListener}
      onToggleMute={handleToggleMute}
      onFaderChange={handleFaderChange}
      onFaderChangeEnd={handleFaderChangeEnd}
      onFaderInteractionEnd={onFaderInteractionEnd}
      onFaderInteractionStart={onFaderInteractionStart}
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
    prev.dragSensitivity === next.dragSensitivity &&
    prev.faderHeight === next.faderHeight &&
    prev.isVisible === next.isVisible &&
    prev.registerMeterListener === next.registerMeterListener &&
    prev.onChangeLevel === next.onChangeLevel &&
    prev.onChangeLevelEnd === next.onChangeLevelEnd &&
    prev.onFaderInteractionEnd === next.onFaderInteractionEnd &&
    prev.onFaderInteractionStart === next.onFaderInteractionStart &&
    prev.onOpenPan === next.onOpenPan &&
    prev.onToggleMute === next.onToggleMute,
);

export const BusMixScreen = ({ route, navigation }: Props) => {
  const { consoleIp, busName, busNumber, linkedBusNumber } = route.params;
  const { width, height } = useWindowDimensions();
  const isCompactLayout = width > height;
  const [visibleChannelIds, setVisibleChannelIds] = useState<Set<string>>(new Set());
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
  const faderDragSensitivity = isCompactLayout ? LANDSCAPE_FADER_DRAG_SENSITIVITY : undefined;
  const [faderHeight, setFaderHeight] = useState(240);
  const [isFaderInteractionActive, setIsFaderInteractionActive] = useState(false);
  const viewabilityConfig = useRef<ViewabilityConfig>({
    itemVisiblePercentThreshold: 10,
  }).current;
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

  const handleFaderInteractionStart = useCallback((): void => {
    setIsFaderInteractionActive(true);
  }, []);

  const handleFaderInteractionEnd = useCallback((): void => {
    setIsFaderInteractionActive(false);
  }, []);

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

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<Channel>[] }): void => {
      setVisibleChannelIds(new Set(viewableItems.map((viewableItem) => viewableItem.item.id)));
    },
    [],
  );

  const handleListLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      const fixedOverhead = isCompactLayout ? STRIP_FIXED_OVERHEAD_COMPACT : STRIP_FIXED_OVERHEAD;
      const nextHeight = Math.max(120, Math.floor(event.nativeEvent.layout.height) - fixedOverhead);
      setFaderHeight((current) => (current === nextHeight ? current : nextHeight));
    },
    [isCompactLayout],
  );

  const renderChannel = useCallback(
    ({ item }: ListRenderItemInfo<Channel>) => (
      <BusMixChannelItem
        channel={item}
        dragSensitivity={faderDragSensitivity}
        faderHeight={faderHeight}
        isVisible={visibleChannelIds.has(item.id)}
        registerMeterListener={registerMeterListener}
        onToggleMute={handleToggleMute}
        onChangeLevel={handleFaderChange}
        onChangeLevelEnd={handleFaderChangeEnd}
        onFaderInteractionEnd={handleFaderInteractionEnd}
        onFaderInteractionStart={handleFaderInteractionStart}
        onOpenPan={openPanModal}
      />
    ),
    [
      handleFaderChange,
      handleFaderChangeEnd,
      handleFaderInteractionEnd,
      handleFaderInteractionStart,
      handleToggleMute,
      faderDragSensitivity,
      faderHeight,
      openPanModal,
      registerMeterListener,
      visibleChannelIds,
    ],
  );

  if (isLoading) {
    return (
      <Screen style={[styles.screen, isCompactLayout && styles.screenCompact]}>
        <PersonalMixHeader
          title="Personal Mix Channel"
          subtitle={subtitle}
          compact={isCompactLayout}
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
    <Screen style={[styles.screen, isCompactLayout && styles.screenCompact]}>
      <PersonalMixHeader
        title="Personal Mix Channel"
        subtitle={subtitle}
        compact={isCompactLayout}
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
        scrollEnabled={!isFaderInteractionActive}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.list, isCompactLayout && styles.listCompact]}
        renderItem={renderChannel}
        getItemLayout={getChannelItemLayout}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
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
    paddingVertical: spacing.md,
  },
  listCompact: {
    paddingVertical: spacing.xs,
  },
  screen: {
    paddingBottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.background.primary,
  },
  screenCompact: {
    paddingBottom: spacing.xxs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
});
