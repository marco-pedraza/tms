'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { codeSchema, nameSchema } from '@/schemas/common';

const countryFormSchema = z.object({
  name: nameSchema,
  code: codeSchema(2, 2),
  active: z.boolean(),
});

export type CountryFormValues = z.infer<typeof countryFormSchema>;

interface CountryFormProps {
  defaultValues?: CountryFormValues;
  onSubmit: (values: CountryFormValues) => void;
}

function CountryForm({ defaultValues, onSubmit }: CountryFormProps) {
  const tCountries = useTranslations('countries');
  const tCommon = useTranslations('common');

  const form = useForm({
    defaultValues: defaultValues ?? {
      name: '',
      code: '',
      active: false,
    },
    validators: {
      onChange: countryFormSchema,
    },
    onSubmit: (values) => {
      onSubmit(values.value);
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

export default CountryForm;
