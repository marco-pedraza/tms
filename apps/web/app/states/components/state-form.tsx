'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

/**
 * Form values for creating/updating a state
 */
export interface StateFormValues {
  name: string;
  code: string;
  countryId: number;
  active: boolean;
}

/**
 * Props for the StateForm component
 */
export interface StateFormProps {
  /**
   * Default values for the form
   */
  defaultValues?: StateFormValues;

  /**
   * Function to call when the form is submitted
   */
  onSubmit: (values: StateFormValues) => Promise<unknown>;

  /**
   * Text to display on the submit button
   */
  submitButtonText?: string;

  /**
   * Whether the form is in the process of submitting
   */
  isSubmitting?: boolean;
}

/**
 * Form component for creating or updating a state
 */
export default function StateForm({
  defaultValues = {
    name: '',
    code: '',
    countryId: 0,
    active: true,
  },
  onSubmit,
  submitButtonText = 'Save',
  isSubmitting = false,
}: StateFormProps) {
  const t = useTranslations('states');

  // Define form validation schema
  const formSchema = z.object({
    name: z.string().min(1, t('validation.name.required')),
    code: z.string().min(1, t('validation.code.required')),
    countryId: z.number().min(1, t('validation.countryId.required')),
    active: z.boolean().default(true),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Form submission handler
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('placeholders.name')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.code')}</FormLabel>
              <FormControl>
                <Input placeholder={t('placeholders.code')} {...field} />
              </FormControl>
              <FormDescription>{t('descriptions.code')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="countryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.countryId')}</FormLabel>
              <FormControl>
                <Input placeholder={t('placeholders.countryId')} {...field} />
              </FormControl>
              <FormDescription>{t('descriptions.countryId')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {t('fields.active')}
                </FormLabel>
                <FormDescription>{t('descriptions.active')}</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('actions.saving') : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
