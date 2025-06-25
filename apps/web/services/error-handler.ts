import { KnownServerErrors, UseTranslationsResult } from '@/types/translations';

type TranslatedValidationErrors = {
  [key in KnownServerErrors]: string;
};

export interface ValidationErrorMetadata {
  code: KnownServerErrors | string;
  value: string;
  message: string;
}

export function getTranslatedValidationError(
  tCommon: UseTranslationsResult,
  error: ValidationErrorMetadata,
): string {
  const translatedValidationErrors: TranslatedValidationErrors = {
    duplicate: tCommon('validations.server.duplicate', {
      // @todo Entity and property should be dynamic.
      entity: tCommon('entities.country'),
      property: tCommon('fields.code'),
      value: error.value,
    }),
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
