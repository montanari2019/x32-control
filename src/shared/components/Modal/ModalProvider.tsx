import React, { PropsWithChildren, createContext, useCallback, useMemo, useState } from 'react';

export type ModalRenderProps = {
    visible: boolean;
    onDismiss: () => void;
    onDismissEnd: () => void;
};

type ModalRenderer = (props: ModalRenderProps) => React.ReactNode;

type ModalEntry = {
    id: string;
    render: ModalRenderer;
    visible: boolean;
};

type ModalContextValue = {
    showModal: (render: ModalRenderer) => string;
    hideModal: (id: string) => void;
    hideAll: () => void;
};

export const ModalContext = createContext<ModalContextValue | undefined>(undefined);

const DISMISS_DELAY_MS = 200;

export const ModalProvider = ({ children }: PropsWithChildren): JSX.Element => {
    const [modals, setModals] = useState<ModalEntry[]>([]);

    const hideModal = useCallback((id: string) => {
        setModals((current) =>
            current.map((entry) => (entry.id === id ? { ...entry, visible: false } : entry)),
        );
        setTimeout(() => {
            setModals((current) => current.filter((entry) => entry.id !== id));
        }, DISMISS_DELAY_MS);
    }, []);

    const hideAll = useCallback(() => {
        setModals((current) => current.map((entry) => ({ ...entry, visible: false })));
        setTimeout(() => {
            setModals([]);
        }, DISMISS_DELAY_MS);
    }, []);

    const showModal = useCallback((render: ModalRenderer) => {
        const id = `modal-${Date.now()}-${Math.round(Math.random() * 10000)}`;
        setModals((current) => [...current, { id, render, visible: true }]);
        return id;
    }, []);

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
            {modals.map((entry) => (
                <React.Fragment key={entry.id}>
                    {entry.render({
                        visible: entry.visible,
                        onDismiss: () => hideModal(entry.id),
                        onDismissEnd: () => hideModal(entry.id),
                    })}
                </React.Fragment>
            ))}
        </ModalContext.Provider>
    );
};
