'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createChangePasswordFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z
    .object({
      currentPassword: z.string().min(1, {
        message: tValidations('required'),
      }),
      newPassword: z.string().min(8, {
        message: tValidations('password.minLength', { length: 8 }),
      }),
      confirmPassword: z.string().min(1, {
        message: tValidations('required'),
      }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: tValidations('password.mismatch'),
      path: ['confirmPassword'],
    });

export type ChangePasswordFormValues = z.output<
  ReturnType<typeof createChangePasswordFormSchema>
>;

interface ChangePasswordFormProps {
  onSubmit: (values: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<unknown>;
}

export default function ChangePasswordForm({
  onSubmit,
}: ChangePasswordFormProps) {
  const tUsers = useTranslations('users');
  const tValidations = useTranslations('validations');
  const changePasswordFormSchema = createChangePasswordFormSchema(tValidations);

  const form = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: changePasswordFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = changePasswordFormSchema.safeParse(value);
        if (parsed.success) {
          // Only send currentPassword and newPassword to the API
          await onSubmit({
            currentPassword: parsed.data.currentPassword,
            newPassword: parsed.data.newPassword,
          });
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'user',
          error,
          tValidations,
        });
      }
    },
  });

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tUsers('changePassword.form.title')}>
        <div className="space-y-6">
          <form.AppField name="newPassword">
            {(field) => (
              <field.TextInput
                type="password"
                label={tUsers('changePassword.fields.newPassword')}
                placeholder={tUsers(
                  'changePassword.form.placeholders.newPassword',
                )}
                isRequired
              />
            )}
          </form.AppField>

          <form.AppField name="confirmPassword">
            {(field) => (
              <field.TextInput
                type="password"
                label={tUsers('changePassword.fields.confirmPassword')}
                placeholder={tUsers(
                  'changePassword.form.placeholders.confirmPassword',
                )}
                isRequired
              />
            )}
          </form.AppField>

          <form.AppField name="currentPassword">
            {(field) => (
              <field.TextInput
                type="password"
                label={tUsers('changePassword.fields.currentPassword')}
                placeholder={tUsers(
                  'changePassword.form.placeholders.currentPassword',
                )}
                isRequired
              />
            )}
          </form.AppField>
        </div>

        <FormFooter>
          <form.AppForm>
            <form.SubmitButton>
              {tUsers('changePassword.actions.submit')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </FormLayout>
    </Form>
  );
}
