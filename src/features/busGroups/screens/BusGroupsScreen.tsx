import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  onPress: () => void;
  onToggleMute: () => void;
  stripHeight: number;
};

const McaStripItem = React.memo(
  ({ mca, onFaderChange, onPress, onToggleMute, stripHeight }: McaStripItemProps) => (
    <McaStrip
      mca={mca}
      onFaderChange={onFaderChange}
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
    prev.onFaderChange === next.onFaderChange &&
    prev.onPress === next.onPress &&
    prev.onToggleMute === next.onToggleMute,
);

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
    clearMcaChannels,
    renameMca,
  } = useBusGroups(consoleIp, busNumber);
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
      title: 'Falha no controle de grupos',
      message: error,
      variant: 'error',
    });
  }, [error, showModal]);

  const handleStripsAreaLayout = useCallback((event: LayoutChangeEvent): void => {
    const nextHeight = Math.max(320, Math.floor(event.nativeEvent.layout.height));
    setStripsHeight((current) => (current === nextHeight ? current : nextHeight));
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
              decelerationRate="fast"
              overScrollMode="never"
              pagingEnabled={false}
              removeClippedSubviews={false}
              scrollEventThrottle={16}
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
                <McaStripItem
                  key={mca.id}
                  mca={mca}
                  onFaderChange={mcaFaderCallbacks.get(mca.dcaNumber)!}
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
