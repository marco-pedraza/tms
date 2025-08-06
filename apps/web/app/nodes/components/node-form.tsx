import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@tanstack/react-form';
import { formatDuration } from 'date-fns';
import { Calendar, Clock, Loader2, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import useQueryAllInstallationAmenities from '@/amenities/hooks/use-query-all-installation-amenities';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import AmenityCard from '@/components/ui/amenity-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useForm from '@/hooks/use-form';
import useQueryInstallationTypeSchemas from '@/hooks/use-query-installation-type-schemas';
import useQueryAllInstallationTypes from '@/installation-types/hooks/use-query-all-installation-types';
import useQueryInstallationTypeEvents from '@/installation-types/hooks/use-query-installation-type-events';
import useQueryAllLabels from '@/labels/hooks/use-query-all-labels';
import InstallationDynamicForm from '@/nodes/components/installation-dynamic-form';
import OperatingHoursForm, {
  OperatingHours,
} from '@/nodes/components/operating-hours-form';
import useQueryAllPopulations from '@/populations/hooks/use-query-all-populations';
import useQueryPopulationCities from '@/populations/hooks/use-query-population-cities';
import { UseValidationsTranslationsResult } from '@/types/translations';
import {
  createDynamicFormDefaultValues,
  createDynamicFormSchema,
  transformFormValuesToApiFormat,
} from '@/utils/create-dynamic-form-schema';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createBaseNodeFormSchema = (
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
    installationTypeId: z
      .string()
      .min(1, tValidations('required'))
      .transform((val) => parseInt(val)),
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
    address: z.string().min(1, { message: tValidations('required') }),
    description: z.string().nullable(),
    contactPhone: z
      .string()
      .trim()
      .refine(
        (val) => {
          if (val.length === 0) {
            return true;
          }
          return val.match(/^\+[1-9][\d\s()-]{1,20}$/);
        },
        {
          message: tValidations('phone.invalid'),
        },
      )
      .transform((val) => (val.length === 0 ? null : val))
      .nullable(),
    contactEmail: z
      .string()
      .trim()
      .refine(
        (val) => {
          if (val.length === 0) {
            return true;
          }
          return val.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
        },
        {
          message: tValidations('email.invalid'),
        },
      )
      .transform((val) => (val.length === 0 ? null : val))
      .nullable(),
    website: z
      .string()
      .trim()
      .refine(
        (val) => {
          if (val.length === 0) {
            return true;
          }
          return val.match(
            /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/,
          );
        },
        {
          message: tValidations('url.invalid'),
        },
      )
      .transform((val) => (val.length === 0 ? null : val))
      .nullable(),
    allowsBoarding: z.boolean().optional(),
    allowsAlighting: z.boolean().optional(),
    nodeEvents: z.array(
      z.object({
        eventTypeId: z.number(),
        customTime: z.number().nullable().optional(),
      }),
    ),
    labelIds: z.array(z.number()).optional().default([]),
    amenityIds: z.array(z.number()).optional().default([]),
    operatingHours: z.any().optional().nullable(),
  });

export type NodeFormOutputValues = z.output<
  ReturnType<typeof createBaseNodeFormSchema>
> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customAttributes?: Record<string, any>;
};
type NodeFormRawValues = z.input<ReturnType<typeof createBaseNodeFormSchema>>;

export type NodeFormValues = Omit<
  NodeFormOutputValues,
  'installationTypeId'
> & {
  installationTypeId: number | null | undefined;
  customAttributes?: { name: string; value: string | boolean }[];
  operatingHours?: OperatingHours | null;
};

interface NodeFormProps {
  defaultValues?: NodeFormValues;
  onSubmit: (values: NodeFormOutputValues) => Promise<unknown>;
}

export default function NodeForm({ defaultValues, onSubmit }: NodeFormProps) {
  const tCommon = useTranslations('common');
  const tNodes = useTranslations('nodes');
  const tNodeEvents = useTranslations('nodeEvents');
  const tValidations = useTranslations('validations');

  // Start with base schema - we'll handle dynamic validation differently
  const baseNodeSchema = createBaseNodeFormSchema(tValidations);

  const rawDefaultValues: NodeFormRawValues | undefined = defaultValues
    ? {
        ...defaultValues,
        radius: defaultValues.radius.toString(),
        installationTypeId: defaultValues.installationTypeId?.toString() ?? '',
        cityId: defaultValues.cityId.toString(),
        populationId: defaultValues.populationId.toString(),
        latitude: defaultValues.latitude.toString(),
        longitude: defaultValues.longitude.toString(),
        operatingHours: defaultValues.operatingHours || null,
        nodeEvents: (defaultValues.nodeEvents || []).map((event) => ({
          eventTypeId: event.eventTypeId,
          customTime: event.customTime,
        })),
      }
    : undefined;

  const form = useForm({
    defaultValues: rawDefaultValues ?? {
      name: '',
      code: '',
      radius: '',
      installationTypeId: '',
      cityId: '',
      populationId: '',
      latitude: '',
      longitude: '',
      address: '',
      description: '',
      contactPhone: '',
      contactEmail: '',
      website: '',
      nodeEvents: [],
      labelIds: [],
      amenityIds: [],
      operatingHours: null,
    },
    validators: {
      onSubmit: baseNodeSchema,
    },
    onSubmitMeta: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customAttributes: {} as any,
    },
    onSubmit: async ({ value, meta }) => {
      try {
        // We'll handle the combined validation in the onSubmit
        const parsed = baseNodeSchema.safeParse(value);
        if (parsed.success) {
          // Add customAttributes from the dynamic form state
          const finalData = {
            ...parsed.data,
            customAttributes: meta.customAttributes,
          };
          await onSubmit(finalData);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'node',
          error,
          tValidations,
          tCommon,
        });
      }
    },
  });

  const { data: populations } = useQueryAllPopulations();
  const { data: installationTypes } = useQueryAllInstallationTypes();
  const { data: labels } = useQueryAllLabels();
  const { data: amenities } = useQueryAllInstallationAmenities();

  const selectedPopulationId = useStore(
    form.store,
    (state) => state.values.populationId,
  );
  const { data: cities } = useQueryPopulationCities({
    populationId: parseInt(selectedPopulationId),
    enabled: !!selectedPopulationId,
  });

  // Get current installation type ID for dynamic form
  const currentInstallationTypeId = useStore(
    form.store,
    (state) => state.values.installationTypeId,
  );

  // Use the hook properly with the selected installation type ID
  const { data: events, isLoading: isLoadingEvents } =
    useQueryInstallationTypeEvents({
      installationTypeId: currentInstallationTypeId
        ? parseInt(currentInstallationTypeId)
        : 0,
      enabled: !!currentInstallationTypeId,
    });

  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);

  // Get form events from store to avoid circular dependencies
  const formEvents = useStore(form.store, (state) => state.values.nodeEvents);

  // Memoize the initial events from default values
  const initialEvents = useMemo(() => {
    if (defaultValues?.nodeEvents && defaultValues.nodeEvents.length > 0) {
      return new Set(
        defaultValues.nodeEvents.map((event) => event.eventTypeId),
      );
    }
    return new Set<number>();
  }, [defaultValues?.nodeEvents]);

  // Helper function to compare arrays reliably (order-independent)
  const areArraysEqual = useCallback((arr1: number[], arr2: number[]) => {
    if (arr1.length !== arr2.length) return false;

    const set1 = new Set(arr1);

    if (set1.size !== arr1.length) return false;

    return arr2.every((item) => set1.has(item));
  }, []);

  // Track previous states to avoid circular dependencies
  const prevFormEvents = useRef<unknown>(undefined);
  const prevInstallationTypeId = useRef<string | undefined>(undefined);
  const prevSelectedEvents = useRef<number[]>([]);
  const hasInitialized = useRef(false);
  const hasUserClearedEvents = useRef(false);

  const syncFormEventsWithSelectedEvents = useCallback(() => {
    const currentFormEvents = form.getFieldValue('nodeEvents') || [];
    const currentEventIds = currentFormEvents.map((event) => event.eventTypeId);

    // Only update if the arrays are actually different (order-independent comparison)
    if (!areArraysEqual(currentEventIds, selectedEvents)) {
      setSelectedEvents(currentEventIds);
      prevSelectedEvents.current = currentEventIds;
    }

    // Update the previous form events reference without including it in dependencies
    prevFormEvents.current = form.getFieldValue('nodeEvents');
  }, [form, selectedEvents, areArraysEqual]);

  const handleInstallationTypeChange = useCallback(() => {
    const hasInstallationTypeChanged =
      currentInstallationTypeId !== prevInstallationTypeId.current;

    if (hasInstallationTypeChanged) {
      // Clear events when installation type changes
      setSelectedEvents([]);
      prevSelectedEvents.current = [];
      form.setFieldValue('nodeEvents', []);
      // Reset the user cleared flag when installation type changes
      hasUserClearedEvents.current = false;
      prevInstallationTypeId.current = currentInstallationTypeId;
    }
  }, [currentInstallationTypeId, form]);

  const handleInitialEventsForEditMode = useCallback(() => {
    if (!hasInitialized.current && initialEvents.size > 0) {
      const initialEventArray = Array.from(initialEvents);
      setSelectedEvents(initialEventArray);
      prevSelectedEvents.current = initialEventArray;
      // Set form events from default values
      if (defaultValues?.nodeEvents) {
        form.setFieldValue('nodeEvents', defaultValues.nodeEvents);
      }
      hasInitialized.current = true;
    }
  }, [initialEvents, defaultValues?.nodeEvents, form]);

  // Single consolidated effect to handle form events synchronization
  useEffect(() => {
    syncFormEventsWithSelectedEvents();
  }, [syncFormEventsWithSelectedEvents]);

  // Handle installation type changes
  useEffect(() => {
    handleInstallationTypeChange();
  }, [handleInstallationTypeChange]);

  // Handle initial events for edit mode (only run once)
  useEffect(() => {
    handleInitialEventsForEditMode();
  }, [handleInitialEventsForEditMode]);

  // Restore events when installation type is changed back to original in edit mode
  useEffect(() => {
    if (
      defaultValues?.installationTypeId &&
      currentInstallationTypeId &&
      defaultValues.nodeEvents &&
      defaultValues.nodeEvents.length > 0
    ) {
      const originalInstallationTypeId =
        defaultValues.installationTypeId.toString();
      const isBackToOriginal =
        currentInstallationTypeId === originalInstallationTypeId;

      // Only restore events if we're back to original installation type,
      // there are no currently selected events, and the user hasn't manually cleared them
      if (
        isBackToOriginal &&
        selectedEvents.length === 0 &&
        !hasUserClearedEvents.current
      ) {
        const eventIds = defaultValues.nodeEvents.map(
          (event) => event.eventTypeId,
        );
        setSelectedEvents(eventIds);
        prevSelectedEvents.current = eventIds;
        form.setFieldValue('nodeEvents', defaultValues.nodeEvents);
      }
    }
  }, [currentInstallationTypeId, defaultValues, form, selectedEvents]);

  const handleEventSelection = useCallback(
    (eventTypeId: number, checked: boolean) => {
      if (checked) {
        setSelectedEvents((prevEvents) => {
          const newSelectedEvents = [...prevEvents, eventTypeId];
          prevSelectedEvents.current = newSelectedEvents;
          return newSelectedEvents;
        });
        // Add to form state
        const currentEvents = form.getFieldValue('nodeEvents') || [];
        const newEvent = { eventTypeId, customTime: null };
        form.setFieldValue('nodeEvents', [...currentEvents, newEvent]);
        // Reset the user cleared flag when user starts adding events again
        hasUserClearedEvents.current = false;
      } else {
        setSelectedEvents((prevEvents) => {
          const newSelectedEvents = prevEvents.filter(
            (id) => id !== eventTypeId,
          );
          prevSelectedEvents.current = newSelectedEvents;
          return newSelectedEvents;
        });
        // Remove from form state
        const currentEvents = form.getFieldValue('nodeEvents') || [];
        form.setFieldValue(
          'nodeEvents',
          currentEvents.filter((event) => event.eventTypeId !== eventTypeId),
        );
        // Mark that user has manually cleared events if this results in empty selection
        if (currentEvents.length === 1) {
          hasUserClearedEvents.current = true;
        }
      }
    },
    [form],
  );

  const handleEventTimeChange = useCallback(
    (eventTypeId: number, time: number | null) => {
      const currentEvents = form.getFieldValue('nodeEvents') || [];
      const updatedEvents = currentEvents.map((event) =>
        event.eventTypeId === eventTypeId
          ? { ...event, customTime: time }
          : event,
      );
      form.setFieldValue('nodeEvents', updatedEvents);
    },
    [form],
  );

  // Use formEvents directly since it's the reactive state from the form store
  const currentFormEvents = formEvents || [];

  // Fetch installation type schemas based on selected installation type
  const { data: schemasData } = useQueryInstallationTypeSchemas({
    installationTypeId: currentInstallationTypeId
      ? parseInt(currentInstallationTypeId)
      : null,
    enabled: !!currentInstallationTypeId,
  });

  /**
   * We need to memoize the schemas to avoid unnecessary re-renders.
   *
   * schemas, dynamicSchema, and dynamicDefaultValues they all depend on the schemasData state.
   * Since the schemasData state changes constantly run almost every time something inside the NodeForm re-renders.
   * It causes the dynamicDefaultValues to "change" for React,
   * making the customAttributesForm reset to the default values while
   * the user might be filling the form and when the user submits the form.
   *
   * The use of memoization solves this problem by "changing" the dynamicDefaultValues for
   * React only if the schemasData state changes the value and not only the variable instance.
   */
  const schemas = useMemo(() => schemasData?.data || [], [schemasData]);
  const dynamicSchema = useMemo(
    () => createDynamicFormSchema(schemas, tValidations),
    [schemas, tValidations],
  );
  const dynamicDefaultValues = useMemo(
    () => createDynamicFormDefaultValues(schemas),
    [schemas],
  );
  const customAttributesDefaultValues = defaultValues?.customAttributes?.reduce(
    (acc, attribute) => {
      acc[attribute.name] = attribute.value;
      return acc;
    },
    {} as Record<string, string | boolean>,
  );

  const customAttributesForm = useForm({
    defaultValues: customAttributesDefaultValues ?? dynamicDefaultValues,
    validators: {
      onSubmit: dynamicSchema,
    },
    onSubmit: ({ value }) => {
      const parsed = dynamicSchema.safeParse(value);
      if (parsed.success) {
        const apiValues = transformFormValuesToApiFormat(parsed.data, schemas);
        form.handleSubmit({ customAttributes: apiValues });
      }
    },
  });

  const handleSubmit = () => {
    /**
     * form.validateSync is a private method of the form instance.
     * This method is not documented in the tanstack-form library.
     *
     * There's an existent and documented method called validateAllFields,
     * however, it's not working as expected.
     *
     * So we decided to use the private method validateSync instead.
     * This method works as expected. But we need to be careful when
     * updating the tanstack-form library in the future, because this
     * method could be removed.
     */
    const formValidation = form.validateSync('submit');
    const customAttributesFormValidation =
      customAttributesForm.validateSync('submit');
    if (
      !formValidation.hasErrored &&
      !customAttributesFormValidation.hasErrored
    ) {
      customAttributesForm.handleSubmit();
    }
  };

  useEffect(() => {
    /**
     * When the installation type is changed,
     * the dynamic form fields and schema are changed too to show the
     * correct fields and validations for the new installation type.
     *
     * However, tanstack-form doesn't resets the customAttributesForm instances automatically
     * after this changes. This generated inconsistent behavior when the user tries to submit
     * the form.
     *
     * customAttributesForm.reset updates the customAttributesForm instance with the new default values
     * and validations. Thus, making the form work as expected.
     */
    if (
      customAttributesDefaultValues &&
      currentInstallationTypeId === rawDefaultValues?.installationTypeId
    ) {
      /**
       * If the selected installationType is the same as the installationType from the default values,
       * then we need to reset the customAttributesForm instance with the customAttributesDefaultValues.
       *
       * If we don't do this, the form will not show the existent values
       * for the custom attributes when editing a node.
       *
       * This reset with the customAttributesDefaultValues also has a nice side effect:
       * The form will recover the existent values for the custom attributes
       * even if the user changes the installationType and then changes it back to the original installationType.
       * This only happens when editing a node.
       */
      customAttributesForm.reset(customAttributesDefaultValues);
    } else {
      customAttributesForm.reset(dynamicDefaultValues);
    }
    /**
     * We don't use both currentInstallationTypeId and dynamicDefaultValues to re-run this effect because we would double the re-renders.
     * Since the calculation of dynamicDefaultValues indirecly depends on the currentInstallationTypeId state,
     * It would run when:
     *  - The currentInstallationTypeId is correct but the dynamicDefaultValues are not recalculated yet, thus is not the correct value.
     *  - Both the currentInstallationTypeId and the dynamicDefaultValues are correct after dynamicDefaultValues is recalculated.
     * The first case is an unnecessary re-render because the dynamicDefaultValues is incorrect.
     * Using dynamicDefaultValues will only run this effect for the second case.
     *
     * So, dynamicDefaultValues is the only dependency that we need to re-run this effect. Is also the most efficient dependency to use.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally excluding currentInstallationTypeId (read comment above)
  }, [dynamicDefaultValues]);

  return (
    <Form onSubmit={handleSubmit}>
      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">
            {tCommon('sections.basicInfo')}
          </TabsTrigger>
          <TabsTrigger value="location">
            {tNodes('form.sections.locationAndContactInfo')}
          </TabsTrigger>
          <TabsTrigger value="events">{tCommon('sections.events')}</TabsTrigger>
          <TabsTrigger value="custom">
            {tNodes('form.sections.customAttributes')}
          </TabsTrigger>
          <TabsTrigger value="amenities">
            {tNodes('fields.amenitiesAndHours')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="basic">
          <FormLayout title={tNodes('form.sections.basicInfo')}>
            <form.AppField name="installationTypeId">
              {(field) => (
                <field.SelectInput
                  label={tNodes('fields.installationType')}
                  placeholder={tNodes('form.placeholders.installationType')}
                  isRequired
                  items={
                    installationTypes?.data.map((installationType) => ({
                      id: installationType.id.toString(),
                      name: installationType.name,
                    })) ?? []
                  }
                />
              )}
            </form.AppField>
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
            <form.AppField name="description">
              {(field) => (
                <field.TextInput
                  label={tCommon('fields.description')}
                  placeholder={tNodes('form.placeholders.description')}
                />
              )}
            </form.AppField>
            <form.AppField name="labelIds">
              {(field) => (
                <field.MultiSelectInput
                  label={tNodes('fields.labels')}
                  placeholder={tNodes('form.placeholders.labels')}
                  items={
                    labels?.data.map((label) => ({
                      id: label.id.toString(),
                      name: label.name,
                      color: label.color,
                    })) ?? []
                  }
                  emptyOptionsLabel={tNodes(
                    'form.placeholders.emptyLabelsList',
                  )}
                />
              )}
            </form.AppField>
            <form.AppField name="allowsBoarding">
              {(field) => (
                <field.SwitchInput label={tNodes('fields.allowsBoarding')} />
              )}
            </form.AppField>
            <form.AppField name="allowsAlighting">
              {(field) => (
                <field.SwitchInput label={tNodes('fields.allowsAlighting')} />
              )}
            </form.AppField>
          </FormLayout>
        </TabsContent>
        <TabsContent value="location" className="space-y-4">
          <FormLayout title={tNodes('form.sections.locationInfo')}>
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
            <form.AppField name="address">
              {(field) => (
                <field.TextInput
                  label={tNodes('fields.address')}
                  placeholder={tNodes('form.placeholders.address')}
                  isRequired
                />
              )}
            </form.AppField>
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
          <FormLayout title={tNodes('form.sections.contactInfo')}>
            <form.AppField name="contactPhone">
              {(field) => (
                <field.TextInput
                  label={tNodes('fields.contactPhone')}
                  placeholder={tNodes('form.placeholders.contactPhone')}
                />
              )}
            </form.AppField>
            <form.AppField name="contactEmail">
              {(field) => (
                <field.TextInput
                  label={tNodes('fields.contactEmail')}
                  placeholder={tNodes('form.placeholders.contactEmail')}
                />
              )}
            </form.AppField>
            <form.AppField name="website">
              {(field) => (
                <field.TextInput
                  label={tNodes('fields.website')}
                  placeholder={tNodes('form.placeholders.website')}
                />
              )}
            </form.AppField>
          </FormLayout>
        </TabsContent>
        <TabsContent value="events">
          {!currentInstallationTypeId ? (
            <Card>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg mb-4">
                    {tNodes('form.placeholders.selectInstallationTypeFirst')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tNodes(
                      'form.placeholders.selectInstallationTypeFirstDescription',
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : events && events.length === 0 ? (
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {tNodeEvents('noEventsAvailable')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : isLoadingEvents ? (
            <Card>
              <CardContent>
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-10 w-10 animate-spin" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {tNodeEvents('title')}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {tNodeEvents('description')}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events?.map((eventType) => (
                    <div
                      key={eventType.id}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`event-${eventType.id}`}
                            checked={selectedEvents.includes(eventType.id)}
                            onCheckedChange={(checked: boolean) => {
                              handleEventSelection(eventType.id, checked);
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`event-${eventType.id}`}
                            className="font-medium cursor-pointer block"
                          >
                            {eventType.name}
                          </Label>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {eventType.code}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDuration({
                                minutes: eventType.baseTime,
                              })}
                            </div>
                            {eventType.integration && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <Zap className="h-3 w-3" />
                                {tNodeEvents('integration')}
                              </div>
                            )}
                          </div>
                          {eventType.description && (
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {eventType.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {selectedEvents.includes(eventType.id) && (
                        <div className="mt-3 ml-8">
                          <div className="flex items-center gap-3">
                            <Label
                              htmlFor={`time-${eventType.id}`}
                              className="text-sm font-medium min-w-0"
                            >
                              {tNodeEvents('customTime')}
                            </Label>
                            <Input
                              id={`time-${eventType.id}`}
                              min={0}
                              step={1}
                              type="number"
                              placeholder={`${eventType.baseTime}`}
                              value={
                                currentFormEvents.find(
                                  (event) => event.eventTypeId === eventType.id,
                                )?.customTime || ''
                              }
                              onChange={(e) => {
                                if (e.target.value === '') {
                                  handleEventTimeChange(eventType.id, null);
                                } else {
                                  handleEventTimeChange(
                                    eventType.id,
                                    parseInt(e.target.value),
                                  );
                                }
                              }}
                              className="w-24"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="custom">
          {!currentInstallationTypeId ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                {tNodes('form.placeholders.selectInstallationTypeFirst')}
              </p>
              <p className="text-sm text-muted-foreground">
                {tNodes(
                  'form.placeholders.selectInstallationTypeFirstDescription',
                )}
              </p>
            </div>
          ) : schemas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                {tNodes('form.placeholders.noCustomAttributes')}
              </p>
              <p className="text-sm text-muted-foreground">
                {tNodes('form.placeholders.noCustomAttributesDescription')}
              </p>
            </div>
          ) : (
            <InstallationDynamicForm
              form={customAttributesForm}
              schemas={schemas}
            />
          )}
        </TabsContent>
        <TabsContent value="amenities" className="space-y-4">
          <FormLayout title={tNodes('fields.amenities')}>
            <form.AppField name="amenityIds">
              {(field) => (
                <div className="space-y-4">
                  <field.MultiSelectInput
                    label={tNodes('fields.amenities')}
                    placeholder={tNodes('form.placeholders.amenities')}
                    items={
                      amenities?.data.map((amenity) => ({
                        id: amenity.id.toString(),
                        name: amenity.name,
                        category: amenity.category,
                        iconName: amenity.iconName,
                        description: amenity.description,
                      })) ?? []
                    }
                    emptyOptionsLabel={tNodes(
                      'form.placeholders.emptyAmenitiesList',
                    )}
                  />

                  {field.state.value && field.state.value.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-foreground">
                        {tNodes('fields.selectedAmenities', {
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
          </FormLayout>

          <FormLayout title={tNodes('fields.operatingHours.title')}>
            <form.AppField name="operatingHours">
              {(field) => {
                return (
                  <OperatingHoursForm
                    value={field.state.value}
                    onChange={(value) => field.handleChange(value)}
                    errors={
                      (field.state.meta.errors
                        ?.filter(Boolean)
                        .map((err) => err?.message)
                        .filter(Boolean) as string[]) || []
                    }
                  />
                );
              }}
            </form.AppField>
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
