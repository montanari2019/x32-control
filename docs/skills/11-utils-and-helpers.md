---
title: Utilities and Helpers
type: skill
version: 1.0
scope: utilities
tags: [utils, helpers, storage]
---

## Summary

Utilities provide reusable building blocks for storage, analytics, logging, errors, and formatting. They are thin wrappers around native modules or pure functions.

## Reference Implementation

- Secure storage: [src/utils/SecureStore/index.ts](src/utils/SecureStore/index.ts)
- Device info wrapper: [src/utils/DeviceInfo/index.ts](src/utils/DeviceInfo/index.ts)
- Analytics and crash logs: [src/utils/Analytics/index.ts](src/utils/Analytics/index.ts)
- Debug logs: [src/utils/debug/index.ts](src/utils/debug/index.ts)
- Common error UI: [src/utils/helpers/showCommonErrors.ts](src/utils/helpers/showCommonErrors.ts)
- Props injection HOC: [src/hoc/withPropsInjection/index.tsx](src/hoc/withPropsInjection/index.tsx)

## Common Utility Buckets

- Validators: [src/utils/validators/validateCep/index.ts](src/utils/validators/validateCep/index.ts)
- Masks: [src/utils/masks/maskCep/index.ts](src/utils/masks/maskCep/index.ts)
- Transformers: [src/utils/transformers/currencyFormatTransformer/index.ts](src/utils/transformers/currencyFormatTransformer/index.ts)
- Datetime: [src/utils/datetime/dateToString/index.ts](src/utils/datetime/dateToString/index.ts)

## Core Pattern

- Utilities should be pure or thin wrappers over a single dependency.
- Keep APIs synchronous where possible; async only when needed.

## Pitfalls

- Avoid adding app-specific logic into shared utilities.
- Keep SecureStore keys centralized to prevent mismatch.

## Checklist

- Utility has a single responsibility
- API is simple and typed
- Test added for non-trivial logic

## Prompt Seed

Create small, focused utilities for storage, logging, analytics, and formatting. Keep them as thin wrappers or pure functions with clear, typed APIs.
