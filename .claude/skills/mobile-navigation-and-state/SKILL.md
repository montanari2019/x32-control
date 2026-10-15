---
name: mobile-navigation-and-state
description: Mobile Template navigation setup with React Navigation, NavigationHolder, context/state management with createContextFactory, and dependency injection via withPropsInjection HOC. Use when setting up navigation, managing state, or configuring dependency injection.
---

# Mobile Template - Navigation, State & Dependency Injection

## Navigation (`src/navigation/`)

Uses `@react-navigation/stack` (v6.x).

### Root Navigation

Root `Stack.Navigator` conditionally renders based on authentication state:
- `userAuthentication` truthy → `HomeNavigation`
- `userAuthentication` falsy → `IntroNavigation`

```tsx
import { createStackNavigator } from '@react-navigation/stack';
import { useUserAuthenticationContext } from '~/context/UserAuthentication';
import HomeNavigation from '~/features/home/navigation';
import IntroNavigation from '~/features/intro/navigation';

const Stack = createStackNavigator<ReactNavigation.RootParamList>();

const Navigation = () => {
  const { state: userAuthentication } = useUserAuthenticationContext();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userAuthentication
        ? <Stack.Screen name="HomeNavigation" component={HomeNavigation} />
        : <Stack.Screen name="IntroNavigation" component={IntroNavigation} />
      }
    </Stack.Navigator>
  );
};
```

### Feature Navigation

Each feature defines its own Stack Navigator:

```tsx
// src/features/my-feature/navigation/index.tsx
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import MyFeatureScreen from '../screens/MyFeatureScreen';
import MyFeatureDetailScreen from '../screens/MyFeatureDetailScreen';
import MyFeatureNavigationParamsType from './types';

const Stack = createStackNavigator<MyFeatureNavigationParamsType>();

const screenOptions: StackNavigationOptions = { headerShown: false };

const Navigation = () => (
  <Stack.Navigator screenOptions={screenOptions} initialRouteName="MyFeatureScreen">
    <Stack.Screen name="MyFeatureScreen" component={MyFeatureScreen} />
    <Stack.Screen name="MyFeatureDetailScreen" component={MyFeatureDetailScreen} />
  </Stack.Navigator>
);

export default Navigation;
```

### Navigation Types

```typescript
// src/features/my-feature/navigation/types.ts
type MyFeatureNavigationParamsType = {
  MyFeatureScreen: undefined;
  MyFeatureDetailScreen: { id: number };
};
export default MyFeatureNavigationParamsType;
```

### Root Navigation Types

```typescript
// src/navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';
import HomeNavigationParamsType from '~/features/home/navigation/types';
import IntroNavigationParamsType from '~/features/intro/navigation/types';

type RootStackParamsType = {
  IntroNavigation: NavigatorScreenParams<IntroNavigationParamsType>;
  HomeNavigation: NavigatorScreenParams<HomeNavigationParamsType>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamsType {}
  }
}
```

### NavigationHolder

`NavigationHolder` wraps `NavigationContainerRef` with safety checks (`isReady()` before each action).

Methods: `navigate`, `goBack`, `replace`, `push`, `pop`, `popToTop`, `reset`, `resetRoot`, `dispatch`, `canGoBack`, `getCurrentRoute`, `getState`, `setParams`.

```ts
import { getNavigationHolder } from '~/navigation/NavigationHolder';

// Static access (outside components, e.g., in services)
const navigation = getNavigationHolder();
navigation.navigate('HomeNavigation', { screen: 'MyScreen' });
```

### `useNavigationHolder()` Hook

Returns the `NavigationHolder` from context (or falls back to static ref in tests):

```tsx
import { useNavigationHolder } from '~/navigation/NavigationHolder';

const MyScreen = () => {
  const navigation = useNavigationHolder();

  const handlePress = useCallback(() => {
    navigation.navigate('HomeNavigation', { screen: 'FormExampleScreen' });
  }, [navigation]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // ...
};
```

### Navigation Patterns

```tsx
// Navigate to a screen in a nested navigator
navigation.navigate('HomeNavigation', { screen: 'MyScreen' });

// Go back
navigation.goBack();

// Replace current screen
navigation.replace('IntroNavigation', { screen: 'LoginScreen' });

// Push a new screen
navigation.push('DetailScreen', { id: 123 });
```

## Context and State Management

Use the `createContextFactory` from `~/context` to create typed context providers:

```tsx
import createContextFactory from '~/context';

type MyStateType = {
  value: string;
  count: number;
};

const {
  Provider: MyProvider,
  Holder: MyHolder,
  useContext: useMyContext,
} = createContextFactory<MyStateType | null>(null);

export { MyProvider, MyHolder, useMyContext };
```

### Holder Pattern

The `Holder` object allows accessing/updating state **outside React components** (useful in services, interceptors, and other non-component code):

```ts
// Get current state
MyHolder.getState();

// Set state (full replacement)
MyHolder.setState(newState);

// Partial state update
MyHolder.updateState({ count: 5 });
```

### UserAuthentication Context

The main auth context is `UserAuthentication`:

```tsx
import { useUserAuthenticationContext, UserAuthenticationHolder } from '~/context/UserAuthentication';

// In components
const { state: userAuthentication } = useUserAuthenticationContext();

// In services/interceptors (outside components)
const token = UserAuthenticationHolder.getState()?.token;
UserAuthenticationHolder.setState(null); // logout
```

- Prefer context over prop drilling for cross-component state that needs to be shared.

## Dependency Injection via HOC (`withPropsInjection`)

Use `withPropsInjection` from `~/hoc/withPropsInjection` to inject HTTP service instances and other dependencies into screen components:

```tsx
import withPropsInjection from '~/hoc/withPropsInjection';
import myHttpServiceInstance from '../../http/MyFeatureHttpService';

type MyScreenPropsType = {
  myHttpService: MyFeatureHttpService;
};

const MyScreen = ({ myHttpService }: MyScreenPropsType) => {
  // Use myHttpService for API calls
};

export default withPropsInjection(MyScreen, {
  myHttpService: myHttpServiceInstance,
});
```

### Why Use `withPropsInjection`

- Enables **easy mocking in tests** — tests can provide mock services as props.
- Makes dependencies explicit in the component's prop types.
- **CRITICAL**: When writing tests, provide ALL injected props as mocks. The HOC validates this in test mode.

### Usage with wrapForm

When a screen uses both `wrapForm` and `withPropsInjection`, wrap with `withPropsInjection` on the outside:

```tsx
const MyFormScreen = wrapForm<MyFormScreenPropsType, FormValuesType>(
  ({ handleSubmit, submitting, form, myHttpService }) => {
    // form + service usage
  },
);

export default withPropsInjection(MyFormScreen, {
  myHttpService: myHttpServiceInstance,
});
```
