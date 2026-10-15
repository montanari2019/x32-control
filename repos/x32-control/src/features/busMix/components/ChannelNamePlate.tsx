import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { mapX32ColorToUiColor, X32ChannelColor } from '@shared/x32/channelColor';

type ChannelNamePlateProps = {
  label: string;
  name: string;
  color?: X32ChannelColor | number;
  onPress: () => void;
};

export const ChannelNamePlate = ({
  label,
  name,
  color = 0,
  onPress,
}: ChannelNamePlateProps): JSX.Element => {
  const { t } = useTranslation();
  const uiColor = mapX32ColorToUiColor(color);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('accessibility.editPan', { label })}
      onPress={onPress}
      style={({ pressed }) => [
        styles.plate,
        { backgroundColor: uiColor.backgroundColor },
        pressed && styles.pressed,
      ]}
    >
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        numberOfLines={2}
        style={[styles.name, { color: uiColor.textColor }]}
      >
        {name}
      </Text>
      <View style={styles.labelWrapper}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  label: {
    color: colors.text.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  labelWrapper: {
    backgroundColor: colors.surface.control,
    borderRadius: radius.xs,
    marginTop: 1,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  name: {
    fontSize: 11,
    fontWeight: '900',
    minHeight: 26,
    textAlign: 'center',
    width: '100%',
  },
  plate: {
    alignItems: 'center',
    borderRadius: radius.sm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 3,
    paddingVertical: 3,
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
  },
});
