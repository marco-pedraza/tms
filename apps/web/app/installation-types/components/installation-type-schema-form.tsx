import { useStore } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { installation_schemas } from '@repo/ims-client';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import useForm from '@/hooks/use-form';
import { UseValidationsTranslationsResult } from '@/types/translations';
import { cn } from '@/utils/cn';
import { createEnumArray } from '@/utils/create-enum-array';

const installationSchemaTypes =
  createEnumArray<installation_schemas.InstallationSchemaFieldType>({
    string: undefined,
    long_text: undefined,
    number: undefined,
    boolean: undefined,
    date: undefined,
    enum: undefined,
  });

export const createInstallationTypeSchemaFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) => {
  const baseSchema = z.object({
    id: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined)),
    name: z.string().min(1, { message: tValidations('required') }),
    required: z.boolean(),
    description: z.string(),
  });

  // Esquema para el tipo de dato enum
  const enumSchema = baseSchema.extend({
    type: z
      .enum(['enum'], {
        message: tValidations('required'),
      })
      .transform(
        (val) => val as installation_schemas.InstallationSchemaFieldType,
      ),
    options: z.object({
      enumValues: z
        .string()
        .min(1, { message: tValidations('required') })
        .trim()
        .regex(
          /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s]+(?:,[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s]+)*$/,
          {
            message: tValidations('enumValues.commaSeparated'),
          },
        )
        .transform((val) => {
          const splitted = val
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item !== '');
          return splitted;
        }),
    }),
  });

  // Esquema para otros tipos de dato
  const otherTypesSchema = baseSchema.extend({
    type: z
      .enum(['string', 'long_text', 'number', 'boolean', 'date'], {
        message: tValidations('required'),
      })
      .transform(
        (val) => val as installation_schemas.InstallationSchemaFieldType,
      ),
    options: z
      .object({
        enumValues: z.string().transform(() => [] as string[]),
      })
      .transform(() => undefined),
  });

  return z.discriminatedUnion('type', [enumSchema, otherTypesSchema], {
    message: tValidations('required'),
  });
};

export type InstallationTypeSchemaFormRawValues = z.input<
  ReturnType<typeof createInstallationTypeSchemaFormSchema>
>;

interface InstallationTypeSchemaFormProps {
  invalidNameValues: string[];
  onSubmit: (values: InstallationTypeSchemaFormRawValues) => void;
}

export default function InstallationTypeSchemaForm({
  invalidNameValues,
  onSubmit,
}: InstallationTypeSchemaFormProps) {
  const tInstallationTypes = useTranslations('installationTypes');
  const tValidations = useTranslations('validations');
  const installationTypeSchemaFormSchema =
    createInstallationTypeSchemaFormSchema(tValidations);
  const form = useForm({
    defaultValues: {
      name: '',
      type: 'string' as installation_schemas.InstallationSchemaFieldType,
      required: true,
      options: {
        enumValues: '',
      },
      description: '',
    },
    validators: {
      onChange: installationTypeSchemaFormSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit(value);
    },
  });
  const isEnumDataType = useStore(
    form.store,
    (state) => state.values.type === 'enum',
  );

  return (
    <Form onSubmit={form.handleSubmit}>
      <div className="grid gap-4 pt-6">
        <form.AppField
          name="name"
          validators={{
            onChange: ({ value }) => {
              if (invalidNameValues.includes(value)) {
                return {
                  message: tInstallationTypes('errors.duplicatedAttributeName'),
                };
              }
            },
          }}
        >
          {(field) => (
            <field.TextInput
              label={tInstallationTypes('form.fields.name')}
              placeholder={tInstallationTypes('form.placeholders.schemaName')}
              isRequired
            />
          )}
        </form.AppField>
        <form.AppField name="type">
          {(field) => (
            <field.SelectInput
              label={tInstallationTypes('form.fields.dataType')}
              isRequired
              placeholder={tInstallationTypes('form.placeholders.dataType')}
              items={installationSchemaTypes.map((type) => ({
                id: type,
                name: tInstallationTypes(`form.schemas.fieldTypes.${type}`),
              }))}
            />
          )}
        </form.AppField>
        <div className={cn(!isEnumDataType && 'hidden')}>
          <form.AppField name="options.enumValues">
            {(field) => (
              <field.TextInput
                label={tInstallationTypes('form.fields.enumValues')}
                placeholder={tInstallationTypes('form.placeholders.enumValues')}
                description={tInstallationTypes('form.helpText.enumValues')}
                isRequired
              />
            )}
          </form.AppField>
        </div>
        <form.AppField name="description">
          {(field) => (
            <field.TextAreaInput
              label={tInstallationTypes('form.fields.description')}
              placeholder={tInstallationTypes(
                'form.placeholders.schemaDescription',
              )}
            />
          )}
        </form.AppField>
        <form.AppField name="required">
          {(field) => (
            <field.SwitchInput
              label={tInstallationTypes('form.fields.required')}
            />
          )}
        </form.AppField>
        <FormFooter>
          <form.AppForm>
            <form.SubmitButton>
              {tInstallationTypes('form.sections.schemas.addAttribute')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </div>
    </Form>
  );
}
