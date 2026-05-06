import React, {
  ComponentType,
  PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ModalHandle, ModalPropsType } from './types';

type ModalComponent<Props extends ModalPropsType = ModalPropsType> = ComponentType<Props>;

type ModalEntry = {
  id: string;
  component: ModalComponent<any>;
  props: Record<string, unknown>;
  visible: boolean;
  animationDuration: number;
};

type ModalContextValue = {
  showModal: <Props extends ModalPropsType>(
    Component: ModalComponent<Props>,
    props?: Omit<Props, keyof ModalPropsType>,
  ) => ModalHandle;
  hideModal: (id: string) => void;
  hideAll: () => void;
};

type ModalProviderProps = PropsWithChildren<{
  throttleTimeout?: number;
}>;

export const ModalContext = createContext<ModalContextValue | undefined>(undefined);

const DEFAULT_ANIMATION_DURATION = 250;
const DEFAULT_THROTTLE_TIMEOUT = 500;

const getModalSignature = (Component: ModalComponent<any>): string =>
  (Component as { displayName?: string }).displayName || Component.name || 'anonymous-modal';

export const ModalProvider = ({
  children,
  throttleTimeout = DEFAULT_THROTTLE_TIMEOUT,
}: ModalProviderProps): JSX.Element => {
  const [modals, setModals] = useState<ModalEntry[]>([]);
  const dismissTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const throttleRef = useRef<Map<string, number>>(new Map());

  const removeModal = useCallback((id: string) => {
    const pendingTimeout = dismissTimeoutsRef.current.get(id);
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      dismissTimeoutsRef.current.delete(id);
    }

    setModals((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const scheduleRemoval = useCallback((id: string, animationDuration: number) => {
    const pendingTimeout = dismissTimeoutsRef.current.get(id);
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
    }

    const timeoutId = setTimeout(() => {
      dismissTimeoutsRef.current.delete(id);
      setModals((current) => current.filter((entry) => entry.id !== id));
    }, animationDuration + 60);

    dismissTimeoutsRef.current.set(id, timeoutId);
  }, []);

  const hideModal = useCallback(
    (id: string) => {
      setModals((current) => {
        const entry = current.find((item) => item.id === id);
        scheduleRemoval(id, entry?.animationDuration ?? DEFAULT_ANIMATION_DURATION);

        return current.map((item) => (item.id === id ? { ...item, visible: false } : item));
      });
    },
    [scheduleRemoval],
  );

  const hideAll = useCallback(() => {
    setModals((current) => {
      current.forEach((entry) => {
        scheduleRemoval(entry.id, entry.animationDuration);
      });

      return current.map((entry) => ({ ...entry, visible: false }));
    });
  }, [scheduleRemoval]);

  const showModal = useCallback(
    <Props extends ModalPropsType>(
      Component: ModalComponent<Props>,
      props?: Omit<Props, keyof ModalPropsType>,
    ): ModalHandle => {
      const signature = getModalSignature(Component);
      const now = Date.now();
      const lastOpenedAt = throttleRef.current.get(signature);

      if (
        typeof lastOpenedAt === 'number' &&
        throttleTimeout > 0 &&
        now - lastOpenedAt < throttleTimeout
      ) {
        return {
          id: `${signature}-throttled`,
          dismiss: () => undefined,
        };
      }

      throttleRef.current.set(signature, now);

      const id = `modal-${now}-${Math.round(Math.random() * 10000)}`;

      setModals((current) => [
        ...current,
        {
          id,
          component: Component,
          props: props ? { ...props } : {},
          visible: true,
          animationDuration: DEFAULT_ANIMATION_DURATION,
        },
      ]);

      return {
        id,
        dismiss: () => hideModal(id),
      };
    },
    [hideModal, throttleTimeout],
  );

  useEffect(
    () => () => {
      dismissTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      dismissTimeoutsRef.current.clear();
    },
    [],
  );

  const value = useMemo(
    () => ({
      showModal,
      hideModal,
      hideAll,
    }),
    [hideAll, hideModal, showModal],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modals.map((entry) => {
        const Component = entry.component;

        return (
          <Component
            key={entry.id}
            {...entry.props}
            visible={entry.visible}
            onDismiss={() => hideModal(entry.id)}
            onDismissEnd={() => removeModal(entry.id)}
          />
        );
      })}
    </ModalContext.Provider>
  );
};
