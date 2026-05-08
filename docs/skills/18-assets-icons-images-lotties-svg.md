---
title: Assets — Ícones, Imagens, Lotties e SVG
type: skill
version: 1.0
scope: assets
tags: [assets, icons, images, lottie, svg, react-native-svg]
---

## Summary

Todos os assets visuais do projeto vivem em `src/assets/`. Ícones e imagens são componentes TSX construídos com `react-native-svg`. Arquivos raster (PNG, JPEG) são importados via `require()`. Animações Lottie são arquivos JSON importados como módulos. Tudo é exportado por namespaces (`Icons`, `Images`, `Lotties`) a partir de `~/assets`.

---

## Estrutura de Pastas

```
src/assets/
  index.ts            ← re-exporta todos os namespaces
  icons/
    ArrowLeft.tsx
    Close.tsx
    ...
    index.ts          ← exporta cada ícone por nome
  images/
    DiscoverLogo.tsx
    SplashLogo.tsx
    DiscoverIntro/
      discoverImageIntro.png
      index.ts        ← export default require('./discoverImageIntro.png')
    ...
    index.ts          ← exporta cada imagem por nome
  lotties/
    lottieSpinner.json
    index.ts          ← exporta cada Lottie por nome
```

---

## Reference Implementation

- Raiz dos assets: [src/assets/index.ts](src/assets/index.ts)
- Índice de ícones: [src/assets/icons/index.ts](src/assets/icons/index.ts)
- Índice de imagens: [src/assets/images/index.ts](src/assets/images/index.ts)
- Índice de Lotties: [src/assets/lotties/index.ts](src/assets/lotties/index.ts)
- Tipo global `IconPropsType`: [src/@types/assets.d.ts](src/@types/assets.d.ts)
- Exemplo de ícone simples: [src/assets/icons/ArrowLeft.tsx](src/assets/icons/ArrowLeft.tsx)
- Exemplo de ícone com gradiente: [src/assets/icons/StarGradient.tsx](src/assets/icons/StarGradient.tsx)
- Exemplo de imagem SVG (logo): [src/assets/images/SplashLogo.tsx](src/assets/images/SplashLogo.tsx)
- Exemplo de imagem PNG: [src/assets/images/DiscoverIntro/index.ts](src/assets/images/DiscoverIntro/index.ts)
- Consumo de Lottie: [src/components/LoadingIndicator/index.tsx](src/components/LoadingIndicator/index.tsx)

---

## Tipo Global `IconPropsType`

Definido em [src/@types/assets.d.ts](src/@types/assets.d.ts), disponível globalmente (sem necessidade de importar):

```ts
type IconPropsType = Omit<SvgProps, 'color'> & {
  color: ColorValue;
  colorSecondary?: ColorValue;
};
```

- Use `IconPropsType` para **todos os ícones** (sobrescreve `color` para aceitar `ColorValue`).
- Para imagens e logos sem cor dinâmica, use diretamente `SvgProps` de `react-native-svg`.

---

## Arquivo Raiz `src/assets/index.ts`

```ts
/* Manter em ordem alfabética */

export * as Icons from './icons';
export * as Images from './images';
export * as Lotties from './lotties';
```

Nunca importe diretamente de subpastas nos componentes. Use sempre `~/assets`.

---

## Padrão de Ícone SVG

Ícones são SVGs convertidos para TSX com cores dinâmicas via prop `color`.

### Estrutura do componente

```tsx
import * as React from 'react';

import Svg, { Path } from 'react-native-svg';

const NomeDoIcone = ({
  width = 24,
  height = 24,
  color,
  ...others
}: IconPropsType) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    {...others}
    fill="none"
  >
    <Path
      d="..."
      fill={color}
    />
  </Svg>
);

export default NomeDoIcone;
```

### Ícone com duas cores (gradiente)

Quando o ícone usa gradiente linear, use `color` e `colorSecondary`:

```tsx
import * as React from 'react';

import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const StarGradient = ({
  width = 24,
  height = 24,
  color,
  colorSecondary,
  ...others
}: IconPropsType) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...others}>
    <Defs>
      <LinearGradient id="grad" x1="..." y1="..." x2="..." y2="..." gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor={color} />
        <Stop offset="1" stopColor={colorSecondary} />
      </LinearGradient>
    </Defs>
    <Path d="..." fill="url(#grad)" />
  </Svg>
);

export default StarGradient;
```

### Registrar no índice de ícones

Adicione a entrada em [src/assets/icons/index.ts](src/assets/icons/index.ts), **mantendo ordem alfabética**:

```ts
export { default as NomeDoIcone } from './NomeDoIcone';
```

---

## Padrão de Imagem SVG (Logo / Ilustração)

Imagens não recebem cor dinâmica — use `SvgProps` diretamente. As cores ficam hardcoded no SVG.

```tsx
import * as React from 'react';

import Svg, { Path } from 'react-native-svg';
import { SvgProps } from 'react-native-svg';

const DiscoverLogo = ({ width = 276, height = 169, ...others }: SvgProps) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 276 169"
    fill="none"
    {...others}
  >
    <Path d="..." fill="#4FD807" />
  </Svg>
);

export default DiscoverLogo;
```

### Registrar no índice de imagens

Adicione em [src/assets/images/index.ts](src/assets/images/index.ts), **mantendo ordem alfabética**:

```ts
export { default as DiscoverLogo } from './DiscoverLogo';
```

---

## Padrão de Imagem PNG / Raster

Para assets raster (PNG, JPEG, WebP), crie uma subpasta com o nome da imagem em PascalCase.

### Estrutura

```
src/assets/images/
  NomeDaImagem/
    nomeDaImagem.png     ← arquivo raster
    index.ts             ← exporta via require
```

### `index.ts` da imagem PNG

```ts
export default require('./nomeDaImagem.png');
```

### Registrar no índice de imagens

```ts
export { default as NomeDaImagem } from './NomeDaImagem';
```

### Uso em componente

```tsx
import { Image } from 'react-native';
import { Images } from '~/assets';

<Image source={Images.NomeDaImagem} style={{ width: 200, height: 120 }} />
```

---

## Padrão de Lottie

Animações Lottie são arquivos `.json` exportados diretamente.

### Adicionar novo Lottie

1. Coloque o arquivo `.json` em `src/assets/lotties/`.
2. Exporte em [src/assets/lotties/index.ts](src/assets/lotties/index.ts):

```ts
export { default as NomeDaAnimacao } from './nomeDoArquivo.json';
```

### Uso com `LottieView`

```tsx
import React, { useRef, useMemo } from 'react';
import LottieView from 'lottie-react-native';

import { Lotties } from '~/assets';
import { useViewStyles } from '~/hooks/useStyles';
import { useTheme } from '~/theme';

const MyAnimation = () => {
  const theme = useTheme();
  const animation = useRef<LottieView>(null);

  const lottieStyle = useViewStyles(() => ({
    width: 40,
    height: 40,
    backgroundColor: 'transparent',
  }), []);

  // Substituir cores de layers da animação dinamicamente
  const colorFilters = useMemo(() => [
    { keypath: 'Shape Layer 1', color: theme.colors.primaryBase },
  ], [theme.colors.primaryBase]);

  return (
    <LottieView
      autoPlay
      ref={animation}
      source={Lotties.NomeDaAnimacao}
      colorFilters={colorFilters}
      style={lottieStyle}
    />
  );
};
```

> `colorFilters` é opcional. Use apenas quando for necessário sobrescrever cores da animação com tokens do tema.

---

## Como Importar e Usar nos Componentes

### Import

```ts
import { Icons, Images, Lotties } from '~/assets';
```

Nunca importe diretamente de subpastas (`~/assets/icons/ArrowLeft`).

### Uso de ícones

```tsx
import { useTheme } from '~/theme';
import { Icons } from '~/assets';

const { colors } = useTheme();

<Icons.ArrowLeft color={colors.neutralDark} width={20} height={20} />
<Icons.StarGradient color={colors.primaryBase} colorSecondary={colors.primaryLight} />
```

### Uso de imagens SVG

```tsx
import { Images } from '~/assets';

<Images.SplashLogo width={123} height={37} />
<Images.DiscoverLogo />
```

### Uso de imagens PNG

```tsx
import { Image } from 'react-native';
import { Images } from '~/assets';

<Image source={Images.DiscoverImageIntro} style={{ width: 300, height: 200 }} resizeMode="contain" />
```

---

## Conversão de SVG Puro para Componente TSX

Ao receber um arquivo `.svg` do designer, siga os passos:

1. **Abrir o SVG** no editor e copiar o conteúdo interno (elementos dentro de `<svg>`).
2. **Criar o arquivo** `.tsx` em `src/assets/icons/` ou `src/assets/images/` conforme o tipo.
3. **Substituir as tags HTML** pelos equivalentes `react-native-svg`:
   - `<svg>` → `<Svg>`
   - `<path>` → `<Path>`
   - `<circle>` → `<Circle>`
   - `<rect>` → `<Rect>`
   - `<g>` → `<G>`
   - `<defs>` → `<Defs>`
   - `<linearGradient>` → `<LinearGradient>`
   - `<stop>` → `<Stop>`
   - `<clipPath>` → `<ClipPath>`
4. **Para ícones:** Substituir todos os valores de `fill` hardcoded por `{color}`. Remover `fill` do `<Svg>` raiz.
5. **Para imagens/logos:** Manter os `fill` hardcoded. Usar `SvgProps` como tipo de props.
6. **Definir dimensões padrão** via `width` e `height` com valores do `viewBox`.
7. **Exportar** e registrar no `index.ts` correspondente em ordem alfabética.

### Atributos a remover do `<Svg>` raiz

- `xmlns` e `xmlns:xlink` (não necessários em React Native)
- `version`
- `id` (a menos que seja referenciado internamente)

### Atributos a preservar

- `viewBox`
- `fill="none"` no `<Svg>` raiz (quando o SVG original tiver)
- `fillRule`, `clipRule` nos elementos filhos

---

## Checklist para Adicionar um Novo Asset

### Ícone SVG

- [ ] Arquivo `.tsx` criado em `src/assets/icons/NomeDoIcone.tsx`
- [ ] Tipado com `IconPropsType`
- [ ] `color` passado para os `fill` dinâmicos
- [ ] Dimensões padrão definidas (`width`, `height`)
- [ ] Exportado em `src/assets/icons/index.ts` em ordem alfabética

### Imagem SVG

- [ ] Arquivo `.tsx` criado em `src/assets/images/NomeDaImagem.tsx`
- [ ] Tipado com `SvgProps`
- [ ] Cores hardcoded mantidas
- [ ] Exportado em `src/assets/images/index.ts` em ordem alfabética

### Imagem PNG/Raster

- [ ] Pasta `src/assets/images/NomeDaImagem/` criada
- [ ] Arquivo raster colocado dentro da pasta
- [ ] `index.ts` com `export default require('./arquivo.png')`
- [ ] Exportado em `src/assets/images/index.ts` em ordem alfabética

### Lottie

- [ ] Arquivo `.json` colocado em `src/assets/lotties/`
- [ ] Exportado em `src/assets/lotties/index.ts`
- [ ] `LottieView` com `autoPlay`, `ref`, `source={Lotties.Nome}` e `style` via `useViewStyles`

---

## Anti-Padrões

| Anti-padrão | Correto |
|---|---|
| `import ArrowLeft from '~/assets/icons/ArrowLeft'` | `import { Icons } from '~/assets'` |
| `fill="#000000"` hardcoded em ícone | `fill={color}` via prop |
| `color` como `string` em `IconPropsType` | `color` como `ColorValue` |
| Arquivo PNG importado diretamente sem subpasta | Pasta com `index.ts` e `require()` |
| Nova entrada fora de ordem alfabética no `index.ts` | Manter ordem alfabética sempre |
| `<img>` ou `<svg>` HTML em vez de `react-native-svg` | `<Svg>`, `<Path>`, etc. de `react-native-svg` |
