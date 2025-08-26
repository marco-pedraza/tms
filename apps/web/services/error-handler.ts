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
}: GetTranslatedValidationErrorProps): string {
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
  };
  const errorCode = error.code.toLowerCase();
  const isKnownServerError = Object.keys(translatedValidationErrors).includes(
    errorCode,
  );
  return isKnownServerError
    ? // Safely casting after checking if the error is known
      translatedValidationErrors[errorCode as KnownServerErrors]
    : error.message;
}
