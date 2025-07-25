'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createLabelFormSchema = (
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
    description: z.string().optional(),
    color: z
      .string()
      .trim()
      .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
        message: tValidations('color.format'),
      }),
    active: z.boolean(),
  });

export type LabelFormValues = z.output<
  ReturnType<typeof createLabelFormSchema>
>;

interface LabelFormProps {
  defaultValues?: LabelFormValues;
  onSubmit: (values: LabelFormValues) => Promise<unknown>;
}

export default function LabelForm({ defaultValues, onSubmit }: LabelFormProps) {
  const tLabels = useTranslations('labels');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');
  const labelFormSchema = createLabelFormSchema(tValidations);
  const form = useForm({
    defaultValues: defaultValues ?? {
      name: '',
      description: undefined,
      color: '#2CBC29',
      active: true,
    },
    validators: {
      onChange: labelFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = labelFormSchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'label',
          error,
          tValidations,
        });
      }
    },
  });

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tLabels('form.title')}>
        <form.AppField name="name">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.name')}
              placeholder={tLabels('form.placeholders.name')}
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="description">
          {(field) => (
            <field.TextAreaInput
              label={tCommon('fields.description')}
              placeholder={tLabels('form.placeholders.description')}
            />
          )}
        </form.AppField>

        <form.AppField name="color">
          {(field) => (
            <field.TextInput
              type="color"
              label={tCommon('fields.color')}
              placeholder={tLabels('form.placeholders.color')}
              isRequired
              className="w-20 h-10"
            />
          )}
        </form.AppField>

        <form.AppField name="active">
          {(field) => <field.SwitchInput label={tCommon('fields.active')} />}
        </form.AppField>

        <FormFooter>
          <form.AppForm>
            <form.SubmitButton>
              {defaultValues
                ? tLabels('actions.update')
                : tLabels('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </FormLayout>
    </Form>
  );
}
