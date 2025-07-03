import { useTranslations } from 'next-intl';
import { z } from 'zod';
import useQueryAllCities from '@/cities/hooks/use-query-all-cities';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useForm from '@/hooks/use-form';
import useQueryAllPopulations from '@/populations/hooks/use-query-all-populations';
import { UseTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createNodeFormSchema = (tCommon: UseTranslationsResult) =>
  z.object({
    name: z.string().min(1, { message: tCommon('validations.required') }),
    code: z.string().min(1, { message: tCommon('validations.required') }),
    radius: z
      .string()
      .min(1, { message: tCommon('validations.required') })
      .refine(
        (val) => {
          const num = parseFloat(val);
          return num > 0;
        },
        { message: tCommon('validations.radius.positive') },
      )
      .transform((val) => parseFloat(val)),
    cityId: z
      .string()
      .min(1, tCommon('validations.required'))
      .transform((val) => parseInt(val)),
    populationId: z
      .string()
      .min(1, tCommon('validations.required'))
      .transform((val) => parseInt(val)),
    latitude: z
      .string()
      .min(1, { message: tCommon('validations.required') })
      .refine(
        (val) => {
          if (isNaN(parseFloat(val))) {
            return false;
          }
          const num = parseFloat(val);
          return num >= -90 && num <= 90;
        },
        { message: tCommon('validations.latitude.range') },
      )
      .transform((val) => parseFloat(val)),
    longitude: z
      .string()
      .min(1, { message: tCommon('validations.required') })
      .refine(
        (val) => {
          if (isNaN(parseFloat(val))) {
            return false;
          }
          const num = parseFloat(val);
          return num >= -180 && num <= 180;
        },
        { message: tCommon('validations.longitude.range') },
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
  const nodeSchema = createNodeFormSchema(tCommon);
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
          tCommon,
        });
      }
    },
  });
  const { data: cities } = useQueryAllCities();
  const { data: populations } = useQueryAllPopulations();

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
          <FormLayout title={tNodes('form.title')}>
            <form.AppField name="name">
              {(field) => (
                <field.TextInput
                  label={tCommon('fields.name')}
                  placeholder={tNodes('form.placeholders.name')}
                />
              )}
            </form.AppField>
            <form.AppField name="code">
              {(field) => (
                <field.TextInput
                  label={tCommon('fields.code')}
                  placeholder={tNodes('form.placeholders.code')}
                />
              )}
            </form.AppField>
            <form.AppField name="radius">
              {(field) => (
                <field.TextInput
                  label={tNodes('fields.radius')}
                  placeholder={tNodes('form.placeholders.radius')}
                  inputMode="decimal"
                />
              )}
            </form.AppField>
          </FormLayout>
        </TabsContent>
        <TabsContent value="location">
          <FormLayout title={tNodes('form.title')}>
            <div className="grid grid-cols-2 gap-4">
              <form.AppField name="cityId">
                {(field) => (
                  <field.SelectInput
                    label={tNodes('fields.city')}
                    placeholder={tNodes('form.placeholders.city')}
                    items={
                      cities?.data.map((city) => ({
                        id: city.id.toString(),
                        name: city.name,
                      })) ?? []
                    }
                  />
                )}
              </form.AppField>
              <form.AppField name="populationId">
                {(field) => (
                  <field.SelectInput
                    label={tNodes('fields.population')}
                    placeholder={tNodes('form.placeholders.population')}
                    items={
                      populations?.data.map((population) => ({
                        id: population.id.toString(),
                        name: population.name,
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
                    inputMode="decimal"
                  />
                )}
              </form.AppField>
              <form.AppField name="longitude">
                {(field) => (
                  <field.TextInput
                    label={tCommon('fields.longitude')}
                    placeholder={tNodes('form.placeholders.longitude')}
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
