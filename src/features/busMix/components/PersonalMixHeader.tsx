import React from 'react';
import { AppHeader, AppHeaderActionText } from '@shared/components/AppHeader';

type PersonalMixHeaderProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  onAction: () => void;
  actionLabel?: string;
  isActionLoading?: boolean;
  isActionDisabled?: boolean;
};

export const PersonalMixHeader = ({
  title,
  subtitle,
  onBack,
  onAction,
  actionLabel = 'Presets',
  isActionLoading = false,
  isActionDisabled = false,
}: PersonalMixHeaderProps): JSX.Element => (
  <AppHeader
    title={title}
    subtitle={subtitle}
    onBack={onBack}
    onRightPress={onAction}
    rightAccessibilityLabel={actionLabel}
    isRightDisabled={isActionDisabled || isActionLoading}
    rightVariant="success"
    rightContent={
      <AppHeaderActionText>{isActionLoading ? 'Abrindo...' : actionLabel}</AppHeaderActionText>
    }
  />
);
