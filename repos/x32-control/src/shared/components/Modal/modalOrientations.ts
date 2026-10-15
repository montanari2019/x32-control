import type { ComponentProps } from 'react';
import { Modal } from 'react-native';

type SupportedOrientations = NonNullable<ComponentProps<typeof Modal>['supportedOrientations']>;

export const APP_MODAL_SUPPORTED_ORIENTATIONS: SupportedOrientations = [
  'portrait',
  'landscape',
  'landscape-left',
  'landscape-right',
];
