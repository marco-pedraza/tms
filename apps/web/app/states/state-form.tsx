'use client';

import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from '@tanstack/react-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import imsClient from '@/lib/imsClient';
import type { countries } from '@repo/ims-client';

type Country = countries.Country;

const editStateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(2).max(3),
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
  const { t } = useTranslation(['states', 'common']);

  // Fetch countries for the dropdown
  const { data: countriesData } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => await imsClient.inventory.listCountries(),
  });

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
          <CardTitle>{t('states:form.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="name">{t('common:fields.name')}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t('states:form.placeholders.name')}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="code">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="code">{t('common:fields.code')}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t('states:form.placeholders.code')}
                  maxLength={3}
                />
                <p className="text-sm text-muted-foreground">
                  {t('states:form.codeHelp')}
                </p>
              </div>
            )}
          </form.Field>

          <form.Field name="countryId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="countryId">{t('states:form.country')}</Label>
                <Select
                  value={field.state.value?.toString() ?? ''}
                  onValueChange={(value) =>
                    field.handleChange(parseInt(value, 10))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('states:form.placeholders.country')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {countriesData?.countries?.map((country: Country) => (
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
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
                <Label htmlFor={field.name}>{t('common:fields.active')}</Label>
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
                  {submitButtonText ?? t('common:actions.create')}
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
