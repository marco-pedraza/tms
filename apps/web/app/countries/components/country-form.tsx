'use client';

import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from '@tanstack/react-form';
import { nameSchema, codeSchema } from '@/lib/schemas/common';
import { hasFieldErrors } from '@/lib/utils';

const editCountrySchema = z.object({
  name: nameSchema,
  code: codeSchema(2, 2),
  active: z.boolean(),
});

export type CountryFormValues = z.infer<typeof editCountrySchema>;

interface CountryFormProps {
  defaultValues?: CountryFormValues;
  onSubmit: (values: CountryFormValues) => Promise<unknown>;
  submitButtonText?: string;
}

function CountryForm({
  defaultValues,
  onSubmit,
  submitButtonText,
}: CountryFormProps) {
  const tCountries = useTranslations('countries');
  const tCommon = useTranslations('common');

  const form = useForm({
    defaultValues: defaultValues ?? {
      name: '',
      code: '',
      active: false,
    },
    validators: {
      onChange: editCountrySchema,
    },
    onSubmit: (values) => {
      onSubmit(values.value);
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
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{tCountries('form.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="name">{tCommon('fields.name')}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={tCountries('form.placeholders.name')}
                  aria-invalid={hasFieldErrors(field)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="code">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="code">{tCommon('fields.code')}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={tCountries('form.placeholders.code')}
                  aria-invalid={hasFieldErrors(field)}
                  maxLength={2}
                />
                <p className="text-sm text-muted-foreground">
                  {tCountries('form.codeHelp')}
                </p>
              </div>
            )}
          </form.Field>

          <form.Field name="active">
            {(field) => (
              <div className="flex items-center space-x-2">
                <Switch
                  id={field.name}
                  checked={field.state.value ?? false}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
                <Label htmlFor={field.name}>{tCommon('fields.active')}</Label>
              </div>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  {submitButtonText ?? tCommon('actions.create')}
                </Button>
              </div>
            )}
          </form.Subscribe>
        </CardContent>
      </Card>
    </form>
  );
}

export default CountryForm;
