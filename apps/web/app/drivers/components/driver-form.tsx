'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import type { drivers } from '@repo/ims-client';
import useQueryAllBusLines from '@/bus-lines/hooks/use-query-all-bus-lines';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useForm from '@/hooks/use-form';
import { nameSchema } from '@/schemas/common';
import { driverInitialStatuses, driverStatuses } from '@/services/ims-client';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createDriverFormSchema = (
  tValidations: UseValidationsTranslationsResult,
  isEditing = false,
) =>
  z.object({
    driverKey: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') }),
    payrollKey: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') }),
    firstName: nameSchema(tValidations),
    lastName: nameSchema(tValidations),
    phone: z
      .string()
      .trim()
      .transform((val) => val.replace(/[^\d+]/g, ''))
      .refine((val) => val.length === 0 || /^\+[1-9]\d{1,14}$/.test(val), {
        message: tValidations('phone.invalid'),
      })
      .optional(),
    email: z
      .union([
        z.string().email({ message: tValidations('email.invalid') }),
        z.literal(''),
      ])
      .optional(),
    address: z.string().trim().optional(),
    emergencyContactName: z.string().trim().optional(),
    emergencyContactPhone: z
      .string()
      .trim()
      .transform((val) => val.replace(/[^\d+]/g, ''))
      .refine((val) => val.length === 0 || /^\+[1-9]\d{1,14}$/.test(val), {
        message: tValidations('phone.invalid'),
      })
      .optional(),
    emergencyContactRelationship: z.string().trim().optional(),
    hireDate: z
      .union([z.string(), z.literal('')])
      .transform((val) => (val === '' ? null : val)),
    busLineId: z
      .string()
      .min(1, { message: tValidations('required') })
      .transform((val) => parseInt(val)),
    status: z
      .string()
      .min(1, { message: tValidations('required') })
      .pipe(
        z.enum(
          (isEditing ? driverStatuses : driverInitialStatuses) as [
            drivers.DriverStatus,
            ...drivers.DriverStatus[],
          ],
          {
            errorMap: () => ({ message: tValidations('required') }),
          },
        ),
      ),
    statusDate: z
      .union([z.string(), z.literal('')])
      .transform((val) => (val === '' ? null : val)),
    license: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') }),
    licenseExpiry: z.string().min(1, { message: tValidations('required') }),
  });

export type DriverFormValues = z.output<
  ReturnType<typeof createDriverFormSchema>
>;

type DriverFormRawValues = z.input<ReturnType<typeof createDriverFormSchema>>;

interface DriverFormProps {
  defaultValues?: DriverFormValues;
  onSubmit: (values: DriverFormValues) => Promise<unknown>;
}

export default function DriverForm({
  defaultValues,
  onSubmit,
}: DriverFormProps) {
  const tDrivers = useTranslations('drivers');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');
  const isEditing = !!defaultValues;
  const driverFormSchema = createDriverFormSchema(tValidations, isEditing);

  const { data: busLinesData } = useQueryAllBusLines();
  const busLinesOptions =
    busLinesData?.data?.map((busLine) => ({
      id: busLine.id.toString(),
      name: busLine.name,
    })) || [];

  const rawDefaultValues: DriverFormRawValues | undefined = defaultValues
    ? {
        ...defaultValues,
        busLineId: String(defaultValues.busLineId),
        status: defaultValues.status,
        hireDate: defaultValues.hireDate ?? '',
        statusDate: defaultValues.statusDate ?? '',
        emergencyContactName: defaultValues.emergencyContactName ?? '',
        emergencyContactPhone: defaultValues.emergencyContactPhone ?? '',
        emergencyContactRelationship:
          defaultValues.emergencyContactRelationship ?? '',
      }
    : undefined;

  const form = useForm({
    defaultValues: rawDefaultValues ?? {
      driverKey: '',
      payrollKey: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      hireDate: '',
      busLineId: '',
      status: '',
      statusDate: new Date().toISOString().split('T')[0],
      license: '',
      licenseExpiry: '',
    },
    validators: {
      onChange: driverFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = driverFormSchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'driver',
          error,
          tValidations,
        });
      }
    },
  });

  return (
    <Form onSubmit={form.handleSubmit}>
      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">
            {tDrivers('sections.personalInfo')}
          </TabsTrigger>
          <TabsTrigger value="job">{tDrivers('sections.jobInfo')}</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <FormLayout title={tDrivers('sections.personalInfo')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form.AppField name="driverKey">
                {(field) => (
                  <field.TextInput
                    label={tDrivers('form.driverKey')}
                    placeholder={tDrivers('form.placeholders.driverKey')}
                    isRequired
                  />
                )}
              </form.AppField>

              <form.AppField name="payrollKey">
                {(field) => (
                  <field.TextInput
                    label={tDrivers('form.payrollKey')}
                    placeholder={tDrivers('form.placeholders.payrollKey')}
                    isRequired
                  />
                )}
              </form.AppField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form.AppField name="firstName">
                {(field) => (
                  <field.TextInput
                    label={tCommon('fields.firstName')}
                    placeholder={tDrivers('form.placeholders.firstName')}
                    isRequired
                  />
                )}
              </form.AppField>

              <form.AppField name="lastName">
                {(field) => (
                  <field.TextInput
                    label={tCommon('fields.lastName')}
                    placeholder={tDrivers('form.placeholders.lastName')}
                    isRequired
                  />
                )}
              </form.AppField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form.AppField name="phone">
                {(field) => (
                  <field.TextInput
                    type="tel"
                    label={tCommon('fields.phone')}
                    placeholder={tDrivers('form.placeholders.phone')}
                  />
                )}
              </form.AppField>

              <form.AppField name="email">
                {(field) => (
                  <field.TextInput
                    type="email"
                    label={tCommon('fields.email')}
                    placeholder={tDrivers('form.placeholders.email')}
                  />
                )}
              </form.AppField>
            </div>

            <form.AppField name="address">
              {(field) => (
                <field.TextAreaInput
                  label={tDrivers('form.address')}
                  placeholder={tDrivers('form.placeholders.address')}
                />
              )}
            </form.AppField>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <form.AppField name="emergencyContactName">
                {(field) => (
                  <field.TextInput
                    label={tDrivers('form.emergencyContactName')}
                    placeholder={tDrivers(
                      'form.placeholders.emergencyContactName',
                    )}
                  />
                )}
              </form.AppField>

              <form.AppField name="emergencyContactPhone">
                {(field) => (
                  <field.TextInput
                    type="tel"
                    label={tDrivers('form.emergencyContactPhone')}
                    placeholder={tDrivers(
                      'form.placeholders.emergencyContactPhone',
                    )}
                  />
                )}
              </form.AppField>

              <form.AppField name="emergencyContactRelationship">
                {(field) => (
                  <field.TextInput
                    label={tDrivers('form.emergencyContactRelationship')}
                    placeholder={tDrivers(
                      'form.placeholders.emergencyContactRelationship',
                    )}
                  />
                )}
              </form.AppField>
            </div>
          </FormLayout>
        </TabsContent>

        <TabsContent value="job">
          <FormLayout title={tDrivers('sections.jobInfo')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form.AppField name="hireDate">
                {(field) => (
                  <field.TextInput
                    type="date"
                    label={tDrivers('form.hireDate')}
                  />
                )}
              </form.AppField>

              <form.AppField name="busLineId">
                {(field) => (
                  <field.SelectInput
                    label={tDrivers('form.busLine')}
                    placeholder={tDrivers('form.placeholders.busLine')}
                    items={busLinesOptions}
                    isRequired
                  />
                )}
              </form.AppField>

              <form.AppField name="status">
                {(field) => (
                  <field.SelectInput
                    label={tCommon('fields.status')}
                    placeholder={tDrivers('form.placeholders.status')}
                    items={(isEditing
                      ? driverStatuses
                      : driverInitialStatuses
                    ).map((status) => ({
                      id: status,
                      name: tDrivers(`status.${status}`),
                    }))}
                    isRequired
                  />
                )}
              </form.AppField>

              <form.AppField name="statusDate">
                {(field) => (
                  <field.TextInput
                    type="date"
                    label={tDrivers('form.statusDate')}
                  />
                )}
              </form.AppField>

              <form.AppField name="license">
                {(field) => (
                  <field.TextInput
                    label={tDrivers('form.license')}
                    placeholder={tDrivers('form.placeholders.license')}
                    isRequired
                  />
                )}
              </form.AppField>

              <form.AppField name="licenseExpiry">
                {(field) => (
                  <field.TextInput
                    type="date"
                    label={tDrivers('form.licenseExpiry')}
                    isRequired
                  />
                )}
              </form.AppField>
            </div>
          </FormLayout>
        </TabsContent>
      </Tabs>

      <FormFooter>
        <form.AppForm>
          <form.SubmitButton>
            {defaultValues
              ? tDrivers('actions.update')
              : tDrivers('actions.create')}
          </form.SubmitButton>
        </form.AppForm>
      </FormFooter>
    </Form>
  );
}
