import { format } from 'date-fns';
import { z } from 'zod';
import {
  type InstallationSchema,
  InstallationSchemaFieldType,
} from '@/types/installation-schemas';
import { UseValidationsTranslationsResult } from '@/types/translations';

/**
 * Creates a dynamic Zod schema based on installation type schema definitions
 * @param schemas - Array of installation schema definitions from the API
 * @param tValidations - Validation translations function
 * @returns Zod schema object for form validation
 */
export function createDynamicFormSchema(
  schemas: InstallationSchema[],
  tValidations: UseValidationsTranslationsResult,
) {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  for (const schema of schemas) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let zodField: any;
    const fieldName = schema.name;
    const enumValues = schema.options.enumValues || [];

    switch (schema.type) {
      case InstallationSchemaFieldType.STRING:
        zodField = z.string();
        if (schema.required) {
          zodField = zodField.min(1, { message: tValidations('required') });
        }
        break;

      case InstallationSchemaFieldType.LONG_TEXT:
        zodField = z.string();
        if (schema.required) {
          zodField = zodField.min(1, { message: tValidations('required') });
        }
        break;

      case InstallationSchemaFieldType.NUMBER:
        zodField = z
          .string()
          .refine(
            (val: string) => {
              if (!schema.required && val === '') return true;
              return !isNaN(parseFloat(val));
            },
            { message: tValidations('required') },
          )
          .transform((val: string) =>
            val === '' ? undefined : parseFloat(val),
          );

        if (schema.required) {
          zodField = z
            .string()
            .min(1, { message: tValidations('required') })
            .refine((val: string) => !isNaN(parseFloat(val)), {
              message: tValidations('mustBeNumber'),
            })
            .transform((val: string) => parseFloat(val));
        }
        break;

      case InstallationSchemaFieldType.BOOLEAN:
        zodField = z.boolean();
        break;

      case InstallationSchemaFieldType.DATE:
        zodField = z.string();
        if (schema.required) {
          zodField = zodField.min(1, { message: tValidations('required') });
        }
        zodField = zodField
          .refine(
            (val: string) => {
              if (!schema.required && val === '') return true;
              return !isNaN(Date.parse(val));
            },
            { message: tValidations('mustBeDate') },
          )
          .transform((val: string) =>
            val === '' ? undefined : format(new Date(val), 'yyyy-MM-dd'),
          );
        break;

      case InstallationSchemaFieldType.ENUM:
        if (enumValues.length > 0) {
          zodField = z.enum(enumValues as [string, ...string[]], {
            message: tValidations('required'),
          });
          if (schema.required) {
            zodField = zodField.refine(
              (val: string) => enumValues.includes(val),
              {
                message: tValidations('required'),
              },
            );
          }
        } else {
          // Fallback if no enum values are provided
          zodField = z.string();
          if (schema.required) {
            zodField = zodField.min(1, { message: tValidations('required') });
          }
        }
        break;

      default:
        zodField = z.string();
        if (schema.required) {
          zodField = zodField.min(1, { message: tValidations('required') });
        }
        break;
    }

    // Make field optional if not required (except for boolean which should always be defined)
    if (
      !schema.required &&
      schema.type !== InstallationSchemaFieldType.BOOLEAN
    ) {
      zodField = zodField.optional();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (schemaObject as any)[fieldName] = zodField;
  }

  return z.object(schemaObject);
}

/**
 * Creates default values for a dynamic form based on schema definitions
 * @param schemas - Array of installation schema definitions
 * @returns Object with default values for each field
 */
export function createDynamicFormDefaultValues(
  schemas: InstallationSchema[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultValues: Record<string, any> = {};

  for (const schema of schemas) {
    switch (schema.type) {
      case InstallationSchemaFieldType.STRING:
      case InstallationSchemaFieldType.LONG_TEXT:
        defaultValues[schema.name] = '';
        break;
      case InstallationSchemaFieldType.NUMBER:
        defaultValues[schema.name] = '';
        break;
      case InstallationSchemaFieldType.BOOLEAN:
        defaultValues[schema.name] = false;
        break;
      case InstallationSchemaFieldType.DATE:
        defaultValues[schema.name] = '';
        break;
      case InstallationSchemaFieldType.ENUM:
        defaultValues[schema.name] = schema.required
          ? schema.options.enumValues?.[0] || ''
          : '';
        break;
      default:
        defaultValues[schema.name] = '';
        break;
    }
  }

  return defaultValues;
}

/**
 * Transforms form values back to API format
 * @param formValues - Raw form values from the form
 * @param schemas - Schema definitions for transformation context
 * @returns Transformed values ready for API submission
 */
export function transformFormValuesToApiFormat(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formValues: Record<string, any>,
  schemas: InstallationSchema[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiValues: Record<string, any> = {};

  for (const schema of schemas) {
    const value = formValues[schema.name];

    if (value === undefined || value === null) {
      continue;
    }

    switch (schema.type) {
      case InstallationSchemaFieldType.STRING:
      case InstallationSchemaFieldType.LONG_TEXT:
      case InstallationSchemaFieldType.ENUM:
        apiValues[schema.name] = value;
        break;
      case InstallationSchemaFieldType.NUMBER:
        apiValues[schema.name] =
          typeof value === 'number' ? value : parseFloat(value);
        break;
      case InstallationSchemaFieldType.BOOLEAN:
        apiValues[schema.name] = Boolean(value);
        break;
      case InstallationSchemaFieldType.DATE:
        apiValues[schema.name] =
          value instanceof Date ? value.toISOString() : value;
        break;
      default:
        apiValues[schema.name] = value;
        break;
    }
  }

  return apiValues;
}
