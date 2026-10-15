---
name: web-ui-components
description: Web Template UI component patterns including reusable components, forms, shared pages, toast notifications, and custom hooks. Use when creating or modifying UI components, forms, or pages.
---

# Web Template - UI Components

## Reusable Components (`src/components/`)

- Always search `src/components/` first for reusable components before creating new ones.
- `src/components/Container` is a div with all basic props, prefer before using raw divs.
- Use a **folder-per-component** structure with an `index.tsx`.
- Components **wrap Ant Design** primitives with project-specific props and behavior. Do not use Ant Design components directly in feature pages.
- Define component prop types with the `PropsType` suffix (e.g., `ButtonPropsType`).
- Provide default values for optional props directly in the function parameter destructuring.

## Form Rules

- Use the `validators` utility from `~/utils/validators` for form validation rules.
  - If you need a new validation rule, add it to `validators` and reuse it across the project.
- Use parsers and formatters from `~/utils/parsers` for input value transformations (e.g., date formatting, number parsing) and `~/utils/masks` for input masks.
- Always create `CreateEdit...` pages, never create separate components for create and edit forms. Use the presence of an `id` param to determine if it's create or edit mode.
- Always validate free text inputs, with length limits considering the backend database limits, and any specific format requirements (e.g., email, phone).

## Form Components

- `InputSearch`: for input fields with search with services.
  - Create a `requestDataSource` function in `~/utils/requestDataSources/` following the patterns.
- Use `wrapForm` from `~/components/Form/wrapForm` to wrap page-level form components:
  ```tsx
  import wrapForm, { OnSubmitFormType } from '~/components/Form/wrapForm';

  const MyFormPage = wrapForm<MyFormPagePropsType, FormValuesType>(
    ({ handleSubmit, hasValidationErrors, submitting, form, ...props }) => {
      // Form page implementation
    },
  );

  export default withPropsInjection(MyFormPage, { myHttpService: myHttpServiceInstance });
  ```

## Shared Page Components (`src/shared/`)

- **`ListPage`**: Use for list/table pages with built-in pagination, sorting, filtering, and URL-synced filters.
  - Accepts `requestDataSource` callback, `columns` definition, and optional `filtersContent`.
  - Implements `RequestDataSourceType` for standardized data fetching.
- **`ContentPage`**: Use for detail/form pages with a page header, back button, and optional sider.
- **`CreateUpdateFormContainer`**: Use for standardized create/update form layouts with submit/cancel buttons and validation messaging.
- **`YesNoTag`**: Simple boolean display tag.

## Toast Notifications

- Use the `toast` utility from `~/components/toast` for user notifications:
  ```ts
  import toast from '~/components/toast';

  toast.success('Operação realizada com sucesso!');
  toast.error('Ocorreu um erro ao processar a solicitação.');
  toast.warning('Atenção: esta ação não pode ser desfeita.');
  toast.info('Informação adicional aqui.');
  ```

## Row and Col Components

- Use `Row` and `Col` components from `~/components` for grid layouts instead of raw divs. They wrap Ant Design's grid system with project-specific behavior and responsive defaults.
- For Col, always use *ALL* of the breakpoint props (`xs`, `sm`, `md`, `lg`, `xl`) to ensure consistent responsive behavior.

## Custom Hooks (`src/hooks/`)

Use the project's custom hooks instead of reinventing patterns:
- **`useAsync`**: Wraps async operations with loading state management. Returns `{ loading, call }`.
- **`useDidMount`**: Runs a callback once on component mount (wrapper around `useEffect` with `[]` deps).
- **`useDidMountAndUpdate`**: Runs on mount and when specified dependencies change.
- **`useIsMountedRef`**: Ref that tracks whether the component is still mounted (prevents state updates on unmounted components).
- **`usePagination`**: Manages pagination state for tables.
- **`usePreventNavigation`**: Prevents navigation when there are unsaved changes.
- **`useScreen`**: Provides responsive breakpoint information (`isDesktop`, `isMobile`, etc.).
- **`useClassNames`**: Wrapper around `classnames` for conditional CSS class composition.

## Performance and Scalability

- Use `React.lazy()` for code-splitting page components in route definitions.
- Use `useCallback` and `useMemo` for expensive computations and callback stability.
- Avoid creating new object/array/function references in render — memoize them.
- Use the `useAsync` hook for async operations to properly track loading state and prevent memory leaks.
- Prefer the project's custom hooks over raw `useEffect` patterns for consistency.
