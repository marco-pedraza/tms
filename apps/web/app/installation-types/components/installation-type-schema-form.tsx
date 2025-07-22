import { useStore } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { installation_schemas } from '@repo/ims-client';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import useForm from '@/hooks/use-form';
import { UseTranslationsResult } from '@/types/translations';
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
  tCommon: UseTranslationsResult,
) => {
  const baseSchema = z.object({
    id: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined)),
    name: z.string(),
    label: z.string().min(1, { message: tCommon('validations.required') }),
    required: z.boolean(),
    description: z.string(),
  });

  // Esquema para el tipo de dato enum
  const enumSchema = baseSchema.extend({
    type: z
      .enum(['enum'], {
        message: tCommon('validations.required'),
      })
      .transform(
        (val) => val as installation_schemas.InstallationSchemaFieldType,
      ),
    options: z.object({
      enumValues: z
        .string()
        .min(1, { message: tCommon('validations.required') })
        .trim()
        .regex(/^[a-zA-Z0-9\s]+(?:,[a-zA-Z0-9\s]+)*$/, {
          message: tCommon('validations.enumValues.commaSeparated'),
        })
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
        message: tCommon('validations.required'),
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
    message: tCommon('validations.required'),
  });
};

export type InstallationTypeSchemaFormRawValues = z.input<
  ReturnType<typeof createInstallationTypeSchemaFormSchema>
>;

interface InstallationTypeSchemaFormProps {
  onSubmit: (values: InstallationTypeSchemaFormRawValues) => void;
}

export default function InstallationTypeSchemaForm({
  onSubmit,
}: InstallationTypeSchemaFormProps) {
  const tCommon = useTranslations('common');
  const tInstallationTypes = useTranslations('installationTypes');
  const installationTypeSchemaFormSchema =
    createInstallationTypeSchemaFormSchema(tCommon);
  const form = useForm({
    defaultValues: {
      label: '',
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
        <form.AppField name="label">
          {(field) => (
            <field.TextInput
              label={tInstallationTypes('form.fields.label')}
              placeholder={tInstallationTypes('form.placeholders.schemaLabel')}
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
