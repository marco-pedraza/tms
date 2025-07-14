import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { UseTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createInstallationTypeFormSchema = (tCommon: UseTranslationsResult) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: tCommon('validations.required') })
      .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, {
        message: tCommon('validations.name.letters'),
      }),
    code: z
      .string()
      .min(1, { message: tCommon('validations.required') })
      .regex(/^[A-Z0-9-]+$/, {
        message: tCommon('validations.code.alphanumeric'),
      }),
    description: z.string().optional(),
    active: z.boolean().optional(),
  });

export type InstallationTypeFormValues = z.output<
  ReturnType<typeof createInstallationTypeFormSchema>
>;

interface InstallationTypeFormProps {
  defaultValues?: InstallationTypeFormValues;
  onSubmit: (values: InstallationTypeFormValues) => Promise<unknown>;
}

export default function InstallationTypeForm({
  defaultValues,
  onSubmit,
}: InstallationTypeFormProps) {
  const tCommon = useTranslations('common');
  const tInstallationTypes = useTranslations('installationTypes');
  const form = useForm({
    defaultValues: defaultValues ?? {
      name: '',
      code: '',
      description: '',
      active: true,
    },
    validators: {
      onChange: createInstallationTypeFormSchema(tCommon),
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'installationType',
          error,
          tCommon,
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
              placeholder={tInstallationTypes('form.placeholders.name')}
              isRequired
            />
          )}
        </form.AppField>
        <form.AppField name="code">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.code')}
              placeholder={tInstallationTypes('form.placeholders.code')}
              isRequired
            />
          )}
        </form.AppField>
        <form.AppField name="description">
          {(field) => (
            <field.TextAreaInput
              label={tCommon('fields.description')}
              placeholder={tInstallationTypes('form.placeholders.description')}
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
                ? tInstallationTypes('actions.update')
                : tInstallationTypes('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </FormLayout>
    </Form>
  );
}
