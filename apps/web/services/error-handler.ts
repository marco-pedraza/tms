import {
  KnownServerEntities,
  KnownServerErrors,
  KnownServerFields,
  UseValidationsTranslationsResult,
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
  tValidations: UseValidationsTranslationsResult;
  error: ValidationErrorMetadata;
  property: KnownServerFields;
  entity: KnownServerEntities;
}

export function getTranslatedValidationError({
  tValidations,
  error,
  property,
  entity,
}: GetTranslatedValidationErrorProps): string {
  const translatedValidationErrors: TranslatedValidationErrors = {
    duplicate: tValidations('server.duplicate', {
      entity: tValidations(`entities.${entity}`),
      property: tValidations(`fields.${property}`),
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
