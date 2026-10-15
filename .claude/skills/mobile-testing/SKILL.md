---
name: mobile-testing
description: Mobile Template testing patterns with Jest and Testing Library React Native, including mocking strategies for HTTP services, navigation, modals, and HOC-injected dependencies. Use when writing or fixing tests.
---

# Mobile Template - Testing

## Testing Patterns

- Write unit and component tests using **Jest** with **`@testing-library/react-native`**.
- Test preset: `jest-expo`.
- Place test files alongside the component: `MyComponent.spec.tsx`.
- Create `test-utils.ts` in the same folder for mock data and helpers.

## Render Pattern

Wrap components in `<Providers>` for proper context:

```tsx
import { render, screen } from '@testing-library/react-native';
import Providers from '~/Providers';
import MyScreen from './index';

const renderScreen = () => render(
  <Providers>
    <MyScreen httpService={mockService} />
  </Providers>,
);
```

## HTTP Mock Pattern

Use `MockHttpAdapter` from `~/http/adapters/MockHttpAdapter` to mock HTTP requests:

```typescript
import { MockHttpAdapter } from '~/http/adapters/MockHttpAdapter';
import { IResponseSuccess } from '~/http/IHttpAdapter';

// Define mock responses in test-utils.ts
export const MOCK_SUCCESS_RESPONSE: IResponseSuccess<DataType> = {
  data: [...],
  status: 200,
  headers: {},
  url: '',
};

// Create mock service instance
const mockService = new MyHttpService(
  new MockHttpAdapter({
    '/my-endpoint': MOCK_SUCCESS_RESPONSE,
  }),
);
```

### Testing HTTP Services Directly

```typescript
import { MockHttpAdapter } from '~/http/adapters/MockHttpAdapter';
import { MyFeatureHttpService } from './MyFeatureHttpService';
import { MOCK_GET_ITEMS_RESPONSE } from './test-utils';

describe('MyFeatureHttpService', () => {
  it('should get items', async () => {
    const adapter = new MockHttpAdapter({
      '/my-endpoint': MOCK_GET_ITEMS_RESPONSE,
    });
    const spyGet = jest.spyOn(adapter, 'get');
    const service = new MyFeatureHttpService(adapter);

    const response = await service.getItems();

    expect(response).toEqual(MOCK_GET_ITEMS_RESPONSE);
    expect(spyGet).toHaveBeenCalledWith('/my-endpoint', undefined);
  });
});
```

## Mocking withPropsInjection Dependencies

When testing components that use `withPropsInjection`, provide ALL injected props as mocks:

```tsx
import { MockHttpAdapter } from '~/http/adapters/MockHttpAdapter';
import { MyHttpService } from '../../http/MyHttpService';
import MyScreen from '.';

const createMockService = () => new MyHttpService(
  new MockHttpAdapter({
    '/items': MOCK_ITEMS_RESPONSE,
  }),
);

const renderScreen = (httpService = createMockService()) => render(
  <Providers>
    <MyScreen myHttpService={httpService} />
  </Providers>,
);
```

## Navigation Mocking

Use `createNavigationMock` from `~/utils/tests`:

```typescript
import { createNavigationMock } from '~/utils/tests';

const navigationMock = createNavigationMock();

// After user action:
expect(navigationMock.navigate).toHaveBeenCalledWith(
  'HomeNavigation',
  { screen: 'MyScreen' },
);
```

## Modal/Toast Testing

Use timing helpers from `~/utils/tests`:

```typescript
import {
  advanceTimeToModalOpen,
  advanceTimeToModalClose,
  advanceTimeToToastOpen,
  advanceTimeToToastClose,
} from '~/utils/tests';

// Trigger action that opens modal
await user.press(screen.getByText('Button'));
advanceTimeToModalOpen();
expect(screen.getByText('Modal content')).toBeOnTheScreen();

// Close modal
await user.press(screen.getByText('OK'));
advanceTimeToModalClose();

// Toast testing
advanceTimeToToastOpen();
expect(screen.getByText('Success')).toBeOnTheScreen();
advanceTimeToToastClose();
```

## Timer Setup

```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});
```

## Android-Specific Testing

```typescript
import {
  mockSimulateAndroid,
  dispatchAndroidBackAction,
} from '~/utils/tests';

mockSimulateAndroid(); // Simulate Android platform
dispatchAndroidBackAction(); // Simulate hardware back button
```

## Testing Best Practices

- Write tests that cover at least **80% coverage**.
- Write tests for components, screens, and services.
- Use `screen.getByText()`, `screen.getByPlaceholderText()`, `screen.getByTestId()`, etc. from RNTL.
- Use `@testing-library/react-native`'s `userEvent` for user interactions:
  ```tsx
  import { userEvent } from '@testing-library/react-native';

  const user = userEvent.setup();
  await user.press(screen.getByText('Submit'));
  await user.type(screen.getByPlaceholderText('E-mail'), 'test@test.com');
  ```
- Use `waitFor` for async assertions:
  ```tsx
  import { waitFor } from '@testing-library/react-native';

  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeOnTheScreen();
  });
  ```

## Test Utilities (`src/utils/tests/`)

| Utility | Purpose |
|---------|---------|
| `createNavigationMock` | Creates a mock NavigationHolder for navigation assertions |
| `mockSimulateAndroid` | Simulates Android platform for tests |
| `dispatchAndroidBackAction` | Simulates Android hardware back button |
| `advanceTimeToModalOpen` | Advances timers 250ms for modal open animation |
| `advanceTimeToModalClose` | Advances timers 250ms for modal close animation |
| `advanceTimeToToastOpen` | Advances timers for toast open animation |
| `advanceTimeToToastClose` | Advances timers for toast close animation |

## Definition of Done

- Tests are written for new features or bug fixes, covering at least 80% of the relevant code.
- All tests pass successfully (`jest --coverage`).
- Mock data is defined in `test-utils.ts` files for reusability.
