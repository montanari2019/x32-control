---
name: web-http-services
description: Web Template HTTP service layer for creating API services, error handling, and response mapping. Use when implementing API calls, HTTP services, or error handling.
---

# Web Template - HTTP Services

## HTTP Layer (`src/http/`)

- All HTTP services extend the abstract `HttpService` class from `~/http/HttpService`.
- `HttpService` uses the adapter pattern via `IHttpAdapter` interface — the default implementation is `AxiosHttpAdapter`.
- If the route has specific error codes, create an error type for the service and map error responses to it for better error handling in the UI.
- For feature-specific HTTP services, create a class that extends `HttpService`:
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

  type MyFeatureErrorsType = ErrorIdentifierType<'MY_ERROR_CODE' | 'UNKNOWN'>;

  export class MyFeatureHttpService extends HttpService<MyFeatureErrorsType> {
    getItems(filters?: FilterParamsType, pagination?: HttpPaginationType, sorter?: HttpSorterType) {
      return this.get<ResponseDataType, ErrorResponseType>('/my-endpoint', {
        params: formatListParams(filters, pagination, sorter),
      });
    }

    createItem(data: CreateDataType) {
      return this.post<ResponseItemType, ErrorResponseType>('/my-endpoint', data, undefined, response => {
        switch (response.data?.error.code) {
          case 201: return 'MY_ERROR_CODE';
          default: return 'UNKNOWN';
        }
      });
    }
  }

  const axios = Axios.create({ baseURL: Environment.apiBaseUrl });
  axios.interceptors.request.use(userAuthenticationInterceptor);

  const myFeatureHttpServiceInstance = new MyFeatureHttpService(new AxiosHttpAdapter(axios));
  export default myFeatureHttpServiceInstance;
  ```
- Always add the `userAuthenticationInterceptor` to include the auth token in requests.
- Define request/response types in a separate `types.ts` file.
- Always use `isResponseError()` from `~/http/IHttpAdapter` to check for errors in responses.
- Always map error responses to your service's error type using the responseErrorMapper parameter in HTTP methods.
- Use the `HttpFiltersType` system for building dynamic query filters:
  ```ts
  const filters: HttpFiltersType = [];
  if (filterValue) {
    filters.push({ where: ['table.column', 'like', `%${filterValue}%`] });
  }
  ```

## Error Handling

- Use `isResponseError()` to check HTTP responses before processing data.
- Use `showCommonErrors()` from `~/utils/helpers/showCommonErrors` for standard error toast messages.
- For domain-specific errors, map error codes to user-friendly messages:
  ```ts
  const response = await myHttpService.createItem(data);

  const MAP_ERROR_CODE_TO_MESSAGE: Record<string, string> = {
    MY_ERROR_CODE: 'Mensagem de erro amigável para o usuário',
  };

  if (isResponseError(response)) {
    const errorMessage = MAP_ERROR_CODE_TO_MESSAGE[response.error];
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }
    showCommonErrors(response.error);
  }
  ```

## Using

- The best practice for using HTTP services is injecting with props injection in the component or hook that needs it:
  ```ts
  import { withPropsInjection } from '~/utils/hocs/withPropsInjection';
  import myFeatureHttpServiceInstance from '~/services/myFeatureHttpService';

  function MyComponent({ myFeatureHttpService }: { myFeatureHttpService: MyFeatureHttpService }) {
    // use myFeatureHttpService to make API calls
  }

  export default withPropsInjection(MyComponent, {
    myFeatureHttpService: myFeatureHttpServiceInstance,
  });
  ```
