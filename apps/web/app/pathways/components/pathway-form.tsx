'use client';

import { useCallback, useEffect } from 'react';
import { useStore } from '@tanstack/react-form';
import { RefreshCcwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import useQueryAllNodes from '@/app/nodes/hooks/use-query-all-nodes';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import { requiredIntegerSchema } from '@/schemas/number';
import { optionalStringSchema, requiredStringSchema } from '@/schemas/string';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createPathwayFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    originNodeId: requiredIntegerSchema(tValidations),
    destinationNodeId: requiredIntegerSchema(tValidations),
    name: requiredStringSchema(tValidations),
    code: requiredStringSchema(tValidations),
    description: optionalStringSchema(),
    isEmptyTrip: z.boolean().default(false),
    isSellable: z.boolean().default(false),
    active: z.boolean().default(false),
  });

export type PathwayFormValues = z.output<
  ReturnType<typeof createPathwayFormSchema>
>;

type PathwayFormRawValues = z.input<ReturnType<typeof createPathwayFormSchema>>;

interface PathwayFormProps {
  defaultValues?: PathwayFormValues;
  onSubmit: (values: PathwayFormValues) => Promise<unknown>;
}

export default function PathwayForm({
  defaultValues,
  onSubmit,
}: PathwayFormProps) {
  const tPathways = useTranslations('pathways');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');
  const pathwaySchema = createPathwayFormSchema(tValidations);
  const { data: originNodes } = useQueryAllNodes();
  const { data: destinationNodes } = useQueryAllNodes();
  const rawDefaultValues: PathwayFormRawValues = defaultValues
    ? {
        ...defaultValues,
        originNodeId: defaultValues.originNodeId.toString() || '',
        destinationNodeId: defaultValues.destinationNodeId.toString() || '',
        name: defaultValues.name || '',
        code: defaultValues.code || '',
        description: defaultValues.description || '',
        isEmptyTrip: defaultValues.isEmptyTrip || false,
        isSellable: defaultValues.isSellable || false,
        active: defaultValues.active,
      }
    : {
        originNodeId: '',
        destinationNodeId: '',
        name: '',
        code: '',
        description: '',
        isEmptyTrip: false,
        isSellable: false,
        active: false,
      };

  const form = useForm({
    defaultValues: rawDefaultValues,
    validators: {
      onSubmit: pathwaySchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = pathwaySchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'pathway',
          error,
          tValidations,
          tCommon,
        });
      }
    },
  });

  const originNodeId = useStore(
    form.store,
    (state) => state.values.originNodeId,
  );
  const destinationNodeId = useStore(
    form.store,
    (state) => state.values.destinationNodeId,
  );

  const regenerateName = useCallback(() => {
    const originNode = originNodes?.data.find(
      (node) => node.id.toString() === originNodeId,
    );
    const destinationNode = destinationNodes?.data.find(
      (node) => node.id.toString() === destinationNodeId,
    );

    if (originNode && destinationNode) {
      form?.setFieldValue(
        'name',
        `${originNode?.name} - ${destinationNode?.name}`,
      );
      form?.setFieldValue(
        'code',
        `${originNode?.code}-${destinationNode?.code}`,
      );
    }
  }, [originNodeId, destinationNodeId, originNodes, destinationNodes, form]);

  useEffect(() => {
    regenerateName();
  }, [originNodeId, destinationNodeId, form, regenerateName]);

  return (
    <div className="max-w-7xl">
      <Form onSubmit={form.handleSubmit}>
        <FormLayout title={tPathways('form.title')}>
          <form.AppField name="originNodeId">
            {(field) => (
              <field.SelectInput
                items={
                  originNodes?.data.map((node) => ({
                    id: node.id.toString(),
                    name: `${node.name} (${node.code})`,
                    value: node.id.toString(),
                  })) ?? []
                }
                emptyOptionsLabel={tPathways(
                  'form.placeholders.emptyOptionsLabel',
                )}
                label={tPathways('fields.origin')}
                placeholder={tPathways('form.placeholders.origin')}
                isRequired
              />
            )}
          </form.AppField>

          <form.AppField name="destinationNodeId">
            {(field) => (
              <field.SelectInput
                items={
                  destinationNodes?.data.map((node) => ({
                    id: node.id.toString(),
                    name: `${node.name} (${node.code})`,
                    value: node.id.toString(),
                  })) ?? []
                }
                emptyOptionsLabel={tPathways(
                  'form.placeholders.emptyOptionsLabel',
                )}
                label={tPathways('fields.destination')}
                placeholder={tPathways('form.placeholders.destination')}
                isRequired
              />
            )}
          </form.AppField>

          <div className="space-y-2">
            <div className="flex flex-row justify-end">
              <button
                type="button"
                onClick={regenerateName}
                className="border border-gray-300 text-sm text-gray-500 px-4 py-2 rounded-md flex items-center gap-2"
              >
                <RefreshCcwIcon className="w-4 h-4" />{' '}
                {tPathways('actions.regenerateName')}
              </button>
            </div>
          </div>

          <form.AppField name="name">
            {(field) => (
              <field.TextInput
                label={tPathways('fields.name')}
                placeholder={tPathways('form.placeholders.name')}
                isRequired
              />
            )}
          </form.AppField>

          <form.AppField name="code">
            {(field) => (
              <field.TextInput
                label={tPathways('fields.code')}
                placeholder={tPathways('form.placeholders.code')}
                isRequired
              />
            )}
          </form.AppField>

          <form.AppField name="description">
            {(field) => (
              <field.TextAreaInput
                label={tPathways('fields.description')}
                placeholder={tPathways('form.placeholders.description')}
              />
            )}
          </form.AppField>

          <form.AppField name="isEmptyTrip">
            {(field) => (
              <field.SwitchInput label={tPathways('fields.isEmptyTrip')} />
            )}
          </form.AppField>
          <form.AppField name="isSellable">
            {(field) => (
              <field.SwitchInput label={tPathways('fields.isSellable')} />
            )}
          </form.AppField>

          <form.AppField name="active">
            {(field) => <field.SwitchInput label={tCommon('fields.active')} />}
          </form.AppField>

          <FormFooter>
            <form.AppForm>
              <form.SubmitButton>
                {defaultValues
                  ? tPathways('actions.update')
                  : tPathways('actions.create')}
              </form.SubmitButton>
            </form.AppForm>
          </FormFooter>
        </FormLayout>
      </Form>
    </div>
  );
}
