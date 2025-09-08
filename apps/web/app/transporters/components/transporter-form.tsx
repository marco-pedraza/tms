'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import useQueryAllCities from '@/cities/hooks/use-query-all-cities';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { emailSchema, phoneSchema } from '@/schemas/contact';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createTransporterFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') })
      .regex(/.*\S.*/, {
        message: tValidations('name.nonWhitespace'),
      }),
    code: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') })
      .regex(/^[A-Z0-9-]{1,10}$/, {
        message: tValidations('code.transporterFormat'),
      }),
    description: z.string(),
    legalName: z.string(),
    address: z.string(),
    website: z.union([
      z.string().url({ message: tValidations('url.invalid') }),
      z.literal(''),
    ]),
    email: emailSchema(tValidations),
    phone: phoneSchema(tValidations)
      .transform((val) => (val.length === 0 ? null : val))
      .nullable(),
    headquarterCityId: z
      .string()
      .transform((val) => (val === '' ? undefined : parseInt(val)))
      .optional(),
    logoUrl: z.union([
      z.string().url({ message: tValidations('url.invalid') }),
      z.literal(''),
    ]),
    contactInfo: z.string(),
    licenseNumber: z.string(),
    active: z.boolean(),
  });

export type TransporterFormOutputValues = z.output<
  ReturnType<typeof createTransporterFormSchema>
>;
type TransporterFormRawValues = z.input<
  ReturnType<typeof createTransporterFormSchema>
>;

export type TransporterFormValues = Omit<
  TransporterFormOutputValues,
  'headquarterCityId'
> & {
  headquarterCityId: number | undefined;
};

interface TransporterFormProps {
  defaultValues?: TransporterFormValues;
  onSubmit: (values: TransporterFormOutputValues) => Promise<unknown>;
}

export default function TransporterForm({
  defaultValues,
  onSubmit,
}: TransporterFormProps) {
  const tCommon = useTranslations('common');
  const tTransporters = useTranslations('transporters');
  const tValidations = useTranslations('validations');

  const transporterSchema = createTransporterFormSchema(tValidations);

  const rawDefaultValues: TransporterFormRawValues | undefined = defaultValues
    ? {
        ...defaultValues,
        headquarterCityId: defaultValues.headquarterCityId?.toString() ?? '',
        description: defaultValues.description ?? '',
        legalName: defaultValues.legalName ?? '',
        address: defaultValues.address ?? '',
        website: defaultValues.website ?? '',
        email: defaultValues.email ?? '',
        phone: defaultValues.phone ?? '',
        logoUrl: defaultValues.logoUrl ?? '',
        contactInfo: defaultValues.contactInfo ?? '',
        licenseNumber: defaultValues.licenseNumber ?? '',
      }
    : undefined;

  const form = useForm({
    defaultValues: rawDefaultValues ?? {
      name: '',
      code: '',
      description: '',
      legalName: '',
      address: '',
      website: '',
      email: '',
      phone: '',
      headquarterCityId: '',
      logoUrl: '',
      contactInfo: '',
      licenseNumber: '',
      active: true,
    },
    validators: {
      onChange: transporterSchema,
      onSubmit: transporterSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = transporterSchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'transporter',
          error,
          tValidations,
          tCommon,
        });
      }
    },
  });

  const { data: cities } = useQueryAllCities();

  return (
    <Form onSubmit={form.handleSubmit}>
      <div className="space-y-6">
        <FormLayout title={tCommon('sections.basicInfo')}>
          <form.AppField name="name">
            {(field) => (
              <field.TextInput
                label={tCommon('fields.name')}
                placeholder={tTransporters('form.placeholders.name')}
                isRequired
              />
            )}
          </form.AppField>

          <form.AppField name="code">
            {(field) => (
              <field.TextInput
                label={tCommon('fields.code')}
                placeholder={tTransporters('form.placeholders.code')}
                isRequired
                maxLength={10}
                description={tTransporters('form.codeHelp')}
              />
            )}
          </form.AppField>

          <form.AppField name="description">
            {(field) => (
              <field.TextAreaInput
                label={tCommon('fields.description')}
                placeholder={tTransporters('form.placeholders.description')}
              />
            )}
          </form.AppField>

          <form.AppField name="active">
            {(field) => <field.SwitchInput label={tCommon('fields.active')} />}
          </form.AppField>
        </FormLayout>

        <FormLayout title={tTransporters('sections.companyInfo')}>
          <form.AppField name="legalName">
            {(field) => (
              <field.TextInput
                label={tTransporters('fields.legalName')}
                placeholder={tTransporters('form.placeholders.legalName')}
              />
            )}
          </form.AppField>

          <form.AppField name="licenseNumber">
            {(field) => (
              <field.TextInput
                label={tTransporters('fields.licenseNumber')}
                placeholder={tTransporters('form.placeholders.licenseNumber')}
              />
            )}
          </form.AppField>

          <form.AppField name="headquarterCityId">
            {(field) => (
              <field.SelectInput
                label={tTransporters('fields.headquarterCity')}
                placeholder={tTransporters('form.placeholders.headquarterCity')}
                emptyOptionsLabel={tTransporters('form.emptyCitiesOptions')}
                items={
                  cities?.data.map((city) => ({
                    id: city.id.toString(),
                    name: city.name,
                  })) ?? []
                }
              />
            )}
          </form.AppField>

          <form.AppField name="address">
            {(field) => (
              <field.TextAreaInput
                label={tTransporters('fields.address')}
                placeholder={tTransporters('form.placeholders.address')}
              />
            )}
          </form.AppField>

          <form.AppField name="logoUrl">
            {(field) => (
              <field.TextInput
                label={tTransporters('fields.logoUrl')}
                placeholder={tTransporters('form.placeholders.logoUrl')}
                description={tTransporters('form.logoUrlHelp')}
              />
            )}
          </form.AppField>
        </FormLayout>

        <FormLayout title={tTransporters('sections.contactInfo')}>
          <form.AppField name="email">
            {(field) => (
              <field.TextInput
                label={tCommon('fields.email')}
                placeholder={tTransporters('form.placeholders.email')}
                inputMode="email"
              />
            )}
          </form.AppField>

          <form.AppField name="phone">
            {(field) => (
              <field.TextInput
                label={tCommon('fields.phone')}
                placeholder={tTransporters('form.placeholders.phone')}
                inputMode="tel"
              />
            )}
          </form.AppField>

          <form.AppField name="website">
            {(field) => (
              <field.TextInput
                label={tCommon('fields.website')}
                placeholder={tTransporters('form.placeholders.website')}
                inputMode="url"
              />
            )}
          </form.AppField>

          <form.AppField name="contactInfo">
            {(field) => (
              <field.TextAreaInput
                label={tTransporters('fields.contactInfo')}
                placeholder={tTransporters('form.placeholders.contactInfo')}
                description={tTransporters('form.contactInfoHelp')}
              />
            )}
          </form.AppField>
        </FormLayout>
      </div>

      <FormFooter>
        <form.AppForm>
          <form.SubmitButton>
            {defaultValues
              ? tTransporters('actions.update')
              : tTransporters('actions.create')}
          </form.SubmitButton>
        </form.AppForm>
      </FormFooter>
    </Form>
  );
}
