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
  compact?: boolean;
  dragSensitivity?: number;
  isFaderDisabled?: boolean;
  isMaster?: boolean;
  isMuted: boolean;
  label: string;
  name: string;
  onFaderChange: (value: number) => void;
  onFaderInteractionEnd?: () => void;
  onFaderInteractionStart?: () => void;
  onPress?: () => void;
  onToggleMute: () => void;
  stripHeight?: number;
  value: number;
};

export const GroupStrip = ({
  accentColor,
  assignmentCount,
  compact = false,
  dragSensitivity,
  isFaderDisabled = false,
  isMaster = false,
  isMuted,
  label,
  name,
  onFaderChange,
  onFaderInteractionEnd,
  onFaderInteractionStart,
  onPress,
  onToggleMute,
  stripHeight,
  value,
}: GroupStripProps): JSX.Element => {
  const dbLabel = formatDb(faderToDb(value));
  const [measuredFaderHeight, setMeasuredFaderHeight] = useState(compact ? 160 : 320);
  const canOpenDetails = Boolean(onPress && !isMaster);

  const handleFaderSlotLayout = (event: LayoutChangeEvent): void => {
    const nextHeight = Math.max(compact ? 1 : 180, Math.floor(event.nativeEvent.layout.height));
    setMeasuredFaderHeight(nextHeight);
  };

  return (
    <View
      style={[
        styles.wrapper,
        compact && styles.wrapperCompact,
        isMaster ? styles.masterWrapper : styles.mcaWrapper,
        stripHeight ? { height: stripHeight } : undefined,
      ]}
    >
      <View
        style={[
          styles.card,
          compact && styles.cardCompact,
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
            compact && styles.headerPressableCompact,
            pressed && canOpenDetails ? styles.cardPressed : undefined,
          ]}
        >
          <Text style={[styles.kicker, compact && styles.kickerCompact]}>{label}</Text>
          <Text
            style={[
              styles.name,
              compact && styles.nameCompact,
              !isMaster ? styles.mcaName : undefined,
              compact && !isMaster ? styles.mcaNameCompact : undefined,
              {
                color: isMaster ? colors.master.label : accentColor,
              },
            ]}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            numberOfLines={2}
          >
            {name}
          </Text>
        </Pressable>

        <View
          style={[styles.faderSlot, compact && styles.faderSlotCompact]}
          onLayout={handleFaderSlotLayout}
        >
          <VerticalGroupFader
            accentColor={accentColor}
            disabled={isFaderDisabled}
            dragSensitivity={dragSensitivity}
            isMaster={isMaster}
            onFaderChange={onFaderChange}
            onInteractionEnd={onFaderInteractionEnd}
            onInteractionStart={onFaderInteractionStart}
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
            compact && styles.footerPressableCompact,
            pressed && canOpenDetails ? styles.cardPressed : undefined,
          ]}
        >
          <View
            style={[
              styles.labelPlate,
              compact && styles.labelPlateCompact,
              {
                backgroundColor: isMaster ? colors.master.thumb : accentColor,
              },
            ]}
          >
            <Text
              ellipsizeMode="clip"
              numberOfLines={1}
              style={[
                styles.labelPlateText,
                compact && styles.labelPlateTextCompact,
                !isMaster ? styles.mcaLabelPlateText : undefined,
                compact && !isMaster ? styles.mcaLabelPlateTextCompact : undefined,
              ]}
            >
              {dbLabel}
            </Text>
          </View>

          {assignmentCount != null ? (
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              numberOfLines={1}
              style={[styles.assignmentText, compact && styles.assignmentTextCompact]}
            >
              {assignmentCount} canais
            </Text>
          ) : (
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.62}
              numberOfLines={1}
              style={[styles.assignmentText, compact && styles.assignmentTextCompact]}
            >
              Bus master
            </Text>
          )}
        </Pressable>
      </View>

      <GroupMuteButton
        compact={compact}
        dense={!isMaster}
        isMuted={isMuted}
        onPress={onToggleMute}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  assignmentText: {
    color: colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: spacing.xs,
    minHeight: 13,
    textAlign: 'center',
  },
  assignmentTextCompact: {
    fontSize: 9,
    marginTop: spacing.xxs,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.md,
    width: '100%',
  },
  cardCompact: {
    borderRadius: radius.md,
    gap: spacing.xxs,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
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
  faderSlotCompact: {
    marginTop: 0,
    minHeight: 0,
  },
  footerPressable: {
    gap: spacing.xs,
  },
  footerPressableCompact: {
    gap: spacing.xxs,
  },
  headerPressable: {
    gap: spacing.xs,
  },
  headerPressableCompact: {
    gap: 0,
  },
  kicker: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  kickerCompact: {
    fontSize: 9,
    letterSpacing: 0.4,
  },
  labelPlate: {
    borderRadius: radius.md,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  labelPlateCompact: {
    marginTop: 0,
    paddingHorizontal: spacing.xxs,
    paddingVertical: spacing.xxs,
  },
  labelPlateText: {
    color: colors.background.deep,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  labelPlateTextCompact: {
    fontSize: 10,
    lineHeight: 12,
  },
  mcaLabelPlateText: {
    flexShrink: 0,
    fontSize: 11,
    includeFontPadding: false,
    lineHeight: 13,
    textAlign: 'center',
  },
  mcaLabelPlateTextCompact: {
    fontSize: 9,
    lineHeight: 11,
  },
  masterCard: {
    backgroundColor: colors.surface.stripMaster,
  },
  masterWrapper: {
    width: 72,
  },
  mcaCard: {
    backgroundColor: colors.surface.strip,
    borderRadius: radius.lg,
  },
  mcaName: {
    fontSize: 13,
    lineHeight: 16,
  },
  mcaNameCompact: {
    fontSize: 10,
    lineHeight: 12,
  },
  mcaWrapper: {
    width: 70,
  },
  name: {
    fontSize: 15,
    fontWeight: '900',
    minHeight: 38,
    textAlign: 'center',
  },
  nameCompact: {
    fontSize: 11,
    minHeight: 24,
  },
  wrapper: {
    gap: spacing.sm,
  },
  wrapperCompact: {
    gap: spacing.xxs,
  },
});
