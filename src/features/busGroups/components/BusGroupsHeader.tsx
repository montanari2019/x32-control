import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icons } from '@assets';
import { AppHeader, AppHeaderActionText } from '@shared/components/AppHeader';
import { colors } from '@shared/theme/colors';
import { spacing } from '@shared/theme/spacing';

type BusGroupsHeaderProps = {
  compact?: boolean;
  onBack: () => void;
  onChannels: () => void;
};

export const BusGroupsHeader = ({
  compact = false,
  onBack,
  onChannels,
}: BusGroupsHeaderProps): JSX.Element => (
  <AppHeader
    title="Personal Mix Grupos"
    compact={compact}
    onBack={onBack}
    onRightPress={onChannels}
    rightAccessibilityLabel="Abrir Bus Mix"
    rightVariant="channels"
    rightContent={
      <View style={styles.channelsContent}>
        <AppHeaderActionText compact={compact}>Channels</AppHeaderActionText>
        <View style={styles.forwardIcon}>
          <Icons.ArrowLeft
            color={colors.button.channels.text}
            width={compact ? 14 : 16}
            height={compact ? 14 : 16}
          />
        </View>
      </View>
    }
  />
);

const styles = StyleSheet.create({
  channelsContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  forwardIcon: {
    transform: [{ rotate: '180deg' }],
  },
});
