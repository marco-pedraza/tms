'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createChromaticFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') })
      .regex(/^[a-zA-Z\s]+$/, {
        message: tValidations('name.letters'),
      }),
    description: z.string().nullable(),
    imageUrl: z
      .string()
      .url({ message: tValidations('url.invalid') })
      .nullable()
      .or(z.literal('')),
    active: z.boolean().default(true),
  });

export type ChromaticFormValues = z.output<
  ReturnType<typeof createChromaticFormSchema>
>;

type ChromaticFormRawValues = z.input<
  ReturnType<typeof createChromaticFormSchema>
>;

interface ChromaticFormProps {
  defaultValues?: ChromaticFormValues;
  onSubmit: (values: ChromaticFormValues) => Promise<unknown>;
}

export default function ChromaticForm({
  defaultValues,
  onSubmit,
}: ChromaticFormProps) {
  const tChromatics = useTranslations('chromatics');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');
  const chromaticSchema = createChromaticFormSchema(tValidations);

  const rawDefaultValues: ChromaticFormRawValues = defaultValues
    ? {
        ...defaultValues,
        name: defaultValues.name || '',
        description: defaultValues.description || '',
        imageUrl: defaultValues.imageUrl || '',
        active: defaultValues.active,
      }
    : {
        name: '',
        description: '',
        imageUrl: '',
        active: true,
      };

  const form = useForm({
    defaultValues: rawDefaultValues,
    validators: {
      onChange: chromaticSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = chromaticSchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'chromatic',
          error,
          tValidations,
          tCommon,
        });
      }
    },
  });

  return (
    <div className="max-w-7xl">
      <Form onSubmit={form.handleSubmit}>
        <FormLayout title={tChromatics('form.title')}>
          <form.AppField name="name">
            {(field) => (
              <field.TextInput
                label={tChromatics('fields.name')}
                placeholder={tChromatics('form.placeholders.name')}
                isRequired
              />
            )}
          </form.AppField>

          <form.AppField name="description">
            {(field) => (
              <field.TextAreaInput
                label={tChromatics('fields.description')}
                placeholder={tChromatics('form.placeholders.description')}
              />
            )}
          </form.AppField>

          <form.AppField name="imageUrl">
            {(field) => (
              <field.TextInput
                label={tChromatics('fields.imageUrl')}
                placeholder={tChromatics('form.placeholders.imageUrl')}
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
                  ? tChromatics('actions.update')
                  : tChromatics('actions.create')}
              </form.SubmitButton>
            </form.AppForm>
          </FormFooter>
        </FormLayout>
      </Form>
    </div>
  );
}
