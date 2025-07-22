'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { UseTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createCountryFormSchema = (tCommon: UseTranslationsResult) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: tCommon('validations.required') })
      .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, {
        message: tCommon('validations.name.letters'),
      }),
    code: z
      .string()
      .min(2, {
        // @todo Temporal fix to avoid posibble infinite inference loop.
        // Wee need to understand better why this is happening and find a better solution.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message: (tCommon as any)('validations.code.length', { length: 2 }),
      })
      .max(2)
      .regex(/^[A-Z]+$/, { message: tCommon('validations.code.uppercase') }),
    active: z.boolean(),
  });

export type CountryFormValues = z.infer<
  ReturnType<typeof createCountryFormSchema>
>;

interface CountryFormProps {
  defaultValues?: CountryFormValues;
  onSubmit: (values: CountryFormValues) => Promise<unknown>;
}

export default function CountryForm({
  defaultValues,
  onSubmit,
}: CountryFormProps) {
  const tCountries = useTranslations('countries');
  const tCommon = useTranslations('common');

  const form = useForm({
    defaultValues: defaultValues ?? {
      name: '',
      code: '',
      active: true,
    },
    validators: {
      onChange: createCountryFormSchema(tCommon),
    },
    onSubmit: async (values) => {
      try {
        await onSubmit(values.value);
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'country',
          error,
          tCommon,
        });
      }
    },
  });

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tCountries('form.title')}>
        <form.AppField name="name">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.name')}
              placeholder={tCountries('form.placeholders.name')}
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="code">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.code')}
              placeholder={tCountries('form.placeholders.code')}
              isRequired
              maxLength={2}
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
                ? tCountries('actions.update')
                : tCountries('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </FormLayout>
    </Form>
  );
}
