'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { bus_models } from '@repo/ims-client';
import useQueryAllBusAmenities from '@/bus-models/hooks/use-query-all-bus-amenities';
import { useQueryAllBusDiagrams } from '@/bus-models/hooks/use-query-all-bus-diagrams';
import busEngineTypeTranslationKeys from '@/bus-models/translations/bus-engine-type-translation-keys';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import AmenityCard from '@/components/ui/amenity-card';
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
    amenityIds: z.array(z.number()).optional().default([]),
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
  const tSeatDiagrams = useTranslations('seatDiagrams');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');
  const busModelSchema = createBusModelFormSchema(tValidations);
  const { data: busDiagrams } = useQueryAllBusDiagrams();
  const { data: amenities } = useQueryAllBusAmenities();

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
        amenityIds: defaultValues.amenityIds || [],
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
        amenityIds: [],
        engineType: '',
        active: true,
        defaultBusDiagramModelId: '',
      };

  const form = useForm({
    defaultValues: rawDefaultValues,
    validators: {
      onSubmit: busModelSchema,
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
    <Form onSubmit={form.handleSubmit}>
      <div className="space-y-4">
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
                placeholder={tBusModels('form.placeholders.seatingCapacity')}
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

          <form.AppField name="active">
            {(field) => <field.SwitchInput label={tCommon('fields.active')} />}
          </form.AppField>
        </FormLayout>
        <FormLayout title={tBusModels('sections.amenities')}>
          <form.AppField name="amenityIds">
            {(field) => (
              <div className="space-y-4">
                <field.MultiSelectInput
                  label={tBusModels('fields.amenities')}
                  placeholder={tBusModels('form.placeholders.amenities')}
                  items={
                    amenities?.data.map((amenity) => ({
                      id: amenity.id.toString(),
                      name: amenity.name,
                      category: amenity.category,
                      iconName: amenity.iconName,
                      description: amenity.description,
                    })) ?? []
                  }
                  emptyOptionsLabel={tBusModels(
                    'form.placeholders.emptyAmenitiesList',
                  )}
                />

                {field.state.value && field.state.value.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">
                      {tBusModels('fields.selectedAmenities', {
                        count: field.state.value.length,
                      })}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {field.state.value.map((amenityId: number) => {
                        const amenity = amenities?.data.find(
                          (a) => a.id === amenityId,
                        );
                        return amenity ? (
                          <AmenityCard key={amenity.id} amenity={amenity} />
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form.AppField>
        </FormLayout>
        <FormLayout title={tBusModels('sections.diagram')}>
          <form.AppField name="defaultBusDiagramModelId">
            {(field) => {
              const seatDiagram = busDiagrams?.data.find(
                (diagram) => diagram.id.toString() === field.state.value,
              );
              return (
                <>
                  <field.ComboboxInput
                    label={tBusModels('fields.busDiagramModel')}
                    placeholder={tBusModels(
                      'form.placeholders.busDiagramModel',
                    )}
                    emptyOptionsLabel={tBusModels(
                      'form.placeholders.emptyOptionsLabel',
                    )}
                    searchPlaceholder={tBusModels(
                      'form.placeholders.busDiagramModelSearch',
                    )}
                    noResultsLabel={tBusModels(
                      'form.placeholders.noBusDiagramModelsFound',
                    )}
                    items={
                      busDiagrams?.data.map((diagram) => ({
                        id: diagram.id.toString(),
                        name: diagram.name,
                      })) || []
                    }
                    isRequired
                  />
                  {seatDiagram && (
                    <div className="space-y-4 pt-4">
                      {seatDiagram.seatsPerFloor.map((floor) => (
                        <div
                          key={floor.floorNumber}
                          className="border rounded-lg p-4"
                        >
                          <h4 className="font-medium mb-2">
                            {tSeatDiagrams('fields.floor', {
                              floorNumber: floor.floorNumber,
                            })}
                          </h4>
                          <dl className="grid grid-cols-[1fr_1fr] gap-2 text-sm">
                            <dt>{tSeatDiagrams('fields.numRows')}:</dt>
                            <dd>{floor.numRows || '-'}</dd>
                            <dt>{tSeatDiagrams('fields.seatsLeft')}:</dt>
                            <dd>{floor.seatsLeft || '-'}</dd>
                            <dt>{tSeatDiagrams('fields.seatsRight')}:</dt>
                            <dd>{floor.seatsRight || '-'}</dd>
                          </dl>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            }}
          </form.AppField>
        </FormLayout>
      </div>
      <FormFooter>
        <form.AppForm>
          <form.SubmitButton>
            {defaultValues
              ? tBusModels('actions.update')
              : tBusModels('actions.create')}
          </form.SubmitButton>
        </form.AppForm>
      </FormFooter>
    </Form>
  );
}
