import {
  KnownEntities,
  KnownFields,
  KnownServerErrors,
  UseTranslationsResult,
} from '@/types/translations';

type TranslatedValidationErrors = {
  [key in KnownServerErrors]: string;
};

export interface ValidationErrorMetadata {
  code: KnownServerErrors | string;
  value: string;
  message: string;
}

interface GetTranslatedValidationErrorProps {
  tCommon: UseTranslationsResult;
  error: ValidationErrorMetadata;
  property: string;
  entity: string;
}

export function getTranslatedValidationError({
  tCommon,
  error,
  property,
  entity,
}: GetTranslatedValidationErrorProps): string {
  const translatedValidationErrors: TranslatedValidationErrors = {
    duplicate: tCommon('validations.server.duplicate', {
      entity: tCommon(`entities.${entity as KnownEntities}`),
      property: tCommon(`fields.${property as KnownFields}`),
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
