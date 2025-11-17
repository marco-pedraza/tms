import {
  KnownServerEntities,
  KnownServerErrors,
  KnownServerFields,
  UseCommonTranslationsResult,
  UseValidationsTranslationsResult,
} from '@/types/translations';

type TranslatedValidationErrors = {
  [key in KnownServerErrors]: string;
};

/**
 * Type helper for namespace-specific translation functions from useTranslations.
 *
 * Since next-intl returns functions with strict literal union types for keys,
 * we need to use `any` here to accept any translation function. This is safe
 * because we only call it with dynamic string keys at runtime and handle
 * missing translations gracefully.
 *
 * The `any` type is necessary because:
 * - next-intl uses strict literal union types like `'errors.notFound' | 'fields.name'`
 * - We need runtime flexibility to pass dynamic string keys
 * - TypeScript doesn't allow a function with specific literal params to be assigned
 *   to a function with generic string params (contravariance)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NamespaceTranslationFunction = (key: any) => string;

export interface ValidationErrorMetadata {
  code: KnownServerErrors | string;
  value: string | { fieldName?: string };
  message: string;
}

interface GetTranslatedValidationErrorProps {
  tValidations: UseValidationsTranslationsResult;
  tCommon: UseCommonTranslationsResult;
  error: ValidationErrorMetadata;
  property: KnownServerFields;
  entity: KnownServerEntities;
  tNamespace?: NamespaceTranslationFunction;
}

/**
 * Converts SNAKE_CASE error codes to camelCase for translation keys.
 *
 * @param str - The error code in SNAKE_CASE format
 * @returns The error code in camelCase format
 *
 * @example
 * toCamelCase('SAME_ORIGIN_DESTINATION') // Returns 'sameOriginDestination'
 * toCamelCase('EMPTY_TRIP_SELLABLE') // Returns 'emptyTripSellable'
 */
function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    .replace(/^[a-z]/, (letter) => letter.toLowerCase());
}

/**
 * Handles invalid format error translation with specific domain logic.
 *
 * @param error - The validation error metadata
 * @param property - The field property that failed validation
 * @param tValidations - Validation translations function
 * @param tCommon - Common translations function
 * @returns The appropriate validation message for invalid format errors
 */
function getInvalidFormatMessage(
  error: ValidationErrorMetadata,
  property: KnownServerFields,
  tValidations: UseValidationsTranslationsResult,
  tCommon: UseCommonTranslationsResult,
): string {
  // Check if value contains field information from the form
  if (typeof error.value === 'object' && error.value !== null) {
    // Special handling for operating hours errors that include day information
    if (
      property === 'operatingHours' &&
      'day' in error.value &&
      error.value.day
    ) {
      const day = error.value.day as string;
      const dayName = tCommon(`days.${day}` as never);
      return tValidations('server.invalid_format', {
        fieldName: dayName,
      });
    }
  }

  // Default case for other fields
  return tValidations('server.invalid_format', {
    fieldName: tValidations(`fields.${property}`),
  });
}

export function getTranslatedValidationError({
  tValidations,
  tCommon,
  error,
  property,
  entity,
  tNamespace,
}: GetTranslatedValidationErrorProps): string {
  const errorCode = error.code.toLowerCase();

  // Try namespace-specific translation first (e.g., pathways.server.*)
  if (tNamespace) {
    const namespaceErrorKey = `server.${toCamelCase(error.code)}`;
    try {
      // Internal cast: useTranslations has strict types but accepts any string at runtime
      const translateFn = tNamespace as (key: string) => string;
      const namespaceTranslation = translateFn(namespaceErrorKey);
      // Check if translation was found (next-intl returns key if not found)
      if (namespaceTranslation && namespaceTranslation !== namespaceErrorKey) {
        return namespaceTranslation;
      }
    } catch {
      // Fall through to generic errors
    }
  }

  // Try generic known errors
  const translatedValidationErrors: TranslatedValidationErrors = {
    duplicate: tValidations('server.duplicate', {
      entity: tValidations(`entities.${entity}`),
      property: tValidations(`fields.${property}`),
      value:
        typeof error.value === 'string'
          ? error.value
          : JSON.stringify(error.value),
    }),
    invalid_format: getInvalidFormatMessage(
      error,
      property,
      tValidations,
      tCommon,
    ),
    invalid_status: tValidations('server.invalid_status'),
    invalid_password: tValidations('server.invalid_password'),
  };

  const isKnownServerError = Object.keys(translatedValidationErrors).includes(
    errorCode,
  );

  // Return generic translation or fallback to server message
  return isKnownServerError
    ? translatedValidationErrors[errorCode as KnownServerErrors]
    : error.message;
}
