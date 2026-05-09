import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { formatDb, faderToDb } from '../utils/audio';
import { GroupMuteButton } from './GroupMuteButton';
import { VerticalGroupFader } from './VerticalGroupFader';

type GroupStripProps = {
  accentColor: string;
  assignmentCount?: number;
  isMaster?: boolean;
  isMuted: boolean;
  label: string;
  name: string;
  onFaderChange: (value: number) => void;
  onPress?: () => void;
  onToggleMute: () => void;
  stripHeight?: number;
  value: number;
};

export const GroupStrip = ({
  accentColor,
  assignmentCount,
  isMaster = false,
  isMuted,
  label,
  name,
  onFaderChange,
  onPress,
  onToggleMute,
  stripHeight,
  value,
}: GroupStripProps): JSX.Element => {
  const dbLabel = formatDb(faderToDb(value));
  const [measuredFaderHeight, setMeasuredFaderHeight] = useState(320);
  const canOpenDetails = Boolean(onPress && !isMaster);

  const handleFaderSlotLayout = (event: LayoutChangeEvent): void => {
    const nextHeight = Math.max(180, Math.floor(event.nativeEvent.layout.height));
    setMeasuredFaderHeight(nextHeight);
  };

  return (
    <View
      style={[
        styles.wrapper,
        isMaster ? styles.masterWrapper : styles.mcaWrapper,
        stripHeight ? { height: stripHeight } : undefined,
      ]}
    >
      <View
        style={[
          styles.card,
          isMaster ? styles.masterCard : styles.mcaCard,
          { borderColor: isMaster ? colors.border.subtle : accentColor },
        ]}
      >
        <Pressable
          disabled={!canOpenDetails}
          hitSlop={6}
          onPress={onPress}
          style={({ pressed }) => [
            styles.headerPressable,
            pressed && canOpenDetails ? styles.cardPressed : undefined,
          ]}
        >
          <Text style={styles.kicker}>{label}</Text>
          <Text
            style={[
              styles.name,
              {
                color: isMaster ? colors.master.label : accentColor,
              },
            ]}
            numberOfLines={2}
          >
            {name}
          </Text>
        </Pressable>

        <View style={styles.faderSlot} onLayout={handleFaderSlotLayout}>
          <VerticalGroupFader
            accentColor={accentColor}
            isMaster={isMaster}
            onFaderChange={onFaderChange}
            trackHeight={measuredFaderHeight}
            value={value}
          />
        </View>

        <Pressable
          disabled={!canOpenDetails}
          hitSlop={6}
          onPress={onPress}
          style={({ pressed }) => [
            styles.footerPressable,
            pressed && canOpenDetails ? styles.cardPressed : undefined,
          ]}
        >
          <View
            style={[
              styles.labelPlate,
              {
                backgroundColor: isMaster ? colors.master.thumb : accentColor,
              },
            ]}
          >
            <Text
              ellipsizeMode="clip"
              numberOfLines={1}
              style={[styles.labelPlateText, !isMaster ? styles.mcaLabelPlateText : undefined]}
            >
              {dbLabel}
            </Text>
          </View>

          {assignmentCount != null ? (
            <Text style={styles.assignmentText}>{assignmentCount} canais</Text>
          ) : (
            <Text style={styles.assignmentText}>Bus master</Text>
          )}
        </Pressable>
      </View>

      <GroupMuteButton isMuted={isMuted} onPress={onToggleMute} />
    </View>
  );
};

const styles = StyleSheet.create({
  assignmentText: {
    color: colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    width: '100%',
  },
  cardPressed: {
    opacity: 0.9,
  },
  faderSlot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: spacing.xs,
    minHeight: 220,
  },
  footerPressable: {
    gap: spacing.xs,
  },
  headerPressable: {
    gap: spacing.xs,
  },
  kicker: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  labelPlate: {
    borderRadius: radius.md,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  labelPlateText: {
    color: colors.background.deep,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  mcaLabelPlateText: {
    flexShrink: 0,
    fontSize: 11,
    includeFontPadding: false,
    lineHeight: 13,
    textAlign: 'center',
  },
  masterCard: {
    backgroundColor: colors.surface.stripMaster,
  },
  masterWrapper: {
    width: 104,
  },
  mcaCard: {
    backgroundColor: colors.surface.strip,
  },
  mcaWrapper: {
    width: 82,
  },
  name: {
    fontSize: 15,
    fontWeight: '900',
    minHeight: 38,
    textAlign: 'center',
  },
  wrapper: {
    gap: spacing.sm,
  },
});
