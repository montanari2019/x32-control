---
name: modal-dialog-toast-system
description: "Documents the project overlay system using ModalProvider, useModal, Toast, Dialog, AlertDialog, lifecycle props, throttling, and common error helpers. Use when implementing or debugging app overlays and modal flows."
---

# Modal Dialog Toast System

## Summary

O sistema de overlays é inteiramente gerenciado pelo `ModalProvider`. Qualquer componente pode abrir um modal, dialog ou toast chamando `showModal` obtido via `useModal()` — sem state local, sem prop drilling. O provider gerencia o ciclo de vida (`visible`, `onDismiss`, `onDismissEnd`) e aplica throttle automático para evitar abertura dupla.

## Arquitetura

```
ModalProvider (raiz do app)
  └── useModal()  →  showModal(Component, props)
        ├── Toast          – notificação temporária (desliza da direita)
        ├── Dialog         – overlay com backdrop (sobe de baixo)
        ├── AlertDialog    – Dialog pré-montado com título, mensagem e botões
        └── [qualquer componente que aceite ModalPropsType]
```

## Reference Implementation

- Provider + hook: [src/components/Modal/ModalProvider.tsx](src/components/Modal/ModalProvider.tsx)
- Modal base (animações): [src/components/Modal/index.tsx](src/components/Modal/index.tsx)
- Dialog composto: [src/components/Dialog/index.tsx](src/components/Dialog/index.tsx)
- AlertDialog: [src/components/AlertDialog/index.tsx](src/components/AlertDialog/index.tsx)
- Toast: [src/components/Toast/index.tsx](src/components/Toast/index.tsx)
- Utilitários de variante do Toast: [src/components/Toast/utils.ts](src/components/Toast/utils.ts)
- Helper de erros comuns: [src/utils/helpers/showCommonErrors.ts](src/utils/helpers/showCommonErrors.ts)

## Contratos de Props

### `ModalPropsType` (base para todos)

```ts
type ModalPropsType = {
  visible: boolean;
  onDismiss?: () => void;       // chamado quando o usuário fecha
  onDismissEnd?: () => void;    // chamado após a animação de saída terminar
  dismissible?: boolean;        // default: true
  animationDuration?: number;   // default: 250ms
};
```

`showModal` injeta `visible`, `onDismiss` e `onDismissEnd` automaticamente — **nunca passe esses props manualmente**.

### `Toast`

```ts
type ToastPropsType = ModalPropsType & {
  title: string;
  message: string;
  variant?: 'success' | 'error' | 'warning';   // default: 'success'
  timeToCloseInMilliseconds?: number;           // default: 4000
  bottomOffset?: number;                        // default: 41
};
```

### `AlertDialog`

```ts
type AlertDialogPropsType = DialogPropsType & {
  title?: string;
  message?: string | React.ReactNode;
  Icon?: ComponentType<IconPropsType>;
  primaryButtonName?: string;
  secondaryButtonName?: string;
  onPressPrimary?: () => void;
  onPressSecondary?: () => void;
};
```

### `Dialog` (base livre)

```ts
type DialogPropsType = ModalPropsType & {
  modalStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  containerChildren?: React.ReactNode;
  dismissible?: boolean;
};
```

Subcomponentes: `Dialog.Header`, `Dialog.Title`, `Dialog.Message`, `Dialog.Actions` (filhos devem ser `<Button>`).

## Como Usar

### 1. Mostrar um Toast

```tsx
import { useModal } from '~/components/Modal/ModalProvider';
import Toast from '~/components/Toast';

const MyComponent = () => {
  const showModal = useModal();

  const handleSuccess = () => {
    showModal(Toast, {
      title: 'Sucesso!',
      message: 'Operação realizada com sucesso.',
      variant: 'success',
    });
  };

  const handleError = () => {
    showModal(Toast, {
      title: 'Erro',
      message: 'Não foi possível completar a operação.',
      variant: 'error',
    });
  };
};
```

### 2. Mostrar um AlertDialog (confirmação)

```tsx
import { useModal } from '~/components/Modal/ModalProvider';
import AlertDialog from '~/components/AlertDialog';

const MyComponent = () => {
  const showModal = useModal();

  const handleDelete = () => {
    showModal(AlertDialog, {
      title: 'Confirmar exclusão',
      message: 'Deseja realmente excluir este item?',
      primaryButtonName: 'Excluir',
      secondaryButtonName: 'Cancelar',
      onPressPrimary: () => { /* lógica de exclusão */ },
    });
  };
};
```

### 3. Mostrar um Dialog customizado

```tsx
import { useModal } from '~/components/Modal/ModalProvider';
import Dialog from '~/components/Dialog';
import Button from '~/components/Button';

const MyComponent = () => {
  const showModal = useModal();

  const handleOpen = () => {
    showModal(Dialog, {
      children: (
        <>
          <Dialog.Title>Título</Dialog.Title>
          <Dialog.Message>Conteúdo livre aqui.</Dialog.Message>
          <Dialog.Actions>
            <Button onPress={() => {}}>Confirmar</Button>
            <Button onPress={() => {}}>Cancelar</Button>
          </Dialog.Actions>
        </>
      ),
    });
  };
};
```

### 4. Fechar um modal programaticamente

```tsx
const { dismiss } = showModal(Toast, { ... });

// fechar antes do tempo:
dismiss();
```

### 5. Usar `showCommonErrors` (erros de API)

```tsx
import { showCommonErrors } from '~/utils/helpers/showCommonErrors';

const showModal = useModal();

if (isResponseError(response)) {
  showCommonErrors(showModal, response.error);
  return;
}
```

Trata automaticamente os erros: `INVALID_CREDENTIALS` → AlertDialog de sessão expirada; `SERVER` / `NETWORK` / desconhecido → Toast de erro com mensagem adequada.

## Setup no App

O `ModalProvider` já está wired no `Providers.tsx`. Em projetos novos, adicione uma vez na raiz:

```tsx
// Providers.tsx
import ModalProvider, { ModalHolder } from '~/components/Modal/ModalProvider';

export const Providers = ({ children }) => (
  <ModalProvider>
    <ModalHolder>
      {children}
    </ModalHolder>
  </ModalProvider>
);
```

## Throttle

O `ModalProvider` ignora chamadas duplicadas do **mesmo tipo de modal** dentro de `throttleTimeout` (default: **500ms**). Isso evita abertura dupla ao clicar rápido.

Em testes, desative passando `throttleTimeout={0}`:

```tsx
<ModalProvider throttleTimeout={0}>
  {children}
</ModalProvider>
```

## Toast — Variantes e Ícones

| `variant` | Cor de fundo | Ícone |
|---|---|---|
| `success` | `primaryBase` | Check |
| `error` | `feedbackNegativeBase` | DangerTriangle |
| `warning` | `feedbackWarningBase` | DangerCircle |

## Dialog.Actions

Filhos devem ser `<Button>`. O `DialogActions` aplica estilos automaticamente:
- **1º filho** → `variant="filled"`, `size="large"`
- **2º filho** → `variant="outline"`, `size="medium"`

Em `__DEV__`, passar um componente diferente de `Button` lança um erro.

## Conventions to Follow

- Nunca gerencie `visible` localmente para modals — sempre use `showModal`.
- Use `AlertDialog` para fluxos de confirmação, `Toast` para feedback transitório, `Dialog` para conteúdo livre.
- `onPressPrimary` e `onPressSecondary` no `AlertDialog` já chamam `onDismiss` internamente — não duplique o dismiss.
- Prefira `showCommonErrors` para tratar erros de API em vez de repetir o padrão `showModal(Toast, ...)` manualmente.

## Pitfalls

- Passar `visible` ou `onDismiss` manualmente no `showModal` é ignorado — o provider controla esses props.
- Esquecer de montar o `ModalProvider` na raiz faz `useModal` retornar um contexto vazio e não abre nada.
- `Dialog.Actions` com elementos que não são `Button` quebra em DEV com erro explícito.
- Toast sem `onDismiss` nunca é desmontado do provider após o `timeToCloseInMilliseconds`.

## Checklist

- [ ] `ModalProvider` montado uma vez na raiz do app
- [ ] Componente modal aceita `ModalPropsType` (ou extensão) como props
- [ ] `visible`, `onDismiss` e `onDismissEnd` **não** passados manualmente ao `showModal`
- [ ] `showCommonErrors` usado para erros de API
- [ ] `throttleTimeout={0}` nos testes que abrem modals múltiplas vezes

## Prompt Seed

Implemente o sistema de overlays do projeto com `ModalProvider` na raiz, `useModal` para abrir modals de qualquer componente, `Toast` para notificações temporárias (variantes success/error/warning), `AlertDialog` para confirmações com botões primário e secundário, e `Dialog` para conteúdo livre com subcomponentes `Header`, `Title`, `Message` e `Actions`. Use `showCommonErrors` para tratar erros de API. Siga os contratos de props e as convenções descritas nesta skill.
