import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import { x32DbToRaw } from '@shared/utils/faderDb';

type FaderDbScaleProps = {
  height: number;
};

const SCALE_MARKS_DB = [-60, -50, -40, -30, -20, -10, 0, 10] as const;
const MIN_DB = -60;
const MAX_DB = 10;
const MIN_RAW = x32DbToRaw(MIN_DB);
const MAX_RAW = x32DbToRaw(MAX_DB);
const LABEL_HEIGHT = 12;

const formatScaleLabel = (db: number): string => (db > 0 ? `+${db}` : `${db}`);

const getMarkPosition = (db: number): number => {
  const raw = x32DbToRaw(db);
  return (raw - MIN_RAW) / (MAX_RAW - MIN_RAW);
};

export const FaderDbScale = ({ height }: FaderDbScaleProps): JSX.Element => (
  <View pointerEvents="none" style={[styles.container, { height }]}>
    {SCALE_MARKS_DB.map((db) => {
      const top = (1 - getMarkPosition(db)) * height - LABEL_HEIGHT / 2;
      return (
        <View key={`db-scale-${db}`} style={[styles.mark, { top }]}>
          <Text style={styles.label}>{formatScaleLabel(db)}</Text>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    opacity: 0.58,
    position: 'relative',
    width: 26,
    zIndex: 1,
  },
  label: {
    color: colors.fader.scaleText,
    fontSize: 9,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: LABEL_HEIGHT,
    minWidth: 20,
    textAlign: 'right',
  },
  mark: {
    alignItems: 'center',
    position: 'absolute',
    right: 0,
  },
});
