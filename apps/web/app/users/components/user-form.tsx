'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import useQueryAllRoles from '@/app/roles/hooks/use-query-all-roles';
import useQueryAllDepartments from '@/app/users/hooks/use-query-all-departments';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { nameSchema } from '@/schemas/common';
import { optionalPhoneSchema } from '@/schemas/contact';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createUserFormSchema = (
  tValidations: UseValidationsTranslationsResult,
  isEditMode = false,
) =>
  z.object({
    departmentId: z
      .string()
      .min(1, tValidations('required'))
      .transform((val) => parseInt(val)),
    username: isEditMode
      ? z.string().optional()
      : z
          .string()
          .trim()
          .min(3, {
            message: tValidations('username.minLength', { length: 3 }),
          })
          .max(20, {
            message: tValidations('username.maxLength', { length: 20 }),
          })
          .regex(/^[a-zA-Z0-9._-]+$/, {
            message: tValidations('username.format'),
          }),
    email: z
      .email(tValidations('email.invalid'))
      .trim()
      .min(1, { message: tValidations('required') }),
    password: isEditMode
      ? z.string().optional()
      : z.string().min(8, {
          message: tValidations('password.minLength', { length: 8 }),
        }),
    firstName: nameSchema(tValidations),
    lastName: nameSchema(tValidations),
    position: z.string().trim().optional(),
    employeeId: z.string().trim().optional(),
    phone: optionalPhoneSchema(tValidations),
    roleIds: z.array(z.number()).optional(),
    active: z.boolean(),
  });

export type UserFormValues = z.output<ReturnType<typeof createUserFormSchema>>;
type UserFormRawValues = z.input<ReturnType<typeof createUserFormSchema>>;

interface UserFormProps {
  defaultValues?: UserFormValues;
  onSubmit: (values: UserFormValues) => Promise<unknown>;
}

export default function UserForm({ defaultValues, onSubmit }: UserFormProps) {
  const tUsers = useTranslations('users');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');
  const isEditMode = !!defaultValues;
  const rawDefaultValues: UserFormRawValues | undefined = defaultValues
    ? {
        ...defaultValues,
        departmentId: defaultValues.departmentId?.toString() || '',
        phone: defaultValues.phone ?? '',
        roleIds: defaultValues.roleIds || [],
      }
    : undefined;
  const userFormSchema = createUserFormSchema(tValidations, isEditMode);
  const { data: departmentsData } = useQueryAllDepartments();
  const { data: rolesData } = useQueryAllRoles();
  const departments = departmentsData?.departments || [];
  const roles = rolesData?.data || [];
  const form = useForm({
    defaultValues: rawDefaultValues ?? {
      departmentId: '',
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      position: '',
      employeeId: '',
      phone: '',
      roleIds: [],
      active: true,
    },
    validators: {
      onSubmit: userFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = userFormSchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'user',
          error,
          tValidations,
        });
      }
    },
  });

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tUsers('form.title')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form.AppField name="firstName">
            {(field) => (
              <field.TextInput
                label={tCommon('fields.firstName')}
                placeholder={tUsers('form.placeholders.firstName')}
                isRequired
              />
            )}
          </form.AppField>

          <form.AppField name="lastName">
            {(field) => (
              <field.TextInput
                label={tCommon('fields.lastName')}
                placeholder={tUsers('form.placeholders.lastName')}
                isRequired
              />
            )}
          </form.AppField>

          {!defaultValues ? (
            <form.AppField name="username">
              {(field) => (
                <field.TextInput
                  label={tUsers('fields.username')}
                  placeholder={tUsers('form.placeholders.username')}
                  isRequired
                />
              )}
            </form.AppField>
          ) : (
            <div></div>
          )}

          {!defaultValues ? (
            <form.AppField name="password">
              {(field) => (
                <field.TextInput
                  type="password"
                  label={tUsers('fields.password')}
                  placeholder={tUsers('form.placeholders.password')}
                  isRequired
                />
              )}
            </form.AppField>
          ) : (
            <div></div>
          )}

          <form.AppField name="departmentId">
            {(field) => (
              <field.SelectInput
                label={tUsers('fields.department')}
                placeholder={tUsers('form.placeholders.department')}
                isRequired
                items={departments.map((dept) => ({
                  id: dept.id.toString(),
                  name: dept.name,
                }))}
                emptyOptionsLabel={tUsers(
                  'form.placeholders.emptyDepartmentsList',
                )}
              />
            )}
          </form.AppField>

          <form.AppField name="email">
            {(field) => (
              <field.TextInput
                type="email"
                label={tCommon('fields.email')}
                placeholder={tUsers('form.placeholders.email')}
                isRequired
              />
            )}
          </form.AppField>

          <form.AppField name="position">
            {(field) => (
              <field.TextInput
                label={tUsers('fields.position')}
                placeholder={tUsers('form.placeholders.position')}
              />
            )}
          </form.AppField>

          <form.AppField name="employeeId">
            {(field) => (
              <field.TextInput
                label={tUsers('fields.employeeId')}
                placeholder={tUsers('form.placeholders.employeeId')}
              />
            )}
          </form.AppField>

          <form.AppField name="phone">
            {(field) => (
              <field.TextInput
                type="tel"
                label={tCommon('fields.phone')}
                placeholder={tUsers('form.placeholders.phone')}
              />
            )}
          </form.AppField>
        </div>

        <div className="space-y-4">
          <form.AppField name="roleIds">
            {(field) => (
              <field.MultiSelectInput
                label={tUsers('fields.roles')}
                placeholder={tUsers('form.placeholders.roles')}
                items={roles.map((role) => ({
                  id: role.id.toString(),
                  name: role.name,
                }))}
                emptyOptionsLabel={tUsers('form.placeholders.emptyRolesList')}
              />
            )}
          </form.AppField>

          <form.AppField name="active">
            {(field) => <field.SwitchInput label={tCommon('fields.active')} />}
          </form.AppField>
        </div>

        <FormFooter>
          <form.AppForm>
            <form.SubmitButton>
              {defaultValues
                ? tUsers('actions.update')
                : tUsers('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </FormLayout>
    </Form>
  );
}
