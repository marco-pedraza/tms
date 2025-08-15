'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';
import type { amenities, service_types } from '@repo/ims-client';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import AmenityCard from '@/components/ui/amenity-card';
import useForm from '@/hooks/use-form';
import { codeSchema, nameSchema } from '@/schemas/common';
import type { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';
import useQueryServiceTypeAmenities from '../hooks/use-query-service-type-amenities';

const createServiceTypeFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    name: nameSchema(tValidations),
    code: codeSchema(tValidations, 2, 20),
    category: z.custom<service_types.ServiceTypeCategory>(
      (val) => typeof val === 'string' && val.length > 0,
      { message: tValidations('required') },
    ),
    description: z.string().trim().optional(),
    active: z.boolean(),
    amenityIds: z.array(z.number()),
  });

export type ServiceTypeFormValues = z.output<
  ReturnType<typeof createServiceTypeFormSchema>
>;

interface Props {
  defaultValues?: ServiceTypeFormValues;
  onSubmit: (values: ServiceTypeFormValues) => Promise<unknown>;
}

export default function ServiceTypeForm({ defaultValues, onSubmit }: Props) {
  const tServiceTypes = useTranslations('serviceTypes');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');
  const serviceTypeFormSchema = createServiceTypeFormSchema(tValidations);
  const form = useForm({
    defaultValues: defaultValues ?? {
      name: '',
      code: '',
      category: '',
      description: undefined,
      active: true,
      amenityIds: [],
    },
    validators: {
      onChange: serviceTypeFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = serviceTypeFormSchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'serviceType',
          error,
          tValidations,
          tCommon,
        });
      }
    },
  });

  // Query amenities for service_type
  const { data: amenities } = useQueryServiceTypeAmenities();

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tServiceTypes('form.title')}>
        <form.AppField name="name">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.name')}
              placeholder={tServiceTypes('form.placeholders.name')}
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="code">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.code')}
              placeholder={tServiceTypes('form.placeholders.code')}
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="category">
          {(field) => (
            <field.SelectInput
              label={tCommon('fields.category')}
              placeholder={tServiceTypes('form.placeholders.category')}
              isRequired
              items={[
                { id: 'regular', name: tServiceTypes('categories.regular') },
                { id: 'express', name: tServiceTypes('categories.express') },
                { id: 'luxury', name: tServiceTypes('categories.luxury') },
                { id: 'economic', name: tServiceTypes('categories.economic') },
              ]}
            />
          )}
        </form.AppField>

        <form.AppField name="amenityIds">
          {(field) => (
            <div className="space-y-4">
              <field.MultiSelectInput
                label={tServiceTypes('fields.amenities')}
                placeholder={tServiceTypes('form.placeholders.amenities')}
                items={
                  amenities?.data.map((amenity: amenities.Amenity) => ({
                    id: amenity.id.toString(),
                    name: amenity.name,
                  })) ?? []
                }
                emptyOptionsLabel={tServiceTypes(
                  'form.placeholders.emptyAmenitiesList',
                )}
              />

              {field.state.value && field.state.value.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">
                    {tServiceTypes('fields.selectedAmenities', {
                      count: field.state.value.length,
                    })}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {field.state.value.map((amenityId: number) => {
                      const amenity = amenities?.data.find(
                        (a) => a.id === amenityId,
                      );
                      return amenity ? (
                        <AmenityCard key={amenity.id} amenity={amenity} />
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </form.AppField>

        <form.AppField name="description">
          {(field) => (
            <field.TextAreaInput
              label={tCommon('fields.description')}
              placeholder={tServiceTypes('form.placeholders.description')}
            />
          )}
        </form.AppField>

        <form.AppField name="active">
          {(field) => <field.SwitchInput label={tCommon('fields.active')} />}
        </form.AppField>

        <FormFooter>
          <form.AppForm>
            <form.SubmitButton>
              {defaultValues
                ? tServiceTypes('actions.update')
                : tServiceTypes('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </FormLayout>
    </Form>
  );
}
