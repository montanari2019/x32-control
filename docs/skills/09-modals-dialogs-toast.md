---
title: Modals, Dialogs, and Toasts
type: skill
version: 1.0
scope: overlays
tags: [modal, dialog, toast]
---

## Summary

Overlays are managed by a modal provider that can show multiple modal components with throttling. Dialogs are composed using subcomponents and toasts are animated overlays.

## Reference Implementation

- Modal base: [src/components/Modal/index.tsx](src/components/Modal/index.tsx)
- Modal provider: [src/components/Modal/ModalProvider.tsx](src/components/Modal/ModalProvider.tsx)
- Dialog: [src/components/Dialog/index.tsx](src/components/Dialog/index.tsx)
- Alert dialog: [src/components/AlertDialog/index.tsx](src/components/AlertDialog/index.tsx)
- Toast: [src/components/Toast/index.tsx](src/components/Toast/index.tsx)

## Core Pattern

- `ModalProvider` renders a list of modal elements and handles dismiss.
- `useModal` returns `showModal` to open overlays from anywhere.
- Dialogs compose Header, Title, Message, and Actions.
- Toast uses animated entry/exit and auto-dismiss timer.

## Implementation Steps

1. Wrap the app with `ModalProvider`.
2. Use `useModal` to show any modal component.
3. Ensure modal components accept `visible`, `onDismiss`, and `onDismissEnd`.
4. For confirm flows, use AlertDialog (Dialog + Buttons).

## Pitfalls

- Forgetting to pass `visible` or `onDismiss` breaks modal lifecycle.
- Throttling prevents rapid repeated opens; adjust in tests when needed.

## Checklist

- Modal components accept modal props
- Provider is mounted once at app root
- Modals use `onDismiss` to close

## Prompt Seed

Create a modal system with a provider that can render multiple modal components, expose a `useModal` hook, and include reusable Dialog and Toast overlays.
