import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { amenities } from '@repo/ims-client';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { UseValidationsTranslationsResult } from '@/types/translations';
import { createEnumArray } from '@/utils/create-enum-array';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

// Create mapping object for AmenityCategory to use with createEnumArray
const amenityCategoryMap: { [key in amenities.AmenityCategory]: undefined } = {
  basic: undefined,
  comfort: undefined,
  technology: undefined,
  security: undefined,
  accessibility: undefined,
  services: undefined,
};

/**
 * Create form validation schema for amenities
 */
const createAmenityFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') })
      .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, {
        message: tValidations('name.letters'),
      }),
    category: z
      .string()
      .refine(
        (val): val is amenities.AmenityCategory =>
          createEnumArray(amenityCategoryMap).includes(
            val as amenities.AmenityCategory,
          ),
        { message: tValidations('required') },
      )
      .transform((val) => val as amenities.AmenityCategory),
    description: z.string().optional(),
    iconName: z.string().optional(),
    active: z.boolean().default(true),
  });

export type AmenityFormValues = z.output<
  ReturnType<typeof createAmenityFormSchema>
>;
type AmenityFormRawValues = z.input<ReturnType<typeof createAmenityFormSchema>>;

interface AmenityFormProps {
  defaultValues?: AmenityFormValues;
  onSubmit: (values: AmenityFormValues) => Promise<unknown>;
}

/**
 * Form component for creating and editing amenities
 */
export default function AmenityForm({
  defaultValues,
  onSubmit,
}: AmenityFormProps) {
  const tCommon = useTranslations('common');
  const tAmenities = useTranslations('amenities');
  const tValidations = useTranslations('validations');

  const amenitySchema = createAmenityFormSchema(tValidations);

  const rawDefaultValues: AmenityFormRawValues | undefined = defaultValues
    ? {
        ...defaultValues,
        description: defaultValues.description || '',
        iconName: defaultValues.iconName || '',
      }
    : undefined;

  const form = useForm({
    defaultValues: rawDefaultValues ?? {
      name: '',
      category: '',
      description: '',
      iconName: '',
      active: true,
    },
    validators: {
      onChange: amenitySchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = amenitySchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'amenity',
          error,
          tValidations,
        });
      }
    },
  });

  // Generate category options from enum
  const categoryOptions = createEnumArray(amenityCategoryMap).map(
    (category) => ({
      id: category,
      name: tAmenities(`categories.${category}`),
    }),
  );

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tAmenities('form.title')}>
        <form.AppField name="name">
          {(field) => (
            <field.TextInput
              label={tCommon('fields.name')}
              placeholder={tAmenities('form.placeholders.name')}
              isRequired
            />
          )}
        </form.AppField>

        <form.AppField name="category">
          {(field) => (
            <field.SelectInput
              label={tCommon('fields.category')}
              placeholder={tAmenities('form.placeholders.category')}
              isRequired
              items={categoryOptions}
            />
          )}
        </form.AppField>

        <form.AppField name="iconName">
          {(field) => (
            <field.IconInput
              label={tAmenities('fields.iconName')}
              placeholder={tAmenities('form.placeholders.iconName')}
            />
          )}
        </form.AppField>

        <form.AppField name="description">
          {(field) => (
            <field.TextAreaInput
              label={tCommon('fields.description')}
              placeholder={tAmenities('form.placeholders.description')}
            />
          )}
        </form.AppField>

        <form.AppField name="active">
          {(field) => <field.SwitchInput label={tCommon('fields.active')} />}
        </form.AppField>
      </FormLayout>

      <FormFooter>
        <form.AppForm>
          <form.SubmitButton>
            {defaultValues
              ? tAmenities('actions.update')
              : tAmenities('actions.create')}
          </form.SubmitButton>
        </form.AppForm>
      </FormFooter>
    </Form>
  );
}
