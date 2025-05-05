'use client';

import { useForm } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import type { countries } from '@repo/ims-client';
import useQueryCountries from '@/app/countries/hooks/use-query-countries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { codeSchema, nameSchema } from '@/lib/schemas/common';
import { hasFieldErrors } from '@/lib/utils';

type Country = countries.Country;

const editStateSchema = z.object({
  name: nameSchema,
  code: codeSchema(2, 3),
  countryId: z.number().min(1),
  active: z.boolean(),
});

export type StateFormValues = z.infer<typeof editStateSchema>;

interface StateFormProps {
  defaultValues?: StateFormValues;
  onSubmit: (values: StateFormValues) => Promise<unknown>;
  submitButtonText?: string;
}

function StateForm({
  defaultValues,
  onSubmit,
  submitButtonText,
}: StateFormProps) {
  const tStates = useTranslations('states');
  const tCommon = useTranslations('common');
  const { data: countriesData } = useQueryCountries();

  const form = useForm({
    defaultValues: defaultValues ?? {
      name: '',
      code: '',
      countryId: 0,
      active: false,
    },
    validators: {
      onChange: editStateSchema,
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
          <CardTitle>{tStates('form.title')}</CardTitle>
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
                  placeholder={tStates('form.placeholders.name')}
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
                  placeholder={tStates('form.placeholders.code')}
                  maxLength={3}
                  aria-invalid={hasFieldErrors(field)}
                />
                <p className="text-sm text-muted-foreground">
                  {tStates('form.codeHelp')}
                </p>
              </div>
            )}
          </form.Field>

          <form.Field name="countryId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="countryId">{tStates('form.country')}</Label>
                <Select
                  value={field.state.value?.toString() ?? ''}
                  onValueChange={(value: string) =>
                    field.handleChange(parseInt(value, 10))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={tStates('form.placeholders.country')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {countriesData?.data?.map((country: Country) => (
                      <SelectItem
                        key={country.id}
                        value={country.id.toString()}
                      >
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name="active">
            {(field) => (
              <div className="flex items-center space-x-2">
                <Switch
                  id={field.name}
                  checked={field.state.value ?? false}
                  onCheckedChange={(checked: boolean) =>
                    field.handleChange(checked)
                  }
                />
                <Label htmlFor={field.name}>{tCommon('fields.active')}</Label>
              </div>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]: [boolean, boolean]) => (
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

export default StateForm;
