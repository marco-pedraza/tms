import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { optionalIntegerSchema } from '@/schemas/number';
import { optionalStringSchema } from '@/schemas/string';
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
    description: optionalStringSchema(),
    baseTime: optionalIntegerSchema().transform((val) => val ?? 0),
    integration: z.boolean(),
    needsCost: z.boolean(),
    needsQuantity: z.boolean(),
    active: z.boolean(),
  });

export type EventFormValues = z.output<
  ReturnType<typeof createEventFormSchema>
>;

export type EventFormInput = z.input<ReturnType<typeof createEventFormSchema>>;

interface EventFormProps {
  defaultValues?: Partial<EventFormInput>;
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
      baseTime: '0',
      integration: false,
      needsCost: false,
      needsQuantity: false,
      active: true,
    },
    validators: {
      onSubmit: createEventFormSchema(tValidations),
    },
    onSubmit: async ({ value }) => {
      try {
        const parsedValue =
          createEventFormSchema(tValidations).safeParse(value);
        if (parsedValue.success) {
          await onSubmit(parsedValue.data);
        }
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
              description={tEvents('details.baseTime')}
              placeholder="0"
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
