'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import type { pathways } from '@repo/ims-client';
import useQueryAllBusLines from '@/bus-lines/hooks/use-query-all-bus-lines';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import useForm from '@/hooks/use-form';
import useQueryAllNodes from '@/nodes/hooks/use-query-all-nodes';
import useQueryAllPathways from '@/pathways/hooks/use-query-all-pathways';
import { optionalIntegerSchema, requiredIntegerSchema } from '@/schemas/number';
import { optionalStringSchema, requiredStringSchema } from '@/schemas/string';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';
import RouteLegsList from './route-legs-list';
import RouteSummary from './route-summary';

const createRouteFormSchema = (
  tValidations: UseValidationsTranslationsResult,
) =>
  z.object({
    id: z.number().optional(),
    name: requiredStringSchema(tValidations),
    code: requiredStringSchema(tValidations),
    description: optionalStringSchema(),
    buslineId: requiredIntegerSchema(tValidations),
    serviceTypeId: optionalIntegerSchema(), // Will be populated from busLine
    originNodeId: optionalIntegerSchema(), // Will be calculated from first leg
    destinationNodeId: optionalIntegerSchema(), // Will be calculated from last leg
    active: z.boolean().default(true),
    autoUpdateNameCode: z.boolean().default(true),
    legs: z
      .array(
        z.object({
          pathwayId: z.string(),
          pathwayOptionId: z.string(),
          position: z.number(),
        }),
      )
      .default([])
      .refine((data) => data.length > 0, {
        message: tValidations('required'),
        path: ['legs'],
      }),
  });

export type RouteFormValues = z.output<
  ReturnType<typeof createRouteFormSchema>
>;

type RouteFormRawValues = z.input<ReturnType<typeof createRouteFormSchema>>;

interface RouteLegRaw {
  pathwayId: string;
  pathwayOptionId: string;
  position: number;
}

interface RouteFormProps {
  defaultValues?: RouteFormValues;
  onSubmit: (values: RouteFormValues) => Promise<unknown>;
}

interface LegContinuityError {
  expectedOrigin: string;
  actualOrigin: string;
}

type NodeData = NonNullable<
  ReturnType<typeof useQueryAllNodes>['data']
>['data'][0];

type PathwayData = NonNullable<
  ReturnType<typeof useQueryAllPathways>['data']
>['data'][0];

/**
 * Creates a map of node IDs to nodes for quick lookup
 */
function createNodesMap(
  nodesData: ReturnType<typeof useQueryAllNodes>['data'],
): Map<number, NodeData> {
  const map = new Map<number, NodeData>();
  if (nodesData?.data) {
    nodesData.data.forEach((node) => {
      map.set(node.id, node);
    });
  }
  return map;
}

/**
 * Validates that route legs connect properly (destination of one leg matches origin of next)
 *
 * Returns a map of leg indices to continuity errors, or an empty map if all legs connect
 */
function validateLegContinuity(
  legs: RouteLegRaw[],
  pathways: PathwayData[],
  nodesMap: Map<number, NodeData>,
  tCommon: ReturnType<typeof useTranslations<'common'>>,
): Map<number, LegContinuityError> {
  const errors = new Map<number, LegContinuityError>();

  if (legs.length < 2 || !pathways.length) {
    return errors;
  }

  for (let i = 0; i < legs.length - 1; i++) {
    const currentLeg = legs[i];
    const nextLeg = legs[i + 1];

    if (!currentLeg?.pathwayId || !nextLeg?.pathwayId) {
      continue;
    }

    const currentPathway = pathways.find(
      (p) => p.id.toString() === currentLeg.pathwayId,
    );
    const nextPathway = pathways.find(
      (p) => p.id.toString() === nextLeg.pathwayId,
    );

    if (!currentPathway || !nextPathway) {
      continue;
    }

    // Check if the destination of current leg matches the origin of next leg
    if (currentPathway.destinationNodeId !== nextPathway.originNodeId) {
      const previousDestinationNode = nodesMap.get(
        currentPathway.destinationNodeId,
      );
      const currentOriginNode = nodesMap.get(nextPathway.originNodeId);

      const expectedOrigin =
        previousDestinationNode?.name || tCommon('unknown');
      const actualOrigin = currentOriginNode?.name || tCommon('unknown');

      // Store error for the next leg (i+1) as it's the one that doesn't connect
      errors.set(i + 1, { expectedOrigin, actualOrigin });
    }
  }

  return errors;
}

/**
 * Transforms raw leg data to the format expected by the API
 */
function transformLegsForSubmission(legs: RouteLegRaw[]) {
  return legs.map((leg, index) => ({
    position: index + 1,
    pathwayId: Number(leg.pathwayId),
    pathwayOptionId: Number(leg.pathwayOptionId),
    active: true,
  }));
}

/**
 * Calculates origin and destination node IDs from the first and last legs
 */
function calculateOriginAndDestination(
  transformedLegs: ReturnType<typeof transformLegsForSubmission>,
  pathways: PathwayData[],
): { originNodeId?: number; destinationNodeId?: number } {
  if (transformedLegs.length === 0) {
    return {};
  }

  const firstLeg = transformedLegs[0];
  const lastLeg = transformedLegs[transformedLegs.length - 1];

  if (!firstLeg || !lastLeg) {
    return {};
  }

  const firstPathway = pathways.find((p) => p.id === firstLeg.pathwayId) as
    | pathways.PathwayWithRelations
    | undefined;
  const lastPathway = pathways.find((p) => p.id === lastLeg.pathwayId) as
    | pathways.PathwayWithRelations
    | undefined;

  return {
    originNodeId: firstPathway?.originNodeId,
    destinationNodeId: lastPathway?.destinationNodeId,
  };
}

/**
 * Transforms form values to match RouteFormValues schema output
 */
function transformFormValues(
  value: RouteFormRawValues,
  serviceTypeId: number,
  originNodeId: number,
  destinationNodeId: number,
  transformedLegs: ReturnType<typeof transformLegsForSubmission>,
): RouteFormValues {
  return {
    name: value.name,
    code: value.code,
    description: value.description,
    buslineId: Number(value.buslineId),
    serviceTypeId,
    originNodeId,
    destinationNodeId,
    active: value.active ?? false,
    autoUpdateNameCode: value.autoUpdateNameCode ?? false,
    legs: transformedLegs.map((leg) => ({
      pathwayId: leg.pathwayId.toString(),
      pathwayOptionId: leg.pathwayOptionId.toString(),
      position: leg.position,
    })),
  };
}

export default function RouteForm({ defaultValues, onSubmit }: RouteFormProps) {
  const tRoutes = useTranslations('routes');
  const tCommon = useTranslations('common');
  const tValidations = useTranslations('validations');
  const routeSchema = createRouteFormSchema(tValidations);
  const { data: busLines } = useQueryAllBusLines();
  const { data: pathwaysData } = useQueryAllPathways();
  const { data: nodesData } = useQueryAllNodes();
  const [legContinuityErrors, setLegContinuityErrors] = useState<
    Map<number, LegContinuityError>
  >(new Map());

  /**
   * Prepares default values for the form, converting output types to input types
   */
  const rawDefaultValues: RouteFormRawValues = defaultValues
    ? {
        ...defaultValues,
        id: defaultValues.id,
        name: defaultValues.name || '',
        code: defaultValues.code || '',
        description: defaultValues.description || '',
        buslineId: defaultValues.buslineId?.toString() || '',
        serviceTypeId: defaultValues.serviceTypeId?.toString() || '',
        originNodeId: defaultValues.originNodeId?.toString() || '',
        destinationNodeId: defaultValues.destinationNodeId?.toString() || '',
        active: defaultValues.active ?? false,
        autoUpdateNameCode: defaultValues.id ? false : true,
        legs: defaultValues.legs || [],
      }
    : {
        name: '',
        code: '',
        description: '',
        buslineId: '',
        active: true,
        serviceTypeId: '',
        originNodeId: '',
        destinationNodeId: '',
        autoUpdateNameCode: true,
        legs: [],
      };

  const form = useForm({
    defaultValues: rawDefaultValues,
    validators: {
      onSubmit: routeSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const legs = (value.legs || []) as RouteLegRaw[];
        const nodesMap = createNodesMap(nodesData);
        const pathways = pathwaysData?.data || [];

        // Validate leg continuity
        const continuityErrors = validateLegContinuity(
          legs,
          pathways,
          nodesMap,
          tCommon,
        );

        if (continuityErrors.size > 0) {
          setLegContinuityErrors(continuityErrors);
          const errorKeys = Array.from(continuityErrors.keys());
          const firstErrorIndex = errorKeys[0];

          if (firstErrorIndex !== undefined) {
            const firstError = continuityErrors.get(firstErrorIndex);

            if (firstError) {
              throw new Error(
                tRoutes('form.error.tripContinuityErrorSpecific', {
                  index: firstErrorIndex + 1,
                  expected: firstError.expectedOrigin,
                  actual: firstError.actualOrigin,
                }),
              );
            }
          }

          throw new Error(tRoutes('form.error.tripContinuityErrorGeneric'));
        }

        setLegContinuityErrors(new Map());

        // Get serviceTypeId from the selected busLine
        const currentBusLine = busLines?.data.find(
          (line) => line.id.toString() === value.buslineId,
        );

        if (!currentBusLine?.serviceTypeId) {
          throw new Error(tRoutes('form.error.serviceTypeRequired'));
        }

        // Transform and validate legs
        const transformedLegs = transformLegsForSubmission(legs);
        const { originNodeId, destinationNodeId } =
          calculateOriginAndDestination(transformedLegs, pathways);

        if (!originNodeId || !destinationNodeId) {
          throw new Error(tRoutes('form.error.invalidOriginDestination'));
        }

        // Transform form values to match schema output
        const formValues = transformFormValues(
          value,
          currentBusLine.serviceTypeId,
          originNodeId,
          destinationNodeId,
          transformedLegs,
        );

        await onSubmit(formValues);
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'route',
          error,
          tValidations,
          tCommon,
        });
      }
    },
  });

  const autoUpdateNameCode = useStore(
    form.store,
    (state) => state.values.autoUpdateNameCode,
  );

  /**
   * Creates a stable key for legs array changes to detect when legs are modified
   * Used as a dependency for effects that need to react to leg changes
   */
  const legsKey = useStore(form.store, (state) => {
    const legs = (state.values as { legs?: RouteLegRaw[] })?.legs ?? [];
    return legs.length > 0
      ? `${legs.length}-${legs.map((l) => l.pathwayId).join(',')}`
      : '0';
  });

  /**
   * Gets the current legs array from form state
   */
  const legsArray = useStore(
    form.store,
    (state) => (state.values as { legs?: RouteLegRaw[] })?.legs ?? [],
  ) as RouteLegRaw[];

  const hasLegsErrors = useStore(form.store, (state) =>
    state.errors.reduce((acc, error) => {
      if (error) {
        const errorsKeys = Object.keys(error);
        acc.push(...errorsKeys);
      }
      return acc;
    }, [] as string[]),
  );

  /**
   * Creates a map of node IDs to nodes for quick lookup (used for auto-generating name/code)
   */
  const nodesMapForAutoGen = useMemo(
    () => createNodesMap(nodesData),
    [nodesData],
  );

  /**
   * Calculates origin and destination nodes from the first and last legs
   * Used for auto-generating route name and code
   */
  const originAndDestination = useMemo(() => {
    if (legsArray.length === 0 || !pathwaysData?.data) {
      return { origin: null, destination: null };
    }

    const firstLeg = legsArray[0];
    const lastLeg = legsArray[legsArray.length - 1];

    if (!firstLeg || !lastLeg || !firstLeg.pathwayId || !lastLeg.pathwayId) {
      return { origin: null, destination: null };
    }

    const firstPathway = pathwaysData.data.find(
      (p) => p.id.toString() === firstLeg.pathwayId,
    );
    const lastPathway = pathwaysData.data.find(
      (p) => p.id.toString() === lastLeg.pathwayId,
    );

    if (!firstPathway || !lastPathway) {
      return { origin: null, destination: null };
    }

    const originNode = nodesMapForAutoGen.get(firstPathway.originNodeId);
    const destinationNode = nodesMapForAutoGen.get(
      lastPathway.destinationNodeId,
    );

    return {
      origin: originNode || null,
      destination: destinationNode || null,
    };
  }, [legsArray, pathwaysData?.data, nodesMapForAutoGen]);

  /**
   * Regenerates route name and code based on origin and destination nodes
   */
  const regenerateName = useCallback(() => {
    const { origin, destination } = originAndDestination;

    if (!origin || !destination) {
      return;
    }

    form?.setFieldValue('name', `${origin.name} - ${destination.name}`);
    form?.setFieldValue('code', `${origin.code}-${destination.code}`);
  }, [originAndDestination, form]);

  /**
   * Auto-generates name and code when switch is enabled and legs change
   */
  useEffect(() => {
    if (
      autoUpdateNameCode &&
      originAndDestination.origin &&
      originAndDestination.destination
    ) {
      regenerateName();
    }
  }, [legsKey, autoUpdateNameCode, originAndDestination, regenerateName]);

  /**
   * Clears continuity errors when legs change (user is fixing the issue)
   */
  useEffect(() => {
    if (legContinuityErrors.size > 0) {
      setLegContinuityErrors(new Map());
    }
  }, [legsKey, legContinuityErrors]);

  /**
   * Calculates summary data for the route preview
   */
  const summaryData = useMemo(() => {
    const legCount = legsArray.length;
    const { origin, destination } = originAndDestination;

    // Note: Distance and time calculation would require loading pathway options data
    // For now, we show 0 and calculate it server-side
    const totalDistance = 0;
    const totalTime = 0;

    const routeType =
      legCount === 0
        ? tRoutes('types.noDefined')
        : legCount === 1
          ? tRoutes('types.direct')
          : tRoutes('types.withStops');

    // Type assertion for nodes that may have city relation
    const originNode = origin as pathways.PathwayWithRelations['origin'] & {
      city?: { name: string };
    };
    const destinationNode =
      destination as pathways.PathwayWithRelations['destination'] & {
        city?: { name: string };
      };

    return {
      routeType,
      totalDistance,
      totalTime,
      originCity:
        originNode?.city?.name ||
        originNode?.name ||
        tRoutes('types.noDefined'),
      destinationCity:
        destinationNode?.city?.name ||
        destinationNode?.name ||
        tRoutes('types.noDefined'),
      originNode: originNode?.name || tRoutes('types.noDefined'),
      destinationNode: destinationNode?.name || tRoutes('types.noDefined'),
      legCount,
    };
  }, [tRoutes, originAndDestination, legsArray]);

  return (
    <div className="w-full">
      <Form onSubmit={form.handleSubmit} className="max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{tRoutes('form.title')}</h2>
              <p className="text-sm text-gray-600">
                {tRoutes('form.subtitle')}
              </p>
            </div>

            <form.AppField name="name">
              {(field) => (
                <field.TextInput
                  label={tRoutes('form.fields.routeName')}
                  placeholder={tRoutes('form.placeholders.routeName')}
                  isRequired
                  disabled={autoUpdateNameCode}
                />
              )}
            </form.AppField>

            <div className="space-y-2">
              <form.AppField name="code">
                {(field) => (
                  <field.TextInput
                    label={tRoutes('form.fields.routeCode')}
                    placeholder={tRoutes('form.placeholders.routeCode')}
                    isRequired
                    disabled={autoUpdateNameCode}
                  />
                )}
              </form.AppField>
            </div>

            <form.AppField name="description">
              {(field) => (
                <field.TextAreaInput
                  label={tRoutes('form.fields.description')}
                  placeholder={tRoutes('form.placeholders.description')}
                />
              )}
            </form.AppField>

            <form.AppField name="buslineId">
              {(field) => (
                <field.SelectInput
                  items={
                    busLines?.data.map((busLine) => ({
                      id: busLine.id.toString(),
                      name: busLine.name,
                      value: busLine.id.toString(),
                    })) ?? []
                  }
                  emptyOptionsLabel={tRoutes('form.placeholders.noBusLine')}
                  label={tRoutes('form.fields.busLine')}
                  placeholder={tRoutes('form.placeholders.noBusLine')}
                  className="w-full"
                  isRequired
                />
              )}
            </form.AppField>

            <form.AppField name="active">
              {(field) => (
                <field.SwitchInput label={tRoutes('form.fields.activeRoute')} />
              )}
            </form.AppField>

            <form.AppField name="autoUpdateNameCode">
              {(field) => (
                <field.SwitchInput
                  label={tRoutes('form.fields.autoUpdateNameCode')}
                />
              )}
            </form.AppField>
          </div>

          {/* Right Column: Summary */}
          <RouteSummary data={summaryData} />
        </div>

        {/* Route Legs Section */}
        <div className="pt-4">
          <RouteLegsList
            form={form as unknown as ReturnType<typeof useForm>}
            legContinuityErrors={legContinuityErrors}
            className={hasLegsErrors.length > 0 ? 'border-destructive' : ''}
          />
        </div>

        <FormFooter>
          <form.AppForm>
            <form.SubmitButton>
              {defaultValues
                ? tRoutes('actions.update')
                : tRoutes('actions.create')}
            </form.SubmitButton>
          </form.AppForm>
        </FormFooter>
      </Form>
    </div>
  );
}
