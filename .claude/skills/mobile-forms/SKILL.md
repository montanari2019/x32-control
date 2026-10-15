---
name: mobile-forms
description: Mobile Template form handling patterns using react-final-form, wrapForm, wrapField, field components, validation, and masks. Use when creating or modifying forms and list screens.
---

# Mobile Template - Forms & Lists

## Form System

The project uses **`react-final-form`** for form state management.

## wrapForm

Use `wrapForm` from `~/components/Form` to wrap screen-level form components:

```tsx
import { wrapForm, OnSubmitFormType } from '~/components/Form';
import withPropsInjection from '~/hoc/withPropsInjection';
import myHttpServiceInstance, { MyHttpService } from '~/http/MyHttpService';

type MyFormScreenPropsType = {
  myHttpService: MyHttpService;
};

type FormValuesType = {
  email: string;
  password: string;
};

const MyFormScreen = wrapForm<MyFormScreenPropsType, FormValuesType>(
  ({ handleSubmit, submitting, form, myHttpService }) => {
    const handleConfirm: OnSubmitFormType<FormValuesType> = useCallback(async (values) => {
      // submit logic
    }, []);

    return (
      <Container fillParent>
        <InputText.Field name="email" required validate={validateEmail} />
        <Button onPress={handleSubmit(handleConfirm)} loading={submitting}>
          Submit
        </Button>
      </Container>
    );
  },
);

export default withPropsInjection(MyFormScreen, {
  myHttpService: myHttpServiceInstance,
});
```

- `handleSubmit` is a **curried function** — `handleSubmit(submitCallback)` returns a function to call.
- `form` provides access to `form.initialize()`, `form.change()`, `form.batch()`, `form.getState()`, etc.

## wrapField

Form components follow a dual-use pattern:
1. **Standalone**: Used directly with `onChange`/`value` props.
2. **Field-wrapped**: Used with `react-final-form` via the `.Field` static property.

Use `wrapField` from `~/components/Form/wrapField` to connect input components to form state:

```tsx
import { wrapField, getFieldErrorState } from '~/components/Form';

const InputText = ({ value, onChange, ...props }: InputTextPropsType) => (
  // ... component implementation
);

InputText.Field = wrapField<InputTextPropsType>((props, fieldProps) => {
  const { invalid, touched, error, submitError, value, onChange, onBlur, onFocus } = fieldProps;
  const { showError, message } = getFieldErrorState(invalid, touched, error, submitError, props.help);
  return <InputText {...props} value={value} onChange={onChange} error={showError} help={message} />;
});
```

## Available Field Components

### InputText.Field
```tsx
import InputText from '~/components/InputText';
import validateEmail from '~/utils/validators/validateEmail';

<InputText.Field
  name="email"
  placeholder="E-mail"
  keyboardType="email-address"
  autoCapitalize="none"
  autoCorrect={false}
  required
  validate={validateEmail}
/>

<InputText.Field
  name="password"
  placeholder="Senha"
  secureTextEntry
  required
  validate={validateNotEmpty}
/>
```

### InputDate.Field
```tsx
import InputDate from '~/components/InputDate';
import validateBirthdate from '~/utils/validators/validateBirthdate';

<InputDate.Field
  required
  validate={validateBirthdate}
  name="birthdate"
  placeholder="Data de Nascimento"
  datePicker
/>
```

### InputSelect.Field
For select inputs with async data loading:
```tsx
import InputSelect from '~/components/InputSelect';
import { InputSelectResponseType, InputSelectValueType } from '~/components/InputSelect/utils';

// Define requestRecords callback
const requestRecords = useCallback(async (): Promise<InputSelectResponseType<ItemType>> => {
  const response = await httpService.getItems();
  if (isResponseError(response)) {
    showCommonErrors(showModal, response.error);
    return { canLoadMore: false, result: [] };
  }
  return { canLoadMore: false, result: response.data };
}, [httpService, showModal]);

// Define mapRecord callback
const mapRecord = useCallback((item: ItemType): InputSelectValueType<ItemType> => ({
  label: item.name,
  key: item.id.toString(),
  item,
}), []);

<InputSelect.Field
  required
  name="people"
  placeholder="Selecione uma pessoa"
  requestRecords={requestRecords}
  mapRecord={mapRecord}
  validate={validateNotEmpty}
/>
```

For static options without async loading:
```tsx
const requestOptions = useCallback((): InputSelectResponseType<string> => ({
  canLoadMore: false,
  result: ['iOS', 'Android', 'Windows', 'Linux'],
}), []);

const mapOption = useCallback((item: string): InputSelectValueType<string> => ({
  label: item,
  key: item,
  item,
}), []);

<InputSelect.Field
  name="system"
  placeholder="Selecione o sistema"
  requestRecords={requestOptions}
  mapRecord={mapOption}
/>
```

### InputCep.Field
CEP input with auto-fill support:
```tsx
import InputCep from '~/components/InputCep';
import validateCep from '~/utils/validators/validateCep';

<InputCep.Field
  name="cep"
  placeholder="CEP"
  required
  validate={validateCep}
  httpService={addressHttpService}
  onRequestSuccess={handleRequestCepSuccess}
  onRequestError={handleRequestCepError}
/>
```

### RadioGroup.Field
```tsx
import RadioGroup from '~/components/RadioGroup';
import { RadioOptionType } from '~/components/RadioGroup/utils';

const OPTIONS: RadioOptionType<null>[] = [
  { key: 'M', label: 'Masculino', item: null },
  { key: 'F', label: 'Feminino', item: null },
];

<RadioGroup.Field name="gender" options={OPTIONS} vertical />
```

### Checkbox.Field and Switch.Field
```tsx
import Checkbox from '~/components/Checkbox';
import Switch from '~/components/Switch';

<Checkbox.Field name="accept" label="Aceito os termos" required />
<Switch.Field name="enabled" label="Ativar notificações" />
```

### InputOtp.Field
```tsx
import InputOtp from '~/components/InputOtp';

<InputOtp.Field name="token" />
```

## Validation

Use pre-built validators from `~/utils/validators/`:

| Validator | Description |
|-----------|-------------|
| `validateNotEmpty` | Checks if value is non-empty |
| `validateEmail` | E-mail format validation |
| `validateCpf` | CPF validation (format + check digit) |
| `validateCep` | CEP format validation |
| `validateBirthdate` | Birthdate validation |
| `validateMobilePhone` | Mobile phone format validation |

Validators return `undefined` on success or an error message string:
```ts
const validateNotEmpty = <T>(value: T) => {
  // validation logic
  return valid ? undefined : 'Campo obrigatório.';
};
```

If you need a new validation rule, add it to `~/utils/validators/` and reuse it across the project.

## Masks

Use mask utilities from `~/utils/masks/`:

```ts
import maskCpf from '~/utils/masks/maskCpf';
import maskCep from '~/utils/masks/maskCep';
import maskMobilePhone from '~/utils/masks/maskMobilePhone';

// Format: raw value → formatted display
maskCpf.format('12345678909'); // '123.456.789-09'

// Parse: formatted display → raw value
maskCpf.parse('123.456.789-09'); // '12345678909'
```

Create new masks using `createMaskFactory` from `~/utils/masks/factory`:
```ts
import { createMaskFactory } from '~/utils/masks/factory';

const maskCpf = createMaskFactory({ mask: '000.000.000-00' });
export default maskCpf;
```

## List Screen Pattern with usePagination

For paginated list screens, use the `usePagination` hook:

```tsx
import DefaultList from '~/components/DefaultList';
import usePagination, { PaginationRequestArgsType } from '~/hooks/usePagination';

type ParametersType = { search?: string };

const ListScreen = ({ httpService }: ListScreenPropsType) => {
  const showModal = useModal();

  const fetchItems = useCallback(async ({
    page, dataSource, parameters,
  }: PaginationRequestArgsType<ItemType, ParametersType>) => {
    const response = await httpService.getItems(page, PAGE_SIZE, parameters?.search);

    if (isResponseError(response)) {
      showCommonErrors(showModal, response.error);
      return { ok: false };
    }

    return {
      dataSource: dataSource.concat(response.data),
      ok: true,
      canLoadMore: response.data.length > 0,
    };
  }, [httpService, showModal]);

  const {
    dataSource, doRefresh, loadingMore, refreshing, doLoadMore,
  } = usePagination<ItemType, ParametersType>({
    requestDataSource: fetchItems,
  });

  useDidMount(() => { doRefresh(); });

  const renderItem = useCallback(({ item }: ListRenderItemInfo<ItemType>) => (
    <Container padding={theme.spacings.sMedium}>
      <Text>{item.name}</Text>
    </Container>
  ), [theme]);

  const keyExtractor = useCallback((item: ItemType) => item.id.toString(), []);

  return (
    <Container variant="safeAreaView" fillParent>
      <Header title="Listagem" />
      <DefaultList<ItemType>
        data={dataSource}
        refreshing={refreshing}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        loadingMore={loadingMore}
        onEndReached={doLoadMore}
        onRefresh={doRefresh}
        ListEmptyComponent={<Text>Nenhum item encontrado.</Text>}
      />
    </Container>
  );
};

export default withPropsInjection(ListScreen, {
  httpService: httpServiceInstance,
});
```

### usePagination API

```tsx
const {
  dataSource,       // Current list data
  doRefresh,        // Refresh (resets to page 1), accepts optional parameters
  doLoadMore,       // Load next page
  refreshing,       // Is refreshing
  loadingMore,      // Is loading more
  clearDataSource,  // Clear all data
} = usePagination<ItemType, ParametersType>({
  requestDataSource: fetchCallback,
});
```

### DefaultList Component

Wraps `FlatList`/`SectionList` with pagination support:

```tsx
<DefaultList<ItemType>
  data={dataSource}
  refreshing={refreshing}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  loadingMore={loadingMore}
  onEndReached={doLoadMore}
  onRefresh={doRefresh}
  contentContainerStyle={containerStyles}
  ListEmptyComponent={emptyComponent}
  ItemSeparatorComponent={separatorComponent}
  endListMessage="Fim da lista"
  variant="flat"  // 'flat' | 'section'
/>
```
