import { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import useForm from '@/hooks/use-form';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';
import InstallationTypeSchemaForm from './installation-type-schema-form';
import { createInstallationTypeSchemaFormSchema } from './installation-type-schema-form';

const createInstallationTypeFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') })
      .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, {
        message: tValidations('name.letters'),
      }),
    code: z
      .string()
      .min(1, { message: tValidations('required') })
      .regex(/^[A-Z0-9-]+$/, {
        message: tValidations('code.alphanumeric'),
      }),
    description: z.string().optional(),
    active: z.boolean().optional(),
    schemas: z.array(createInstallationTypeSchemaFormSchema(tValidations)),
  });

export type InstallationTypeFormValues = z.output<
  ReturnType<typeof createInstallationTypeFormSchema>
>;

type InstallationTypeFormRawValues = z.input<
  ReturnType<typeof createInstallationTypeFormSchema>
>;

interface InstallationTypeFormProps {
  defaultValues?: InstallationTypeFormValues;
  onSubmit: (values: InstallationTypeFormValues) => Promise<unknown>;
}

export default function InstallationTypeForm({
  defaultValues,
  onSubmit,
}: InstallationTypeFormProps) {
  const tCommon = useTranslations('common');
  const tInstallationTypes = useTranslations('installationTypes');
  const tValidations = useTranslations('validations');
  const installationTypeSchema = createInstallationTypeFormSchema(tValidations);
  const rawDefaultValues: InstallationTypeFormRawValues = defaultValues
    ? {
        ...defaultValues,
        schemas:
          defaultValues?.schemas?.map((schema) => ({
            ...schema,
            id: schema.id?.toString(),
            options: {
              enumValues: schema.options?.enumValues?.join(',') ?? '',
            },
          })) || [],
      }
    : {
        name: '',
        code: '',
        description: '',
        active: true,
        schemas: [],
      };
  const form = useForm({
    defaultValues: rawDefaultValues,
    validators: {
      onChange: installationTypeSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = installationTypeSchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'installationType',
          error,
          tValidations,
        });
      }
    },
  });
  const [showSchemaForm, setShowSchemaForm] = useState(false);

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tCommon('sections.basicInfo')}>
        <form.AppField name="name">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.name')}
              placeholder={tInstallationTypes('form.placeholders.name')}
              isRequired
            />
          )}
        </form.AppField>
        <form.AppField name="code">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.code')}
              placeholder={tInstallationTypes('form.placeholders.code')}
              isRequired
            />
          )}
        </form.AppField>
        <form.AppField name="description">
          {(field) => (
            <field.TextAreaInput
              label={tCommon('fields.description')}
              placeholder={tInstallationTypes('form.placeholders.description')}
            />
          )}
        </form.AppField>
        <form.AppField name="active">
          {(field) => <field.SwitchInput label={tCommon('fields.active')} />}
        </form.AppField>
      </FormLayout>
      <div className="pt-4">
        <FormLayout title={tInstallationTypes('form.sections.schemas.title')}>
          <form.AppField name="schemas">
            {(field) => (
              <Dialog open={showSchemaForm} onOpenChange={setShowSchemaForm}>
                <div className="w-full border rounded-md grid">
                  <Table>
                    <TableBody>
                      {field.state.value?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-left">
                            {tInstallationTypes(
                              'form.sections.schemas.emptyText',
                            )}
                          </TableCell>
                        </TableRow>
                      ) : (
                        field.state.value?.map((schema, index) => {
                          if (!schema) return null;
                          return (
                            <TableRow key={`${schema.name}-${index}`}>
                              <TableCell>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold">
                                      {schema.name}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {tInstallationTypes(
                                        `form.schemas.fieldTypes.${schema.type}`,
                                      )}
                                    </span>
                                    <span className="text-sm text-muted-foreground italic">
                                      {schema.required &&
                                        tInstallationTypes(
                                          'form.schemas.required',
                                        )}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    onClick={() => {
                                      field.setValue(
                                        field.state.value?.filter(
                                          (_, stateIndex) =>
                                            stateIndex !== index,
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
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="justify-start rounded-none rounded-bl-lg rounded-br-lg"
                      type="button"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {tInstallationTypes('form.sections.schemas.addAttribute')}
                    </Button>
                  </DialogTrigger>
                </div>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {tInstallationTypes('form.sections.schemas.addAttribute')}
                    </DialogTitle>
                  </DialogHeader>
                  <InstallationTypeSchemaForm
                    invalidNameValues={
                      field.state.value?.map((schema) => schema.name) ?? []
                    }
                    onSubmit={(values) => {
                      form.pushFieldValue('schemas', values);
                      setShowSchemaForm(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
            )}
          </form.AppField>
        </FormLayout>
      </div>
      <FormFooter>
        <form.AppForm>
          <form.SubmitButton>
            {defaultValues
              ? tInstallationTypes('actions.update')
              : tInstallationTypes('actions.create')}
          </form.SubmitButton>
        </form.AppForm>
      </FormFooter>
    </Form>
  );
}
