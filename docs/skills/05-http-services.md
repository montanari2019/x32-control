---
title: HTTP Services and Adapters
type: skill
version: 1.0
scope: http
tags: [http, axios, adapters, errors]
---

## Summary

HTTP access is built on a generic `HttpService` plus an adapter interface. Adapters handle transport and normalize responses while services focus on endpoints and domain-specific error mapping.

## Core Pattern

- `IHttpAdapter` defines GET/POST/PUT/PATCH/DELETE with typed responses.
- `HttpService` wraps adapter calls and applies error handlers.
- Axios adapter normalizes Axios errors into consistent error identifiers.
- A mock adapter supports deterministic unit tests.

## Reference Implementation

- Base service: [src/http/HttpService.ts](src/http/HttpService.ts)
- Adapter interface: [src/http/IHttpAdapter.ts](src/http/IHttpAdapter.ts)
- Axios adapter: [src/http/adapters/AxiosHttpAdapter.ts](src/http/adapters/AxiosHttpAdapter.ts)
- Mock adapter: [src/http/adapters/MockHttpAdapter.ts](src/http/adapters/MockHttpAdapter.ts)
- Token interceptor: [src/http/interceptors/tokenInterceptor/index.ts](src/http/interceptors/tokenInterceptor/index.ts)
- Error enums: [src/http/enum.ts](src/http/enum.ts)
- Example service: [src/features/home/http/HomeHttpService/index.ts](src/features/home/http/HomeHttpService/index.ts)
- Example auth service: [src/features/intro/http/LoginHttpService/index.ts](src/features/intro/http/LoginHttpService/index.ts)
- Example custom error mapping: [src/http/AddressHttpService/index.ts](src/http/AddressHttpService/index.ts)

## Implementation Steps

1. Define an adapter that implements `IHttpAdapter`.
2. Extend `HttpService` and add endpoint methods.
3. Map server error payloads to typed error identifiers when needed.
4. Create an Axios instance with `baseURL` from env config.
5. Register request interceptors (token, headers).
6. Export a singleton instance and the class for tests.

## Conventions to Follow

- Use `ErrorIdentifierType` for service-specific errors.
- When needed, pass a per-request error handler to `HttpService` methods.
- For tests, swap the adapter for `MockHttpAdapter`.

## Pitfalls

- Reusing `Axios` default instance is blocked by design.
- Avoid inline headers in components; push them into services.

## Checklist

- Adapter implements `IHttpAdapter`
- Service extends `HttpService`
- Axios instance uses env base URL
- Interceptors registered
- Tests use `MockHttpAdapter`

## Prompt Seed

Implement an HTTP layer with an adapter interface, a base service class that normalizes errors, an Axios adapter for production, and a mock adapter for tests. Services should expose endpoint methods and map domain errors when needed.
