'use client';

import { useState } from 'react';
import { Bath, MoveUpRight, PlusIcon, TrashIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import { BaseSwitchInput } from '@/components/form/switch-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useForm from '@/hooks/use-form';
import { requiredIntegerSchema } from '@/schemas/number';
import { optionalStringSchema, requiredStringSchema } from '@/schemas/string';
import SeatDiagram from '@/seat-diagrams/components/seat-diagram';
import {
  SeatDiagramSpace,
  createSeatDiagramSpaceSchema,
} from '@/seat-diagrams/seat-diagrams.schemas';
import { SeatType, SpaceType } from '@/services/ims-client';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';
import createFloorsFromQuickConfig from './create-floors-from-quick-config';

const createFloorSchema = (tValidations: UseValidationsTranslationsResult) =>
  z.object({
    floorNumber: z.number(),
    spaces: z.array(createSeatDiagramSpaceSchema(tValidations)),
  });

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
    seatConfiguration: z
      .array(createFloorSchema(tValidations))
      .min(1, tValidations('missingSeatDiagramSpaces')),
  });

export interface SeatDiagramFormValues
  extends z.output<ReturnType<typeof createSeatDiagramFormSchema>> {
  numFloors: number;
  totalSeats: number;
}

type SeatDiagramFormRawValues = z.input<
  ReturnType<typeof createSeatDiagramFormSchema>
>;

const createDefaultValuesSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    name: z.coerce.string().default(''),
    description: z.coerce
      .string()
      .transform((val) => (val === 'null' ? '' : val))
      .default(''),
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
    seatConfiguration: z.array(createFloorSchema(tValidations)).default([]),
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
  const rawDefaultValues: SeatDiagramFormRawValues = createDefaultValuesSchema(
    tValidations,
  ).parse(defaultValues ?? {});
  const form = useForm({
    defaultValues: rawDefaultValues,
    validators: {
      onSubmit: seatDiagramSchema,
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

  const spaceForm = useForm({
    defaultValues: {
      spaceType: '' as SpaceType,
      seatType: '' as SeatType,
      seatNumber: '',
      floorNumber: 1,
      /**
       * Active field is intentionally missing at the form fields
       * we only declare it here to send it to the backend.
       *
       * But we don't want the user to be able to edit it. We always set it to true.
       */
      active: true,
      position: {
        x: 0,
        y: 0,
      },
    },
    validators: {
      /**
       * @todo explore options to improve typing when using zod's discriminated unions
       * when the discriminated union is not the root of the schema
       */
      // @ts-expect-error - read todo above
      onSubmit: createSeatDiagramSpaceSchema(tValidations),
    },
    onSubmit: ({ value }) => {
      const currentSeatConfiguration = form.getFieldValue('seatConfiguration');
      const floorToModify = currentSeatConfiguration.find(
        (floor) => floor.floorNumber === value.floorNumber,
      );
      if (floorToModify) {
        const newSpacesForFloor = floorToModify.spaces.filter(
          (space) =>
            !(
              space.position.x === value.position.x &&
              space.position.y === value.position.y
            ),
        );
        newSpacesForFloor.push(value);
        const newSeatConfiguration = currentSeatConfiguration.filter(
          (floor) => floor.floorNumber !== value.floorNumber,
        );
        newSeatConfiguration.push({
          floorNumber: value.floorNumber,
          spaces: newSpacesForFloor,
        });
        const orderedByFloorNumber = newSeatConfiguration.sort(
          (a, b) => a.floorNumber - b.floorNumber,
        );
        form.setFieldValue('seatConfiguration', orderedByFloorNumber);
      }
    },
  });

  const [selectedFloor, setSelectedFloor] = useState<number>(1);

  const handleSpaceClick = (space: SeatDiagramSpace) => {
    /**
     * @todo explore options to improve typing when using zod's discriminated unions
     * when the discriminated union is not the root of the schema
     */
    // @ts-expect-error - read todo above
    spaceForm.reset(space);
  };

  const onAddColumn = (floorNumber: number, afterX: number) => {
    const currentSeatConfiguration = form.getFieldValue('seatConfiguration');
    const floorToModify = currentSeatConfiguration.find(
      (floor) => floor.floorNumber === floorNumber,
    );

    if (floorToModify) {
      // Get all unique Y positions (rows) for this floor
      const uniqueYPositions = Array.from(
        new Set(floorToModify.spaces.map((space) => space.position.y)),
      ).sort((a, b) => a - b);

      // Shift existing spaces to the right (x > afterX)
      const shiftedSpaces = floorToModify.spaces.map((space) => {
        if (space.position.x > afterX) {
          return {
            ...space,
            position: {
              ...space.position,
              x: space.position.x + 1,
            },
          };
        }
        return space;
      });

      // Create new spaces for the new column
      const newColumnSpaces: SeatDiagramSpace[] = uniqueYPositions.map((y) => ({
        spaceType: SpaceType.SEAT,
        seatType: SeatType.REGULAR,
        seatNumber: '', // Empty - user needs to set manually
        floorNumber,
        active: true,
        position: {
          x: afterX + 1,
          y,
        },
      }));

      const newSpacesForFloor = [...shiftedSpaces, ...newColumnSpaces];
      const newSeatConfiguration = currentSeatConfiguration.filter(
        (floor) => floor.floorNumber !== floorNumber,
      );
      newSeatConfiguration.push({
        floorNumber,
        spaces: newSpacesForFloor,
      });

      const orderedByFloorNumber = newSeatConfiguration.sort(
        (a, b) => a.floorNumber - b.floorNumber,
      );
      form.setFieldValue('seatConfiguration', orderedByFloorNumber);
    }
  };

  const onAddRow = (floorNumber: number) => {
    const currentSeatConfiguration = form.getFieldValue('seatConfiguration');
    const floorToModify = currentSeatConfiguration.find(
      (floor) => floor.floorNumber === floorNumber,
    );

    if (floorToModify && floorToModify.spaces.length > 0) {
      // Find the maximum Y position to add the new row after it
      const maxY = Math.max(
        ...floorToModify.spaces.map((space) => space.position.y),
      );
      const newRowY = maxY + 1;

      // Get unique X positions from existing spaces to maintain structure
      const uniqueXPositions = Array.from(
        new Set(floorToModify.spaces.map((space) => space.position.x)),
      ).sort((a, b) => a - b);

      // Create new row with one seat and the rest as empty spaces
      const newRowSpaces: SeatDiagramSpace[] = uniqueXPositions.map((x) => {
        return {
          spaceType: SpaceType.SEAT,
          seatType: SeatType.REGULAR,
          seatNumber: '', // Empty - user needs to set manually
          floorNumber,
          active: true,
          position: { x, y: newRowY },
        };
      });

      const newSpacesForFloor = [...floorToModify.spaces, ...newRowSpaces];
      const newSeatConfiguration = currentSeatConfiguration.filter(
        (floor) => floor.floorNumber !== floorNumber,
      );
      newSeatConfiguration.push({
        floorNumber,
        spaces: newSpacesForFloor,
      });

      const orderedByFloorNumber = newSeatConfiguration.sort(
        (a, b) => a.floorNumber - b.floorNumber,
      );
      form.setFieldValue('seatConfiguration', orderedByFloorNumber);
    }
  };

  const onRemoveColumn = (floorNumber: number, columnX: number) => {
    const currentSeatConfiguration = form.getFieldValue('seatConfiguration');
    const floorToModify = currentSeatConfiguration.find(
      (floor) => floor.floorNumber === floorNumber,
    );

    if (floorToModify) {
      // Remove spaces at the specified X position
      const spacesWithoutColumn = floorToModify.spaces.filter(
        (space) => space.position.x !== columnX,
      );

      // Shift spaces to the left (x > columnX)
      const shiftedSpaces = spacesWithoutColumn.map((space) => {
        if (space.position.x > columnX) {
          return {
            ...space,
            position: {
              ...space.position,
              x: space.position.x - 1,
            },
          };
        }
        return space;
      });

      const newSeatConfiguration = currentSeatConfiguration.filter(
        (floor) => floor.floorNumber !== floorNumber,
      );
      newSeatConfiguration.push({
        floorNumber,
        spaces: shiftedSpaces,
      });

      const orderedByFloorNumber = newSeatConfiguration.sort(
        (a, b) => a.floorNumber - b.floorNumber,
      );
      form.setFieldValue('seatConfiguration', orderedByFloorNumber);
    }
  };

  const onRemoveRow = (floorNumber: number) => {
    const currentSeatConfiguration = form.getFieldValue('seatConfiguration');
    const floorToModify = currentSeatConfiguration.find(
      (floor) => floor.floorNumber === floorNumber,
    );

    if (floorToModify && floorToModify.spaces.length > 0) {
      // Find the maximum Y position (last row)
      const maxY = Math.max(
        ...floorToModify.spaces.map((space) => space.position.y),
      );

      // Remove spaces from the last row
      const spacesWithoutLastRow = floorToModify.spaces.filter(
        (space) => space.position.y !== maxY,
      );

      const newSeatConfiguration = currentSeatConfiguration.filter(
        (floor) => floor.floorNumber !== floorNumber,
      );
      newSeatConfiguration.push({
        floorNumber,
        spaces: spacesWithoutLastRow,
      });

      const orderedByFloorNumber = newSeatConfiguration.sort(
        (a, b) => a.floorNumber - b.floorNumber,
      );
      form.setFieldValue('seatConfiguration', orderedByFloorNumber);
    }
  };

  return (
    <Form onSubmit={form.handleSubmit} className="w-full max-w-none">
      {/* General Configuration Section */}
      <FormLayout
        title={tSeatDiagrams('sections.generalConfiguration')}
        className="w-full max-w-none"
      >
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
            <field.NumberInput
              label={tSeatDiagrams('fields.maxCapacity')}
              isRequired
            />
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
        <FormLayout
          title={tSeatDiagrams('sections.quickConfiguration')}
          className="w-full max-w-none"
        >
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
                            type="button"
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
                              isRequired
                            />
                          )}
                        </form.AppField>
                        <form.AppField
                          name={`seatsPerFloor[${index}].seatsLeft`}
                        >
                          {(field) => (
                            <field.NumberInput
                              label={tSeatDiagrams('fields.seatsLeft')}
                              isRequired
                            />
                          )}
                        </form.AppField>
                        <form.AppField
                          name={`seatsPerFloor[${index}].seatsRight`}
                        >
                          {(field) => (
                            <field.NumberInput
                              label={tSeatDiagrams('fields.seatsRight')}
                              isRequired
                            />
                          )}
                        </form.AppField>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between">
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
                    <form.Subscribe
                      selector={(state) => {
                        const errorsKeys = state.errors.reduce(
                          (acc, errorMap) => {
                            if (errorMap) {
                              const errorsKeys = Object.keys(errorMap);
                              acc.push(...errorsKeys);
                            }
                            return acc;
                          },
                          [] as string[],
                        );
                        const hasSeatsPerFloorErrors = errorsKeys.some((key) =>
                          key.startsWith('seatsPerFloor'),
                        );
                        return [hasSeatsPerFloorErrors];
                      }}
                    >
                      {([hasSeatsPerFloorErrors]: [boolean]) => (
                        <Button
                          variant="outline"
                          type="button"
                          disabled={
                            hasSeatsPerFloorErrors ||
                            field.state.meta.isDefaultValue
                          }
                          onClick={() => {
                            const floors = createFloorsFromQuickConfig(
                              seatDiagramSchema.shape.seatsPerFloor.parse(
                                field.state.value,
                              ),
                            );
                            form.setFieldValue('seatConfiguration', floors);
                            form.validateSync('change');
                          }}
                        >
                          {tSeatDiagrams('actions.generateDiagram')}
                        </Button>
                      )}
                    </form.Subscribe>
                  </div>
                </div>
              )}
            </form.AppField>
          </div>
        </FormLayout>
      </div>
      <div className="pt-4">
        <FormLayout
          title={tSeatDiagrams('sections.seatsConfiguration')}
          className="w-full max-w-none"
        >
          <spaceForm.Subscribe selector={(state) => [state.values]}>
            {([selectedSpace]: [SeatDiagramSpace]) => (
              <form.Subscribe
                selector={(state) => [state.values.seatConfiguration]}
              >
                {([seatConfiguration]: [SeatDiagramSpace[]]) =>
                  seatConfiguration.length === 0 ? (
                    <div>
                      {tSeatDiagrams('form.placeholders.emptyQuickConfig')}
                    </div>
                  ) : (
                    <div className="grid gap-4 w-full">
                      <div className="flex gap-1">
                        {seatConfiguration.map((floor) => (
                          <Button
                            variant="outline"
                            size="sm"
                            key={floor.floorNumber}
                            onClick={() => {
                              setSelectedFloor(floor.floorNumber);
                            }}
                            type="button"
                            className={
                              selectedFloor === floor.floorNumber
                                ? 'bg-primary text-primary-foreground ring'
                                : ''
                            }
                          >
                            {tSeatDiagrams('fields.floor', {
                              floorNumber: floor.floorNumber,
                            })}
                          </Button>
                        ))}
                      </div>
                      <div className="h-[min(70vh,_700px)]">
                        <div className="grid gap-4 grid-cols-[3fr_auto_2fr] h-full">
                          <form.AppField name="seatConfiguration">
                            {(field) => {
                              const floor = field.state.value.find(
                                (floor) => floor.floorNumber === selectedFloor,
                              );
                              if (!floor) return null;
                              return (
                                <SeatDiagram
                                  spaces={floor.spaces as SeatDiagramSpace[]}
                                  floorNumber={floor.floorNumber}
                                  onClick={handleSpaceClick}
                                  selectedSpace={selectedSpace}
                                  onAddColumn={onAddColumn}
                                  onAddRow={onAddRow}
                                  onRemoveColumn={onRemoveColumn}
                                  onRemoveRow={onRemoveRow}
                                />
                              );
                            }}
                          </form.AppField>
                          <div className="p-4 pt-20 text-sm ">
                            <ul>
                              <li className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-white border border-gray-300 rounded-full" />
                                {tSeatDiagrams('form.placeholders.seatTypes', {
                                  seatType: SeatType.REGULAR,
                                })}
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-purple-100 border border-purple-500 rounded-full" />
                                {tSeatDiagrams('form.placeholders.seatTypes', {
                                  seatType: SeatType.PREMIUM,
                                })}
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-green-100 border border-green-500 rounded-full" />
                                {tSeatDiagrams('form.placeholders.seatTypes', {
                                  seatType: SeatType.VIP,
                                })}
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-100 border border-blue-500 rounded-full" />
                                {tSeatDiagrams('form.placeholders.seatTypes', {
                                  seatType: SeatType.BUSINESS,
                                })}
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-yellow-100 border border-yellow-500 rounded-full" />
                                {tSeatDiagrams('form.placeholders.seatTypes', {
                                  seatType: SeatType.EXECUTIVE,
                                })}
                              </li>
                              <li className="flex items-center gap-2">
                                <Bath className="w-3 h-3" />
                                {tSeatDiagrams('form.spaceTypes.bathroom')}
                              </li>
                              <li className="flex items-center gap-2">
                                <MoveUpRight className="w-3 h-3" />
                                {tSeatDiagrams('form.spaceTypes.stairs')}
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-white border-dashed border-2 border-gray-300 rounded-full" />
                                {tSeatDiagrams('form.spaceTypes.empty')}
                              </li>
                            </ul>
                          </div>
                          <Card>
                            <CardHeader>
                              <CardTitle>
                                {tSeatDiagrams('form.placeholders.editSpace')}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="h-full">
                              <spaceForm.Subscribe
                                selector={(state) => {
                                  return [
                                    state.values.spaceType,
                                    state.canSubmit,
                                    state.isSubmitting,
                                  ];
                                }}
                              >
                                {([spaceType, canSubmit, isSubmitting]: [
                                  SpaceType,
                                  boolean,
                                  boolean,
                                ]) => (
                                  <>
                                    {!spaceType ? (
                                      <div>
                                        {tSeatDiagrams(
                                          'form.placeholders.selectSpace',
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-2 justify-between h-full">
                                        <div className="grid gap-2">
                                          <spaceForm.AppField name="spaceType">
                                            {(field) => (
                                              <field.SelectInput
                                                label={tSeatDiagrams(
                                                  'fields.spaceType',
                                                )}
                                                isRequired
                                                placeholder={tSeatDiagrams(
                                                  'form.placeholders.spaceType',
                                                )}
                                                disabled={
                                                  spaceType === SpaceType.EMPTY
                                                }
                                                items={Object.values(
                                                  SpaceType,
                                                ).map((type) => ({
                                                  id: type,
                                                  name: tSeatDiagrams(
                                                    `form.spaceTypes.${type}`,
                                                  ),
                                                  hidden:
                                                    type === SpaceType.EMPTY,
                                                }))}
                                              />
                                            )}
                                          </spaceForm.AppField>
                                          {spaceType === SpaceType.SEAT && (
                                            <>
                                              <spaceForm.AppField name="seatType">
                                                {(field) => (
                                                  <field.SelectInput
                                                    label={tSeatDiagrams(
                                                      'fields.seatType',
                                                    )}
                                                    isRequired
                                                    placeholder={tSeatDiagrams(
                                                      'form.placeholders.seatType',
                                                    )}
                                                    items={Object.values(
                                                      SeatType,
                                                    ).map((type) => ({
                                                      id: type,
                                                      name: tSeatDiagrams(
                                                        `form.seatTypes.${type}`,
                                                      ),
                                                    }))}
                                                  />
                                                )}
                                              </spaceForm.AppField>
                                              <spaceForm.AppField name="seatNumber">
                                                {(field) => (
                                                  <field.TextInput
                                                    label={tSeatDiagrams(
                                                      'fields.seatNumber',
                                                    )}
                                                    isRequired
                                                    placeholder={tSeatDiagrams(
                                                      'form.placeholders.seatNumber',
                                                    )}
                                                  />
                                                )}
                                              </spaceForm.AppField>
                                            </>
                                          )}
                                          <div className="pt-2">
                                            <spaceForm.AppField name="spaceType">
                                              {(field) => (
                                                <BaseSwitchInput
                                                  label={tSeatDiagrams(
                                                    'fields.disableSpace',
                                                  )}
                                                  name="disable-space"
                                                  value={
                                                    field.state.value ===
                                                    SpaceType.EMPTY
                                                  }
                                                  onChange={(value) => {
                                                    field.handleChange(
                                                      value
                                                        ? SpaceType.EMPTY
                                                        : SpaceType.SEAT,
                                                    );
                                                    spaceForm.validateSync(
                                                      'change',
                                                    );
                                                  }}
                                                />
                                              )}
                                            </spaceForm.AppField>
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          type="button"
                                          onClick={spaceForm.handleSubmit}
                                          disabled={!canSubmit || isSubmitting}
                                          className="mt-4"
                                        >
                                          {tCommon('actions.save')}
                                        </Button>
                                      </div>
                                    )}
                                  </>
                                )}
                              </spaceForm.Subscribe>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  )
                }
              </form.Subscribe>
            )}
          </spaceForm.Subscribe>
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
