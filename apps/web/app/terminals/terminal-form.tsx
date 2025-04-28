'use client';

import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { cities, terminals } from '@repo/ims-client';
import {
  nameSchema,
  latitudeSchema,
  longitudeSchema,
  operatingHoursSchema,
  facilitiesSchema,
  codeSchema,
  phoneSchema,
} from '@/lib/schemas/common';
import { hasFieldErrors } from '@/lib/utils';
import { OperatingHoursSelector } from '@/components/operating-hours-selector';

// Days of the week
const daysOfWeek = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

// TODO: Add facilities from the API and creates its view in V0
// Facility options
const facilityOptions = [
  { id: 'sala-espera', label: 'Sala de Espera' },
  { id: 'banos', label: 'Baños' },
  { id: 'restaurantes', label: 'Restaurantes' },
  { id: 'taquillas', label: 'Taquillas' },
  { id: 'equipaje', label: 'Almacenamiento de Equipaje' },
  { id: 'wifi', label: 'WiFi' },
  { id: 'cajeros', label: 'Cajeros Automáticos' },
  { id: 'estacionamiento', label: 'Estacionamiento' },
  { id: 'acceso-discapacitados', label: 'Acceso para Discapacitados' },
  { id: 'modulo-informacion', label: 'Módulo de Información' },
];

const MIN_CODE_LENGTH = 2;
const MAX_CODE_LENGTH = 4;

// Validation schema for terminal form
const editTerminalSchema = z.object({
  name: nameSchema,
  address: z.string().min(1),
  cityId: z.number().min(1).pipe(z.number().int()),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  contactphone: phoneSchema,
  code: codeSchema(MIN_CODE_LENGTH, MAX_CODE_LENGTH),
  active: z.boolean(),
  operatingHours: operatingHoursSchema,
  facilities: facilitiesSchema,
});

export type TerminalFormValues = z.output<typeof editTerminalSchema>;

interface TerminalFormProps {
  defaultValues?: Omit<
    TerminalFormValues,
    'latitude' | 'longitude' | 'operatingHours' | 'facilities'
  > & {
    latitude: number | string;
    longitude: number | string;
    operatingHours?: terminals.OperatingHours;
    facilities?: terminals.Facility[];
  };
  onSubmit: (values: TerminalFormValues) => Promise<unknown>;
  submitButtonText?: string;
}

/**
 * Form component for creating and editing terminals
 */
function TerminalForm({
  defaultValues,
  onSubmit,
  submitButtonText,
}: TerminalFormProps) {
  const tTerminals = useTranslations('terminals');
  const tCommon = useTranslations('common');

  // Transform default values to use strings for numeric inputs
  const transformedDefaults = defaultValues
    ? {
        ...defaultValues,
        latitude: defaultValues.latitude?.toString() || '',
        longitude: defaultValues.longitude?.toString() || '',
        operatingHours:
          defaultValues.operatingHours || ({} as terminals.OperatingHours),
        facilities: defaultValues.facilities ?? [],
      }
    : undefined;

  // Fetch cities for the dropdown
  const { data: citiesData, isLoading: isLoadingCities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => await imsClient.inventory.listCities(),
  });

  const form = useForm({
    defaultValues: transformedDefaults ?? {
      name: '',
      address: '',
      cityId: 0,
      latitude: '',
      longitude: '',
      contactphone: '',
      code: '',
      active: true,
      operatingHours: {} as terminals.OperatingHours,
      facilities: [] as terminals.Facility[],
    },
    validators: {
      onChange: editTerminalSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = editTerminalSchema.parse(value);
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
      className="space-y-6"
    >
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{tTerminals('form.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="name">{tCommon('fields.name')}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={tTerminals('form.placeholders.name')}
                  aria-invalid={hasFieldErrors(field)}
                  required
                />
              </div>
            )}
          </form.Field>

          {/* Code */}
          <form.Field name="code">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="code">{tCommon('fields.code')}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={tTerminals('form.placeholders.code')}
                  aria-invalid={hasFieldErrors(field)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {tTerminals('form.helpText.code')}
                </p>
              </div>
            )}
          </form.Field>

          {/* Address */}
          <form.Field name="address">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="address">{tTerminals('fields.address')}</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={tTerminals('form.placeholders.address')}
                  aria-invalid={hasFieldErrors(field)}
                  required
                />
              </div>
            )}
          </form.Field>

          {/* Contact */}
          <form.Field name="contactphone">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="contactphone">
                  {tTerminals('fields.contactphone')}
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={tTerminals('form.placeholders.contactphone')}
                  aria-invalid={hasFieldErrors(field)}
                />
              </div>
            )}
          </form.Field>

          {/* City */}
          <form.Field name="cityId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="cityId">{tTerminals('fields.city')}</Label>
                <Select
                  value={field.state.value?.toString() ?? ''}
                  onValueChange={(value: string) =>
                    field.handleChange(parseInt(value, 10))
                  }
                  disabled={isLoadingCities}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={tTerminals('form.placeholders.city')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {citiesData?.cities?.map((city: cities.City) => (
                      <SelectItem key={city.id} value={city.id.toString()}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          {/* Coordinates */}
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

          {/* Active Status */}
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
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle>{tTerminals('fields.operatingHours')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form.Field name="operatingHours">
            {(field) => (
              <div className="space-y-4">
                {daysOfWeek.map((day) => (
                  <OperatingHoursSelector
                    key={day}
                    day={day}
                    timeSlots={field.state.value?.[day] || []}
                    onChange={(timeSlots) => {
                      const newHours = {
                        ...(field.state.value || {}),
                      } as terminals.OperatingHours;
                      newHours[day] = timeSlots;
                      field.handleChange(newHours);
                    }}
                    dayLabel={tCommon(`days.${day}`)}
                  />
                ))}
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* Facilities */}
      <Card>
        <CardHeader>
          <CardTitle>{tTerminals('fields.facilities')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form.Field name="facilities">
            {(field) => (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {facilityOptions.map((facility) => {
                  const isChecked = (field.state.value || []).some(
                    (f: terminals.Facility) => f.name === facility.label,
                  );
                  return (
                    <div
                      key={facility.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={facility.id}
                        checked={isChecked}
                        onCheckedChange={(
                          checked: boolean | 'indeterminate',
                        ) => {
                          let newFacilities = [
                            ...(field.state.value || []),
                          ] as terminals.Facility[];
                          if (checked === true && !isChecked) {
                            newFacilities.push({
                              name: facility.label,
                              description: undefined,
                              icon: undefined,
                            });
                          } else if (checked === false && isChecked) {
                            newFacilities = newFacilities.filter(
                              (f) => f.name !== facility.label,
                            );
                          }
                          field.handleChange(newFacilities);
                        }}
                      />
                      <Label htmlFor={facility.id}>{facility.label}</Label>
                    </div>
                  );
                })}
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* Buttons */}
      <div className="flex justify-end space-x-2 pt-4">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]: [boolean, boolean]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting && (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              )}
              {submitButtonText ?? tCommon('actions.create')}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

export default TerminalForm;
