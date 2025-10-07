'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { nameSchema } from '@/schemas/common';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createRoleFormSchema = (tValidations: UseValidationsTranslationsResult) =>
  z.object({
    name: nameSchema(tValidations),
    description: z.string().trim().optional(),
    active: z.boolean(),
  });

export type RoleFormValues = z.output<ReturnType<typeof createRoleFormSchema>>;

interface RoleFormProps {
  defaultValues?: RoleFormValues;
  onSubmit: (values: RoleFormValues) => Promise<unknown>;
}

export default function RoleForm({ defaultValues, onSubmit }: RoleFormProps) {
  const tRoles = useTranslations('roles');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');
  const roleFormSchema = createRoleFormSchema(tValidations);

  const form = useForm({
    defaultValues: defaultValues ?? {
      name: '',
      description: undefined,
      active: true,
    },
    validators: {
      onSubmit: roleFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = roleFormSchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'role',
          error,
          tValidations,
        });
      }
    },
  });

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tRoles('form.title')}>
        <form.AppField name="name">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.name')}
              placeholder={tRoles('form.placeholders.name')}
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="description">
          {(field) => (
            <field.TextAreaInput
              label={tCommon('fields.description')}
              placeholder={tRoles('form.placeholders.description')}
            />
          )}
        </form.AppField>

        <form.AppField name="active">
          {(field) => <field.SwitchInput label={tCommon('fields.active')} />}
        </form.AppField>

        <FormFooter>
          <form.AppForm>
            <form.SubmitButton>
              {defaultValues
                ? tRoles('actions.update')
                : tRoles('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </FormLayout>
    </Form>
  );
}
