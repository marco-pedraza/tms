'use client';

import { PlusCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import useForm from '@/hooks/use-form';
import useQueryAssignableCities from '@/populations/hooks/use-query-assignable-cities';
import { UseTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createPopulationSchema = (tCommon: UseTranslationsResult) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: tCommon('validations.required') })
      .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, {
        message: tCommon('validations.name.letters'),
      }),
    code: z
      .string()
      .min(1, { message: tCommon('validations.required') })
      .regex(/^[A-Z0-9-]+$/, {
        message: tCommon('validations.code.alphanumeric'),
      }),
    description: z.string().optional(),
    active: z.boolean(),
    cities: z.array(z.string()),
  });

export type PopulationFormValues = z.infer<
  ReturnType<typeof createPopulationSchema>
>;

interface PopulationFormProps {
  defaultValues?: PopulationFormValues;
  onSubmit: (values: PopulationFormValues) => Promise<unknown>;
  populationId?: number;
}

/**
 * Form component for creating and editing populations
 */
export default function PopulationForm({
  defaultValues,
  onSubmit,
  populationId,
}: PopulationFormProps) {
  const tPopulations = useTranslations('populations');
  const tCommon = useTranslations('common');
  const populationSchema = createPopulationSchema(tCommon);
  const form = useForm({
    defaultValues: defaultValues ?? {
      name: '',
      code: '',
      description: '',
      active: true,
      cities: [],
    },
    validators: {
      onChange: populationSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = populationSchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'population',
          error,
          tCommon,
        });
      }
    },
  });
  const { data: cities } = useQueryAssignableCities({
    populationId,
  });

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tPopulations('form.title')}>
        <form.AppField name="name">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.name')}
              placeholder={tPopulations('form.placeholders.name')}
            />
          )}
        </form.AppField>

        <form.AppField name="code">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.code')}
              placeholder={tPopulations('form.placeholders.code')}
            />
          )}
        </form.AppField>

        <form.AppField name="description">
          {(field) => (
            <field.TextAreaInput
              label={tCommon('fields.description')}
              placeholder={tPopulations('form.placeholders.description')}
            />
          )}
        </form.AppField>

        <form.AppField name="active">
          {(field) => <field.SwitchInput label={tCommon('fields.active')} />}
        </form.AppField>
      </FormLayout>

      <div className="mt-4">
        <FormLayout title={tPopulations('sections.cities.title')}>
          <form.AppField name="cities">
            {(field) => (
              <div className="w-full border rounded-md grid">
                <Table>
                  <TableBody>
                    {field.state.value?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-left">
                          {tPopulations('sections.cities.emptyText')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      field.state.value?.map((id) => {
                        const city = cities?.data.find(
                          (city) => city.id.toString() === id,
                        );
                        if (!city) return null;
                        return (
                          <TableRow key={id}>
                            <TableCell>
                              <div className="flex items-center justify-between">
                                <span>
                                  {city?.name}, {city?.state.name}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  type="button"
                                  onClick={() => {
                                    field.setValue(
                                      field.state.value?.filter(
                                        (id) => id !== city.id.toString(),
                                      ),
                                    );
                                  }}
                                >
                                  <X />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                    <TableRow>
                      <TableCell className="h-0 p-0"></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="justify-start"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {tPopulations('sections.cities.assignCity')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder={tPopulations(
                          'sections.cities.searchPlaceholder',
                        )}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {tPopulations('sections.cities.noResults')}
                        </CommandEmpty>
                        <CommandGroup>
                          {cities?.data.map((city) => {
                            const isSelected = field.state.value?.includes(
                              city.id.toString(),
                            );
                            if (isSelected) {
                              return null;
                            }
                            return (
                              <CommandItem
                                key={city.id}
                                onSelect={() => {
                                  field.setValue([
                                    ...(field.state.value ?? []),
                                    city.id.toString(),
                                  ]);
                                }}
                              >
                                {city.name}, {city.state.name}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </form.AppField>
        </FormLayout>
      </div>

      <FormFooter>
        <form.AppForm>
          <form.SubmitButton>
            {defaultValues
              ? tPopulations('actions.update')
              : tPopulations('actions.create')}
          </form.SubmitButton>
        </form.AppForm>
      </FormFooter>
    </Form>
  );
}
