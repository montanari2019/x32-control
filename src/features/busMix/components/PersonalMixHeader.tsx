import React from 'react';
import { AppHeader, AppHeaderActionText } from '@shared/components/AppHeader';

type PersonalMixHeaderProps = {
  title: string;
  subtitle?: string;
  compact?: boolean;
  onBack: () => void;
  onAction: () => void;
  actionLabel?: string;
  isActionLoading?: boolean;
  isActionDisabled?: boolean;
};

export const PersonalMixHeader = ({
  title,
  subtitle,
  compact = false,
  onBack,
  onAction,
  actionLabel = 'Presets',
  isActionLoading = false,
  isActionDisabled = false,
}: PersonalMixHeaderProps): JSX.Element => (
  <AppHeader
    title={title}
    subtitle={subtitle}
    compact={compact}
    onBack={onBack}
    onRightPress={onAction}
    rightAccessibilityLabel={actionLabel}
    isRightDisabled={isActionDisabled || isActionLoading}
    rightVariant="success"
    rightContent={
      <AppHeaderActionText compact={compact}>
        {isActionLoading ? 'Abrindo...' : actionLabel}
      </AppHeaderActionText>
    }
  />
);
