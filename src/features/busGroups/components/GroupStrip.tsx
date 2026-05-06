import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  onToggleMute: () => void;
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
  onToggleMute,
  value,
}: GroupStripProps): JSX.Element => {
  const dbLabel = formatDb(faderToDb(value));

  return (
    <View style={[styles.wrapper, isMaster ? styles.masterWrapper : styles.mcaWrapper]}>
      <View
        style={[
          styles.card,
          isMaster ? styles.masterCard : styles.mcaCard,
          { borderColor: isMaster ? colors.border.subtle : accentColor },
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

        <View style={styles.faderSlot}>
          <VerticalGroupFader
            accentColor={accentColor}
            isMaster={isMaster}
            onFaderChange={onFaderChange}
            value={value}
          />
        </View>

        <View
          style={[
            styles.labelPlate,
            {
              backgroundColor: isMaster ? colors.master.thumb : accentColor,
            },
          ]}
        >
          <Text style={styles.labelPlateText}>{dbLabel}</Text>
        </View>

        {assignmentCount != null ? (
          <Text style={styles.assignmentText}>{assignmentCount} canais</Text>
        ) : (
          <Text style={styles.assignmentText}>Bus master</Text>
        )}
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
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    width: '100%',
  },
  faderSlot: {
    alignItems: 'center',
    height: 300,
    justifyContent: 'center',
    marginTop: spacing.xs,
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
  masterCard: {
    backgroundColor: colors.surface.stripMaster,
  },
  masterWrapper: {
    width: 112,
  },
  mcaCard: {
    backgroundColor: colors.surface.strip,
  },
  mcaWrapper: {
    width: 90,
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
