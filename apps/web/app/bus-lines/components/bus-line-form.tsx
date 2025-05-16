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
  code: codeSchema(1, 10),
  description: z.string().optional(),
  transporterId: z.number().nonnegative(),
  serviceTypeId: z.number().nonnegative(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
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
      logoUrl: '',
      primaryColor: '',
      secondaryColor: '',
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

        <form.Field name="logoUrl">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="logo_url">{tCommon('fields.logo')}</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={tBusLines('form.placeholders.logo')}
              />
              <p className="text-sm text-muted-foreground">
                {tBusLines('form.placeholders.logo')}
              </p>
            </div>
          )}
        </form.Field>

        <form.Field name="primaryColor">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="primary_color">
                {tCommon('fields.primaryColor')}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="primary_color"
                  name="primary_color"
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  name="primary_color"
                  placeholder="#000000"
                />
              </div>
            </div>
          )}
        </form.Field>

        <form.Field name="secondaryColor">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="secondary_color">
                {tCommon('fields.secondaryColor')}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="secondary_color"
                  name="secondary_color"
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  name="secondary_color"
                  placeholder="#ffffff"
                />
              </div>
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
