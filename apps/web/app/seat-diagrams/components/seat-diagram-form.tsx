'use client';

import { PlusIcon, TrashIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import { Button } from '@/components/ui/button';
import useForm from '@/hooks/use-form';
import { requiredIntegerSchema } from '@/schemas/number';
import { optionalStringSchema, requiredStringSchema } from '@/schemas/string';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createSeatDiagramFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    // Basic information
    name: requiredStringSchema(tValidations),
    description: optionalStringSchema(),
    maxCapacity: requiredIntegerSchema(tValidations),
    isFactoryDefault: z.boolean(),
    active: z.boolean(),
    // Quick configuration
    seatsPerFloor: z.array(
      z.object({
        floorNumber: requiredIntegerSchema(tValidations),
        numRows: requiredIntegerSchema(tValidations),
        seatsLeft: requiredIntegerSchema(tValidations),
        seatsRight: requiredIntegerSchema(tValidations),
      }),
    ),
  });

export interface SeatDiagramFormValues
  extends z.output<ReturnType<typeof createSeatDiagramFormSchema>> {
  numFloors: number;
  totalSeats: number;
}

type SeatDiagramFormRawValues = z.input<
  ReturnType<typeof createSeatDiagramFormSchema>
>;

const defaultValuesSchema = z.object({
  name: z.string().default(''),
  description: z.string().default(''),
  isFactoryDefault: z.boolean().default(true),
  active: z.boolean().default(true),
  maxCapacity: z.coerce.string().default(''),
  seatsPerFloor: z
    .array(
      z.object({
        floorNumber: z.coerce.string().default(''),
        numRows: z.coerce.string().default(''),
        seatsLeft: z.coerce.string().default(''),
        seatsRight: z.coerce.string().default(''),
      }),
    )
    .default([
      { floorNumber: '1', numRows: '', seatsLeft: '', seatsRight: '' },
    ]),
});

interface SeatDiagramFormProps {
  defaultValues?: SeatDiagramFormValues;
  onSubmit: (values: SeatDiagramFormValues) => Promise<unknown>;
}

export default function SeatDiagramForm({
  defaultValues,
  onSubmit,
}: SeatDiagramFormProps) {
  const tCommon = useTranslations('common');
  const tSeatDiagrams = useTranslations('seatDiagrams');
  const tValidations = useTranslations('validations');
  const seatDiagramSchema = createSeatDiagramFormSchema(tValidations);
  const rawDefaultValues: SeatDiagramFormRawValues = defaultValuesSchema.parse(
    defaultValues ?? {},
  );
  const form = useForm({
    defaultValues: rawDefaultValues,
    validators: {
      onChange: seatDiagramSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = seatDiagramSchema.safeParse(value);
        if (parsed.success) {
          const submitValues = {
            ...parsed.data,
            numFloors: parsed.data.seatsPerFloor.length,
            totalSeats: parsed.data.seatsPerFloor.reduce(
              (acc, floor) =>
                acc + floor.numRows * (floor.seatsLeft + floor.seatsRight),
              0,
            ),
          };
          await onSubmit(submitValues);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'seatDiagram',
          error,
          tValidations,
        });
      }
    },
  });

  return (
    <Form onSubmit={form.handleSubmit}>
      {/* General Configuration Section */}
      <FormLayout title={tSeatDiagrams('sections.generalConfiguration')}>
        <form.AppField name="name">
          {(field) => (
            <field.TextInput
              label={tSeatDiagrams('fields.name')}
              placeholder={tSeatDiagrams('form.placeholders.name')}
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="description">
          {(field) => (
            <field.TextAreaInput
              label={tSeatDiagrams('fields.description')}
              placeholder={tSeatDiagrams('form.placeholders.description')}
            />
          )}
        </form.AppField>

        <form.AppField name="maxCapacity">
          {(field) => (
            <field.NumberInput label={tSeatDiagrams('fields.maxCapacity')} />
          )}
        </form.AppField>

        <form.AppField name="isFactoryDefault">
          {(field) => (
            <field.SwitchInput
              label={tSeatDiagrams('fields.isFactoryDefault')}
            />
          )}
        </form.AppField>

        <form.AppField name="active">
          {(field) => <field.SwitchInput label={tCommon('fields.active')} />}
        </form.AppField>
      </FormLayout>

      {/* Quick Configuration Section */}
      <div className="pt-4">
        <FormLayout title={tSeatDiagrams('sections.quickConfiguration')}>
          <div className="grid gap-4">
            <form.AppField name="seatsPerFloor">
              {(field) => (
                <div className="space-y-4">
                  {field.state.value.map((floor, index) => (
                    <div className="grid gap-1" key={floor.floorNumber}>
                      <div className="flex justify-between">
                        <h4 className="font-medium">
                          {tSeatDiagrams('fields.floor', {
                            floorNumber: floor.floorNumber,
                          })}
                        </h4>
                        {index > 0 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              field.handleChange(
                                field.state.value.filter((_, i) => i !== index),
                              );
                            }}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <form.AppField name={`seatsPerFloor[${index}].numRows`}>
                          {(field) => (
                            <field.NumberInput
                              label={tSeatDiagrams('fields.numRows')}
                            />
                          )}
                        </form.AppField>
                        <form.AppField
                          name={`seatsPerFloor[${index}].seatsLeft`}
                        >
                          {(field) => (
                            <field.NumberInput
                              label={tSeatDiagrams('fields.seatsLeft')}
                            />
                          )}
                        </form.AppField>
                        <form.AppField
                          name={`seatsPerFloor[${index}].seatsRight`}
                        >
                          {(field) => (
                            <field.NumberInput
                              label={tSeatDiagrams('fields.seatsRight')}
                            />
                          )}
                        </form.AppField>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      field.handleChange([
                        ...field.state.value,
                        {
                          floorNumber: String(field.state.value.length + 1),
                          numRows: '',
                          seatsLeft: '',
                          seatsRight: '',
                        },
                      ]);
                    }}
                  >
                    <PlusIcon className="w-4 h-4" />
                    {tSeatDiagrams('actions.addFloor')}
                  </Button>
                </div>
              )}
            </form.AppField>
          </div>
        </FormLayout>
      </div>
      <FormFooter>
        <form.AppForm>
          <form.SubmitButton>
            {defaultValues
              ? tSeatDiagrams('actions.update')
              : tSeatDiagrams('actions.create')}
          </form.SubmitButton>
        </form.AppForm>
      </FormFooter>
    </Form>
  );
}
