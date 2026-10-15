import React, { ReactNode } from 'react';
import { Button } from '@shared/components/Button';
import Dialog, { DialogPropsType } from '@shared/components/Dialog';

export type AlertDialogPropsType = DialogPropsType & {
  title?: string;
  message?: string | ReactNode;
  primaryButtonName?: string;
  secondaryButtonName?: string;
  onPressPrimary?: () => void;
  onPressSecondary?: () => void;
};

const AlertDialog = ({
  title,
  message,
  primaryButtonName = 'OK',
  secondaryButtonName,
  onPressPrimary,
  onPressSecondary,
  onDismiss,
  ...props
}: AlertDialogPropsType): JSX.Element => {
  const handlePrimaryPress = (): void => {
    onDismiss?.();
    onPressPrimary?.();
  };

  const handleSecondaryPress = (): void => {
    onDismiss?.();
    onPressSecondary?.();
  };

  return (
    <Dialog onDismiss={onDismiss} {...props}>
      <Dialog.Header>
        {title ? <Dialog.Title>{title}</Dialog.Title> : null}
        {message ? <Dialog.Message>{message}</Dialog.Message> : null}
      </Dialog.Header>

      <Dialog.Actions>
        <Button title={primaryButtonName} onPress={handlePrimaryPress} />
        {secondaryButtonName ? (
          <Button title={secondaryButtonName} onPress={handleSecondaryPress} variant="secondary" />
        ) : null}
      </Dialog.Actions>
    </Dialog>
  );
};

export default AlertDialog;
