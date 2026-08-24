---
name: forms-and-inputs
description: "Documents form and input conventions, field wrappers, validation, and reusable input components. Use when building forms, connecting inputs to form state, or standardizing validation and error rendering."
---

# Forms and Inputs

## Summary

Forms are built on `react-final-form` with a `wrapField` helper. Each input component exposes a `.Field` variant that integrates with form state, validation, and error rendering.

## Reference Implementation

- Form core: [src/components/Form/index.tsx](src/components/Form/index.tsx)
- Field wrapper: [src/components/Form/wrapField.tsx](src/components/Form/wrapField.tsx)
- Form wrapper: [src/components/Form/wrapForm.tsx](src/components/Form/wrapForm.tsx)
- Form utils: [src/components/Form/utils.tsx](src/components/Form/utils.tsx)

## Input Components

- Text input: [src/components/InputText/index.tsx](src/components/InputText/index.tsx)
- Text input actions: [src/components/InputText/InputTextAction.tsx](src/components/InputText/InputTextAction.tsx)
- Select input: [src/components/InputSelect/index.tsx](src/components/InputSelect/index.tsx)
- Select modal: [src/components/InputSelect/InputSelectModal.tsx](src/components/InputSelect/InputSelectModal.tsx)
- Date input: [src/components/InputDate/index.tsx](src/components/InputDate/index.tsx)
- OTP input: [src/components/InputOtp/index.tsx](src/components/InputOtp/index.tsx)
- CEP input: [src/components/InputCep/index.tsx](src/components/InputCep/index.tsx)
- Checkbox: [src/components/Checkbox/index.tsx](src/components/Checkbox/index.tsx)
- Radio group: [src/components/RadioGroup/index.tsx](src/components/RadioGroup/index.tsx)
- Switch: [src/components/Switch/index.tsx](src/components/Switch/index.tsx)
- Password form: [src/components/CreatePasswordForm/index.tsx](src/components/CreatePasswordForm/index.tsx)

## Core Pattern

- `wrapField` turns a component into a `.Field` wrapper.
- `getFieldErrorState` determines error visibility based on `invalid` + `touched`.
- Inputs sanitize or mask values inside their own `onChange` handlers.
- `InputSelect` uses a modal + pagination hook to fetch options.

## Implementation Steps

1. Build a pure input component that renders value, error, and help.
2. Add a `.Field` export using `wrapField`.
3. Apply validation only when required or when there is a value.
4. Use `ensureDefaultValue` to avoid `null`/`undefined` surprises.

## Pitfalls

- Forgetting to forward `onBlur` and `onFocus` breaks form touched state.
- Masked inputs must convert user format to system format before saving.

## Checklist

- Input supports `error`, `help`, `disabled`
- `.Field` wrapper uses `getFieldErrorState`
- Validation uses `wrapField` contract

## Prompt Seed

Create form-ready input components with `.Field` wrappers built on `react-final-form`. Each input should handle its own masking/sanitization and expose error/help display based on form meta.
