import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  FADER_THUMB_NEUTRAL_PALETTE,
  FaderThumbPalette,
} from '@shared/utils/faderThumbPalette';

export { FADER_THUMB_NEUTRAL_PALETTE };
export type { FaderThumbPalette };

export const FADER_THUMB_METRICS = {
  width: 32,
  height: 52,
  radius: 14,
} as const;

type FaderThumbProps = {
  palette?: FaderThumbPalette;
  pressed?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export const FaderThumb = ({
  palette = FADER_THUMB_NEUTRAL_PALETTE,
  pressed = false,
  style,
  testID,
}: FaderThumbProps): JSX.Element => (
  <View
    pointerEvents="none"
    testID={testID}
    style={[
      styles.container,
      { backgroundColor: palette.surface },
      pressed ? styles.pressed : undefined,
      style,
    ]}
  >
    <View
      style={[
        styles.surface,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={styles.leftShade} />
      <View style={styles.rightShade} />
      <View style={styles.topLight} />
      <View style={styles.bottomShade} />
      <View style={[styles.groove, styles.grooveTopFirst, { backgroundColor: palette.groove }]} />
      <View style={[styles.groove, styles.grooveTopSecond, { backgroundColor: palette.groove }]} />
      <View style={[styles.centerLine, { backgroundColor: palette.centerLine }]} />
      <View
        style={[styles.groove, styles.grooveBottomFirst, { backgroundColor: palette.groove }]}
      />
      <View
        style={[styles.groove, styles.grooveBottomSecond, { backgroundColor: palette.groove }]}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  bottomShade: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderBottomLeftRadius: FADER_THUMB_METRICS.radius,
    borderBottomRightRadius: FADER_THUMB_METRICS.radius,
    bottom: 0,
    height: 16,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  centerLine: {
    alignSelf: 'center',
    borderRadius: 1,
    height: 2,
    position: 'absolute',
    top: 25,
    width: 23,
  },
  container: {
    borderRadius: FADER_THUMB_METRICS.radius,
    elevation: 8,
    height: FADER_THUMB_METRICS.height,
    overflow: 'visible',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.42,
    shadowRadius: 11,
    width: FADER_THUMB_METRICS.width,
  },
  groove: {
    alignSelf: 'center',
    borderBottomColor: 'rgba(255, 255, 255, 0.65)',
    borderBottomWidth: 1,
    borderRadius: 2,
    borderTopColor: 'rgba(0, 0, 0, 0.18)',
    borderTopWidth: 1,
    height: 4,
    position: 'absolute',
    width: 22,
  },
  grooveBottomFirst: {
    top: 34,
  },
  grooveBottomSecond: {
    top: 41,
  },
  grooveTopFirst: {
    top: 10,
  },
  grooveTopSecond: {
    top: 17,
  },
  leftShade: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderBottomLeftRadius: FADER_THUMB_METRICS.radius,
    borderTopLeftRadius: FADER_THUMB_METRICS.radius,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 7,
  },
  pressed: {
    elevation: 5,
    opacity: 0.6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 7,
  },
  rightShade: {
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
    borderBottomRightRadius: FADER_THUMB_METRICS.radius,
    borderTopRightRadius: FADER_THUMB_METRICS.radius,
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 8,
  },
  surface: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: FADER_THUMB_METRICS.radius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderTopLeftRadius: FADER_THUMB_METRICS.radius,
    borderTopRightRadius: FADER_THUMB_METRICS.radius,
    height: 16,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
