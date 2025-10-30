'use client';

import { useCallback, useEffect } from 'react';
import { useStore } from '@tanstack/react-form';
import { RefreshCcwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import useQueryAllNodes from '@/app/nodes/hooks/use-query-all-nodes';
import PathwayOptionsList from '@/app/pathways/components/pathway-options-list';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import useForm from '@/hooks/use-form';
import useQueryAllTollbooths from '@/pathways/hooks/use-query-all-tollbooths';
import { requiredIntegerSchema } from '@/schemas/number';
import {
  PathwayOption,
  PathwayOptionRaw,
  createPathwayOptionSchema,
} from '@/schemas/pathway-options';
import { optionalStringSchema, requiredStringSchema } from '@/schemas/string';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createPathwayFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    id: z.number().optional(),
    originNodeId: requiredIntegerSchema(tValidations),
    destinationNodeId: requiredIntegerSchema(tValidations),
    name: requiredStringSchema(tValidations),
    code: requiredStringSchema(tValidations),
    description: optionalStringSchema(),
    isEmptyTrip: z.boolean().default(false),
    isSellable: z.boolean().default(false),
    active: z.boolean().default(false),
    options: z.array(createPathwayOptionSchema(tValidations)).default([]),
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
  const { data: tollbooths } = useQueryAllTollbooths();
  const rawDefaultValues: PathwayFormRawValues = defaultValues
    ? {
        ...defaultValues,
        id: defaultValues.id,
        originNodeId: defaultValues.originNodeId.toString() || '',
        destinationNodeId: defaultValues.destinationNodeId.toString() || '',
        name: defaultValues.name || '',
        code: defaultValues.code || '',
        description: defaultValues.description || '',
        isEmptyTrip: defaultValues.isEmptyTrip || false,
        isSellable: defaultValues.isSellable || false,
        active: defaultValues.active,
        options: (defaultValues.options || []).map((option) => ({
          ...option,
          description: option.description || '',
          distanceKm: option.distanceKm?.toString() ?? '',
          typicalTimeMin: option.typicalTimeMin?.toString() ?? '',
          avgSpeedKmh: option.avgSpeedKmh?.toString() ?? '',
          passThroughTimeMin: option.passThroughTimeMin?.toString() || '',
          tolls: (option.tolls || []).map((toll) => ({
            ...toll,
            nodeId: toll.nodeId?.toString() ?? '',
            passTimeMin: toll.passTimeMin?.toString() ?? '',
            distance: toll.distance?.toString() ?? '',
          })),
        })),
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
        options: [],
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
          let sequence = 1;
          parsed.data.options = parsed.data.options.map(
            (option: PathwayOption) => ({
              ...option,
              sequence: sequence++,
              passThroughTimeMin: option.isPassThrough
                ? option.passThroughTimeMin
                : null,
            }),
          );
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

  const newOption: PathwayOptionRaw = {
    name: '',
    description: '',
    distanceKm: '',
    typicalTimeMin: '',
    avgSpeedKmh: '',
    isPassThrough: false,
    passThroughTimeMin: '',
    isDefault: false,
    active: true,
    tolls: [],
  };

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
                className="w-full"
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
                className="w-full"
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
            {(field) => (
              <field.SwitchInput
                label={tCommon('fields.active')}
                disabled={(form.store.state.values.options?.length ?? 0) === 0}
                description={tPathways('messages.pathwayStatusInfo')}
              />
            )}
          </form.AppField>
        </FormLayout>

        <div className="pt-4">
          <FormLayout title={tPathways('sections.options')}>
            {defaultValues?.id ? (
              <form.AppField name="options" mode="array">
                {(field) => (
                  <PathwayOptionsList
                    form={form as unknown as ReturnType<typeof useForm>}
                    options={
                      (field.state.value as PathwayOptionRaw[]).map(
                        (option) => ({
                          ...option,
                          id: option.id ? Number(option.id) : undefined,
                          distanceKm: Number(option.distanceKm),
                          typicalTimeMin: Number(option.typicalTimeMin),
                          avgSpeedKmh: Number(option.avgSpeedKmh),
                          passThroughTimeMin: option.passThroughTimeMin
                            ? Number(option.passThroughTimeMin)
                            : null,
                          tolls: option.tolls?.map((toll) => ({
                            ...toll,
                            id: toll.id ? Number(toll.id) : undefined,
                            nodeId: Number(toll.nodeId),
                            passTimeMin: Number(toll.passTimeMin),
                            distance: Number(toll.distance),
                          })),
                        }),
                      ) || []
                    }
                    newOption={newOption}
                    nodes={
                      tollbooths?.data.map((tollbooth) => ({
                        id: tollbooth.id,
                        name: tollbooth.name,
                        code: tollbooth.code,
                        tollPrice: tollbooth.tollPrice ?? 0,
                        iaveEnabled: tollbooth.iaveEnabled ?? false,
                      })) || []
                    }
                  />
                )}
              </form.AppField>
            ) : (
              <div className="text-sm text-gray-500">
                {tPathways('errors.savePathwayFirst')}
              </div>
            )}
          </FormLayout>
        </div>

        <FormFooter>
          <form.AppForm>
            <form.SubmitButton>
              {defaultValues
                ? tPathways('actions.update')
                : tPathways('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </Form>
    </div>
  );
}
