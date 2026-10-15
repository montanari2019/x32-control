import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  meterDbfs?: number;
  name: string;
  onFaderChange: (value: number) => void;
  onFaderInteractionEnd?: () => void;
  onFaderInteractionStart?: () => void;
  onPress?: () => void;
  onToggleMute: () => void;
  stripHeight?: number;
  value: number;
};

const getInitialFaderHeight = (compact: boolean): number => {
  if (compact) {
    return 160;
  }

  return 320;
};

const getMinimumFaderHeight = (compact: boolean): number => {
  if (compact) {
    return 1;
  }

  return 180;
};

const getWrapperModeStyle = (isMaster: boolean) => {
  if (isMaster) {
    return styles.masterWrapper;
  }

  return styles.mcaWrapper;
};

const getStripHeightStyle = (stripHeight: number | undefined) => {
  if (stripHeight == null) {
    return undefined;
  }

  return { height: stripHeight };
};

const getCardModeStyle = (isMaster: boolean) => {
  if (isMaster) {
    return styles.masterCard;
  }

  return styles.mcaCard;
};

const getCardBorderStyle = (isMaster: boolean, accentColor: string) => {
  if (isMaster) {
    return { borderColor: colors.border.subtle };
  }

  return { borderColor: accentColor };
};

const getPressedStyle = (pressed: boolean, canOpenDetails: boolean) => {
  if (pressed && canOpenDetails) {
    return styles.cardPressed;
  }

  return undefined;
};

const getMcaNameStyle = (isMaster: boolean) => {
  if (isMaster) {
    return undefined;
  }

  return styles.mcaName;
};

const getCompactMcaNameStyle = (compact: boolean, isMaster: boolean) => {
  if (!compact || isMaster) {
    return undefined;
  }

  return styles.mcaNameCompact;
};

const getNameColorStyle = (isMaster: boolean, accentColor: string) => {
  if (isMaster) {
    return { color: colors.master.label };
  }

  return { color: accentColor };
};

const getLabelPlateBackgroundStyle = (isMaster: boolean, accentColor: string) => {
  if (isMaster) {
    return { backgroundColor: colors.master.thumb };
  }

  return { backgroundColor: accentColor };
};

const getMcaLabelPlateTextStyle = (isMaster: boolean) => {
  if (isMaster) {
    return undefined;
  }

  return styles.mcaLabelPlateText;
};

const getCompactMcaLabelPlateTextStyle = (compact: boolean, isMaster: boolean) => {
  if (!compact || isMaster) {
    return undefined;
  }

  return styles.mcaLabelPlateTextCompact;
};

const renderAssignmentText = (
  assignmentCount: number | undefined,
  compact: boolean,
  t: (key: string, options?: Record<string, unknown>) => string,
): JSX.Element => {
  if (assignmentCount != null) {
    return (
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        numberOfLines={1}
        style={[styles.assignmentText, compact && styles.assignmentTextCompact]}
      >
        {t('busGroups.assignmentCount', { count: assignmentCount })}
      </Text>
    );
  }

  return (
    <Text
      adjustsFontSizeToFit
      minimumFontScale={0.62}
      numberOfLines={1}
      style={[styles.assignmentText, compact && styles.assignmentTextCompact]}
    >
      {t('busGroups.busMaster')}
    </Text>
  );
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
  meterDbfs,
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
  const { t } = useTranslation();
  const [measuredFaderHeight, setMeasuredFaderHeight] = useState(getInitialFaderHeight(compact));
  const canOpenDetails = Boolean(onPress && !isMaster);

  const handleFaderSlotLayout = (event: LayoutChangeEvent): void => {
    const nextHeight = Math.max(
      getMinimumFaderHeight(compact),
      Math.floor(event.nativeEvent.layout.height),
    );
    setMeasuredFaderHeight(nextHeight);
  };

  return (
    <View
      style={[
        styles.wrapper,
        compact && styles.wrapperCompact,
        getWrapperModeStyle(isMaster),
        getStripHeightStyle(stripHeight),
      ]}
    >
      <View
        style={[
          styles.card,
          compact && styles.cardCompact,
          getCardModeStyle(isMaster),
          getCardBorderStyle(isMaster, accentColor),
        ]}
      >
        <Pressable
          disabled={!canOpenDetails}
          hitSlop={6}
          onPress={onPress}
          style={({ pressed }) => [
            styles.headerPressable,
            compact && styles.headerPressableCompact,
            getPressedStyle(pressed, canOpenDetails),
          ]}
        >
          <Text style={[styles.kicker, compact && styles.kickerCompact]}>{label}</Text>
          <Text
            style={[
              styles.name,
              compact && styles.nameCompact,
              getMcaNameStyle(isMaster),
              getCompactMcaNameStyle(compact, isMaster),
              getNameColorStyle(isMaster, accentColor),
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
            meterDbfs={meterDbfs}
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
            getPressedStyle(pressed, canOpenDetails),
          ]}
        >
          <View
            style={[
              styles.labelPlate,
              compact && styles.labelPlateCompact,
              getLabelPlateBackgroundStyle(isMaster, accentColor),
            ]}
          >
            <Text
              adjustsFontSizeToFit
              ellipsizeMode="clip"
              minimumFontScale={0.82}
              numberOfLines={1}
              style={[
                styles.labelPlateText,
                compact && styles.labelPlateTextCompact,
                getMcaLabelPlateTextStyle(isMaster),
                getCompactMcaLabelPlateTextStyle(compact, isMaster),
              ]}
            >
              {dbLabel}
            </Text>
          </View>

          {renderAssignmentText(assignmentCount, compact, t)}
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
    fontSize: 10,
    includeFontPadding: false,
    lineHeight: 12,
    textAlign: 'center',
  },
  mcaLabelPlateTextCompact: {
    fontSize: 8.5,
    lineHeight: 10,
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
