---
name: mobile-http-services
description: Mobile Template HTTP service layer for creating API services, error handling, response mapping, and interceptors. Use when implementing API calls, HTTP services, or error handling.
---

# Mobile Template - HTTP Services

## HTTP Layer (`src/http/`)

- All HTTP services extend the abstract `HttpService` class from `~/http/HttpService`.
- `HttpService` uses the adapter pattern via `IHttpAdapter` interface — the default implementation is `AxiosHttpAdapter`.
- There is also a `MockHttpAdapter` for testing.

## Creating a Feature HTTP Service

For feature-specific HTTP services, create a class that extends `HttpService`:

```ts
import Axios from 'axios';
import ENV from '~/environment';
import { AxiosHttpAdapter } from '~/http/adapters/AxiosHttpAdapter';
import { HttpService } from '~/http/HttpService';
import { IResponseSuccess, IResponseError } from '~/http/IHttpAdapter';
import tokenInterceptor from '~/http/interceptors/tokenInterceptor';

type MyFeatureErrorsType = 'MY_ERROR_CODE' | 'UNKNOWN';

export class MyFeatureHttpService extends HttpService<MyFeatureErrorsType> {
  getItems() {
    return this.get<ResponseDataType, IResponseError>('/my-endpoint');
  }

  getItemById(id: number) {
    return this.get<ResponseItemType, IResponseError>(`/my-endpoint/${id}`);
  }

  createItem(data: CreateDataType) {
    return this.post<ResponseItemType, IResponseError>('/my-endpoint', data, undefined, response => {
      switch (response.data?.error.code) {
        case 201: return 'MY_ERROR_CODE';
        default: return 'UNKNOWN';
      }
    });
  }

  updateItem(id: number, data: UpdateDataType) {
    return this.put<ResponseItemType, IResponseError>(`/my-endpoint/${id}`, data);
  }

  deleteItem(id: number) {
    return this.delete<void, IResponseError>(`/my-endpoint/${id}`);
  }
}

const axios = Axios.create({ baseURL: ENV.getValue('apiBaseUrl') });
axios.interceptors.request.use(tokenInterceptor);

const myFeatureHttpServiceInstance = new MyFeatureHttpService(new AxiosHttpAdapter(axios));
export default myFeatureHttpServiceInstance;
```

## Key Patterns

- Always add the `tokenInterceptor` to include the auth token in requests.
- The token interceptor reads from `UserAuthenticationHolder.getState()?.token` and sets `Authorization: Bearer` header.
- Define request/response types in a separate `types.ts` file.
- Always use `isResponseError()` from `~/http/IHttpAdapter` to check for errors in responses.
- Always map error responses to your service's error type using the `responseErrorMapper` parameter in HTTP methods.
- Two-level error handling: local (per-endpoint) → global (per-service).

## HttpService Abstract Class

The `HttpService` provides protected methods: `get`, `post`, `put`, `patch`, `delete`. Each accepts:
1. URL path
2. Request body (for POST/PUT/PATCH)
3. Request options (headers, params)
4. Error handler function (maps response to specific error type)

```ts
export abstract class HttpService<ErrorType extends string = 'UNKNOWN'> {
  constructor(
    apiAdapter: IHttpAdapter,
    errorHandler?: ErrorHandlerType<any, ErrorType>,
  );

  protected get<SuccessData, ErrorData>(url, options?, errorHandler?);
  protected post<SuccessData, ErrorData, RequestBody>(url, body?, options?, errorHandler?);
  protected put<SuccessData, ErrorData, RequestBody>(url, body?, options?, errorHandler?);
  protected patch<SuccessData, ErrorData, RequestBody>(url, body?, options?, errorHandler?);
  protected delete<SuccessData, ErrorData, RequestBody>(url, body?, options?, errorHandler?);
}
```

## Response Types

```ts
// Success response
interface IResponseSuccess<T> {
  data: T;
  status: number;
  headers: AxiosResponse['headers'];
  url: string;
}

// Error response
interface IResponseError<ErrorData, ErrorType extends string> {
  error: ErrorIdentifierType<ErrorType>;
  data?: ErrorData;
  status?: number;
  headers?: AxiosResponse['headers'];
  url?: string;
}

// Built-in error types (always available)
type ErrorIdentifierType<ErrorType extends string> = ErrorType | 'SERVER' | 'NETWORK' | 'INVALID_CREDENTIALS' | 'UNKNOWN';
```

## Error Handling

Use `isResponseError()` to check HTTP responses before processing data:

```ts
import { isResponseError } from '~/http/IHttpAdapter';
import { showCommonErrors } from '~/utils/helpers/showCommonErrors';

const response = await myHttpService.createItem(data);

if (isResponseError(response)) {
  // Option 1: Domain-specific errors
  const MAP_ERROR_CODE_TO_MESSAGE: Record<string, string> = {
    MY_ERROR_CODE: 'Mensagem de erro amigável para o usuário',
  };

  const errorMessage = MAP_ERROR_CODE_TO_MESSAGE[response.error];
  if (errorMessage) {
    showModal(Toast, { variant: 'error', message: errorMessage });
    return;
  }

  // Option 2: Generic errors (SERVER, NETWORK, UNKNOWN, etc.)
  showCommonErrors(showModal, response.error);
  return;
}

// Success — use response.data
```

## showCommonErrors

`showCommonErrors` from `~/utils/helpers/showCommonErrors` maps common HTTP error types to AlertDialog/Toast modals. It requires the `showModal` function from `useModal()`:

```ts
import { showCommonErrors } from '~/utils/helpers/showCommonErrors';
import { useModal } from '~/components/Modal/ModalProvider';

const showModal = useModal();

// In error handler:
showCommonErrors(showModal, response.error);
```

## Token Interceptor

The token interceptor automatically attaches the Bearer token from the `UserAuthenticationHolder`:

```ts
import { UserAuthenticationHolder } from '~/context/UserAuthentication';

const tokenInterceptor = (request: InternalAxiosRequestConfig) => {
  const token = UserAuthenticationHolder.getState()?.token;
  if (!request.headers.Authorization && token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
};
```

## Using HTTP Services in Components

The best practice is injecting services via `withPropsInjection`:

```tsx
import withPropsInjection from '~/hoc/withPropsInjection';
import myFeatureHttpServiceInstance, { MyFeatureHttpService } from '../../http/MyFeatureHttpService';

type MyScreenPropsType = {
  myHttpService: MyFeatureHttpService;
};

const MyScreen = ({ myHttpService }: MyScreenPropsType) => {
  const showModal = useModal();

  const { call: fetchData, loading } = useAsync(async () => {
    const response = await myHttpService.getItems();
    if (isResponseError(response)) {
      showCommonErrors(showModal, response.error);
      return;
    }
    // use response.data
  }, [myHttpService, showModal]);

  useDidMount(() => { fetchData(); });

  // render...
};

export default withPropsInjection(MyScreen, {
  myHttpService: myFeatureHttpServiceInstance,
});
```
