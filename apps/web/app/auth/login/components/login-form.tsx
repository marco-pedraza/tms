'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import TextInput from '@/components/form/text-input';
import { Button } from '@/components/ui/button';
import useForm from '@/hooks/use-form';
import { UseValidationsTranslationsResult } from '@/types/translations';

interface LoginPayload {
  username: string;
  password: string;
}

const createLoginFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    username: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') }),
    password: z.string().min(1, { message: tValidations('required') }),
  });

export type LoginFormValues = z.infer<ReturnType<typeof createLoginFormSchema>>;

interface LoginFormProps {
  onSubmit: (payload: LoginPayload) => void;
  error?: string;
  isLoading?: boolean;
}

function LoginFormComponent({
  onSubmit,
  error,
  isLoading = false,
}: LoginFormProps) {
  const tAuth = useTranslations('auth');
  const tValidations = useTranslations('validations');

  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    validators: {
      onSubmit: createLoginFormSchema(tValidations),
    },
    onSubmit: (values) => {
      onSubmit(values.value);
    },
  });

  return (
    <Form
      onSubmit={() => {
        // Let the form handle validation and submission
        form.handleSubmit();
      }}
      className="space-y-8"
    >
      <form.AppField name="username">
        {() => (
          <TextInput
            label=""
            hideLabel={true}
            type="text"
            className="w-full px-4 py-5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200"
            placeholder={tAuth('form.placeholders.username')}
          />
        )}
      </form.AppField>

      <form.AppField name="password">
        {() => (
          <TextInput
            label=""
            hideLabel={true}
            type="password"
            className="w-full px-4 py-5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200"
            placeholder={tAuth('form.placeholders.password')}
          />
        )}
      </form.AppField>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <FormFooter>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-5 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          {tAuth('actions.submit')}
        </Button>
      </FormFooter>
    </Form>
  );
}

export default LoginFormComponent;
