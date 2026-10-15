---
name: web-crud-feature
description: Web Template full CRUD feature scaffold — HTTP service, types, list page with filters and delete, create/edit form page, and route definitions with CASL permissions. Use when creating a new CRUD feature from scratch or adding list/create/edit pages to an existing feature.
---

# Web Template - CRUD Feature

This skill covers the full implementation of a CRUD feature following the project's separation of concerns: types → HTTP service → pages → routes.

## 1. Feature Folder Structure

Create the feature under `src/features/<featureName>/` with this layout:

```
src/features/<featureName>/
├── http/
│   └── <FeatureName>HttpService/
│       ├── index.ts        # Service class + singleton instance
│       └── types.ts        # Request/response types
├── pages/
│   ├── List<FeatureName>Page/
│   │   └── index.tsx
│   └── <FeatureName>CreateUpdatePage/
│       └── index.tsx
├── routes/
│   └── index.ts
└── types.ts                # (optional) shared domain types
```

---

## 2. Types (`http/<FeatureName>HttpService/types.ts`)

Define all request/response types. Import `HttpPaginationResponseType` from `~/http/IHttpAdapter`.

```ts
import { HttpPaginationResponseType } from '~/http/IHttpAdapter';

// The item returned by the API
export type MyEntityItemType = {
  id: number;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
};

// Paginated list response
export type MyEntityResponseDataType = {
  metadata: HttpPaginationResponseType;
  result: MyEntityItemType[];
};

// Body for create
export type CreateMyEntityDataType = {
  name: string;
  description: string;
};

// Body for update
export type UpdateMyEntityDataType = {
  name: string;
  description: string;
  active: boolean;
};

// Filter params used by the list page
export type GetMyEntityFilterParamsType = {
  name?: string;
  active?: boolean;
};
```

---

## 3. HTTP Service (`http/<FeatureName>HttpService/index.ts`)

- Extend `HttpService` from `~/http/HttpService`.
- Always add `userAuthenticationInterceptor`.
- Use `HttpFiltersType` to build dynamic query filters in `formatListParams`.
- Map domain-specific error codes with the `responseErrorMapper` parameter.
- Export a singleton instance as `default`.

```ts
import Axios from 'axios';

import Environment from '~/Environment';
import { AxiosHttpAdapter } from '~/http/adapters/AxiosHttpAdapter';
import { HttpService } from '~/http/HttpService';
import {
  ErrorIdentifierType, ErrorResponseType, HttpFiltersType,
  HttpPaginationType, HttpSorterType,
} from '~/http/IHttpAdapter';
import userAuthenticationInterceptor from '~/http/interceptors/UserAuthenticationInterceptor';

import {
  CreateMyEntityDataType,
  GetMyEntityFilterParamsType,
  MyEntityItemType,
  MyEntityResponseDataType,
  UpdateMyEntityDataType,
} from './types';

// Add domain-specific error codes here; fall back to 'UNKNOWN'
type MyEntityErrorsType = ErrorIdentifierType<'DUPLICATE_NAME' | 'UNKNOWN'>;

export const formatListParams = (
  filtersParams?: GetMyEntityFilterParamsType,
  pagination?: HttpPaginationType,
  sorter?: HttpSorterType,
) => {
  const filters: HttpFiltersType = [];

  if (filtersParams?.name) {
    filters.push({ where: ['my_entities.name', 'like', `%${filtersParams.name}%`] });
  }

  if (typeof filtersParams?.active === 'boolean') {
    filters.push({ where: ['my_entities.active', filtersParams.active] });
  }

  return {
    ...pagination,
    filters: JSON.stringify(filters),
    orders: sorter?.order ? [JSON.stringify([[sorter.field, sorter.order]])] : [],
  };
};

export class MyEntityHttpService extends HttpService<MyEntityErrorsType> {

  getItems(
    filtersParams?: GetMyEntityFilterParamsType,
    pagination?: HttpPaginationType,
    sorter?: HttpSorterType,
  ) {
    return this.get<MyEntityResponseDataType, ErrorResponseType>('/my-entities', {
      params: formatListParams(filtersParams, pagination, sorter),
    });
  }

  getItem(id: number) {
    return this.get<MyEntityItemType, ErrorResponseType>(`/my-entities/${id}`);
  }

  createItem(data: CreateMyEntityDataType) {
    return this.post<MyEntityItemType, ErrorResponseType>('/my-entities', data, undefined, response => {
      switch (response.data?.error?.code) {
        case 409: return 'DUPLICATE_NAME';
        default: return 'UNKNOWN';
      }
    });
  }

  updateItem(id: number, data: UpdateMyEntityDataType) {
    return this.put<MyEntityItemType, ErrorResponseType>(`/my-entities/${id}`, data, undefined, response => {
      switch (response.data?.error?.code) {
        case 409: return 'DUPLICATE_NAME';
        default: return 'UNKNOWN';
      }
    });
  }

  deleteItem(id: number) {
    return this.delete(`/my-entities/${id}`, null);
  }

}

const axios = Axios.create({ baseURL: Environment.apiBaseUrl });
axios.interceptors.request.use(userAuthenticationInterceptor);

const myEntityHttpServiceInstance = new MyEntityHttpService(new AxiosHttpAdapter(axios));
export default myEntityHttpServiceInstance;
```

---

## 4. List Page (`pages/List<FeatureName>Page/index.tsx`)

- Use the `ListPage` shared component for built-in pagination, sorting, filtering, and URL-synced filters.
- Implement `RequestDataSourceType` in `handleRequestDataSource`.
- Use `useRef<ListRefType>` to trigger `$listPageRef.current?.refresh()` after delete.
- Wrap delete action with `<Popconfirm>` and `<Can I="delete" a="MyFeature">`.
- Wrap edit nav button with `<Can I="update" a="MyFeature">`.
- Use `withPropsInjection` to inject the HTTP service instance.

```tsx
import {
  useCallback, useMemo, useRef, useState,
} from 'react';

import { Can } from '~/components/AbilityProvider';
import Button from '~/components/Button';
import Col from '~/components/Col';
import Container from '~/components/Container';
import Icon from '~/components/Icon';
import InputSelect from '~/components/InputSelect';
import InputText from '~/components/InputText';
import NavButton from '~/components/NavButton';
import Popconfirm from '~/components/Popconfirm';
import Row from '~/components/Row';
import { ColumnType } from '~/components/Table';
import toast from '~/components/toast';
import withPropsInjection from '~/hoc/withPropsInjection';
import { isResponseError } from '~/http/IHttpAdapter';
import ListPage, { ListRefType, RequestDataSourceType } from '~/shared/ListPage';
import YesNoTag from '~/shared/YesNoTag';
import { useTheme } from '~/theme';
import { showCommonErrors } from '~/utils/helpers/showCommonErrors';
import STATUS_OPTIONS from '~/utils/selectOptions/statusOptions';

import myEntityHttpServiceInstance, { MyEntityHttpService } from '../../http/MyEntityHttpService';
import { MyEntityItemType } from '../../http/MyEntityHttpService/types';

type ListMyEntityPagePropsType = {
  myEntityHttpService: MyEntityHttpService;
};

type FilterValuesType = {
  name?: string;
  status?: { item: boolean | undefined };
};

const ListMyEntityPage = ({ myEntityHttpService }: ListMyEntityPagePropsType) => {
  const theme = useTheme();
  const [dataSource, setDataSource] = useState<MyEntityItemType[]>([]);
  const $listPageRef = useRef<ListRefType>(null);

  const handleRequestDataSource: RequestDataSourceType<MyEntityItemType, FilterValuesType> = useCallback(
    async (filters, pagination, sorter) => {
      const response = await myEntityHttpService.getItems(
        {
          name: filters?.name,
          active: filters?.status?.item,
        },
        { page: pagination.current, limit: pagination.pageSize },
        sorter,
      );

      if (isResponseError(response)) {
        showCommonErrors(response.error);
        return { ok: false };
      }

      setDataSource(response.data.result);

      return {
        ok: true,
        dataSource: response.data.result,
        total: response.data.metadata.total,
        current: response.data.metadata.page,
        pageSize: response.data.metadata.limit,
      };
    },
    [myEntityHttpService],
  );

  const handleDelete = useCallback((id: number) => async () => {
    const response = await myEntityHttpService.deleteItem(id);

    if (isResponseError(response)) {
      showCommonErrors(response.error);
      return;
    }

    toast.success('Registro excluído com sucesso!');
    $listPageRef.current?.refresh();
  }, [myEntityHttpService]);

  const renderActions = useCallback((record: MyEntityItemType) => (
    <Container horizontal gap={theme.spacings.sQuarkL} backgroundColor="transparent">
      <Can I="update" a="MyEntity">
        <NavButton
          to={`/app/my-entities/${record.id}`}
          icon={<Icon name="OutlineEdit" family="AntDesign" />}
          tooltipTitle="Editar"
        />
      </Can>
      <Can I="delete" a="MyEntity">
        <Popconfirm
          title="Deseja excluir esse registro?"
          onConfirm={handleDelete(record.id)}
          okText="Sim"
          cancelText="Não"
          okType="danger"
        >
          <Button
            icon={<Icon name="OutlineDelete" family="AntDesign" />}
            tooltipTitle="Excluir"
            danger
          />
        </Popconfirm>
      </Can>
    </Container>
  ), [handleDelete, theme]);

  const tableColumns = useMemo<ColumnType<MyEntityItemType>[]>(() => [
    { key: 'id', title: 'ID', dataIndex: 'id', sorter: true, disableConfig: true },
    { key: 'name', title: 'Nome', dataIndex: 'name', sorter: true },
    {
      key: 'active',
      title: 'Status',
      dataIndex: 'active',
      render: ({ active }) => (
        <YesNoTag active={active} yesLabel="Ativo" noLabel="Inativo" />
      ),
    },
    { key: 'actions', title: 'Ações', render: renderActions },
  ], [renderActions]);

  return (
    <ListPage
      title="Minha Entidade"
      columns={tableColumns}
      listRef={$listPageRef}
      requestDataSource={handleRequestDataSource}
      extra={(
        <Can I="create" a="MyEntity">
          <NavButton to="/app/my-entities/novo" icon={<Icon family="MaterialIcons" name="add" />}>
            Incluir
          </NavButton>
        </Can>
      )}
      filtersContent={(
        <Row gutter={12}>
          <Col xs={24} sm={24} md={12} lg={8} xl={6}>
            <InputText.Field
              name="name"
              label="Nome"
              placeholder="Pesquisar por nome"
            />
          </Col>
          <Col xs={24} sm={24} md={12} lg={8} xl={6}>
            <InputSelect.Field
              name="status"
              label="Status"
              options={STATUS_OPTIONS}
              allowClear
              placeholder="Selecione o status"
            />
          </Col>
        </Row>
      )}
    />
  );
};

export default withPropsInjection(ListMyEntityPage, {
  myEntityHttpService: myEntityHttpServiceInstance,
});
```

---

## 5. Create/Edit Page (`pages/<FeatureName>CreateUpdatePage/index.tsx`)

- Use `wrapForm` from `~/components/Form/wrapForm` to handle form state.
- Use `useParams` to detect create vs. edit mode (`userId` present = edit).
- Use `useAsync` + `useDidMount` to fetch and `initialize()` form values in edit mode.
- Use `ContentPage` as the page container with `onBack` navigation.
- Use `withPropsInjection` to inject the HTTP service.
- Map domain-specific error codes to user-friendly messages before calling `showCommonErrors`.

```tsx
import { useCallback } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import Button from '~/components/Button';
import Col from '~/components/Col';
import Container from '~/components/Container';
import Divider from '~/components/Divider';
import FormLayout from '~/components/Form/FormLayout';
import wrapForm, { OnSubmitFormType } from '~/components/Form/wrapForm';
import InputSwitch from '~/components/InputSwitch';
import InputText from '~/components/InputText';
import InputTextArea from '~/components/InputTextArea';
import LoadingContainer from '~/components/LoadingContainer';
import Row from '~/components/Row';
import toast from '~/components/toast';
import withPropsInjection from '~/hoc/withPropsInjection';
import useAsync from '~/hooks/useAsync';
import useDidMount from '~/hooks/useDidMount';
import { isResponseError } from '~/http/IHttpAdapter';
import ContentPage from '~/shared/ContentPage';
import { useTheme } from '~/theme';
import { showCommonErrors } from '~/utils/helpers/showCommonErrors';
import createCharactersAmountValidation from '~/utils/validators/createCharactersAmountValidation';
import validateNotEmpty from '~/utils/validators/validateNotEmpty';

import myEntityHttpServiceInstance, { MyEntityHttpService } from '../../http/MyEntityHttpService';
import { MyEntityItemType } from '../../http/MyEntityHttpService/types';

const validateNameLength = createCharactersAmountValidation(2, 100);

const MAP_ERROR_CODE_TO_MESSAGE: Record<string, string> = {
  DUPLICATE_NAME: 'Já existe um registro com este nome.',
};

type MyEntityCreateUpdatePagePropsType = {
  myEntityHttpService: MyEntityHttpService;
};

type FormValuesType = {
  name: string;
  description: string;
  active: boolean;
};

const MyEntityCreateUpdatePage = wrapForm<MyEntityCreateUpdatePagePropsType, FormValuesType>(
  ({
    handleSubmit,
    hasValidationErrors,
    submitting,
    myEntityHttpService,
    form,
  }) => {
    const { spacings } = useTheme();
    const navigate = useNavigate();
    const entityId = useParams()?.id;
    const { initialize } = form;

    const handleOnBack = useCallback(() => {
      navigate('/app/my-entities');
    }, [navigate]);

    const initializeFormValues = useCallback(
      (values: MyEntityItemType) => {
        initialize({
          name: values.name,
          description: values.description,
          active: values.active,
        });
      },
      [initialize],
    );

    const { call: requestEntity, loading } = useAsync(async () => {
      const response = await myEntityHttpService.getItem(Number(entityId));

      if (isResponseError(response)) {
        showCommonErrors(response.error);
        return;
      }

      initializeFormValues(response.data);
    }, [initializeFormValues, myEntityHttpService, entityId]);

    useDidMount(() => {
      if (entityId) requestEntity();
    });

    const handleSubmitForm: OnSubmitFormType<FormValuesType> = useCallback(
      async values => {
        const response = entityId
          ? await myEntityHttpService.updateItem(Number(entityId), {
            name: values.name,
            description: values.description,
            active: values.active,
          })
          : await myEntityHttpService.createItem({
            name: values.name,
            description: values.description,
          });

        if (isResponseError(response)) {
          const errorMessage = MAP_ERROR_CODE_TO_MESSAGE[response.error];
          if (errorMessage) {
            toast.error(errorMessage);
            return;
          }
          showCommonErrors(response.error);
          return;
        }

        toast.success(entityId ? 'Registro editado com sucesso!' : 'Registro cadastrado com sucesso!');
        handleOnBack();
      },
      [entityId, myEntityHttpService, handleOnBack],
    );

    return (
      <ContentPage
        title={entityId ? 'Edição de registro' : 'Criação de registro'}
        onBack={handleOnBack}
      >
        <FormLayout onSubmit={handleSubmit(handleSubmitForm)}>
          <LoadingContainer label="Carregando..." loading={loading}>
            <Row gutter={spacings.sXXS}>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <InputText.Field
                  name="name"
                  label="Nome"
                  required
                  validate={validateNameLength}
                  placeholder="Digite o nome"
                  maxLength={100}
                />
              </Col>
              <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                <InputTextArea.Field
                  name="description"
                  label="Descrição"
                  required
                  validate={validateNotEmpty}
                  placeholder="Digite a descrição"
                  maxLength={500}
                  showCount
                />
              </Col>
              {entityId ? (
                <Col>
                  <InputSwitch.Field
                    label="Status"
                    name="active"
                    disabled={submitting}
                    checkedChildren="Ativo"
                    unCheckedChildren="Inativo"
                  />
                </Col>
              ) : null}
            </Row>
            <Divider />
            <Container gap={spacings.sXXS} justifyContent="flex-end" horizontal>
              <Button onClick={handleOnBack}>Cancelar</Button>
              <Button
                htmlType="submit"
                disabled={hasValidationErrors}
                loading={submitting}
                type="primary"
              >
                Salvar
              </Button>
            </Container>
          </LoadingContainer>
        </FormLayout>
      </ContentPage>
    );
  },
);

export default withPropsInjection(MyEntityCreateUpdatePage, {
  myEntityHttpService: myEntityHttpServiceInstance,
});
```

---

## 6. Routes (`routes/index.ts`)

- Use `lazy()` for code-splitting.
- The list route gets `text` and `icon` to appear in the sidebar.
- Guard each route with the appropriate CASL ability in `isVisible`.
- The edit route (`/:id`) and the create route (`/novo`) both point to the same `CreateUpdatePage`.

```ts
import { lazy } from 'react';

import { RouteMenuType } from '~/routes/utils';

const ListMyEntityPage = lazy(() => import('../pages/ListMyEntityPage'));
const MyEntityCreateUpdatePage = lazy(() => import('../pages/MyEntityCreateUpdatePage'));

const myEntityRoutes: RouteMenuType[] = [
  {
    level: 'item',
    path: '/my-entities',
    Component: ListMyEntityPage,
    text: 'Minha Entidade',
    icon: { family: 'AntDesign', name: 'AiOutlineAppstore' },
    isVisible: userAuthentication => (
      Boolean(userAuthentication?.ability.can('find', 'MyEntity'))
    ),
  },
  {
    level: 'item',
    path: '/my-entities/:id',
    Component: MyEntityCreateUpdatePage,
    isVisible: userAuthentication => (
      Boolean(
        userAuthentication?.ability.can('find', 'MyEntity')
        && userAuthentication?.ability.can('update', 'MyEntity'),
      )
    ),
  },
  {
    level: 'item',
    path: '/my-entities/novo',
    Component: MyEntityCreateUpdatePage,
    isVisible: userAuthentication => (
      Boolean(
        userAuthentication?.ability.can('find', 'MyEntity')
        && userAuthentication?.ability.can('create', 'MyEntity'),
      )
    ),
  },
];

export default myEntityRoutes;
```

After creating the routes, **import and spread** them in `src/routes/private.ts`:

```ts
import myEntityRoutes from '~/features/myEntity/routes';

// Inside the private routes array:
...myEntityRoutes,
```

---

## 7. CASL Permissions

Add the new subject to `src/ability/types.ts`:

```ts
// In the Subjects union type, add:
| 'MyEntity'
```

---

## Key Rules Summary

| Concern | Where |
|---|---|
| API types | `http/<Service>/types.ts` |
| API calls | `http/<Service>/index.ts` (extends `HttpService`) |
| List + delete | `pages/List<Feature>Page` using `ListPage` shared component |
| Create + edit | `pages/<Feature>CreateUpdatePage` using `wrapForm` + `ContentPage` |
| Route definitions | `routes/index.ts` with `lazy()` + CASL `isVisible` |
| DI / injection | `withPropsInjection` on every page component |
| Error handling | `isResponseError()` → domain map → `showCommonErrors()` |
| Notifications | `toast.success` / `toast.error` from `~/components/toast` |
| Permissions (UI) | `<Can I="action" a="Subject">` wrapping sensitive buttons |
