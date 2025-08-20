'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createBusModelFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    manufacturer: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') })
      .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, {
        message: tValidations('name.letters'),
      }),
    model: z
      .string()
      .min(2, {
        message: tValidations('code.length', { length: 2 }),
      })
      .max(2)
      .regex(/^[A-Z]+$/, {
        message: tValidations('code.uppercase'),
      }),
    year: z.coerce
      .number()
      .min(1900, {
        message: tValidations('greaterThan', { value: 1900 }),
      })
      .optional(),
    seatingCapacity: z.coerce
      .number()
      .min(1, {
        message: tValidations('greaterThan', { value: 1 }),
      })
      .optional(),
    trunkCapacity: z.coerce
      .number()
      .min(0, {
        message: tValidations('greaterThan', { value: 0 }),
      })
      .optional(),
    fuelEfficiency: z.coerce
      .number()
      .min(0, {
        message: tValidations('greaterThan', { value: 0 }),
      })
      .optional(),
    maxCapacity: z.coerce
      .number()
      .min(0, {
        message: tValidations('greaterThan', { value: 0 }),
      })
      .optional(),
    numFloors: z.coerce
      .number()
      .min(1, {
        message: tValidations('greaterThan', { value: 1 }),
      })
      .optional(),
    amenities: z
      .array(z.string())
      .min(1, {
        message: tValidations('greaterThan', { value: 1 }),
      })
      .optional(),
    engineType: z
      .string()
      .min(1, {
        message: tValidations('greaterThan', { value: 1 }),
      })
      .optional(),
    distributionType: z
      .string()
      .min(1, {
        message: tValidations('greaterThan', { value: 1 }),
      })
      .optional(),
    active: z.boolean(),
  });

export type BusModelFormValues = z.infer<
  ReturnType<typeof createBusModelFormSchema>
>;

interface BusModelFormProps {
  defaultValues?: BusModelFormValues;
  onSubmit: (values: BusModelFormValues) => Promise<unknown>;
}

export default function BusModelForm({
  defaultValues,
  onSubmit,
}: BusModelFormProps) {
  const tBusModels = useTranslations('busModels');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');
  const form = useForm({
    defaultValues: defaultValues ?? {
      manufacturer: '',
      model: '',
      active: true,
    },
    validators: {
      onChange: createBusModelFormSchema(tValidations),
    },
    onSubmit: async (values) => {
      try {
        await onSubmit(values.value);
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'busModel',
          error,
          tValidations,
          tCommon,
        });
      }
    },
  });

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tBusModels('form.title')}>
        <form.AppField name="manufacturer">
          {(field) => (
            <field.TextInput
              label={tBusModels('fields.manufacturer')}
              placeholder={tBusModels('form.placeholders.manufacturer')}
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="model">
          {(field) => (
            <field.TextInput
              label={tBusModels('fields.model')}
              placeholder={tBusModels('form.placeholders.model')}
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
                ? tBusModels('actions.update')
                : tBusModels('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </FormLayout>
    </Form>
  );
}
