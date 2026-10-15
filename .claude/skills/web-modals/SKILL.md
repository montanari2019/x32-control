---
name: web-modals
description: Web modal patterns using Modal and ModalProvider wrappers (Ant Design underneath). Use whenever the user asks to create, refactor, stack, open, close, throttle, or test modals/dialogs/confirmations in web front-end features.
---

# Web Template - Modals

Use this skill to implement modal flows with the project modal abstraction, not with raw Ant Design usage inside feature pages.

## Core Components

- Base component: `src/components/Modal/index.tsx`
- Provider and hooks: `src/components/Modal/ModalProvider.tsx`
- Behavior tests: `src/components/Modal/Modal.spec.tsx`

## Contract for Modal Components

- Build feature modals on top of the project `Modal` wrapper.
- Keep compatibility with `ModalPropsType` from the modal component.
- Treat `visible` as the source of truth for display state.
- Always pass and propagate `onDismiss` and `onDismissEnd`.
- Keep `modalKey` wired by the provider; do not hardcode keys in production modal flows.

`ModalPropsType` expects this API shape:
- `visible`: modal visibility state
- `modalKey`: unique key per modal instance
- `onDismiss`: close handler
- `onDismissEnd`: unmount lifecycle callback
- `dismissible`: whether user can close using close icon
- `isFocused`: indicates top-most modal when stacking

## Provider Pattern

- Mount `ModalProvider` in app composition before using modal hooks.
- Open modals with `useModal()` and `showModal(ModalComponent, props)`.
- Close all opened modals with `useDismissAllModals()` when needed (route changes, global cancel, logout, etc).
- Prefer provider-driven modal lifecycle over local booleans for cross-feature or nested flows.

## Throttle Rules

`ModalProvider` throttles repeated openings of the same modal component to avoid duplicate modals caused by double clicks.

- Default `throttleTimeout` is `500` ms.
- The throttle applies only when opening the same modal component type within the timeout window.
- In tests, pass `throttleTimeout={0}` when you need deterministic repeated openings.

## Recommended Implementation Flow

1. Create a feature modal component that accepts `ModalPropsType`.
2. Render project `Modal` wrapper and pass through `visible`, `onDismiss`, and remaining props.
3. In the trigger component, call `const showModal = useModal()`.
4. Open with `showModal(FeatureModal, initialProps)`.
5. If imperative close is needed, store returned `{ dismiss }` and call it.

## Example Pattern

```tsx
import Modal, { ModalPropsType } from '~/components/Modal';
import { useModal } from '~/components/Modal/ModalProvider';
import Button from '~/components/Button';

type ConfirmDeleteModalPropsType = ModalPropsType & {
  itemName: string;
  onConfirm: () => void;
};

const ConfirmDeleteModal = ({
  visible,
  onDismiss,
  itemName,
  onConfirm,
  ...props
}: ConfirmDeleteModalPropsType) => (
  <Modal
    visible={visible}
    onDismiss={onDismiss}
    title="Confirm deletion"
    {...props}
  >
    <p>Delete {itemName}?</p>
    <Button onClick={onConfirm}>Delete</Button>
  </Modal>
);

const DeleteAction = () => {
  const showModal = useModal();

  return (
    <Button
      onClick={() => {
        showModal(ConfirmDeleteModal, {
          itemName: 'Item A',
          onConfirm: () => {},
        });
      }}
    >
      Remove
    </Button>
  );
};
```

## Testing Checklist

Cover at least the behaviors already validated in `Modal.spec.tsx`:

- Base modal renders when `visible` is true.
- `dismissAllModals` hides all opened modals.
- Dismissing one modal does not close other stacked modals.
- Throttle prevents duplicates within timeout for same modal component.
- Outside timeout (or with low timeout), opening again creates a new modal instance.
- Returned `dismiss()` from `showModal` closes the modal instance.

## Do and Do Not

- Do: reuse `ModalProvider` hooks for lifecycle and stacking.
- Do: keep modal props typed with `ModalPropsType` and explicit feature props.
- Do: disable throttle in tests when repeated opens are intentional.
- Do not: open Ant Design `Modal` directly in feature pages.
- Do not: manage global modal orchestration with ad-hoc state scattered across pages.
