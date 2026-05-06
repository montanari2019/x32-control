---
title: Components and Shared UI
type: skill
version: 1.0
scope: ui-components
tags: [components, shared]
---

## Summary

Components follow a token-driven styling approach. Layout uses `Container` and `Spacer`, and most components rely on `useViewStyles` or `useTextStyles` to memoize styles.

## Core Conventions

- Styling uses theme tokens only.
- Components expose focused props and avoid internal fetch logic.
- Test IDs are added for interactive elements.

## Foundational Components

- Container: [src/components/Container/index.tsx](src/components/Container/index.tsx)
- Text: [src/components/Text/index.tsx](src/components/Text/index.tsx)
- Spacer: [src/components/Spacer/index.tsx](src/components/Spacer/index.tsx)
- Divider: [src/components/Divider/index.tsx](src/components/Divider/index.tsx)
- Scrollable container: [src/components/ScrollableContainer/index.tsx](src/components/ScrollableContainer/index.tsx)
- Keyboard avoiding view: [src/components/KeyboardAvoidingView/index.tsx](src/components/KeyboardAvoidingView/index.tsx)
- Safe area container: [src/components/SafeAreaContainer/index.tsx](src/components/SafeAreaContainer/index.tsx)

## Feedback and Loading

- Toast: [src/components/Toast/index.tsx](src/components/Toast/index.tsx)
- Alert dialog: [src/components/AlertDialog/index.tsx](src/components/AlertDialog/index.tsx)
- Dialog: [src/components/Dialog/index.tsx](src/components/Dialog/index.tsx)
- Loading container: [src/components/LoadingContainer/index.tsx](src/components/LoadingContainer/index.tsx)
- Loading indicator: [src/components/LoadingIndicator/index.tsx](src/components/LoadingIndicator/index.tsx)
- Help message: [src/components/HelpMessage/index.tsx](src/components/HelpMessage/index.tsx)

## Buttons and Actions

- Button: [src/components/Button/index.tsx](src/components/Button/index.tsx)
- Text button: [src/components/TextButton/index.tsx](src/components/TextButton/index.tsx)
- Icon button: [src/components/IconButton/index.tsx](src/components/IconButton/index.tsx)
- Go back button: [src/components/GoBackButton/index.tsx](src/components/GoBackButton/index.tsx)
- Header: [src/components/Header/index.tsx](src/components/Header/index.tsx)

## Layout and Cards

- Card: [src/components/Card/index.tsx](src/components/Card/index.tsx)
- Default list: [src/components/DefaultList/index.tsx](src/components/DefaultList/index.tsx)
- Logo image: [src/components/LogoImage/index.tsx](src/components/LogoImage/index.tsx)
- Equivalent button: [src/components/EquivalentButton/index.tsx](src/components/EquivalentButton/index.tsx)

## Shared Components (Cross-Feature)

- Swipe indicator: [src/shared/SwipeIndicator/index.tsx](src/shared/SwipeIndicator/index.tsx)
- Share button: [src/shared/ShareButton/index.tsx](src/shared/ShareButton/index.tsx)
- Reload button: [src/shared/RealoadButton/index.tsx](src/shared/RealoadButton/index.tsx)
- List button: [src/shared/ListButton/index.tsx](src/shared/ListButton/index.tsx)
- Favorite button: [src/shared/FavoriteButton/index.tsx](src/shared/FavoriteButton/index.tsx)
- Cards clubs: [src/shared/CardsClubs/index.tsx](src/shared/CardsClubs/index.tsx)
- Card extract point club: [src/shared/CardExtractPointClub/index.tsx](src/shared/CardExtractPointClub/index.tsx)
- Card premium: [src/shared/CardPremium/index.tsx](src/shared/CardPremium/index.tsx)
- Modal plans: [src/shared/ModalPlans/index.tsx](src/shared/ModalPlans/index.tsx)

## Visual Effects

- Fade in/out: [src/components/FadeInOutView/index.tsx](src/components/FadeInOutView/index.tsx)
- Pulsing view: [src/components/PulsingView/index.tsx](src/components/PulsingView/index.tsx)
- Swipe carousel: [src/components/SwipeCarousel/index.tsx](src/components/SwipeCarousel/index.tsx)

## Pitfalls

- Avoid inline styles that duplicate token values.
- Do not depend on navigation hooks inside shared components unless required.

## Checklist

- Uses theme tokens only
- Uses `useViewStyles` or `useTextStyles`
- Exposes test IDs for key interactions

## Prompt Seed

Create a set of reusable UI components that rely on theme tokens and memoized styles. Include foundational layout components and shared cross-feature widgets with minimal logic and strong prop boundaries.
