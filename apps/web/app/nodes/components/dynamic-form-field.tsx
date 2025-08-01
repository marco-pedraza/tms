import { useTranslations } from 'next-intl';
import {
  type InstallationSchema,
  InstallationSchemaFieldType,
} from '@/types/installation-schemas';

interface DynamicFormFieldProps {
  schema: InstallationSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}

/**
 * Renders a dynamic form field based on installation schema definition
 */
export default function DynamicFormField({
  schema,
  form,
}: DynamicFormFieldProps) {
  const fieldName = schema.name;
  const tNodes = useTranslations('nodes');

  const renderField = () => {
    switch (schema.type) {
      case InstallationSchemaFieldType.STRING:
        return (
          <form.AppField name={fieldName}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <field.TextInput
                label={schema.name}
                description={schema.description || undefined}
                isRequired={schema.required}
              />
            )}
          </form.AppField>
        );

      case InstallationSchemaFieldType.LONG_TEXT:
        return (
          <form.AppField name={fieldName}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <field.TextAreaInput
                label={schema.name}
                description={schema.description || undefined}
                isRequired={schema.required}
              />
            )}
          </form.AppField>
        );

      case InstallationSchemaFieldType.NUMBER:
        return (
          <form.AppField name={fieldName}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <field.NumberInput
                label={schema.name}
                description={schema.description || undefined}
                isRequired={schema.required}
              />
            )}
          </form.AppField>
        );

      case InstallationSchemaFieldType.BOOLEAN:
        return (
          <form.AppField name={fieldName}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <field.SwitchInput
                label={schema.name}
                description={schema.description || undefined}
              />
            )}
          </form.AppField>
        );

      case InstallationSchemaFieldType.DATE:
        return (
          <form.AppField name={fieldName}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <field.TextInput
                type="date"
                label={schema.name}
                description={schema.description || undefined}
                isRequired={schema.required}
              />
            )}
          </form.AppField>
        );

      case InstallationSchemaFieldType.ENUM: {
        const enumOptions = (schema.options.enumValues || []).map((value) => ({
          id: value,
          name: value,
        }));

        return (
          <form.AppField name={fieldName}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <field.SelectInput
                label={schema.name}
                description={schema.description || undefined}
                isRequired={schema.required}
                placeholder={tNodes('form.placeholders.selectEnumOption')}
                items={enumOptions}
              />
            )}
          </form.AppField>
        );
      }

      default:
        return (
          <form.AppField name={fieldName}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <field.TextInput
                label={schema.name}
                description={schema.description || undefined}
                isRequired={schema.required}
              />
            )}
          </form.AppField>
        );
    }
  };

  return renderField();
}
