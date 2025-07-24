import { useStore } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useForm from '@/hooks/use-form';
import useQueryAllPopulations from '@/populations/hooks/use-query-all-populations';
import useQueryPopulationCities from '@/populations/hooks/use-query-population-cities';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createNodeFormSchema = (tValidations: UseValidationsTranslationsResult) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') })
      .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, {
        message: tValidations('name.letters'),
      }),
    code: z
      .string()
      .min(1, { message: tValidations('required') })
      .regex(/^[A-Z0-9-]+$/, {
        message: tValidations('code.alphanumeric'),
      }),
    radius: z
      .string()
      .min(1, { message: tValidations('required') })
      .refine(
        (val) => {
          const num = parseFloat(val);
          return num > 0;
        },
        { message: tValidations('radius.positive') },
      )
      .transform((val) => parseFloat(val)),
    cityId: z
      .string()
      .min(1, tValidations('required'))
      .transform((val) => parseInt(val)),
    populationId: z
      .string()
      .min(1, tValidations('required'))
      .transform((val) => parseInt(val)),
    latitude: z
      .string()
      .min(1, { message: tValidations('required') })
      .refine(
        (val) => {
          if (isNaN(parseFloat(val))) {
            return false;
          }
          const num = parseFloat(val);
          return num >= -90 && num <= 90;
        },
        { message: tValidations('latitude.range') },
      )
      .transform((val) => parseFloat(val)),
    longitude: z
      .string()
      .min(1, { message: tValidations('required') })
      .refine(
        (val) => {
          if (isNaN(parseFloat(val))) {
            return false;
          }
          const num = parseFloat(val);
          return num >= -180 && num <= 180;
        },
        { message: tValidations('longitude.range') },
      )
      .transform((val) => parseFloat(val)),
  });

export type NodeFormValues = z.output<ReturnType<typeof createNodeFormSchema>>;
type NodeFormRawValues = z.input<ReturnType<typeof createNodeFormSchema>>;

interface NodeFormProps {
  defaultValues?: NodeFormValues;
  onSubmit: (values: NodeFormValues) => Promise<unknown>;
}

export default function NodeForm({ defaultValues, onSubmit }: NodeFormProps) {
  const tCommon = useTranslations('common');
  const tNodes = useTranslations('nodes');
  const tValidations = useTranslations('validations');
  const nodeSchema = createNodeFormSchema(tValidations);
  const rawDefaultValues: NodeFormRawValues | undefined = defaultValues
    ? {
        name: defaultValues.name,
        code: defaultValues.code,
        radius: defaultValues.radius.toString(),
        cityId: defaultValues.cityId.toString(),
        populationId: defaultValues.populationId.toString(),
        latitude: defaultValues.latitude.toString(),
        longitude: defaultValues.longitude.toString(),
      }
    : undefined;
  const form = useForm({
    defaultValues: rawDefaultValues ?? {
      name: '',
      code: '',
      radius: '',
      cityId: '',
      populationId: '',
      latitude: '',
      longitude: '',
    },
    validators: {
      onChange: nodeSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = nodeSchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'node',
          error,
          tValidations,
        });
      }
    },
  });
  const { data: populations } = useQueryAllPopulations();
  const selectedPopulationId = useStore(
    form.store,
    (state) => state.values.populationId,
  );
  const { data: cities } = useQueryPopulationCities({
    populationId: parseInt(selectedPopulationId),
    enabled: !!selectedPopulationId,
  });

  return (
    <Form onSubmit={form.handleSubmit}>
      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">
            {tCommon('sections.basicInfo')}
          </TabsTrigger>
          <TabsTrigger value="location">
            {tCommon('sections.location')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="basic">
          <FormLayout title={tNodes('form.sections.basicInfo')}>
            <form.AppField name="name">
              {(field) => (
                <field.TextInput
                  label={tCommon('fields.name')}
                  placeholder={tNodes('form.placeholders.name')}
                  isRequired
                />
              )}
            </form.AppField>
            <form.AppField name="code">
              {(field) => (
                <field.TextInput
                  label={tCommon('fields.code')}
                  placeholder={tNodes('form.placeholders.code')}
                  isRequired
                />
              )}
            </form.AppField>
          </FormLayout>
        </TabsContent>
        <TabsContent value="location">
          <FormLayout title={tNodes('form.sections.location')}>
            <div className="grid grid-cols-2 gap-4">
              <form.AppField
                name="populationId"
                listeners={{
                  onChange: () => {
                    form.setFieldValue('cityId', '');
                  },
                }}
              >
                {(field) => (
                  <field.SelectInput
                    label={tNodes('fields.population')}
                    placeholder={tNodes('form.placeholders.population')}
                    isRequired
                    items={
                      populations?.data.map((population) => ({
                        id: population.id.toString(),
                        name: population.name,
                      })) ?? []
                    }
                  />
                )}
              </form.AppField>
              <form.AppField name="cityId">
                {(field) => (
                  <field.SelectInput
                    label={tNodes('fields.city')}
                    placeholder={tNodes('form.placeholders.city')}
                    isRequired
                    emptyOptionsLabel={tNodes(
                      'form.placeholders.emptyCityList',
                    )}
                    items={
                      cities?.data.map((city) => ({
                        id: city.id.toString(),
                        name: city.name,
                      })) ?? []
                    }
                  />
                )}
              </form.AppField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <form.AppField name="latitude">
                {(field) => (
                  <field.TextInput
                    label={tCommon('fields.latitude')}
                    placeholder={tNodes('form.placeholders.latitude')}
                    isRequired
                    inputMode="decimal"
                  />
                )}
              </form.AppField>
              <form.AppField name="longitude">
                {(field) => (
                  <field.TextInput
                    label={tCommon('fields.longitude')}
                    placeholder={tNodes('form.placeholders.longitude')}
                    isRequired
                    inputMode="decimal"
                  />
                )}
              </form.AppField>
              <form.AppField name="radius">
                {(field) => (
                  <field.TextInput
                    label={tNodes('fields.radius')}
                    placeholder={tNodes('form.placeholders.radius')}
                    isRequired
                    inputMode="decimal"
                  />
                )}
              </form.AppField>
            </div>
          </FormLayout>
        </TabsContent>
      </Tabs>
      <FormFooter>
        <form.AppForm>
          <form.SubmitButton>
            {defaultValues
              ? tNodes('actions.update')
              : tNodes('actions.create')}
          </form.SubmitButton>
        </form.AppForm>
      </FormFooter>
    </Form>
  );
}
