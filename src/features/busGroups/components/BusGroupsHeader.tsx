import React from 'react';
import { AppHeader, AppHeaderActionText } from '@shared/components/AppHeader';

type BusGroupsHeaderProps = {
  onBack: () => void;
  onChannels: () => void;
};

export const BusGroupsHeader = ({ onBack, onChannels }: BusGroupsHeaderProps): JSX.Element => (
  <AppHeader
    title="Personal Mix Grupos"
    onBack={onBack}
    onRightPress={onChannels}
    rightAccessibilityLabel="Abrir Bus Mix"
    rightVariant="channels"
    rightContent={<AppHeaderActionText>Channels {'>'}</AppHeaderActionText>}
  />
);
