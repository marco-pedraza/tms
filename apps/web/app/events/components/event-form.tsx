import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createEventFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') })
      .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, {
        message: tValidations('name.letters'),
      }),
    code: z
      .string()
      .min(1, { message: tValidations('required') })
      // Alphanumeric, may contain dashes/underscores, but not start or end with them
      .regex(/^(?![_-])[A-Z0-9_-]+(?<![_-])$/, {
        message: tValidations('code.alphanumeric'),
      }),
    description: z.string().optional(),
    baseTime: z.coerce.number().min(1, {
      message: tValidations('greaterThanOrEquals', { value: 1 }),
    }),
    integration: z.boolean().optional(),
    needsCost: z.boolean().optional(),
    needsQuantity: z.boolean().optional(),
    active: z.boolean().optional(),
  });

export type EventFormValues = z.output<
  ReturnType<typeof createEventFormSchema>
>;

interface EventFormProps {
  defaultValues?: EventFormValues;
  onSubmit: (values: EventFormValues) => Promise<unknown>;
}

export default function EventForm({ defaultValues, onSubmit }: EventFormProps) {
  const tCommon = useTranslations('common');
  const tEvents = useTranslations('eventTypes');
  const tValidations = useTranslations('validations');
  const form = useForm({
    defaultValues: defaultValues ?? {
      name: '',
      code: '',
      description: '',
      baseTime: 1,
      integration: false,
      needsCost: false,
      needsQuantity: false,
      active: true,
    },
    validators: {
      onChange: createEventFormSchema(tValidations),
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'event',
          error,
          tValidations,
        });
      }
    },
  });

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tCommon('sections.basicInfo')}>
        <form.AppField name="name">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.name')}
              placeholder={tEvents('form.placeholders.name')}
              isRequired
            />
          )}
        </form.AppField>
        <form.AppField name="code">
          {(field) => (
            <field.SlugInput
              label={tCommon('fields.code')}
              placeholder={tEvents('form.placeholders.code')}
              isRequired
            />
          )}
        </form.AppField>
        <form.AppField name="description">
          {(field) => (
            <field.TextAreaInput
              label={tCommon('fields.description')}
              placeholder={tEvents('form.placeholders.description')}
            />
          )}
        </form.AppField>
        <form.AppField name="baseTime">
          {(field) => (
            <field.NumberInput
              label={tEvents('fields.baseTimeMinutes')}
              allowDecimals={true}
              isRequired
              description={tEvents('details.baseTime')}
            />
          )}
        </form.AppField>
        <form.AppField name="integration">
          {(field) => (
            <field.SwitchInput
              label={tEvents('fields.integration')}
              description={tEvents('details.integration')}
            />
          )}
        </form.AppField>
        <form.AppField name="needsCost">
          {(field) => (
            <field.SwitchInput
              label={tEvents('fields.needsCost')}
              description={tEvents('details.needsCost')}
            />
          )}
        </form.AppField>
        <form.AppField name="needsQuantity">
          {(field) => (
            <field.SwitchInput
              label={tEvents('fields.needsQuantity')}
              description={tEvents('details.needsQuantity')}
            />
          )}
        </form.AppField>
        <form.AppField name="active">
          {(field) => (
            <field.SwitchInput
              label={tCommon('fields.active')}
              description={tEvents('details.active')}
            />
          )}
        </form.AppField>
        <FormFooter>
          <form.AppForm>
            <form.SubmitButton>
              {defaultValues
                ? tEvents('actions.update')
                : tEvents('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </FormLayout>
    </Form>
  );
}
