'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import type { countries } from '@repo/ims-client';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useQueryAllCountries from '@/countries/hooks/use-query-all-countries';
import useForm from '@/hooks/use-form';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

type Country = countries.Country;

const createStateFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') })
      .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, {
        message: tValidations('name.letters'),
      }),
    code: z
      .string()
      .min(2, {
        message: tValidations('code.minLength', { length: 2 }),
      })
      .regex(/^[A-Z]+$/, { message: tValidations('code.uppercase') }),
    countryId: z
      .string()
      .min(1, tValidations('required'))
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
  const tValidations = useTranslations('validations');
  const stateFormSchema = createStateFormSchema(tValidations);
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
      onSubmit: stateFormSchema,
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
          tValidations,
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
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="code">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.code')}
              placeholder={tStates('form.placeholders.code')}
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="countryId">
          {(field) => (
            <field.SelectInput
              label={tStates('form.country')}
              placeholder={tStates('form.placeholders.country')}
              isRequired
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
