import { useForm } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import FormLayout from '@/components/form/form-layout';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { nameSchema } from '@/schemas/common';
import { codeSchema } from '@/schemas/common';
import useQueryAllServiceTypes from '@/service-types/hooks/use-query-all-service-types';
import useQueryAllTransporters from '@/transporters/hooks/use-query-all-transporters';

const busLineSchema = z.object({
  name: nameSchema,
  code: codeSchema(1, 20),
  description: z.string().optional(),
  transporterId: z.number().nonnegative(),
  serviceTypeId: z.number().nonnegative(),
  pricePerKilometer: z.number().positive(),
  fleetSize: z.number().positive().optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  active: z.boolean(),
});

export type BusLineFormValues = z.infer<typeof busLineSchema>;

interface BusLineFormProps {
  defaultValues?: BusLineFormValues;
  onSubmit: (values: BusLineFormValues) => Promise<unknown>;
  submitButtonText?: string;
}

export default function BusLineForm({
  defaultValues,
  onSubmit,
  submitButtonText,
}: BusLineFormProps) {
  const tCommon = useTranslations('common');
  const tBusLines = useTranslations('busLines');
  const { data: transporters } = useQueryAllTransporters();
  const { data: serviceTypes } = useQueryAllServiceTypes();
  const form = useForm({
    defaultValues: defaultValues ?? {
      name: '',
      code: '',
      description: '',
      transporterId: -1,
      serviceTypeId: -1,
      pricePerKilometer: 1.0,
      fleetSize: undefined,
      website: '',
      email: '',
      phone: '',
      active: true,
    },
    validators: {
      onChange: busLineSchema,
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
      <FormLayout title={tBusLines('form.title')}>
        <form.Field name="name">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="name">{tCommon('fields.name')}</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={tBusLines('form.placeholders.name')}
                required
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
                placeholder={tBusLines('form.placeholders.code')}
                required
                maxLength={10}
              />
              <p className="text-sm text-muted-foreground">
                {tBusLines('form.placeholders.code')}
              </p>
            </div>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="description">
                {tCommon('fields.description')}
              </Label>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={tBusLines('form.placeholders.description')}
                rows={3}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="transporterId">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="transporter_id">
                {tCommon('fields.transporter')}
              </Label>
              <Select
                onValueChange={(value: string) =>
                  field.handleChange(Number(value))
                }
                value={field.state.value ?? ''}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder={tCommon('fields.transporter')} />
                </SelectTrigger>
                <SelectContent>
                  {transporters?.transporters?.map((transporter) => (
                    <SelectItem key={transporter.id} value={transporter.id}>
                      {transporter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Field name="serviceTypeId">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="service_type">
                {tCommon('fields.serviceType')}
              </Label>
              <Select
                onValueChange={(value: string) =>
                  field.handleChange(Number(value))
                }
                value={field.state.value ?? ''}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder={tCommon('fields.serviceType')} />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes?.serviceTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Field name="pricePerKilometer">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="price_per_kilometer">Precio por kilómetro</Label>
              <Input
                id={field.name}
                name={field.name}
                type="number"
                step="0.01"
                min="0"
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                placeholder="1.0"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="fleetSize">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="fleet_size">Tamaño de flota</Label>
              <Input
                id={field.name}
                name={field.name}
                type="number"
                min="1"
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                placeholder="Número de vehículos"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="website">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="website">{tCommon('fields.website')}</Label>
              <Input
                id={field.name}
                name={field.name}
                type="url"
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="https://ejemplo.com"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="email">{tCommon('fields.email')}</Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="contacto@ejemplo.com"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="phone">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="phone">{tCommon('fields.phone')}</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="+52 55 1234 5678"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="active">
          {(field) => (
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={field.state.value ?? false}
                onCheckedChange={(checked: boolean) =>
                  field.handleChange(checked)
                }
              />
              <Label htmlFor="active">{tCommon('fields.active')}</Label>
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
      </FormLayout>
    </form>
  );
}
