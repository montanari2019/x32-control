---
name: 'web-forms'
description: 'Web form handling patterns, including form state, validation, practices, and integration with HTTP services. Use when creating or refactoring forms.'
---

# Web Template - Forms

## Create/Edit Pages

- For create/edit entities pages, use the `CreateUpdatePage` pattern. This page should handle both creating and editing an entity based on the presence of an `id` parameter in the route.
- Use `useParams` from `react-router-dom` to get the `id` parameter and determine if the page is in create or edit mode.
- Use `useDidMount` to fetch existing entity data when in edit mode and populate the form fields.
- Use `wrapForm` from `~/components/Form/wrapForm` to wrap the page component and handle form state and validation.
- Examples in the bottom of this file.

## Available Field Components

- `InputText.Field`: for free text inputs. Always validate free text inputs, with length limits considering the backend database limits, and any specific format requirements (e.g., email, phone).
```tsx
import { InputText } from '~/components/InputText';
import { validateCpf } from '~/utils/validators';
import { maskCpf } from '~/utils/masks';

<InputText.Field
  required
  name="cpf"
  label="CPF"
  placeholder="Digite o CPF"
  validate={validateCpf}
  parse={maskCpf.parse}
  format={maskCpf.format}
  maxLength={14}
/>
```


- `InputSearch.Field`: for inputs that require searching with services. Create a `requestDataSource` function in `~/utils/requestDataSources/` following the patterns to provide search results.
```tsx
import { InputSearch } from '~/components/InputSearch';
import { validateNotEmpty } from '~/utils/validators';
import { requestUsersDataSource } from '~/utils/requestDataSources/users';

<InputSearch.Field
  required
  name="search"
  label="Pesquisar no banco de dados"
  placeholder="Digite o termo de busca"
  requestDataSource={requestUsersDataSource}
  allowClear
  validate={validateNotEmpty}
/>
```

- `InputSelect.Field`: for select inputs with predefined options. Use the `options` prop to provide the select options, and consider using `InputSearch` for dynamic options.
```tsx
const SELECT_OPTIONS: InputSelectOptionType<SelectItemType>[] = [
  {
    value: '1',
    label: 'John Doe',
    item: {
      name: 'John Doe',
      age: 32,
      id: 1,
    },
  },
  {
    value: '2',
    label: 'Mary Ane',
    item: {
      name: 'Mary Ane',
      age: 28,
      id: 2,
    },
  },
  {
    value: '3',
    label: 'Jerry Andrew',
    item: {
      name: 'Jerry Andrew',
      age: 45,
      id: 3,
    },
  },
];

<InputSelect.Field
  required
  name="select"
  label="Select sem busca no banco de dados"
  placeholder="Selecione a pessoa"
  options={SELECT_OPTIONS}
  allowClear
  validate={validateNotEmpty}
/>
```

- `InputDate.Field`: for date inputs. Use parsers and formatters from `~/utils/parsers` for date formatting and transformations.
```tsx
import { InputDate } from '~/components/InputDate';
import { validateBirthdate } from '~/utils/validators';

<InputDate.Field
  required
  name="birthDate"
  label="Data de nascimento"
  placeholder="Selecione a data de nascimento"
  validate={validateBirthdate}
/>
```

- `InputTextArea.Field`: for multi-line text inputs. Similar to `InputText` but with a larger input area.
```tsx
import { InputTextArea } from '~/components/InputTextArea';
import { validateNotEmpty } from '~/utils/validators';

<InputTextArea.Field
  required
  name="description"
  label="Descrição"
  placeholder="Digite a descrição"
  maxLength={500}
  showCount // Shows character count and limit
  validate={validateNotEmpty}
/>
```

### Fields Validation

- You can search pre-build validators in `~/utils/validators`. If you need a new validation rule, add it to `validators` and reuse it across the project.
- Always validate fields according to the backend requirements and business rules.

### Masking and Parsing
- Use parsers and formatters from `~/utils/parsers` for input value transformations (e.g., date formatting, number parsing) and `~/utils/masks` for input masks.
- Apply masks and parsers in the field components to ensure consistent formatting and data handling.

### Example — Create/Edit Page with `wrapForm`

```tsx
import { useCallback } from 'react';

import { OnChange } from 'react-final-form-listeners';
import { useNavigate, useParams } from 'react-router-dom';

import Button from '~/components/Button';
import Col from '~/components/Col';
import Container from '~/components/Container';
import Divider from '~/components/Divider';
import FormLayout from '~/components/Form/FormLayout';
import wrapForm, { OnSubmitFormType } from '~/components/Form/wrapForm';
import InputPassword from '~/components/InputPassword';
import InputSelect, { InputSelectOptionType } from '~/components/InputSelect';
import InputSwitch from '~/components/InputSwitch';
import InputText from '~/components/InputText';
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
import validateEmail from '~/utils/validators/validateEmail';
import {
  validateConfirmPassword,
  validatePassword,
} from '~/utils/validators/validatePassword';

import usersHttpServiceInstance, {
  UsersHttpService,
} from '../../http/UsersHttpService';
import { UserRoleEnum, UsersListItemType } from '../../http/UsersHttpService/types';

const validateNameAmount = createCharactersAmountValidation(3, 100);

type UsersCreateUpdatePagePropsType = {
  registerUserHttpService: UsersHttpService;
};

type FormValuesType = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: InputSelectOptionType<null, UserRoleEnum>;
  confirmed_account: boolean;
  status: boolean;
};

const ROLE_OPTIONS: InputSelectOptionType<null, UserRoleEnum>[] = [
  {
    value: UserRoleEnum.ADMIN,
    label: 'Administrador',
    item: null,
  },
  {
    value: UserRoleEnum.CUSTOMER,
    label: 'Cliente',
    item: null,
  },
];

const UsersCreateUpdatePage = wrapForm<
UsersCreateUpdatePagePropsType,
FormValuesType
>(
  ({
    handleSubmit,
    hasValidationErrors,
    submitting,
    registerUserHttpService,
    form,
  }) => {
    const { spacings } = useTheme();
    const navigate = useNavigate();
    const userId = useParams()?.id;
    const {
      initialize, getState, resetFieldState,
    } = form;
    const { values: formValues } = getState();
    const {
      password: passwordValue,
      confirmPassword: confirmPasswordValue,
    } = formValues;

    const handleOnBack = useCallback(() => {
      navigate('/app/usuarios');
    }, [navigate]);

    const onFinish = useCallback(() => {
      toast.success(
        userId
          ? 'Usuário editado com sucesso!'
          : 'Usuário cadastrado com sucesso!',
      );
      handleOnBack();
    }, [handleOnBack, userId]);

    const initializeFormValues = useCallback(
      (values: UsersListItemType) => {
        initialize({
          name: values.name,
          email: values.email,
          role: ROLE_OPTIONS.find(option => option.value === values.role),
          confirmed_account: values.confirmed_account,
          status: values.active,
        });
      },
      [initialize],
    );

    const handleSubmitForm: OnSubmitFormType<FormValuesType> = useCallback(
      async values => {
        if (userId) {
          const response = await registerUserHttpService.updateUser(
            Number(userId),
            {
              name: values.name,
              email: values.email,
              password: values.password,
              role: values.role.value,
              active: values.status,
            },
          );

          if (isResponseError(response)) {
            showCommonErrors(response.error);
            return;
          }

          onFinish();
          return;
        }

        const response = await registerUserHttpService.createUser({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role.value,
        });

        if (isResponseError(response)) {
          showCommonErrors(response.error);
          return;
        }

        onFinish();
      },
      [onFinish, registerUserHttpService, userId],
    );

    const { call: requestUser, loading } = useAsync(async () => {
      const response = await registerUserHttpService.getUser(Number(userId));

      if (isResponseError(response)) {
        showCommonErrors(response.error);
        return;
      }

      initializeFormValues(response.data);
    }, [initializeFormValues, registerUserHttpService, userId]);

    const handlePasswordChange = useCallback((actualPassword: string | undefined) => {
      if (userId && !actualPassword && !confirmPasswordValue) {
        setTimeout(() => { resetFieldState('password'); }, 0);
      }
    }, [resetFieldState, userId, confirmPasswordValue]);

    const handleConfirmPasswordChange = useCallback((actualConfirmPassword: string | undefined) => {
      if (userId && !actualConfirmPassword && !passwordValue) {
        setTimeout(() => { resetFieldState('confirmPassword'); }, 0);
      }
    }, [resetFieldState, userId, passwordValue]);

    useDidMount(() => {
      if (userId) requestUser();
    });

    return (
      <ContentPage
        title={userId ? 'Edição de usuário' : 'Criação de usuário'}
        onBack={handleOnBack}
      >
        <FormLayout onSubmit={handleSubmit(handleSubmitForm)}>
          <LoadingContainer
            label="Carregando..."
            loading={loading}
            testId="loading-container"
          >
            <Row gutter={spacings.sXXS}>
              <Col xxl={12} md={24}>
                <InputText.Field
                  name="name"
                  label="Nome"
                  required
                  validate={validateNameAmount}
                  placeholder="Digite seu nome"
                />
              </Col>
              <Col xxl={12} md={24}>
                <InputText.Field
                  name="email"
                  label="E-mail"
                  required
                  validate={validateEmail}
                  placeholder="Digite seu e-mail"
                />
              </Col>
              <Col xxl={12} md={24}>
                <InputPassword.Field
                  label="Senha"
                  name="password"
                  placeholder="Digite sua senha"
                  validate={validatePassword}
                  disabled={submitting}
                  autoComplete="new-password"
                  required={Boolean(!userId || confirmPasswordValue)}
                />
                <OnChange name="password">
                  {handlePasswordChange}
                </OnChange>
              </Col>
              <Col xxl={12} md={24}>
                <InputPassword.Field
                  label="Confirme sua senha"
                  name="confirmPassword"
                  placeholder="Confirme sua senha"
                  validate={validateConfirmPassword}
                  disabled={submitting}
                  autoComplete="confirm-new-password"
                  required={Boolean(!userId || passwordValue)}
                />
                <OnChange name="confirmPassword">
                  {handleConfirmPasswordChange}
                </OnChange>
              </Col>
              <Col xxl={12} md={24}>
                <InputSelect.Field
                  name="role"
                  label="Perfil"
                  required
                  options={ROLE_OPTIONS}
                  placeholder="Selecione o perfil"
                  disabled={submitting}
                />
              </Col>
              {userId ? (
                <Col>
                  <InputSwitch.Field
                    label="Status"
                    name="status"
                    disabled={submitting}
                    checkedChildren="Ativo"
                    unCheckedChildren="Inativo"
                  />
                </Col>
              ) : null}
            </Row>
            <Divider />
            <Container gap={spacings.sXXS} justifyContent="flex-end" horizontal>
              <Button
                onClick={handleOnBack}
              >
                Cancelar
              </Button>
              <Button htmlType="submit" disabled={hasValidationErrors} loading={submitting} type="primary">
                Salvar
              </Button>
            </Container>
          </LoadingContainer>
        </FormLayout>
      </ContentPage>
    );
  },
);

export default withPropsInjection(UsersCreateUpdatePage, {
  registerUserHttpService: usersHttpServiceInstance,
});
```