---
title: Services and Auth Integrations
type: skill
version: 1.0
scope: services
tags: [auth, biometric, social]
---

## Summary

Service modules encapsulate platform or vendor SDK logic and keep React components thin. They often depend on contexts and SecureStore for state and persistence.

## Reference Implementation

- Biometric auth: [src/services/biometricAuthService/index.ts](src/services/biometricAuthService/index.ts)
- Social auth entry: [src/services/socialAuth/index.ts](src/services/socialAuth/index.ts)
- Google auth: [src/services/socialAuth/google/index.ts](src/services/socialAuth/google/index.ts)
- Facebook auth: [src/services/socialAuth/facebook/index.ts](src/services/socialAuth/facebook/index.ts)
- Logout: [src/services/logoutService/index.ts](src/services/logoutService/index.ts)
- Secure storage: [src/utils/SecureStore/index.ts](src/utils/SecureStore/index.ts)

## Core Pattern

- Service is a plain object exposing methods.
- Auth services return structured data or `null` on failure.
- Logout clears SecureStore and resets auth context.
- Biometric service manages availability checks and user preference storage.

## Implementation Steps

1. Wrap SDK calls inside a service module.
2. Return explicit values for success and failure paths.
3. Use SecureStore for persistence (tokens and preferences).
4. Use context Holders when updating auth state.

## Pitfalls

- Avoid calling SDK methods directly from screens; keep logic in services.
- Biometric checks must verify hardware and enrollment before authentication.

## Checklist

- Service exported as a simple object
- SDK configuration performed once
- SecureStore keys centralized
- Context state updated via Holder

## Prompt Seed

Create service modules that wrap platform SDKs (biometric, social login). Use SecureStore for persistence and update auth context via Holder. Expose simple async methods with explicit success/failure returns.
