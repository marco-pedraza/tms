'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createTechnologyFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') }),
    description: z.string().trim().optional(),
    provider: z.string().trim().optional(),
    version: z.string().trim().optional(),
    active: z.boolean().default(true),
  });

export type TechnologyFormValues = z.output<
  ReturnType<typeof createTechnologyFormSchema>
>;

type TechnologyFormRawValues = z.input<
  ReturnType<typeof createTechnologyFormSchema>
>;

interface TechnologyFormProps {
  defaultValues?: TechnologyFormValues;
  onSubmit: (values: TechnologyFormValues) => Promise<unknown>;
}

export default function TechnologyForm({
  defaultValues,
  onSubmit,
}: TechnologyFormProps) {
  const tTechnologies = useTranslations('technologies');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');
  const technologySchema = createTechnologyFormSchema(tValidations);

  const rawDefaultValues: TechnologyFormRawValues = defaultValues
    ? {
        ...defaultValues,
        name: defaultValues.name || '',
        description: defaultValues.description || '',
        provider: defaultValues.provider || '',
        version: defaultValues.version || '',
        active: defaultValues.active,
      }
    : {
        name: '',
        description: '',
        provider: '',
        version: '',
        active: true,
      };

  const form = useForm({
    defaultValues: rawDefaultValues,
    validators: {
      onChange: technologySchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = technologySchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'technology',
          error,
          tValidations,
          tCommon,
        });
      }
    },
  });

  return (
    <div className="max-w-7xl">
      <Form onSubmit={form.handleSubmit}>
        <FormLayout title={tTechnologies('form.title')}>
          <form.AppField name="name">
            {(field) => (
              <field.TextInput
                label={tTechnologies('fields.name')}
                placeholder={tTechnologies('form.placeholders.name')}
                isRequired
              />
            )}
          </form.AppField>

          <form.AppField name="description">
            {(field) => (
              <field.TextAreaInput
                label={tCommon('fields.description')}
                placeholder={tTechnologies('form.placeholders.description')}
              />
            )}
          </form.AppField>

          <form.AppField name="provider">
            {(field) => (
              <field.TextInput
                label={tTechnologies('fields.provider')}
                placeholder={tTechnologies('form.placeholders.provider')}
              />
            )}
          </form.AppField>
          <form.AppField name="version">
            {(field) => (
              <field.TextInput
                label={tTechnologies('fields.version')}
                placeholder={tTechnologies('form.placeholders.version')}
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
                  ? tTechnologies('actions.update')
                  : tTechnologies('actions.create')}
              </form.SubmitButton>
            </form.AppForm>
          </FormFooter>
        </FormLayout>
      </Form>
    </div>
  );
}
