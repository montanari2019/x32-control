---
name: mobile-ui-components
description: Mobile Template UI component patterns including reusable components, Container, styles hooks, theme system, Toast, AlertDialog, Modal, and custom hooks. Use when creating or modifying UI components or screens.
---

# Mobile Template - UI Components

## Reusable Components (`src/components/`)

- Always search `src/components/` first for reusable components before creating new ones.
- Use a **folder-per-component** structure with an `index.tsx`.
- Components **wrap React Native primitives** with project-specific props and behavior. Do not use raw RN primitives directly in feature screens when a wrapper exists.
- Define component prop types with the `PropsType` suffix (e.g., `ButtonPropsType`).
- Provide default values for optional props directly in the function parameter destructuring.

## Available Components

| Component | Purpose |
|-----------|---------|
| AlertDialog | Alert/confirmation dialogs (shown via `showModal`) |
| Button | Themed button (filled/outline/text, sizes, icons, loading, colors) |
| Carousel | Image carousel |
| Checkbox | Checkbox input |
| Container | Layout wrapper (View/SafeAreaView with layout props) |
| DefaultList | FlatList/SectionList wrapper with pagination support |
| Dialog | Generic modal dialog (Header + Body + Actions) |
| Divider | Visual separator |
| Form | Final Form wrapper + wrapForm + wrapField HOCs |
| Header | Screen header with back button, title, actions, safe area |
| HelpMessage | Field help/error message display |
| IconButton | Icon-only button |
| InputCep | CEP input with mask and auto-fill |
| InputDate | Date picker input |
| InputOtp | OTP code input |
| InputSelect | Select/dropdown with async data loading |
| InputText | Text input with validation, error states, password toggle |
| KeyboardAvoidingView | Keyboard-aware container |
| LoadingContainer | Loading state wrapper |
| Modal | Generic modal with animations |
| RadioGroup | Radio button group |
| Ratio | Aspect ratio container |
| ScrollableContainer | Scrollable content wrapper |
| Spacer | Spacing component |
| Switch | Toggle switch |
| Text | Themed text with variants |
| Toast | Toast notifications (shown via `showModal`) |

## Container Component

`Container` is a View/SafeAreaView wrapper with layout props. **Prefer it over raw `<View>`**:

```tsx
import Container from '~/components/Container';

<Container
  fillParent
  variant="safeAreaView"
  padding={theme.spacings.sMedium}
  gap={theme.spacings.sMedium}
  horizontal
  backgroundColor="neutralLightest"
  borderRadius={theme.borders.radius.small}
  justifyContent="center"
  alignItems="center"
>
  {children}
</Container>
```

Key props: `variant` (`'view'` | `'safeAreaView'`), `fillParent`, `horizontal`, `centered`, `padding*`, `margin*`, `gap`, `backgroundColor` (theme color key), `blockActions`, `safeAreaTop/Bottom/Left/Right`.

## Styles Hooks

Use `useViewStyles()`, `useTextStyles()`, `useImageStyles()` hooks for memoized dynamic styles — do NOT use `StyleSheet.create` for dynamic styles:

```tsx
import { useViewStyles, useTextStyles } from '~/hooks/useStyles';

const containerStyles = useViewStyles(() => ({
  padding: theme.spacings.sMedium,
  gap: theme.spacings.sMedium,
}), [theme.spacings.sMedium]);

const textStyles = useTextStyles(() => ({
  color: theme.colors.primaryBase,
  fontSize: 16,
}), [theme.colors.primaryBase]);
```

These hooks use `useMemo` + `StyleSheet.flatten` internally for memoization.

## Theme System (`src/theme/`)

Uses `@callstack/react-theme-provider` with a custom `AppThemeType`:

```tsx
import { useTheme } from '~/theme';

const theme = useTheme();
// theme.colors.primaryBase, theme.spacings.sMedium, theme.typography.*, etc.
```

### Theme Tokens

- **`colors`**: Brand colors (Primary/Secondary 5 shades), Feedback colors (Positive/Negative/Warning/Info 5 shades), Neutral colors (5 shades).
- **`borders`**: Border radius + width tokens.
- **`opacities`**: Opacity values.
- **`shadows`**: Shadow presets.
- **`spacings`**: 23 spacing tokens (`sZero` through `lGiant`: 0–216).
- **`typography`**: Font family/weight/style definitions.

## Toast Notifications

Toast is shown via the modal system using `showModal`:

```tsx
import { useModal } from '~/components/Modal/ModalProvider';
import Toast from '~/components/Toast';

const showModal = useModal();

showModal(Toast, {
  variant: 'success', // 'success' | 'error' | 'warning' | 'info'
  message: 'Operação realizada com sucesso!',
});
```

## AlertDialog

AlertDialog is shown via the modal system:

```tsx
import AlertDialog from '~/components/AlertDialog';
import { useModal } from '~/components/Modal/ModalProvider';

const showModal = useModal();

showModal(AlertDialog, {
  title: 'Título do alerta',
  message: 'Corpo da mensagem.',
  primaryButtonName: 'Sim',
  secondaryButtonName: 'Cancelar',
  onPressPrimary: () => { /* action */ },
});
```

## Modal System

The `ModalProvider` manages modal rendering. Use the `useModal()` hook to show any component as a modal:

```tsx
import { useModal } from '~/components/Modal/ModalProvider';

const showModal = useModal();
showModal(MyModalComponent, { /* props */ });
```

## Header Component

Screen header with back button, title, actions, and safe area:

```tsx
import Header from '~/components/Header';

<Header title="Formulário" />
<Header hasBackButton={false} /> // No back button (e.g., root screen)
```

## Button Component

```tsx
import Button from '~/components/Button';
import { Icons } from '~/assets';

<Button onPress={handlePress}>Filled (default)</Button>
<Button onPress={handlePress} variant="outline">Outline</Button>
<Button onPress={handlePress} size="medium">Medium</Button>
<Button onPress={handlePress} loading>Loading</Button>
<Button onPress={handlePress} disabled>Disabled</Button>
<Button onPress={handlePress} LeftIcon={Icons.Person}>With Icon</Button>
<Button onPress={handlePress} color="danger">Danger</Button>
```

## Custom Hooks (`src/hooks/`)

Use the project's custom hooks instead of reinventing patterns:

- **`useAsync`**: Wraps an async callback with `loading` state management; prevents state updates after unmount. Returns `{ loading, call }`.
  ```tsx
  const { call: fetchData, loading } = useAsync(async () => {
    const response = await myService.getData();
    // handle response
  }, [myService]);
  ```

- **`useDidMount`**: Runs a callback once on component mount (wrapper around `useEffect` with `[]` deps). Return cleanup function for unmount.
  ```tsx
  useDidMount(() => {
    doRefresh();
    return () => { /* cleanup */ };
  });
  ```

- **`useDidMountAndUpdate`**: Runs on mount and when specified dependencies change.

- **`useIsMountedRef`**: Ref that tracks whether the component is still mounted (prevents state updates on unmounted components).

- **`useDimensions`**: Returns window, screen, and statusBar dimensions.

- **`useNotificationManager`**: Firebase messaging setup, FCM token management, Android channels, notification display.

- **`usePagination`**: Complete pagination state management (see mobile-forms skill for list patterns).

- **`usePreventNavigation`**: Prevents navigation back (blocks gestures + `beforeRemove` event) with allowed actions.

- **`useStyles` / `useViewStyles` / `useTextStyles` / `useImageStyles`**: Memoized `StyleSheet.flatten` for dynamic styles.

## Performance and Scalability

- Use `useCallback` and `useMemo` for expensive computations and callback stability.
- Avoid creating new object/array/function references in render — memoize them.
- Use the `useAsync` hook for async operations to properly track loading state and prevent memory leaks.
- Prefer the project's custom hooks over raw `useEffect` patterns for consistency.
- Use `useViewStyles` / `useTextStyles` / `useImageStyles` for memoized dynamic styles instead of inline style objects.
