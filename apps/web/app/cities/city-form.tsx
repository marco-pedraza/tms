'use client';

import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
import type { states, timezones } from '@repo/ims-client';

type State = states.State;
type Timezone = timezones.Timezone;

// TODO: Number input and typescript looks like general issue, we should refactor this soon
// Single schema with transformations
const editCitySchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/),
  stateId: z.number().min(1),
  timezone: z.string().min(1),
  active: z.boolean(),
  latitude: z
    .string()
    .min(1, 'Latitude is required')
    .transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num)) throw new Error('Invalid number');
      if (num < -90 || num > 90)
        throw new Error('Latitude must be between -90 and 90');
      return num;
    }),
  longitude: z
    .string()
    .min(1, 'Longitude is required')
    .transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num)) throw new Error('Invalid number');
      if (num < -180 || num > 180)
        throw new Error('Longitude must be between -180 and 180');
      return num;
    }),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be in kebab-case format'),
});

export type CityFormValues = z.output<typeof editCitySchema>;

interface CityFormProps {
  defaultValues?: Omit<CityFormValues, 'latitude' | 'longitude'> & {
    latitude: number | string;
    longitude: number | string;
  };
  onSubmit: (values: CityFormValues) => Promise<unknown>;
  submitButtonText?: string;
}

/**
 * Form component for creating and editing cities
 */
function CityForm({
  defaultValues,
  onSubmit,
  submitButtonText,
}: CityFormProps) {
  const { t } = useTranslation(['cities', 'common']);

  // Transform default values to use strings for numeric inputs
  const transformedDefaults = defaultValues
    ? {
        ...defaultValues,
        latitude: defaultValues.latitude?.toString() || '',
        longitude: defaultValues.longitude?.toString() || '',
      }
    : undefined;

  // Fetch states for the dropdown
  const { data: statesData, isLoading: isLoadingStates } = useQuery({
    queryKey: ['states'],
    queryFn: async () => await imsClient.inventory.listStates(),
  });

  // Fetch timezones for the dropdown
  const { data: timezonesData, isLoading: isLoadingTimezones } = useQuery({
    queryKey: ['timezones'],
    queryFn: async () => await imsClient.inventory.listTimezones(),
  });

  const isCreate = !defaultValues;

  const form = useForm({
    defaultValues: transformedDefaults ?? {
      name: '',
      stateId: 0,
      timezone: '',
      active: false,
      latitude: '',
      longitude: '',
      slug: '',
    },
    onSubmit: async (values) => {
      // editCitySchema validates and transforms the values
      try {
        const parsed = editCitySchema.parse(values.value);
        await onSubmit(parsed);
      } catch (error) {
        console.error('Validation error:', error);
        toast.error(
          t(
            isCreate
              ? 'cities:messages.create.error'
              : 'cities:messages.update.error',
          ),
        );
      }
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
          <CardTitle>{t('cities:form.title')}</CardTitle>
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
                  placeholder={t('cities:form.placeholders.name')}
                  required
                />
              </div>
            )}
          </form.Field>

          <form.Field name="stateId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="stateId">{t('cities:form.state')}</Label>
                <Select
                  value={field.state.value?.toString() ?? ''}
                  onValueChange={(value) =>
                    field.handleChange(parseInt(value, 10))
                  }
                  disabled={isLoadingStates}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('cities:form.placeholders.state')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {statesData?.states?.map((state: State) => (
                      <SelectItem key={state.id} value={state.id.toString()}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name="timezone">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="timezone">{t('cities:form.timezone')}</Label>
                <Select
                  value={field.state.value ?? ''}
                  onValueChange={(value) => field.handleChange(value)}
                  disabled={isLoadingTimezones}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue
                      placeholder={t('cities:form.placeholders.timezone')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {timezonesData?.timezones?.map((timezone: Timezone) => (
                      <SelectItem key={timezone.id} value={timezone.id}>
                        {timezone.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="latitude">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="latitude">
                    {t('common:fields.latitude')}
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    inputMode="decimal"
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. 19.4326"
                    required
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="longitude">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="longitude">
                    {t('common:fields.longitude')}
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    inputMode="decimal"
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. -99.1332"
                    required
                  />
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="slug">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="slug">{t('common:fields.slug')}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g. mexico-city"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {t(
                    'cities:form.slugHelp',
                    'URL-friendly version of the city name',
                  )}
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
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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

export default CityForm;
