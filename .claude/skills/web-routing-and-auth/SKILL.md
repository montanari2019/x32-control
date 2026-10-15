---
name: web-routing-and-auth
description: Web Template routing setup, CASL permissions, context/state management, and dependency injection via HOC. Use when setting up routes, managing permissions, or configuring state and dependency injection.
---

# Web Template - Routing, Permissions & State

## Routing (`src/routes/`)

- Routes are defined as `RouteMenuType[]` arrays in each feature's `routes/index.ts`.
- Use `lazy()` from React for code-splitting page components:
  ```ts
  import { lazy } from 'react';
  import { RouteMenuType } from '~/routes/utils';

  const ListMyFeaturePage = lazy(() => import('../pages/ListMyFeaturePage'));
  const CreateUpdateMyFeaturePage = lazy(() => import('../pages/CreateUpdateMyFeaturePage'));

  const myFeatureRoutes: RouteMenuType[] = [
    {
      level: 'item',
      path: '/my-feature',
      Component: ListMyFeaturePage,
      text: 'My Feature',
      icon: { family: 'AntDesign', name: 'AiOutlineStar' },
      isVisible: userAuthentication => (
        Boolean(userAuthentication?.ability.can('find', 'MyFeature'))
      ),
    },
    {
      path: '/my-feature/:id',
      Component: CreateUpdateMyFeaturePage,
      level: 'item',
      isVisible: userAuthentication => (
        Boolean(userAuthentication?.ability.can('update', 'MyFeature'))
      ),
    },
    {
      level: 'item',
      path: '/my-feature/novo',
      Component: CreateUpdateMyFeaturePage,
      isVisible: userAuthentication => (
        Boolean(userAuthentication?.ability.can('create', 'MyFeature'))
      ),
    },
  ];

  export default myFeatureRoutes;
  ```
- **Sidebar Items**: Provide `text` and `icon` properties for routes that should appear in the sidebar menu.
- **Private routes**: Import and spread your feature routes in `src/routes/private.ts`.
- **Public routes**: Import and spread your feature routes in `src/routes/public.tsx`.
- Use the `isVisible` callback for permission-based route visibility, checking CASL abilities.

## Permissions

- Use `@casl/ability` for frontend authorization. Ability rules come from the backend on login/refresh.
- Ability types are defined in `src/ability/types.ts`. Add new subjects there when creating new features.
- Use the `<Can>` component from `~/components/AbilityProvider` to conditionally render UI based on permissions:
  ```tsx
  import { Can } from '~/components/AbilityProvider';

  <Can I="update" a="MyFeature">
    <NavButton to={`/app/my-feature/${record.id}`} tooltipTitle="Editar" />
  </Can>
  ```
- Use `isVisible` in route definitions to control route access based on abilities.

## Context and State Management

- Use the `createContextFactory` from `~/context` to create typed context providers:
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
- The `Holder` object allows accessing/updating state outside React components (useful in services).
- Prefer context over prop drilling for cross-component state that needs to be shared.

## Dependency Injection via HOC (`withPropsInjection`)

- Use `withPropsInjection` from `~/hoc/withPropsInjection` to inject HTTP service instances and other dependencies into page components:
  ```tsx
  import withPropsInjection from '~/hoc/withPropsInjection';
  import myHttpServiceInstance from '../../http/MyFeatureHttpService';

  type MyPagePropsType = {
    myHttpService: MyFeatureHttpService;
  };

  const MyPage = ({ myHttpService }: MyPagePropsType) => {
    // Use myHttpService for API calls
  };

  export default withPropsInjection(MyPage, {
    myHttpService: myHttpServiceInstance,
  });
  ```
- This pattern enables easy mocking in tests — tests can provide mock services as props.
- **CRITICAL**: When writing tests, provide ALL injected props as mocks. The HOC validates this in test mode.
