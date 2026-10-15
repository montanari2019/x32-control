---
name: web-testing
description: Web Template testing patterns with Jest and Testing Library, including mocking strategies for HTTP services and HOC-injected dependencies. Use when writing or fixing tests.
---

# Web Template - Testing

## Testing Patterns

- Write unit and component tests using **Jest 30** with **`@testing-library/react`**.
- Place test files alongside the component: `MyComponent.spec.tsx`.

## Testing Screens

- Use `~/http/adapters/MockHttpAdapter` for mocking HTTP requests in tests.
- Use `~/features/users/pages/UsersCreateUpdatePage` as a reference for testing a screen with injected dependencies via HOC.
- When testing components that use `withPropsInjection`, provide all injected props as mocks:
  ```tsx
  import { MockHttpAdapter } from '~/http/adapters/MockHttpAdapter';
  import { UsersHttpService } from '../../http/UsersHttpService';
  import { MemoryRouter, useParams } from 'react-router-dom';
  import UsersCreateUpdatePage from '.';

  const renderScreen = (userHttpService: UsersHttpService) => {
    const result = render(
      <MemoryRouter>
        <UsersCreateUpdatePage registerUserHttpService={userHttpService} />
      </MemoryRouter>,
    );

    return result;
  };

  describe('Create user screen', () => {
      it('should render create user screen correctly', () => {
        const userServiceInstanceMock = new UsersHttpService(
          new MockHttpAdapter({
            '/users': MOCK_REGISTER_USER_RESPONSE_SUCCESS,
          }),
        );

        const screen = renderScreen(userServiceInstanceMock);

        expect(screen.getByText('Criação de usuário')).toBeInTheDocument();
        expect(screen.getByText('Nome')).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText('Digite seu e-mail'),
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText('Digite sua senha'),
        ).toBeInTheDocument();
        expect(screen.getByText('Confirme sua senha')).toBeInTheDocument();
        expect(screen.getByText('Perfil')).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: 'Salvar' }),
        ).toBeInTheDocument();
      });
  });
  ```

## Testing HTTP Services

- Create HTTP service tests as `MyFeatureHttpService.spec.ts` files alongside the service and `test-utils.ts` for test data and helper functions.
- Use `MockHttpAdapter` to mock API responses in service tests:
  ```ts
  import { MockHttpAdapter } from '~/http/adapters/MockHttpAdapter';
  import { UsersHttpService } from './UsersHttpService';
  import { MOCK_GET_USERS_RESPONSE_SUCCESS } from './test-utils';

  describe('UsersHttpService', () => {
    describe('getUsers', () => {
      it('should be able to get users', async () => {
        const adapter = new MockHttpAdapter({
          '/users': MOCK_GET_USERS_RESPONSE_SUCCESS,
        });
        const spyGet = jest.spyOn(adapter, 'get');
        const service = new UsersHttpService(adapter);

        const responseSuccess = await service.getUsers();

        expect(responseSuccess).toEqual(MOCK_GET_USERS_RESPONSE_SUCCESS);
        expect(spyGet).toHaveBeenCalledWith('/users', {
          params: {
            filters: '[]',
            orders: [],
          },
        });
      });
    });
  });
  ```

## Definition of Done
- Tests are written for new features or bug fixes, covering at least 80% of the relevant code.
- All tests pass successfully.