import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LayoutChangeEvent, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '@app/navigation/RootNavigator';
import Toast from '@shared/components/Toast';
import { ErrorState } from '@shared/components/ErrorState';
import { LoadingState } from '@shared/components/LoadingState';
import { useModal } from '@shared/components/Modal';
import { Screen } from '@shared/components/Screen';
import { colors } from '@shared/theme/colors';
import { spacing } from '@shared/theme/spacing';
import { LANDSCAPE_FADER_DRAG_SENSITIVITY } from '@shared/utils/faderInteraction';
import { BusGroupsHeader } from '../components/BusGroupsHeader';
import { McaChannelSelectionModal } from '../components/McaChannelSelectionModal';
import { MasterStrip } from '../components/MasterStrip';
import { McaStrip } from '../components/McaStrip';
import { useBusGroups } from '../hooks/useBusGroups';
import { McaGroup } from '../types/busGroups.types';

type Props = NativeStackScreenProps<RootStackParamList, 'BusGroups'>;

type McaStripItemProps = {
  mca: McaGroup;
  onFaderChange: (value: number) => void;
  onFaderInteractionEnd: () => void;
  onFaderInteractionStart: () => void;
  onPress: () => void;
  onToggleMute: () => void;
  stripHeight: number;
  compact: boolean;
};

const McaStripItem = React.memo(
  ({
    compact,
    mca,
    onFaderChange,
    onFaderInteractionEnd,
    onFaderInteractionStart,
    onPress,
    onToggleMute,
    stripHeight,
  }: McaStripItemProps) => (
    <McaStrip
      compact={compact}
      mca={mca}
      onFaderChange={onFaderChange}
      onFaderInteractionEnd={onFaderInteractionEnd}
      onFaderInteractionStart={onFaderInteractionStart}
      onPress={onPress}
      onToggleMute={onToggleMute}
      stripHeight={stripHeight}
    />
  ),
  (prev, next) =>
    prev.mca.faderRawValue === next.mca.faderRawValue &&
    prev.mca.isMuted === next.mca.isMuted &&
    prev.mca.name === next.mca.name &&
    prev.mca.colorToken === next.mca.colorToken &&
    prev.mca.assignedChannels.length === next.mca.assignedChannels.length &&
    prev.stripHeight === next.stripHeight &&
    prev.compact === next.compact &&
    prev.onFaderChange === next.onFaderChange &&
    prev.onFaderInteractionEnd === next.onFaderInteractionEnd &&
    prev.onFaderInteractionStart === next.onFaderInteractionStart &&
    prev.onPress === next.onPress &&
    prev.onToggleMute === next.onToggleMute,
);

export const BusGroupsScreen = ({ navigation, route }: Props): JSX.Element => {
  const { consoleIp, busNumber, busName, linkedBusNumber } = route.params;
  const { width, height } = useWindowDimensions();
  const { showModal } = useModal();
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const [stripsHeight, setStripsHeight] = useState(0);
  const [isFaderInteractionActive, setIsFaderInteractionActive] = useState(false);
  const isCompactLayout = width > height;
  const {
    masterFaderRaw,
    masterMeterDbfs,
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
    clearMcaChannels,
    renameMca,
  } = useBusGroups(consoleIp, busNumber, { isMasterMeterActive: isFocused });
  const mcasRef = useRef(mcas);
  const availableChannelsRef = useRef(availableChannels);

  useEffect(() => {
    mcasRef.current = mcas;
  }, [mcas]);

  useEffect(() => {
    availableChannelsRef.current = availableChannels;
  }, [availableChannels]);

  useEffect(() => {
    if (!error) {
      return;
    }

    showModal(Toast, {
      title: t('busGroups.failureTitle'),
      message: error,
      variant: 'error',
    });
  }, [error, showModal, t]);

  const handleStripsAreaLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      const minHeight = isCompactLayout ? 1 : 320;
      const nextHeight = Math.max(minHeight, Math.floor(event.nativeEvent.layout.height));
      setStripsHeight((current) => (current === nextHeight ? current : nextHeight));
    },
    [isCompactLayout],
  );

  const handleFaderInteractionStart = useCallback((): void => {
    setIsFaderInteractionActive(true);
  }, []);

  const handleFaderInteractionEnd = useCallback((): void => {
    setIsFaderInteractionActive(false);
  }, []);

  const mcaFaderCallbacks = useMemo(
    () =>
      new Map<number, (value: number) => void>(
        mcas.map<[number, (value: number) => void]>((mca) => [
          mca.dcaNumber,
          (value: number) => setMcaFader(mca.dcaNumber, value),
        ]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mcas.length, setMcaFader],
  );

  const mcaMuteCallbacks = useMemo(
    () =>
      new Map<number, () => void>(
        mcas.map<[number, () => void]>((mca) => [
          mca.dcaNumber,
          () => toggleMcaMute(mca.dcaNumber),
        ]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mcas.length, toggleMcaMute],
  );

  const mcaPressCallbacks = useMemo(
    () =>
      new Map<number, () => void>(
        mcas.map<[number, () => void]>((mca) => [
          mca.dcaNumber,
          () => {
            const currentMca = mcasRef.current.find((item) => item.dcaNumber === mca.dcaNumber);
            if (!currentMca) {
              return;
            }

            showModal(McaChannelSelectionModal, {
              accentColor: colors.mca[currentMca.colorToken],
              channels: availableChannelsRef.current,
              mca: currentMca,
              onClearChannels: () => clearMcaChannels(currentMca.dcaNumber),
              onRename: (name) => renameMca(currentMca.dcaNumber, name),
              onToggleChannel: (channel) =>
                toggleMcaChannelAssignment(currentMca.dcaNumber, channel),
            });
          },
        ]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearMcaChannels, mcas.length, renameMca, showModal, toggleMcaChannelAssignment],
  );

  return (
    <Screen style={[styles.screen, isCompactLayout && styles.screenCompact]}>
      <View style={[styles.content, isCompactLayout && styles.contentCompact]}>
        <BusGroupsHeader
          compact={isCompactLayout}
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

        {isLoading ? <LoadingState label={t('busGroups.loading')} /> : null}
        {!isLoading && error ? (
          <View style={styles.errorBlock}>
            <ErrorState message={error} actionLabel={t('common.actions.reload')} onAction={reload} />
          </View>
        ) : null}

        {!isLoading ? (
          <View style={styles.stripsArea} onLayout={handleStripsAreaLayout}>
            <ScrollView
              horizontal
              contentContainerStyle={[
                styles.strips,
                isCompactLayout && styles.stripsCompact,
                stripsHeight > 0 ? { minHeight: stripsHeight } : undefined,
              ]}
              decelerationRate="fast"
              overScrollMode="never"
              pagingEnabled={false}
              removeClippedSubviews={false}
              scrollEnabled={!isFaderInteractionActive}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
              style={styles.stripsScroll}
            >
              <MasterStrip
                busId={busNumber}
                busName={busName}
                compact={isCompactLayout}
                dragSensitivity={isCompactLayout ? LANDSCAPE_FADER_DRAG_SENSITIVITY : undefined}
                isMuted={masterMuted}
                meterDbfs={masterMeterDbfs}
                onFaderChange={setMasterFader}
                onFaderInteractionEnd={handleFaderInteractionEnd}
                onFaderInteractionStart={handleFaderInteractionStart}
                onToggleMute={toggleMasterMute}
                stripHeight={stripsHeight}
                value={masterFaderRaw}
              />

              {mcas.map((mca) => (
                <McaStripItem
                  key={mca.id}
                  compact={isCompactLayout}
                  mca={mca}
                  onFaderChange={mcaFaderCallbacks.get(mca.dcaNumber)!}
                  onFaderInteractionEnd={handleFaderInteractionEnd}
                  onFaderInteractionStart={handleFaderInteractionStart}
                  onPress={mcaPressCallbacks.get(mca.dcaNumber)!}
                  onToggleMute={mcaMuteCallbacks.get(mca.dcaNumber)!}
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
  contentCompact: {
    gap: spacing.xs,
  },
  errorBlock: {
    paddingHorizontal: spacing.sm,
  },
  screen: {
    backgroundColor: colors.background.primary,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  screenCompact: {
    paddingBottom: spacing.xxs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
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
    gap: spacing.xs,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  stripsCompact: {
    gap: spacing.xs,
    paddingBottom: 0,
  },
});
