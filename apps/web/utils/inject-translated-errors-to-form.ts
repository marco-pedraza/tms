import { isAPIError } from '@repo/ims-client';
import useForm from '@/hooks/use-form';
import {
  ValidationErrorMetadata,
  getTranslatedValidationError,
} from '@/services/error-handler';
import { UseTranslationsResult } from '@/types/translations';

export default function injectTranslatedErrorsToForm(
  form: ReturnType<typeof useForm>,
  error: unknown,
  tCommon: UseTranslationsResult,
) {
  if (!isAPIError(error)) return;
  if (!error.details || Object.keys(error.details).length === 0) return;
  Object.keys(error.details).forEach((key) => {
    form.setFieldMeta(key, (meta) => {
      return {
        ...meta,
        errorMap: {
          // Some forms don't match the field name of the server.
          // Keep this in mind when reusing this function in the future.
          onServer: error.details[key].map((error: ValidationErrorMetadata) => {
            return {
              message: getTranslatedValidationError(tCommon, error),
              path: [key],
            };
          }),
        },
      };
    });
  });
}
