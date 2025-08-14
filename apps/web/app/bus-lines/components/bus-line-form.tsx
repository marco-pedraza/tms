'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import NumberInput from '@/components/form/number-input';
import SelectInput from '@/components/form/select-input';
import useForm from '@/hooks/use-form';
import { codeSchema, nameSchema } from '@/schemas/common';
import useQueryAllServiceTypes from '@/service-types/hooks/use-query-all-service-types';
import useQueryAllTransporters from '@/transporters/hooks/use-query-all-transporters';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createBusLineFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    name: nameSchema(tValidations),
    code: codeSchema(tValidations, 1, 20),
    description: z.string().trim().optional(),
    transporterId: z
      .string()
      .min(1, { message: tValidations('required') })
      .transform((val) => parseInt(val)),
    serviceTypeId: z
      .string()
      .min(1, { message: tValidations('required') })
      .transform((val) => parseInt(val)),
    pricePerKilometer: z.coerce
      .number()
      .positive({ message: tValidations('positive') }),
    fleetSize: z
      .union([
        z.coerce.number().positive({ message: tValidations('positive') }),
        z.literal(''),
      ])
      .transform((val) => (val === '' ? null : val))
      .optional(),
    website: z
      .union([
        z.string().url({ message: tValidations('url.invalid') }),
        z.literal(''),
      ])
      .optional(),
    email: z
      .union([
        z.string().email({ message: tValidations('email.invalid') }),
        z.literal(''),
      ])
      .optional(),
    phone: z
      .string()
      .trim()
      .transform((val) => val.replace(/[^\d+]/g, ''))
      .refine((val) => val.length === 0 || /^\+[1-9]\d{1,14}$/.test(val), {
        message: tValidations('phone.invalid'),
      })
      .optional(),
    active: z.boolean(),
  });

export type BusLineFormValues = z.output<
  ReturnType<typeof createBusLineFormSchema>
>;

type BusLineFormRawValues = z.input<ReturnType<typeof createBusLineFormSchema>>;

interface BusLineFormProps {
  defaultValues?: BusLineFormValues;
  onSubmit: (values: BusLineFormValues) => Promise<unknown>;
  submitButtonText?: string;
}

export default function BusLineForm({
  defaultValues,
  onSubmit,
}: BusLineFormProps) {
  const tCommon = useTranslations('common');
  const tBusLines = useTranslations('busLines');
  const tValidations = useTranslations('validations');
  const schema = createBusLineFormSchema(tValidations);
  const { data: transporters } = useQueryAllTransporters();
  const { data: serviceTypes } = useQueryAllServiceTypes();

  const rawDefaultValues: BusLineFormRawValues | undefined = defaultValues
    ? {
        ...defaultValues,
        transporterId: String(defaultValues.transporterId),
        serviceTypeId: String(defaultValues.serviceTypeId),
        fleetSize: defaultValues.fleetSize ?? '',
      }
    : undefined;

  const form = useForm({
    defaultValues: rawDefaultValues ?? {
      name: '',
      code: '',
      description: '',
      transporterId: '',
      serviceTypeId: '',
      pricePerKilometer: '1.0',
      fleetSize: '',
      website: '',
      email: '',
      phone: '',
      active: true,
    },
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = schema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'busLine',
          error,
          tValidations,
        });
      }
    },
  });

  const transporterItems = (transporters?.data ?? []).map((t) => ({
    id: String(t.id),
    name: t.name,
  }));
  const serviceTypeItems = (serviceTypes?.data ?? []).map((s) => ({
    id: String(s.id),
    name: s.name,
  }));

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tBusLines('form.title')}>
        <form.AppField name="name">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.name')}
              placeholder={tBusLines('form.placeholders.name')}
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="code">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.code')}
              placeholder={tBusLines('form.placeholders.code')}
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="description">
          {(field) => (
            <field.TextAreaInput
              label={tCommon('fields.description')}
              placeholder={tBusLines('form.placeholders.description')}
            />
          )}
        </form.AppField>

        <form.AppField name="transporterId">
          {() => (
            <SelectInput
              label={tCommon('fields.transporter')}
              placeholder={tBusLines('form.placeholders.transporter')}
              items={transporterItems}
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="serviceTypeId">
          {() => (
            <SelectInput
              label={tCommon('fields.serviceType')}
              placeholder={tBusLines('form.placeholders.serviceType')}
              items={serviceTypeItems}
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="pricePerKilometer">
          {() => (
            <NumberInput
              label={tBusLines('fields.pricePerKilometer')}
              step={0.01}
              min={1}
              allowDecimals={true}
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="fleetSize">
          {() => (
            <NumberInput
              label={tBusLines('fields.fleetSize')}
              placeholder={tBusLines('form.placeholders.fleetSize')}
              allowDecimals={false}
              min={1}
            />
          )}
        </form.AppField>

        <form.AppField name="website">
          {(field) => (
            <field.TextInput
              type="url"
              label={tCommon('fields.website')}
              placeholder={tBusLines('form.placeholders.website')}
            />
          )}
        </form.AppField>

        <form.AppField name="email">
          {(field) => (
            <field.TextInput
              type="email"
              label={tCommon('fields.email')}
              placeholder={tBusLines('form.placeholders.email')}
            />
          )}
        </form.AppField>

        <form.AppField name="phone">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.phone')}
              placeholder={tBusLines('form.placeholders.phone')}
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
                ? tCommon('actions.update')
                : tCommon('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </FormLayout>
    </Form>
  );
}
