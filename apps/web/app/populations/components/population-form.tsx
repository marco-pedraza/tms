'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { UseTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createPopulationSchema = (tCommon: UseTranslationsResult) =>
  z.object({
    name: z.string().min(1, { message: tCommon('validations.required') }),
    code: z.string().min(1, { message: tCommon('validations.required') }),
    description: z.string().optional(),
    active: z.boolean(),
  });

export type PopulationFormValues = z.infer<
  ReturnType<typeof createPopulationSchema>
>;

interface PopulationFormProps {
  defaultValues?: PopulationFormValues;
  onSubmit: (values: PopulationFormValues) => Promise<unknown>;
}

/**
 * Form component for creating and editing populations
 */
export default function PopulationForm({
  defaultValues,
  onSubmit,
}: PopulationFormProps) {
  const tPopulations = useTranslations('populations');
  const tCommon = useTranslations('common');
  const populationSchema = createPopulationSchema(tCommon);
  const form = useForm({
    defaultValues: defaultValues ?? {
      name: '',
      code: '',
      description: '',
      active: true,
    },
    validators: {
      onChange: populationSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = populationSchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'population',
          error,
          tCommon,
        });
      }
    },
  });

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tPopulations('form.title')}>
        <form.AppField name="name">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.name')}
              placeholder={tPopulations('form.placeholders.name')}
            />
          )}
        </form.AppField>

        <form.AppField name="code">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.code')}
              placeholder={tPopulations('form.placeholders.code')}
            />
          )}
        </form.AppField>

        <form.AppField name="description">
          {(field) => (
            <field.TextAreaInput
              label={tCommon('fields.description')}
              placeholder={tPopulations('form.placeholders.description')}
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
                ? tPopulations('actions.update')
                : tPopulations('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </FormLayout>
    </Form>
  );
}
