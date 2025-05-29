import { useForm } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import useQueryAllCities from '@/cities/hooks/use-query-all-cities';
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
import { codeSchema, nameSchema, phoneSchema } from '@/schemas/common';
import hasFieldErrors from '@/utils/has-field-errors';

const transporterSchema = z.object({
  name: nameSchema,
  code: codeSchema(1, 10),
  headquarterCityId: z.number().nonnegative().optional(),
  active: z.boolean(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: phoneSchema,
  logoUrl: z.string().url().optional(),
  licenseNumber: z.string().optional(),
});

export type TransporterFormValues = z.infer<typeof transporterSchema>;

interface TransporterFormProps {
  defaultValues?: TransporterFormValues;
  onSubmit: (values: TransporterFormValues) => Promise<unknown>;
  submitButtonText?: string;
}

export default function TransporterForm({
  defaultValues,
  onSubmit,
  submitButtonText,
}: TransporterFormProps) {
  const tTransporters = useTranslations('transporters');
  const tCommon = useTranslations('common');
  const { data: cities } = useQueryAllCities();

  const form = useForm({
    defaultValues: defaultValues ?? {
      name: '',
      code: '',
      description: '',
      licenseNumber: '',
      active: true,
    },
    validators: {
      onChange: transporterSchema,
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
      <FormLayout title={tTransporters('form.title')}>
        <form.Field name="name">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="name">{tCommon('fields.name')}</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={tTransporters('form.placeholders.name')}
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
                placeholder={tTransporters('form.placeholders.code')}
                aria-invalid={hasFieldErrors(field)}
                maxLength={10}
              />
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
                placeholder={tTransporters('form.placeholders.description')}
                aria-invalid={hasFieldErrors(field)}
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
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={tTransporters('form.placeholders.website')}
                aria-invalid={hasFieldErrors(field)}
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
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={tTransporters('form.placeholders.email')}
                aria-invalid={hasFieldErrors(field)}
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
                placeholder={tTransporters('form.placeholders.phone')}
                aria-invalid={hasFieldErrors(field)}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="headquarterCityId">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="headquarterCityId">
                {tTransporters('fields.headquarterCity')}
              </Label>
              <Select
                id={field.name}
                name={field.name}
                value={field.state.value ?? ''}
                onValueChange={(value: string) =>
                  field.handleChange(parseInt(value, 10))
                }
              >
                <SelectTrigger aria-invalid={hasFieldErrors(field)}>
                  <SelectValue
                    placeholder={tTransporters('fields.headquarterCity')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {cities?.cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
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
              <Label htmlFor="logoUrl">{tCommon('fields.logoUrl')}</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={tTransporters('form.placeholders.logoUrl')}
                aria-invalid={hasFieldErrors(field)}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="licenseNumber">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">
                {tTransporters('fields.licenseNumber')}
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={tTransporters('form.placeholders.licenseNumber')}
                aria-invalid={hasFieldErrors(field)}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="active">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="active">{tCommon('fields.active')}</Label>
              <Switch
                id={field.name}
                name={field.name}
                checked={field.state.value}
                onCheckedChange={(checked: boolean) =>
                  field.handleChange(checked)
                }
              />
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
