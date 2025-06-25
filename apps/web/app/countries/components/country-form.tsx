'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { UseTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createCountryFormSchema = (tCommon: UseTranslationsResult) =>
  z.object({
    name: z.string().min(1, { message: tCommon('validations.required') }),
    code: z
      .string()
      .min(2, { message: tCommon('validations.code.length', { length: 2 }) })
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
      active: false,
    },
    validators: {
      onChange: createCountryFormSchema(tCommon),
    },
    onSubmit: async (values) => {
      try {
        await onSubmit(values.value);
      } catch (error: unknown) {
        // @ts-expect-error - form param is not typed correctly.
        injectTranslatedErrorsToForm(form, error, tCommon);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <FormLayout title={tCountries('form.title')}>
        <form.AppField name="name">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.name')}
              placeholder={tCountries('form.placeholders.name')}
            />
          )}
        </form.AppField>

        <form.AppField name="code">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.code')}
              placeholder={tCountries('form.placeholders.code')}
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
    </form>
  );
}
