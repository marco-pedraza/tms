'use client';

import { useForm } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import FormLayout from '@/components/form/form-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { nameSchema } from '@/schemas/common';
import { UseValidationsTranslationsResult } from '@/types/translations';

const serviceTypeFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    name: nameSchema(tValidations),
    description: z.string().optional(),
    active: z.boolean().default(true),
  });

export type ServiceTypeFormValues = z.infer<
  ReturnType<typeof serviceTypeFormSchema>
>;

interface ServiceTypeFormProps {
  onSubmit: (values: ServiceTypeFormValues) => Promise<unknown>;
  defaultValues?: Partial<ServiceTypeFormValues>;
  submitButtonText?: string;
}

export default function ServiceTypeForm({
  onSubmit,
  defaultValues,
  submitButtonText = 'Submit',
}: ServiceTypeFormProps) {
  const tServiceTypes = useTranslations('serviceTypes');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');
  const form = useForm({
    defaultValues: defaultValues ?? {
      name: '',
      description: '',
      active: true,
    },
    validators: {
      onChange: serviceTypeFormSchema(tValidations),
    },
    onSubmit: async (submission) => {
      await onSubmit(submission.value as ServiceTypeFormValues);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <FormLayout title={tServiceTypes('form.title')}>
        <form.Field name="name">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>{tCommon('fields.name')}</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={tServiceTypes('form.placeholders.name')}
                aria-invalid={!!field.state.meta.errors.length}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                {tCommon('fields.description')}
              </Label>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={tServiceTypes('form.placeholders.description')}
                aria-invalid={!!field.state.meta.errors.length}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="active">
          {(field) => (
            <div className="flex items-center space-x-2">
              <Switch
                id={field.name}
                name={field.name}
                checked={field.state.value}
                onCheckedChange={(checked: boolean) =>
                  field.handleChange(checked)
                }
                aria-invalid={!!field.state.meta.errors.length}
              />
              <Label htmlFor={field.name} className="cursor-pointer">
                {tCommon('fields.active')}
              </Label>
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting] as const}
        >
          {([canSubmit, isSubmitting]: [boolean, boolean]) => (
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting && <Loader2 className=" animate-spin" />}
                {submitButtonText ?? tCommon('actions.save')}
              </Button>
            </div>
          )}
        </form.Subscribe>
      </FormLayout>
    </form>
  );
}
