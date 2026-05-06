export type ModalPropsType = {
  visible: boolean;
  onDismiss?: () => void;
  onDismissEnd?: () => void;
  dismissible?: boolean;
  animationDuration?: number;
};

export type ModalRenderProps = ModalPropsType;

export type ModalHandle = {
  id: string;
  dismiss: () => void;
};
