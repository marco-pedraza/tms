'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { isAPIError } from '@repo/ims-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useForm from '@/hooks/use-form';
import { ValidationErrorMetadata } from '@/services/error-handler';
import { TimeOffType, timeOffTypes } from '@/services/ims-client';
import { UseValidationsTranslationsResult } from '@/types/translations';

/**
 * Converts a SCREAMING_SNAKE_CASE string to lowerCamelCase
 * Example: "INVALID_DATE_RANGE" -> "invalidDateRange"
 */
function toLowerCamelCase(str: string): string {
  return str
    .toLowerCase()
    .split('_')
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('');
}

/**
 * Mapping of time-off types to their translation keys
 */
const TIME_OFF_TYPE_TRANSLATIONS: Record<TimeOffType, string> = {
  [TimeOffType.VACATION]: 'types.vacation',
  [TimeOffType.LEAVE]: 'types.leave',
  [TimeOffType.SICK_LEAVE]: 'types.sick_leave',
  [TimeOffType.PERSONAL_DAY]: 'types.personal_day',
  [TimeOffType.OTHER]: 'types.other',
};

/**
 * Helper function to get the translated label for a time-off type
 */
function getTimeOffTypeLabel(
  type: TimeOffType,
  t: (key: string) => string,
): string {
  const translationKey = TIME_OFF_TYPE_TRANSLATIONS[type];
  return translationKey ? t(translationKey) : type;
}

const createTimeOffFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    startDate: z.string().min(1, { message: tValidations('required') }),
    endDate: z.string().min(1, { message: tValidations('required') }),
    type: z
      .string()
      .min(1, { message: tValidations('required') })
      .pipe(
        z.enum(timeOffTypes as [TimeOffType, ...TimeOffType[]], {
          errorMap: () => ({ message: tValidations('required') }),
        }),
      ),
    reason: z.string().trim(),
  });

export type TimeOffFormValues = z.output<
  ReturnType<typeof createTimeOffFormSchema>
>;

interface DriverTimeOffFormProps {
  onAdd: (timeOff: TimeOffFormValues) => Promise<void>;
  disabled?: boolean;
}

/**
 * Form component for adding time-offs to the driver form state
 * Does not make API calls - only updates local form state
 */
export default function DriverTimeOffForm({
  onAdd,
  disabled = false,
}: DriverTimeOffFormProps) {
  const tTimeOffs = useTranslations('timeOffs');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');
  const tDrivers = useTranslations('drivers');

  const timeOffSchema = createTimeOffFormSchema(tValidations);

  const form = useForm({
    defaultValues: {
      startDate: '',
      endDate: '',
      type: '',
      reason: '',
    },
    validators: {
      onChange: timeOffSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = timeOffSchema.safeParse(value);
        if (parsed.success) {
          await onAdd(parsed.data);
          form.reset();
        }
      } catch (error: unknown) {
        // Handle API errors with custom time-off error handling
        if (isAPIError(error) && error.details) {
          Object.keys(error.details).forEach((fieldName) => {
            const typedFieldName = fieldName as
              | 'startDate'
              | 'endDate'
              | 'type'
              | 'reason';
            form.setFieldMeta(typedFieldName, (meta) => {
              return {
                ...meta,
                errorMap: {
                  onServer: error.details[fieldName].map(
                    (errorDetail: ValidationErrorMetadata) => {
                      // Try to get translation for specific error code
                      let message = errorDetail.message;
                      try {
                        const translatedError = tDrivers(
                          `errors.timeOff.${toLowerCamelCase(errorDetail.code)}` as never,
                        );
                        if (
                          translatedError &&
                          translatedError !==
                            `errors.timeOff.${toLowerCamelCase(errorDetail.code)}`
                        ) {
                          message = translatedError;
                        }
                      } catch {
                        // Fall back to the backend message
                      }

                      return {
                        message,
                        path: [typedFieldName],
                      };
                    },
                  ),
                },
              };
            });
          });
        }
      }
    },
  });

  if (disabled) {
    return (
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-sm">{tTimeOffs('form.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {tTimeOffs('form.disabledMessage')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          {tTimeOffs('form.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <form.AppField name="startDate">
            {(field) => (
              <field.TextInput
                type="date"
                label={tTimeOffs('fields.startDate')}
                isRequired
              />
            )}
          </form.AppField>

          <form.AppField
            name="endDate"
            listeners={{
              onChange: () => {
                // Clear server-side errors on startDate when endDate changes,
                // because overlap validations may have been attached to startDate
                form.setFieldMeta('startDate', (meta) => {
                  return {
                    ...meta,
                    errorMap: {
                      ...meta.errorMap,
                      onServer: [],
                    },
                  };
                });
              },
            }}
          >
            {(field) => (
              <field.TextInput
                type="date"
                label={tTimeOffs('fields.endDate')}
                isRequired
              />
            )}
          </form.AppField>

          <form.AppField name="type">
            {(field) => (
              <field.SelectInput
                label={tTimeOffs('fields.type')}
                placeholder={tTimeOffs('form.placeholders.type')}
                isRequired
                items={timeOffTypes.map((type) => ({
                  id: type,
                  name: getTimeOffTypeLabel(
                    type,
                    tTimeOffs as (key: string) => string,
                  ),
                }))}
              />
            )}
          </form.AppField>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <form.AppField name="reason">
              {(field) => (
                <field.TextAreaInput
                  label={tTimeOffs('fields.reason')}
                  placeholder={tTimeOffs('form.placeholders.reason')}
                  rows={2}
                />
              )}
            </form.AppField>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              onClick={form.handleSubmit}
              className="h-fit px-6 py-2"
            >
              {tCommon('actions.add')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
