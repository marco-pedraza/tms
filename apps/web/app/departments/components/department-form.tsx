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

const createDepartmentFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    name: nameSchema(tValidations).min(
      2,
      tValidations('minLength', { length: 2 }),
    ),
    code: z
      .string()
      .trim()
      .min(2, tValidations('minLength', { length: 2 }))
      .regex(/^[a-zA-Z0-9-]+$/, {
        message: tValidations('code.alphanumeric'),
      }),
    description: z.string().trim().optional(),
    isActive: z.boolean(),
  });

export type DepartmentFormValues = z.output<
  ReturnType<typeof createDepartmentFormSchema>
>;

interface DepartmentFormProps {
  defaultValues?: DepartmentFormValues;
  onSubmit: (values: DepartmentFormValues) => Promise<unknown>;
}

export default function DepartmentForm({
  defaultValues,
  onSubmit,
}: DepartmentFormProps) {
  const tDepartments = useTranslations('departments');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');
  const departmentFormSchema = createDepartmentFormSchema(tValidations);

  const form = useForm({
    defaultValues: defaultValues ?? {
      name: '',
      code: '',
      description: undefined,
      isActive: true,
    },
    validators: {
      onSubmit: departmentFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'department',
          error,
          tValidations,
          tCommon,
        });
      }
    },
  });

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tDepartments('form.title')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form.AppField name="name">
            {(field) => (
              <field.TextInput
                label={tCommon('fields.name')}
                placeholder={tDepartments('form.placeholders.name')}
                isRequired
              />
            )}
          </form.AppField>

          <form.AppField name="code">
            {(field) => (
              <field.TextInput
                label={tDepartments('fields.code')}
                placeholder={tDepartments('form.placeholders.code')}
                isRequired
              />
            )}
          </form.AppField>
        </div>

        <form.AppField name="description">
          {(field) => (
            <field.TextAreaInput
              label={tCommon('fields.description')}
              placeholder={tDepartments('form.placeholders.description')}
            />
          )}
        </form.AppField>

        <form.AppField name="isActive">
          {(field) => <field.SwitchInput label={tCommon('fields.active')} />}
        </form.AppField>

        <FormFooter>
          <form.AppForm>
            <form.SubmitButton>
              {defaultValues
                ? tDepartments('actions.update')
                : tDepartments('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </FormLayout>
    </Form>
  );
}
