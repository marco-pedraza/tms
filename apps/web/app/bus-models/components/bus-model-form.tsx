'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { bus_models } from '@repo/ims-client';
import { useQueryAllBusDiagrams } from '@/bus-models/hooks/use-query-all-bus-diagrams';
import busEngineTypeTranslationKeys from '@/bus-models/translations/bus-engine-type-translation-keys';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useForm from '@/hooks/use-form';
import { engineTypes } from '@/services/ims-client';
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
      .min(1, {
        message: tValidations('required'),
      })
      .regex(/^[a-zA-Z0-9\s]+$/, {
        message: tValidations('code.alphanumeric'),
      }),
    year: z
      .string()
      .min(1, { message: tValidations('required') })
      .transform((val) => parseInt(val))
      .refine((val) => !isNaN(val) && val >= 1900, {
        message: tValidations('greaterThan', { value: 1900 }),
      })
      .refine((val) => !isNaN(val) && val <= 9999, {
        message: tValidations('lessThanOrEquals', { value: 9999 }),
      }),
    seatingCapacity: z
      .string()
      .min(1, { message: tValidations('required') })
      .transform((val) => parseInt(val))
      .refine((val) => !isNaN(val) && val >= 1, {
        message: tValidations('greaterThanOrEquals', { value: 1 }),
      }),
    trunkCapacity: z
      .string()
      .transform((val) => (val === '' ? null : parseFloat(val)))
      .refine((val) => val === null || (!isNaN(val) && val >= 0), {
        message: tValidations('greaterThan', { value: 0 }),
      }),
    fuelEfficiency: z
      .string()
      .transform((val) => (val === '' ? null : parseFloat(val)))
      .refine((val) => val === null || (!isNaN(val) && val >= 0), {
        message: tValidations('greaterThan', { value: 0 }),
      }),
    maxCapacity: z
      .string()
      .transform((val) => (val === '' ? null : parseInt(val)))
      .refine((val) => val === null || (!isNaN(val) && val >= 0), {
        message: tValidations('greaterThan', { value: 0 }),
      }),
    numFloors: z
      .string()
      .min(1, { message: tValidations('required') })
      .transform((val) => parseInt(val))
      .refine((val) => val === null || (!isNaN(val) && val >= 1), {
        message: tValidations('greaterThanOrEquals', { value: 1 }),
      }),
    amenities: z.array(z.string()).optional(),
    engineType: z
      .enum(engineTypes as [string, ...string[]], {
        message: tValidations('required'),
      })
      .transform((val) => val as bus_models.EngineType),
    active: z.boolean(),
    defaultBusDiagramModelId: z
      .string()
      .min(1, { message: tValidations('required') })
      .transform((val) => parseInt(val)),
  });

export type BusModelFormValues = z.output<
  ReturnType<typeof createBusModelFormSchema>
>;

type BusModelFormRawValues = z.input<
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
  const busModelSchema = createBusModelFormSchema(tValidations);
  const { data: busDiagrams } = useQueryAllBusDiagrams();

  const rawDefaultValues: BusModelFormRawValues = defaultValues
    ? {
        ...defaultValues,
        manufacturer: defaultValues.manufacturer || '',
        model: defaultValues.model || '',
        year: defaultValues.year.toString() || '',
        seatingCapacity: defaultValues.seatingCapacity.toString() || '',
        trunkCapacity: defaultValues.trunkCapacity?.toString() || '',
        fuelEfficiency: defaultValues.fuelEfficiency?.toString() || '',
        maxCapacity: defaultValues.maxCapacity?.toString() || '',
        numFloors: defaultValues.numFloors.toString() || '',
        amenities: defaultValues.amenities,
        engineType: defaultValues.engineType || '',
        defaultBusDiagramModelId:
          defaultValues.defaultBusDiagramModelId?.toString() || '',
      }
    : {
        manufacturer: '',
        model: '',
        year: '',
        seatingCapacity: '',
        trunkCapacity: '',
        fuelEfficiency: '',
        maxCapacity: '',
        numFloors: '',
        amenities: [],
        engineType: '',
        active: true,
        defaultBusDiagramModelId: '',
      };

  const form = useForm({
    defaultValues: rawDefaultValues,
    validators: {
      onChange: busModelSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = busModelSchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
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
    <div className="max-w-7xl">
      <Tabs defaultValue="info">
        <TabsList className="w-full">
          <TabsTrigger value="info">{tBusModels('sections.info')}</TabsTrigger>
          <TabsTrigger value="amenities">
            {tBusModels('sections.amenities')}
          </TabsTrigger>
          <TabsTrigger value="diagram">
            {tBusModels('sections.diagram')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info">
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
                  />
                )}
              </form.AppField>

              <form.AppField name="year">
                {(field) => (
                  <field.TextInput
                    label={tBusModels('fields.year')}
                    placeholder={tBusModels('form.placeholders.year')}
                    isRequired
                  />
                )}
              </form.AppField>
              <form.AppField name="seatingCapacity">
                {(field) => (
                  <field.NumberInput
                    label={tBusModels('fields.seatingCapacity')}
                    placeholder={tBusModels(
                      'form.placeholders.seatingCapacity',
                    )}
                    isRequired
                  />
                )}
              </form.AppField>

              <form.AppField name="trunkCapacity">
                {(field) => (
                  <field.NumberInput
                    label={tBusModels('fields.trunkCapacity')}
                    placeholder={tBusModels('form.placeholders.trunkCapacity')}
                  />
                )}
              </form.AppField>

              <form.AppField name="fuelEfficiency">
                {(field) => (
                  <field.NumberInput
                    label={tBusModels('fields.fuelEfficiency')}
                    placeholder={tBusModels('form.placeholders.fuelEfficiency')}
                  />
                )}
              </form.AppField>

              <form.AppField name="maxCapacity">
                {(field) => (
                  <field.NumberInput
                    label={tBusModels('fields.maxCapacity')}
                    placeholder={tBusModels('form.placeholders.maxCapacity')}
                  />
                )}
              </form.AppField>

              <form.AppField name="numFloors">
                {(field) => (
                  <field.NumberInput
                    label={tBusModels('fields.numFloors')}
                    placeholder={tBusModels('form.placeholders.numFloors')}
                    isRequired
                  />
                )}
              </form.AppField>

              <form.AppField name="engineType">
                {(field) => (
                  <field.SelectInput
                    label={tBusModels('fields.engineType')}
                    placeholder={tBusModels('form.placeholders.engineType')}
                    items={engineTypes.map((type) => ({
                      id: type,
                      name: tBusModels(
                        `engineTypes.${busEngineTypeTranslationKeys[type]}`,
                      ),
                    }))}
                    isRequired
                  />
                )}
              </form.AppField>

              <form.AppField name="defaultBusDiagramModelId">
                {(field) => (
                  <field.SelectInput
                    label={tBusModels('fields.busDiagramModel')}
                    placeholder={tBusModels(
                      'form.placeholders.busDiagramModel',
                    )}
                    emptyOptionsLabel={tBusModels(
                      'form.placeholders.emptyOptionsLabel',
                    )}
                    items={
                      busDiagrams?.data.map((diagram) => ({
                        id: diagram.id.toString(),
                        name: diagram.name,
                      })) || []
                    }
                    isRequired
                  />
                )}
              </form.AppField>

              <form.AppField name="active">
                {(field) => (
                  <field.SwitchInput label={tCommon('fields.active')} />
                )}
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
        </TabsContent>
        <TabsContent value="amenities">
          <Card>
            <CardHeader>
              <CardTitle>{tBusModels('sections.amenities')}</CardTitle>
            </CardHeader>
            <CardContent></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="diagram">
          <Card>
            <CardHeader>
              <CardTitle>{tBusModels('sections.diagram')}</CardTitle>
            </CardHeader>
            <CardContent></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
