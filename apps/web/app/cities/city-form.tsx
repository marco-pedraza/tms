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
import {
  nameSchema,
  latitudeSchema,
  longitudeSchema,
} from '@/lib/schemas/common';
import { hasFieldErrors } from '@/lib/utils';

type State = states.State;
type Timezone = timezones.Timezone;

// Single schema with common validations
const editCitySchema = z.object({
  name: nameSchema,
  stateId: z.number().min(1),
  timezone: z.string().min(1),
  active: z.boolean(),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
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
  const tCities = useTranslations('cities');
  const tCommon = useTranslations('common');

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

  const form = useForm({
    defaultValues: transformedDefaults ?? {
      name: '',
      stateId: 0,
      timezone: '',
      active: false,
      latitude: '',
      longitude: '',
    },
    validators: {
      onChange: editCitySchema,
    },
    onSubmit: async (values) => {
      // editCitySchema validates and transforms the values
      try {
        const parsed = editCitySchema.parse(values.value);
        await onSubmit(parsed);
      } catch (error) {
        console.error('Validation error:', error);
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
          <CardTitle>{tCities('form.title')}</CardTitle>
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
                  placeholder={tCities('form.placeholders.name')}
                  aria-invalid={hasFieldErrors(field)}
                  required
                />
              </div>
            )}
          </form.Field>

          <form.Field name="stateId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="stateId">{tCities('form.state')}</Label>
                <Select
                  value={field.state.value?.toString() ?? ''}
                  onValueChange={(value) =>
                    field.handleChange(parseInt(value, 10))
                  }
                  disabled={isLoadingStates}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={tCities('form.placeholders.state')}
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
                <Label htmlFor="timezone">{tCities('form.timezone')}</Label>
                <Select
                  value={field.state.value ?? ''}
                  onValueChange={(value) => field.handleChange(value)}
                  disabled={isLoadingTimezones}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue
                      placeholder={tCities('form.placeholders.timezone')}
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
                <p className="text-sm text-muted-foreground">
                  {tCities('form.timezoneHelp')}
                </p>
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="latitude">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="latitude">{tCommon('fields.latitude')}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    inputMode="decimal"
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. 19.4326"
                    aria-invalid={hasFieldErrors(field)}
                    required
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="longitude">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="longitude">
                    {tCommon('fields.longitude')}
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    inputMode="decimal"
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. -99.1332"
                    aria-invalid={hasFieldErrors(field)}
                    required
                  />
                </div>
              )}
            </form.Field>
          </div>

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

export default CityForm;
