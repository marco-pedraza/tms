'use client';

import { useStore } from '@tanstack/react-form';
import { CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import type { medical_checks } from '@repo/ims-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useForm from '@/hooks/use-form';
import { MedicalCheckResult, medicalCheckResults } from '@/services/ims-client';
import { UseValidationsTranslationsResult } from '@/types/translations';

/**
 * Mapping of medical check results to their translation keys
 */
const MEDICAL_CHECK_RESULT_TRANSLATIONS: Record<MedicalCheckResult, string> = {
  [MedicalCheckResult.FIT]: 'results.fit',
  [MedicalCheckResult.LIMITED]: 'results.limited',
  [MedicalCheckResult.UNFIT]: 'results.unfit',
};

/**
 * Helper function to get the translated label for a medical check result
 */
function getMedicalCheckResultLabel(
  result: MedicalCheckResult,
  t: (key: string) => string,
): string {
  const translationKey = MEDICAL_CHECK_RESULT_TRANSLATIONS[result];
  return translationKey ? t(translationKey) : result;
}

/**
 * Calculates the next medical check date based on the check date and days until next check
 */
function calculateNextCheckDate(
  checkDate: string,
  daysUntilNextCheck: string,
): string | null {
  if (!checkDate || !daysUntilNextCheck) {
    return null;
  }

  const days = parseInt(daysUntilNextCheck, 10);
  if (isNaN(days) || days <= 0) {
    return null;
  }

  const parts = checkDate.split('-').map((p) => parseInt(p, 10));
  const [y, m, d] = parts;
  if (!y || !m || !d) {
    return null;
  }

  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

const createMedicalCheckFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    checkDate: z.string().min(1, { message: tValidations('required') }),
    daysUntilNextCheck: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((n) => Number.isInteger(n) && n > 0, {
        message: tValidations('required'),
      }),
    result: z
      .string()
      .min(1, { message: tValidations('required') })
      .pipe(
        z.enum(
          medicalCheckResults as [
            medical_checks.MedicalCheckResult,
            ...medical_checks.MedicalCheckResult[],
          ],
          {
            errorMap: () => ({ message: tValidations('required') }),
          },
        ),
      ),
    notes: z.string().trim(),
  });

export type MedicalCheckFormValues = z.output<
  ReturnType<typeof createMedicalCheckFormSchema>
>;

interface DriverMedicalCheckFormProps {
  onAdd: (medicalCheck: MedicalCheckFormValues) => Promise<void>;
  disabled?: boolean;
}

/**
 * Form component for adding medical checks to the driver form state
 * Does not make API calls - only updates local form state
 */
export default function DriverMedicalCheckForm({
  onAdd,
  disabled = false,
}: DriverMedicalCheckFormProps) {
  const tMedicalChecks = useTranslations('medicalChecks');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');

  const medicalCheckSchema = createMedicalCheckFormSchema(tValidations);

  const form = useForm({
    defaultValues: {
      checkDate: '',
      daysUntilNextCheck: '',
      result: '',
      notes: '',
    },
    validators: {
      onChange: medicalCheckSchema,
    },
    onSubmit: async ({ value }) => {
      const parsed = medicalCheckSchema.safeParse(value);
      if (parsed.success) {
        await onAdd(parsed.data);
        form.reset();
      }
    },
  });

  // Subscribe to form values so UI updates on change
  const checkDateValue =
    useStore(form.store, (state) => state.values.checkDate) || '';
  const daysValue =
    useStore(form.store, (state) => state.values.daysUntilNextCheck) || '';
  const nextCheckDate = calculateNextCheckDate(
    checkDateValue as string,
    daysValue as string,
  );

  if (disabled) {
    return (
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-sm">
            {tMedicalChecks('form.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {tMedicalChecks('form.disabledMessage')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          {tMedicalChecks('form.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <form.AppField name="checkDate">
            {(field) => (
              <field.TextInput
                type="date"
                label={tMedicalChecks('fields.checkDate')}
                isRequired
              />
            )}
          </form.AppField>

          <form.AppField name="result">
            {(field) => (
              <field.SelectInput
                label={tMedicalChecks('fields.result')}
                placeholder={tMedicalChecks('form.placeholders.result')}
                isRequired
                items={medicalCheckResults.map((result) => ({
                  id: result,
                  name: getMedicalCheckResultLabel(
                    result,
                    tMedicalChecks as (key: string) => string,
                  ),
                }))}
              />
            )}
          </form.AppField>

          <form.AppField name="daysUntilNextCheck">
            {(field) => (
              <field.TextInput
                type="number"
                label={tMedicalChecks('fields.daysUntilNextCheck')}
                placeholder={tMedicalChecks(
                  'form.placeholders.daysUntilNextCheck',
                )}
                min="1"
                isRequired
              />
            )}
          </form.AppField>
        </div>

        {/* Display calculated next check date */}
        {nextCheckDate && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                <span className="font-medium">
                  {tMedicalChecks('form.nextCheckDate')}
                </span>{' '}
                {new Date(nextCheckDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <form.AppField name="notes">
              {(field) => (
                <field.TextAreaInput
                  label={tMedicalChecks('fields.notes')}
                  placeholder={tMedicalChecks('form.placeholders.notes')}
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
