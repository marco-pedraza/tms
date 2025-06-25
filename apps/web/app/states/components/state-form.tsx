'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import type { countries } from '@repo/ims-client';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useQueryAllCountries from '@/countries/hooks/use-query-all-countries';
import useForm from '@/hooks/use-form';
import { UseTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

type Country = countries.Country;

const createStateFormSchema = (tCommon: UseTranslationsResult) =>
  z.object({
    name: z.string().min(1, { message: tCommon('validations.required') }),
    code: z
      .string()
      .min(2, {
        message: tCommon('validations.code.length-range', { min: 2, max: 3 }),
      })
      .max(3)
      .regex(/^[A-Z]+$/, { message: tCommon('validations.code.uppercase') }),
    countryId: z
      .string()
      .min(1, tCommon('validations.required'))
      .transform((val) => parseInt(val)),
    active: z.boolean(),
  });

export type StateFormValues = z.output<
  ReturnType<typeof createStateFormSchema>
>;
type StateFormRawValues = z.input<ReturnType<typeof createStateFormSchema>>;

interface StateFormProps {
  defaultValues?: StateFormValues;
  onSubmit: (values: StateFormValues) => Promise<unknown>;
}

export default function StateForm({ defaultValues, onSubmit }: StateFormProps) {
  const tStates = useTranslations('states');
  const tCommon = useTranslations('common');
  const stateFormSchema = createStateFormSchema(tCommon);
  const rawDefaultValues: StateFormRawValues | undefined = defaultValues
    ? {
        ...defaultValues,
        countryId: defaultValues.countryId?.toString() || '',
      }
    : undefined;
  const form = useForm({
    defaultValues: rawDefaultValues ?? {
      name: '',
      code: '',
      active: true,
      countryId: '',
    },
    validators: {
      onChange: stateFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = stateFormSchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'state',
          error,
          tCommon,
        });
      }
    },
  });
  const { data: countriesData } = useQueryAllCountries();

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tStates('form.title')}>
        <form.AppField name="name">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.name')}
              placeholder={tStates('form.placeholders.name')}
            />
          )}
        </form.AppField>

        <form.AppField name="code">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.code')}
              placeholder={tStates('form.placeholders.code')}
              description={tStates('form.codeHelp')}
              maxLength={3}
            />
          )}
        </form.AppField>

        <form.AppField name="countryId">
          {(field) => (
            <field.SelectInput
              label={tStates('form.country')}
              placeholder={tStates('form.placeholders.country')}
              items={
                countriesData?.data.map((country: Country) => ({
                  id: country.id.toString(),
                  name: country.name,
                })) ?? []
              }
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
                ? tStates('actions.update')
                : tStates('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </FormLayout>
    </Form>
  );
}
