'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import useQueryAllTimezones from '@/cities/hooks/use-query-all-timezones';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import useQueryAllPopulations from '@/populations/hooks/use-query-all-populations';
import useQueryAllStates from '@/states/hooks/use-query-all-states';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createCitySchema = (tValidations: UseValidationsTranslationsResult) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') })
      .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, {
        message: tValidations('name.letters'),
      }),
    stateId: z
      .string()
      .min(1, tValidations('required'))
      .transform((val) => parseInt(val)),
    populationId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined)),
    timezone: z.string().min(1, { message: tValidations('required') }),
    active: z.boolean(),
    latitude: z
      .string()
      .min(1, { message: tValidations('required') })
      .refine(
        (val) => {
          if (isNaN(parseFloat(val))) {
            return false;
          }
          const num = parseFloat(val);
          return num >= -90 && num <= 90;
        },
        { message: tValidations('latitude.range') },
      )
      .transform((val) => parseFloat(val)),
    longitude: z
      .string()
      .min(1, { message: tValidations('required') })
      .refine(
        (val) => {
          if (isNaN(parseFloat(val))) {
            return false;
          }
          const num = parseFloat(val);
          return num >= -180 && num <= 180;
        },
        { message: tValidations('longitude.range') },
      )
      .transform((val) => parseFloat(val)),
  });

export type CityFormValues = z.output<ReturnType<typeof createCitySchema>>;
type CityFormRawValues = z.input<ReturnType<typeof createCitySchema>>;

interface CityFormProps {
  defaultValues?: CityFormValues;
  onSubmit: (values: CityFormValues) => Promise<unknown>;
}

/**
 * Form component for creating and editing cities
 */
function CityForm({ defaultValues, onSubmit }: CityFormProps) {
  const tCities = useTranslations('cities');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');
  const rawDefaultValues: CityFormRawValues | undefined = defaultValues
    ? {
        ...defaultValues,
        stateId: defaultValues.stateId?.toString() || '',
        latitude: defaultValues.latitude?.toString() || '',
        longitude: defaultValues.longitude?.toString() || '',
        populationId: defaultValues.populationId?.toString() || '',
      }
    : undefined;
  const citySchema = createCitySchema(tValidations);
  const form = useForm({
    defaultValues: rawDefaultValues ?? {
      name: '',
      stateId: '',
      timezone: '',
      active: true,
      latitude: '',
      longitude: '',
      populationId: '',
    },
    validators: {
      onSubmit: citySchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = citySchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'city',
          error,
          tValidations,
        });
      }
    },
  });
  const { data: states } = useQueryAllStates();
  const { data: timezones } = useQueryAllTimezones();
  const { data: populations } = useQueryAllPopulations();

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tCities('form.title')}>
        <form.AppField name="name">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.name')}
              placeholder={tCities('form.placeholders.name')}
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="stateId">
          {(field) => (
            <field.ComboboxInput
              label={tCities('form.state')}
              placeholder={tCities('form.placeholders.state')}
              isRequired
              items={
                states?.data?.map((state) => ({
                  id: state.id.toString(),
                  name: state.name,
                })) ?? []
              }
              emptyOptionsLabel={tCities('form.placeholders.emptyStatesList')}
              searchPlaceholder={tCities('form.placeholders.stateSearch')}
              noResultsLabel={tCities('form.placeholders.noStatesFound')}
            />
          )}
        </form.AppField>

        <form.AppField name="populationId">
          {(field) => (
            <field.ComboboxInput
              label={tCities('form.population')}
              placeholder={tCities('form.placeholders.population')}
              items={
                populations?.data?.map((population) => ({
                  id: population.id.toString(),
                  name: population.name,
                })) ?? []
              }
              emptyOptionsLabel={tCities(
                'form.placeholders.emptyPopulationList',
              )}
              searchPlaceholder={tCities('form.placeholders.populationSearch')}
              noResultsLabel={tCities('form.placeholders.noPopulationsFound')}
            />
          )}
        </form.AppField>

        <form.AppField name="timezone">
          {(field) => (
            <field.ComboboxInput
              label={tCities('form.timezone')}
              placeholder={tCities('form.placeholders.timezone')}
              isRequired
              items={
                timezones?.timezones?.map((timezone) => ({
                  id: timezone.id,
                  name: timezone.id,
                })) ?? []
              }
              emptyOptionsLabel={tCities(
                'form.placeholders.emptyTimezonesList',
              )}
              searchPlaceholder={tCities('form.placeholders.timezoneSearch')}
              noResultsLabel={tCities('form.placeholders.noTimezonesFound')}
            />
          )}
        </form.AppField>

        <div className="grid grid-cols-2 gap-4">
          <form.AppField name="latitude">
            {(field) => (
              <field.TextInput
                label={tCommon('fields.latitude')}
                placeholder="e.g. 19.4326"
                isRequired
                inputMode="decimal"
              />
            )}
          </form.AppField>

          <form.AppField name="longitude">
            {(field) => (
              <field.TextInput
                label={tCommon('fields.longitude')}
                placeholder="e.g. -99.1332"
                isRequired
                inputMode="decimal"
              />
            )}
          </form.AppField>
        </div>

        <form.AppField name="active">
          {(field) => <field.SwitchInput label={tCommon('fields.active')} />}
        </form.AppField>

        <FormFooter>
          <form.AppForm>
            <form.SubmitButton>
              {defaultValues
                ? tCities('actions.update')
                : tCities('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </FormLayout>
    </Form>
  );
}

export default CityForm;
