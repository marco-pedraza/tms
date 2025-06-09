'use client';

import { useTranslations } from 'next-intl';
import type { terminals } from '@repo/ims-client';
import FormFooter from '@/components/form/form-footer';
import useForm from '@/hooks/use-form';
import { DaysOfWeek } from '@/types/time';
import BasicInfoTerminalFormSection from './basic-info-terminal-form-section';
import FacilitiesTerminalFormSection from './facilities-terminal-form-section';
import OperatingHoursTerminalFormSection from './operating-hours-terminal-form-section';
import { defaultOperatingHours } from './terminal-form-options';
import terminalFormOptions, { fallbackValues } from './terminal-form-options';
import {
  TerminalFormValues,
  editTerminalSchema,
} from './terminal-form-schemas';
import { TerminalFormRawValues } from './terminal-form-schemas';
import toRawOperatingHours from './to-raw-operating-hours';

export interface TerminalFormProps {
  defaultValues?: Omit<terminals.Terminal, 'operatingHours'> & {
    operatingHours?: terminals.OperatingHours;
  };
  onSubmit: (values: TerminalFormValues) => Promise<unknown>;
}

/**
 * Form component for creating and editing terminals
 */
export default function TerminalForm({
  defaultValues,
  onSubmit,
}: TerminalFormProps) {
  const tTerminals = useTranslations('terminals');
  const rawDefaultOperatingHours: TerminalFormRawValues['operatingHours'] =
    Object.values(DaysOfWeek).reduce(
      toRawOperatingHours(defaultValues, defaultOperatingHours),
      {} as TerminalFormRawValues['operatingHours'],
    );

  const rawDefaultValues: TerminalFormRawValues | undefined = defaultValues
    ? {
        name: defaultValues.name,
        address: defaultValues.address,
        cityId: defaultValues.cityId.toString(),
        code: defaultValues.code,
        latitude: defaultValues.latitude.toString(),
        longitude: defaultValues.longitude.toString(),
        contactPhone: defaultValues.contactphone || '',
        active: defaultValues.active,
        operatingHours: rawDefaultOperatingHours,
        facilities: defaultValues.facilities?.length
          ? defaultValues.facilities
          : [],
      }
    : undefined;
  const form = useForm({
    ...terminalFormOptions,
    defaultValues: rawDefaultValues ?? fallbackValues,
    onSubmit: ({ value }) => {
      const parsed = editTerminalSchema.safeParse(value);
      if (parsed.success) {
        return onSubmit(parsed.data);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <BasicInfoTerminalFormSection form={form} />
      <OperatingHoursTerminalFormSection form={form} />
      <FacilitiesTerminalFormSection form={form} />
      <FormFooter>
        <form.AppForm>
          <form.SubmitButton>
            {defaultValues
              ? tTerminals('actions.update')
              : tTerminals('actions.create')}
          </form.SubmitButton>
        </form.AppForm>
      </FormFooter>
    </form>
  );
}
