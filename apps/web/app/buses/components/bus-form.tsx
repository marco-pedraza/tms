'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@tanstack/react-form';
import { Bath, MoveUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { buses, drivers } from '@repo/ims-client';
import useQueryAllDrivers from '@/app/drivers/hooks/use-query-all-drivers';
import useQueryAllSeatDiagrams from '@/app/seat-diagrams/hooks/use-query-all-seat-diagrams';
import useQueryAllTechnologies from '@/app/technologies/hooks/use-query-all-technologies';
import useQueryAllBusLines from '@/bus-lines/hooks/use-query-all-bus-lines';
import useQueryAllBusModels from '@/bus-models/hooks/use-query-all-bus-models';
import busLicensePlateTypesTranslationKeys from '@/buses/translations/bus-license-plate-types-translations-keys';
import busStatusTranslationKeys from '@/buses/translations/bus-status-translations-keys';
import { convertBusSeatModelToSeatDiagramSpace } from '@/buses/utils/convert-bus-seat-model-to-diagram-space';
import { createFloorsFromSeatModels } from '@/buses/utils/create-floors-from-seat-models';
import { initializeSeatFields } from '@/buses/utils/initialize-seat-fields';
import useQueryAllChromatics from '@/chromatics/hooks/use-query-all-chromatics';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import { BaseSwitchInput } from '@/components/form/switch-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DriverCard from '@/components/ui/driver-card';
import TechnologyCard from '@/components/ui/technology-card';
import useForm from '@/hooks/use-form';
import { useQueryBusAmenities } from '@/hooks/use-query-bus-amenities';
import useQueryAllNodes from '@/nodes/hooks/use-query-all-nodes';
import { optionalDateSchema, requiredDateSchema } from '@/schemas/date';
import {
  optionalFloatSchema,
  optionalIntegerSchema,
  requiredFloatSchema,
  requiredIntegerSchema,
} from '@/schemas/number';
import { optionalStringSchema, requiredStringSchema } from '@/schemas/string';
import SeatDiagram from '@/seat-diagrams/components/seat-diagram';
import useQuerySeatConfiguration from '@/seat-diagrams/hooks/use-query-seat-configuration';
import {
  SeatDiagramSpace,
  createSeatDiagramSpaceSchema,
} from '@/seat-diagrams/seat-diagrams.schemas';
import { SeatType, SpaceType } from '@/services/ims-client';
import {
  BusStatus,
  busLicensePlateTypes,
  busStatuses,
} from '@/services/ims-client';
import useQueryAllTransporters from '@/transporters/hooks/use-query-all-transporters';
import { UseValidationsTranslationsResult } from '@/types/translations';
import { parseAndFormatDateForInput } from '@/utils/date';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createBusFormSchema = (tValidations: UseValidationsTranslationsResult) =>
  z.object({
    // basic information
    economicNumber: requiredStringSchema(tValidations),
    registrationNumber: requiredStringSchema(tValidations),
    licensePlateType: z
      .enum(busLicensePlateTypes as [string, ...string[]], {
        message: tValidations('required'),
      })
      .transform((val) => val as buses.BusLicensePlateType),
    licensePlateNumber: requiredStringSchema(tValidations),
    availableForTourismOnly: z.boolean(),
    status: z
      .enum(busStatuses as [string, ...string[]], {
        message: tValidations('required'),
      })
      .transform((val) => val as buses.BusStatus),
    circulationCard: optionalStringSchema(),
    transporterId: optionalIntegerSchema(),
    alternateTransporterId: optionalIntegerSchema(),
    busLineId: optionalIntegerSchema(),
    baseId: optionalIntegerSchema(),
    active: z.boolean(),
    // model and manufacturer information
    purchaseDate: requiredDateSchema(tValidations),
    expirationDate: requiredDateSchema(tValidations),
    erpClientNumber: optionalStringSchema(),
    modelId: requiredIntegerSchema(tValidations),
    // Seat diagram
    seatDiagramModelId: requiredIntegerSchema(tValidations),
    // Technical information
    vehicleId: optionalStringSchema(),
    serialNumber: requiredStringSchema(tValidations),
    engineNumber: optionalStringSchema(),
    chassisNumber: requiredStringSchema(tValidations),
    grossVehicleWeight: requiredFloatSchema(tValidations),
    sctPermit: optionalStringSchema(),
    // Maintenance information
    currentKilometer: optionalFloatSchema(),
    gpsId: optionalStringSchema(),
    lastMaintenanceDate: optionalDateSchema(),
    nextMaintenanceDate: optionalDateSchema(),
    technologyIds: z.array(z.number()).optional(),
    chromaticId: z.string().transform((val) => (val ? parseInt(val) : null)),
    driverIds: z.array(z.number()).optional(),
    // Seat configuration for bus-specific diagram customization
    seatConfiguration: z
      .array(
        z.object({
          floorNumber: z.number(),
          spaces: z.array(createSeatDiagramSpaceSchema(tValidations)),
        }),
      )
      .optional()
      .default([]),
  });

export type BusFormValues = z.output<ReturnType<typeof createBusFormSchema>>;
type BusFormRawValues = z.input<ReturnType<typeof createBusFormSchema>>;

interface BusFormProps {
  defaultValues?: BusFormValues;
  onSubmit: (values: BusFormValues) => Promise<unknown>;
  nextValidStatuses?: buses.BusStatus[];
}

export default function BusForm({
  defaultValues,
  onSubmit,
  nextValidStatuses = busStatuses,
}: BusFormProps) {
  const tCommon = useTranslations('common');
  const tBuses = useTranslations('buses');
  const tSeatDiagrams = useTranslations('seatDiagrams');
  const tTechnologies = useTranslations('technologies');
  const tDrivers = useTranslations('drivers');
  const tValidations = useTranslations('validations');
  const busSchema = createBusFormSchema(tValidations);
  const { data: technologies } = useQueryAllTechnologies();
  const { data: chromatics, isLoading: isLoadingChromatics } =
    useQueryAllChromatics();

  const rawDefaultValues: BusFormRawValues = defaultValues
    ? {
        ...defaultValues,
        circulationCard: defaultValues.circulationCard || '',
        transporterId: defaultValues.transporterId?.toString() || '',
        alternateTransporterId:
          defaultValues.alternateTransporterId?.toString() || '',
        busLineId: defaultValues.busLineId?.toString() || '',
        baseId: defaultValues.baseId?.toString() || '',
        purchaseDate: parseAndFormatDateForInput(defaultValues.purchaseDate),
        expirationDate: parseAndFormatDateForInput(
          defaultValues.expirationDate,
        ),
        erpClientNumber: defaultValues.erpClientNumber || '',
        modelId: defaultValues.modelId?.toString() || '',
        vehicleId: defaultValues.vehicleId || '',
        engineNumber: defaultValues.engineNumber || '',
        grossVehicleWeight: defaultValues.grossVehicleWeight?.toString() || '',
        sctPermit: defaultValues.sctPermit || '',
        currentKilometer: defaultValues.currentKilometer?.toString() || '',
        gpsId: defaultValues.gpsId || '',
        lastMaintenanceDate: defaultValues.lastMaintenanceDate
          ? parseAndFormatDateForInput(defaultValues.lastMaintenanceDate)
          : '',
        nextMaintenanceDate: defaultValues.nextMaintenanceDate
          ? parseAndFormatDateForInput(defaultValues.nextMaintenanceDate)
          : '',
        seatDiagramModelId: '',
        technologyIds: defaultValues.technologyIds || [],
        chromaticId: defaultValues.chromaticId?.toString() || '',
        driverIds: defaultValues.driverIds || [],
        seatConfiguration: defaultValues.seatConfiguration
          ? defaultValues.seatConfiguration.map((floor) => ({
              ...floor,
              spaces: floor.spaces.map((space) => ({
                ...space,
                // @ts-expect-error - discriminated unions typing issue
                amenities: space.amenities
                  ?.filter((amenity: string) => !isNaN(parseInt(amenity)))
                  .map((amenity: string) => parseInt(amenity)),
              })),
            }))
          : [],
      }
    : {
        economicNumber: '',
        registrationNumber: '',
        licensePlateType: '',
        licensePlateNumber: '',
        availableForTourismOnly: false,
        status: BusStatus.ACTIVE,
        circulationCard: '',
        transporterId: '',
        alternateTransporterId: '',
        busLineId: '',
        baseId: '',
        purchaseDate: '',
        expirationDate: '',
        erpClientNumber: '',
        modelId: '',
        vehicleId: '',
        serialNumber: '',
        engineNumber: '',
        chassisNumber: '',
        grossVehicleWeight: '',
        sctPermit: '',
        currentKilometer: '',
        gpsId: '',
        lastMaintenanceDate: '',
        nextMaintenanceDate: '',
        seatDiagramModelId: '',
        active: true,
        technologyIds: [],
        chromaticId: '',
        driverIds: [],
        seatConfiguration: [],
      };

  const form = useForm({
    defaultValues: rawDefaultValues,
    validators: {
      onSubmit: busSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = busSchema.safeParse(value);
        if (parsed.success) {
          return await onSubmit(parsed.data);
        }
      } catch (error: unknown) {
        injectTranslatedErrorsToForm({
          // @ts-expect-error - form param is not typed correctly.
          form,
          entity: 'bus',
          error,
          tValidations,
        });
      }
    },
  });

  // Second form for editing individual spaces in the seat diagram
  const spaceForm = useForm({
    defaultValues: {
      spaceType: '' as SpaceType,
      seatType: '' as SeatType,
      seatNumber: '',
      floorNumber: 1,
      active: true,
      amenities: [] as number[],
      reclinementAngle: '',
      position: {
        x: 0,
        y: 0,
      },
    },
    listeners: {
      // Autosave values on change
      onChange: ({ formApi }) => {
        formApi.handleSubmit();
      },
    },
    validators: {
      // @ts-expect-error - discriminated unions typing issue
      onSubmit: createSeatDiagramSpaceSchema(tValidations),
    },
    onSubmit: ({ value }) => {
      const currentSeatConfiguration = form.getFieldValue('seatConfiguration');
      if (!currentSeatConfiguration) return;

      const floorToModify = currentSeatConfiguration.find(
        (floor) => floor.floorNumber === value.floorNumber,
      );
      if (floorToModify) {
        const newSpacesForFloor = floorToModify.spaces.filter(
          (space) =>
            !(
              space.position.x === value.position.x &&
              space.position.y === value.position.y
            ),
        );
        const newAmenities = value.amenities ?? [];
        newSpacesForFloor.push({
          ...value,
          amenities: newAmenities,
        });
        const newSeatConfiguration = currentSeatConfiguration.filter(
          (floor) => floor.floorNumber !== value.floorNumber,
        );
        newSeatConfiguration.push({
          floorNumber: value.floorNumber,
          spaces: newSpacesForFloor,
        });
        const orderedByFloorNumber = newSeatConfiguration.sort(
          (a, b) => a.floorNumber - b.floorNumber,
        );
        form.setFieldValue('seatConfiguration', orderedByFloorNumber);
        form.validateSync('change');
      }
    },
  });

  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const { data: busAmenities = [] } = useQueryBusAmenities();

  // Handler for clicking on a space in the diagram
  const handleSpaceClick = (space: SeatDiagramSpace) => {
    // @ts-expect-error - discriminated unions typing issue
    spaceForm.reset(space);
  };

  const [selectedDrivers, setSelectedDrivers] = useState<drivers.Driver[]>([]);
  const busLineId = useStore(form.store, (state) => state.values.busLineId);

  const { data: busLineDrivers } = useQueryAllDrivers({
    filters: { busLineId: busLineId ? parseInt(busLineId) : undefined },
  });

  // @todo - refactor this logic using form.Subscribe
  // When bus line changes, refresh list and drop selections not in the new list
  useEffect(() => {
    if (!busLineId) {
      setSelectedDrivers([]);
      return;
    }
    const list = busLineDrivers?.data ?? [];
    setSelectedDrivers(list);
    form.setFieldValue(
      'driverIds',
      (defaultValues?.driverIds ?? []).filter((id: number) =>
        list.some((d) => d.id === id),
      ),
    );
  }, [busLineId, defaultValues?.driverIds, busLineDrivers, form]);

  const { data: busModels } = useQueryAllBusModels();
  const { data: seatDiagrams } = useQueryAllSeatDiagrams();
  const { data: transporters } = useQueryAllTransporters();
  const { data: busLines } = useQueryAllBusLines();
  const { data: nodes } = useQueryAllNodes();

  const [modelHasChanged, setModelHasChanged] = useState(false);

  // Get the selected seat diagram ID from the form (this is the template ID)
  const selectedSeatDiagramModelId = useStore(
    form.store,
    (state) => state.values.seatDiagramModelId,
  );
  const { data: templateSeatConfiguration } = useQuerySeatConfiguration({
    seatDiagramId: parseInt(selectedSeatDiagramModelId),
    enabled:
      Boolean(selectedSeatDiagramModelId) &&
      Number.isInteger(parseInt(selectedSeatDiagramModelId)),
  });

  // Load template seat configuration into form
  useEffect(() => {
    const isInitialModel =
      form.getFieldValue('modelId') === defaultValues?.modelId?.toString();
    if (
      (!isInitialModel || modelHasChanged) &&
      templateSeatConfiguration?.data &&
      templateSeatConfiguration.data.length > 0
    ) {
      const floors = createFloorsFromSeatModels(
        templateSeatConfiguration.data,
      ).map((floor) => ({
        ...floor,
        spaces: floor.spaces.map(convertBusSeatModelToSeatDiagramSpace),
      }));
      form.setFieldValue('seatConfiguration', floors);
      setModelHasChanged(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateSeatConfiguration, form, selectedSeatDiagramModelId]);

  // Set the default seat diagram model ID at mount
  useEffect(() => {
    const model = busModels?.data.find(
      (model) => model.id.toString() === form.getFieldValue('modelId'),
    );
    if (model) {
      if (model.defaultBusDiagramModelId) {
        form.setFieldValue(
          'seatDiagramModelId',
          model.defaultBusDiagramModelId.toString(),
        );
      }
    }
  }, [busModels, form]);

  return (
    <Form onSubmit={form.handleSubmit} className="w-full max-w-none">
      <FormLayout
        title={tBuses('sections.basicInfo')}
        className="w-full max-w-none"
      >
        <form.AppField name="economicNumber">
          {(field) => (
            <field.TextInput
              label={tBuses('fields.economicNumber')}
              placeholder={tBuses('form.placeholders.economicNumber')}
              isRequired
            />
          )}
        </form.AppField>
        <form.AppField name="registrationNumber">
          {(field) => (
            <field.TextInput
              label={tBuses('fields.registrationNumber')}
              placeholder={tBuses('form.placeholders.registrationNumber')}
              isRequired
            />
          )}
        </form.AppField>
        <form.AppField name="licensePlateType">
          {(field) => (
            <field.SelectInput
              label={tBuses('fields.licensePlateType')}
              placeholder={tBuses('form.placeholders.licensePlateType')}
              items={busLicensePlateTypes.map((type) => ({
                id: type,
                name: tBuses(
                  `licensePlateTypes.${busLicensePlateTypesTranslationKeys[type]}`,
                ),
              }))}
              isRequired
            />
          )}
        </form.AppField>
        <form.AppField name="licensePlateNumber">
          {(field) => (
            <field.TextInput
              label={tBuses('fields.licensePlateNumber')}
              placeholder={tBuses('form.placeholders.licensePlateNumber')}
              isRequired
            />
          )}
        </form.AppField>
        <form.AppField name="status">
          {(field) => (
            <field.SelectInput
              label={tBuses('fields.status')}
              placeholder={tBuses('form.placeholders.status')}
              items={nextValidStatuses.map((status) => ({
                id: status,
                name: tBuses(`status.${busStatusTranslationKeys[status]}`),
              }))}
              isRequired
            />
          )}
        </form.AppField>
        <form.AppField name="circulationCard">
          {(field) => (
            <field.TextInput
              label={tBuses('fields.circulationCard')}
              placeholder={tBuses('form.placeholders.circulationCard')}
            />
          )}
        </form.AppField>
        <form.AppField name="transporterId">
          {(field) => (
            <field.ComboboxInput
              label={tBuses('fields.transporter')}
              placeholder={tBuses('form.placeholders.transporter')}
              emptyOptionsLabel={tBuses('form.placeholders.emptyOptionsLabel')}
              searchPlaceholder={tBuses('form.placeholders.transporterSearch')}
              noResultsLabel={tBuses('form.placeholders.noTransportersFound')}
              items={
                transporters?.data.map((transporter) => ({
                  id: transporter.id.toString(),
                  name: transporter.name,
                })) || []
              }
            />
          )}
        </form.AppField>
        <form.AppField name="alternateTransporterId">
          {(field) => (
            <field.ComboboxInput
              label={tBuses('fields.alternateTransporter')}
              placeholder={tBuses('form.placeholders.alternateTransporter')}
              emptyOptionsLabel={tBuses('form.placeholders.emptyOptionsLabel')}
              searchPlaceholder={tBuses('form.placeholders.transporterSearch')}
              noResultsLabel={tBuses('form.placeholders.noTransportersFound')}
              items={
                transporters?.data.map((transporter) => ({
                  id: transporter.id.toString(),
                  name: transporter.name,
                })) || []
              }
            />
          )}
        </form.AppField>
        <form.AppField name="busLineId">
          {(field) => (
            <field.ComboboxInput
              label={tBuses('fields.busLine')}
              placeholder={tBuses('form.placeholders.busLine')}
              emptyOptionsLabel={tBuses('form.placeholders.emptyOptionsLabel')}
              searchPlaceholder={tBuses('form.placeholders.busLineSearch')}
              noResultsLabel={tBuses('form.placeholders.noBusLinesFound')}
              items={
                busLines?.data.map((busLine) => ({
                  id: busLine.id.toString(),
                  name: busLine.name,
                })) || []
              }
            />
          )}
        </form.AppField>
        <form.AppField name="baseId">
          {(field) => (
            <field.ComboboxInput
              label={tBuses('fields.base')}
              placeholder={tBuses('form.placeholders.base')}
              emptyOptionsLabel={tBuses('form.placeholders.emptyOptionsLabel')}
              searchPlaceholder={tBuses('form.placeholders.nodeSearch')}
              noResultsLabel={tBuses('form.placeholders.noNodesFound')}
              items={
                nodes?.data.map((node) => ({
                  id: node.id.toString(),
                  name: node.name,
                })) || []
              }
            />
          )}
        </form.AppField>
        <form.AppField name="availableForTourismOnly">
          {(field) => (
            <field.SwitchInput
              label={tBuses('fields.availableForTourismOnly')}
            />
          )}
        </form.AppField>
        <form.AppField name="active">
          {(field) => <field.SwitchInput label={tCommon('fields.active')} />}
        </form.AppField>
      </FormLayout>

      <div className="pt-4">
        <FormLayout
          title={tBuses('sections.modelInfo')}
          className="w-full max-w-none"
        >
          <form.AppField
            name="modelId"
            listeners={{
              onChange: (field) => {
                const model = busModels?.data.find(
                  (model) => model.id.toString() === field.value,
                );
                if (model) {
                  if (model.defaultBusDiagramModelId) {
                    form.setFieldValue(
                      'seatDiagramModelId',
                      model.defaultBusDiagramModelId.toString(),
                    );
                  }
                }
              },
            }}
          >
            {(field) => (
              <field.ComboboxInput
                label={tBuses('fields.model')}
                placeholder={tBuses('form.placeholders.model')}
                emptyOptionsLabel={tBuses(
                  'form.placeholders.emptyOptionsLabel',
                )}
                searchPlaceholder={tBuses('form.placeholders.modelSearch')}
                noResultsLabel={tBuses('form.placeholders.noModelsFound')}
                items={
                  busModels?.data.map((model) => ({
                    id: model.id.toString(),
                    name: `${model.manufacturer} - ${model.model}`,
                  })) || []
                }
                isRequired
              />
            )}
          </form.AppField>
          <form.AppField name="purchaseDate">
            {(field) => (
              <field.TextInput
                label={tBuses('fields.purchaseDate')}
                type="date"
                isRequired
              />
            )}
          </form.AppField>
          <form.AppField name="expirationDate">
            {(field) => (
              <field.TextInput
                label={tBuses('fields.expirationDate')}
                type="date"
                isRequired
              />
            )}
          </form.AppField>
          <form.AppField name="erpClientNumber">
            {(field) => (
              <field.TextInput
                label={tBuses('fields.erpClientNumber')}
                placeholder={tBuses('form.placeholders.erpClientNumber')}
              />
            )}
          </form.AppField>
        </FormLayout>
      </div>

      <div className="pt-4">
        <FormLayout
          title={tBuses('sections.technicalInfo')}
          className="w-full max-w-none"
        >
          <form.AppField name="vehicleId">
            {(field) => (
              <field.TextInput
                label={tBuses('fields.vehicleId')}
                placeholder={tBuses('form.placeholders.vehicleId')}
              />
            )}
          </form.AppField>
          <form.AppField name="serialNumber">
            {(field) => (
              <field.TextInput
                label={tBuses('fields.serialNumber')}
                placeholder={tBuses('form.placeholders.serialNumber')}
                isRequired
              />
            )}
          </form.AppField>
          <form.AppField name="engineNumber">
            {(field) => (
              <field.TextInput
                label={tBuses('fields.engineNumber')}
                placeholder={tBuses('form.placeholders.engineNumber')}
              />
            )}
          </form.AppField>
          <form.AppField name="chassisNumber">
            {(field) => (
              <field.TextInput
                label={tBuses('fields.chassisNumber')}
                placeholder={tBuses('form.placeholders.chassisNumber')}
                isRequired
              />
            )}
          </form.AppField>
          <form.AppField name="grossVehicleWeight">
            {(field) => (
              <field.NumberInput
                label={tBuses('fields.grossVehicleWeight')}
                placeholder={tBuses('form.placeholders.grossVehicleWeight')}
                isRequired
              />
            )}
          </form.AppField>
          <form.AppField name="sctPermit">
            {(field) => (
              <field.TextInput
                label={tBuses('fields.sctPermit')}
                placeholder={tBuses('form.placeholders.sctPermit')}
              />
            )}
          </form.AppField>
        </FormLayout>
      </div>

      <div className="pt-4">
        <FormLayout
          title={tBuses('sections.maintenanceInfo')}
          className="w-full max-w-none"
        >
          <form.AppField name="currentKilometer">
            {(field) => (
              <field.NumberInput
                label={tBuses('fields.currentKilometer')}
                placeholder={tBuses('form.placeholders.currentKilometer')}
              />
            )}
          </form.AppField>
          <form.AppField name="gpsId">
            {(field) => (
              <field.TextInput
                label={tBuses('fields.gpsId')}
                placeholder={tBuses('form.placeholders.gpsId')}
              />
            )}
          </form.AppField>
          <form.AppField name="lastMaintenanceDate">
            {(field) => (
              <field.TextInput
                label={tBuses('fields.lastMaintenanceDate')}
                placeholder={tBuses('form.placeholders.lastMaintenanceDate')}
                type="date"
              />
            )}
          </form.AppField>
          <form.AppField name="nextMaintenanceDate">
            {(field) => (
              <field.TextInput
                label={tBuses('fields.nextMaintenanceDate')}
                placeholder={tBuses('form.placeholders.nextMaintenanceDate')}
                type="date"
              />
            )}
          </form.AppField>
        </FormLayout>
      </div>

      <div className="pt-4">
        <FormLayout
          title={tBuses('sections.seatDiagram')}
          className="w-full max-w-none"
        >
          <form.AppField name="seatDiagramModelId">
            {(field) => (
              <field.ComboboxInput
                // This field is only modified through the bus model field
                disabled
                label={tBuses('fields.seatDiagram')}
                placeholder={tBuses('form.placeholders.seatDiagram')}
                emptyOptionsLabel={tBuses(
                  'form.placeholders.emptyOptionsLabel',
                )}
                searchPlaceholder={tBuses(
                  'form.placeholders.seatDiagramSearch',
                )}
                noResultsLabel={tBuses('form.placeholders.noSeatDiagramsFound')}
                isRequired
                items={
                  seatDiagrams?.data.map((seatDiagram) => ({
                    id: seatDiagram.id.toString(),
                    name: seatDiagram.name,
                  })) || []
                }
              />
            )}
          </form.AppField>

          {/* Editable seat diagram */}
          <spaceForm.Subscribe
            // @ts-expect-error - Form library typing
            selector={(state) => [state.values]}
          >
            {/* @ts-expect-error - Form library typing */}
            {([selectedSpace]: [SeatDiagramSpace]) => (
              <form.Subscribe
                // @ts-expect-error - Form library typing
                selector={(state) => [state.values.seatConfiguration]}
              >
                {/* @ts-expect-error - Form library typing */}
                {([seatConfiguration]: [SeatDiagramSpace[]]) =>
                  seatConfiguration.length === 0 ? null : (
                    <div className="grid gap-4 w-full pt-4">
                      <div className="flex gap-1">
                        {seatConfiguration.map((floor) => (
                          <Button
                            variant="outline"
                            size="sm"
                            key={floor.floorNumber}
                            onClick={() => {
                              setSelectedFloor(floor.floorNumber);
                            }}
                            type="button"
                            className={
                              selectedFloor === floor.floorNumber
                                ? 'bg-primary text-primary-foreground ring'
                                : ''
                            }
                          >
                            {tSeatDiagrams('fields.floor', {
                              floorNumber: floor.floorNumber,
                            })}
                          </Button>
                        ))}
                      </div>
                      <div className="min-h-[500px] h-[70vh] max-h-[700px]">
                        <div className="grid gap-4 grid-cols-[3fr_auto_2fr] h-full">
                          <form.AppField name="seatConfiguration">
                            {(field) => {
                              if (!field.state.value) return null;
                              const floor = field.state.value.find(
                                (floor) => floor.floorNumber === selectedFloor,
                              );
                              if (!floor) return null;
                              return (
                                // @todo implement discriminated unions typing for SeatDiagram component
                                // @ts-expect-error - Missing event handlers props because we don't need them
                                <SeatDiagram
                                  spaces={floor.spaces as SeatDiagramSpace[]}
                                  floorNumber={floor.floorNumber}
                                  onClick={handleSpaceClick}
                                  selectedSpace={selectedSpace}
                                  allowColumnEdition={false}
                                  allowRowEdition={false}
                                />
                              );
                            }}
                          </form.AppField>
                          <div className="p-4 pt-20 text-sm ">
                            <ul>
                              <li className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-white border border-gray-300 rounded-full" />
                                {tSeatDiagrams('form.placeholders.seatTypes', {
                                  seatType: SeatType.REGULAR,
                                })}
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-purple-100 border border-purple-500 rounded-full" />
                                {tSeatDiagrams('form.placeholders.seatTypes', {
                                  seatType: SeatType.PREMIUM,
                                })}
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-green-100 border border-green-500 rounded-full" />
                                {tSeatDiagrams('form.placeholders.seatTypes', {
                                  seatType: SeatType.VIP,
                                })}
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-100 border border-blue-500 rounded-full" />
                                {tSeatDiagrams('form.placeholders.seatTypes', {
                                  seatType: SeatType.BUSINESS,
                                })}
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-yellow-100 border border-yellow-500 rounded-full" />
                                {tSeatDiagrams('form.placeholders.seatTypes', {
                                  seatType: SeatType.EXECUTIVE,
                                })}
                              </li>
                              <li className="flex items-center gap-2">
                                <Bath className="w-3 h-3" />
                                {tSeatDiagrams('form.spaceTypes.bathroom')}
                              </li>
                              <li className="flex items-center gap-2">
                                <MoveUpRight className="w-3 h-3" />
                                {tSeatDiagrams('form.spaceTypes.stairs')}
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-white border-dashed border-2 border-gray-300 rounded-full" />
                                {tSeatDiagrams('form.spaceTypes.empty')}
                              </li>
                            </ul>
                          </div>
                          <Card>
                            <CardHeader>
                              <CardTitle>
                                {tSeatDiagrams('form.placeholders.editSpace')}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="h-full">
                              <spaceForm.Subscribe
                                // @ts-expect-error - Form library typing
                                selector={(state) => {
                                  const {
                                    seatNumber,
                                    reclinementAngle,
                                    amenities,
                                  } = state.values;
                                  return [
                                    state.values.spaceType,
                                    seatNumber,
                                    reclinementAngle,
                                    amenities,
                                  ];
                                }}
                              >
                                {/* @ts-expect-error - Form library typing */}
                                {([
                                  spaceType,
                                  seatNumber,
                                  reclinementAngle,
                                  amenities,
                                ]: [
                                  SpaceType,
                                  string | undefined,
                                  string | undefined,
                                  string[] | undefined,
                                ]) => (
                                  <>
                                    {!spaceType ? (
                                      <div>
                                        {tSeatDiagrams(
                                          'form.placeholders.selectSpace',
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-2 justify-between h-full">
                                        <div className="grid gap-2">
                                          <spaceForm.AppField
                                            name="spaceType"
                                            listeners={{
                                              onChange: (event) => {
                                                initializeSeatFields(
                                                  spaceForm as ReturnType<
                                                    typeof useForm
                                                  >,
                                                  event.value,
                                                  seatNumber,
                                                  reclinementAngle,
                                                  amenities,
                                                );
                                              },
                                            }}
                                          >
                                            {(field) => (
                                              <field.SelectInput
                                                label={tSeatDiagrams(
                                                  'fields.spaceType',
                                                )}
                                                isRequired
                                                placeholder={tSeatDiagrams(
                                                  'form.placeholders.spaceType',
                                                )}
                                                disabled={
                                                  spaceType === SpaceType.EMPTY
                                                }
                                                items={Object.values(
                                                  SpaceType,
                                                ).map((type) => ({
                                                  id: type,
                                                  name: tSeatDiagrams(
                                                    `form.spaceTypes.${type}`,
                                                  ),
                                                  hidden:
                                                    type === SpaceType.EMPTY,
                                                }))}
                                              />
                                            )}
                                          </spaceForm.AppField>
                                          {spaceType === SpaceType.SEAT && (
                                            <>
                                              <spaceForm.AppField name="seatType">
                                                {(field) => (
                                                  <field.SelectInput
                                                    label={tSeatDiagrams(
                                                      'fields.seatType',
                                                    )}
                                                    isRequired
                                                    placeholder={tSeatDiagrams(
                                                      'form.placeholders.seatType',
                                                    )}
                                                    items={Object.values(
                                                      SeatType,
                                                    ).map((type) => ({
                                                      id: type,
                                                      name: tSeatDiagrams(
                                                        `form.seatTypes.${type}`,
                                                      ),
                                                    }))}
                                                  />
                                                )}
                                              </spaceForm.AppField>
                                              <spaceForm.AppField name="seatNumber">
                                                {(field) => (
                                                  <field.TextInput
                                                    label={tSeatDiagrams(
                                                      'fields.seatNumber',
                                                    )}
                                                    isRequired
                                                    placeholder={tSeatDiagrams(
                                                      'form.placeholders.seatNumber',
                                                    )}
                                                  />
                                                )}
                                              </spaceForm.AppField>
                                              <spaceForm.AppField name="amenities">
                                                {(field) => (
                                                  <field.MultiSelectInput
                                                    label={tSeatDiagrams(
                                                      'fields.amenities',
                                                    )}
                                                    placeholder={tSeatDiagrams(
                                                      'form.placeholders.selectAmenities',
                                                    )}
                                                    items={busAmenities.map(
                                                      (amenity) => ({
                                                        id: amenity.id.toString(),
                                                        name: amenity.name,
                                                        description:
                                                          amenity.description ||
                                                          undefined,
                                                        category:
                                                          amenity.category,
                                                      }),
                                                    )}
                                                    emptyOptionsLabel={tSeatDiagrams(
                                                      'form.placeholders.noAmenities',
                                                    )}
                                                    previewItemsCount={1}
                                                  />
                                                )}
                                              </spaceForm.AppField>

                                              <spaceForm.AppField name="reclinementAngle">
                                                {(field) => (
                                                  <field.NumberInput
                                                    label={tSeatDiagrams(
                                                      'fields.reclinementAngle',
                                                    )}
                                                    placeholder={tSeatDiagrams(
                                                      'form.placeholders.reclinementAngle',
                                                    )}
                                                    min={0}
                                                    max={180}
                                                  />
                                                )}
                                              </spaceForm.AppField>
                                            </>
                                          )}
                                          <div className="pt-2">
                                            <spaceForm.AppField
                                              name="spaceType"
                                              listeners={{
                                                onChange: (event) => {
                                                  initializeSeatFields(
                                                    spaceForm as ReturnType<
                                                      typeof useForm
                                                    >,
                                                    event.value,
                                                    seatNumber,
                                                    reclinementAngle,
                                                    amenities,
                                                  );
                                                },
                                              }}
                                            >
                                              {(field) => (
                                                <BaseSwitchInput
                                                  label={tSeatDiagrams(
                                                    'fields.disableSpace',
                                                  )}
                                                  name="disable-space"
                                                  value={
                                                    field.state.value ===
                                                    SpaceType.EMPTY
                                                  }
                                                  onChange={(value) => {
                                                    field.handleChange(
                                                      value
                                                        ? SpaceType.EMPTY
                                                        : SpaceType.SEAT,
                                                    );
                                                    spaceForm.validateSync(
                                                      'change',
                                                    );
                                                  }}
                                                />
                                              )}
                                            </spaceForm.AppField>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </spaceForm.Subscribe>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  )
                }
              </form.Subscribe>
            )}
          </spaceForm.Subscribe>
        </FormLayout>
      </div>

      <div className="pt-4">
        <FormLayout
          title={tTechnologies('sections.technologies')}
          className="w-full max-w-none"
        >
          <form.AppField name="technologyIds">
            {(field) => (
              <div className="space-y-4">
                <field.MultiSelectInput
                  label={''}
                  placeholder={tTechnologies(
                    'form.sections.technologies.addTechnology',
                  )}
                  items={
                    technologies?.data.map((technology) => ({
                      id: technology.id.toString(),
                      name: technology.name,
                      description: technology.description,
                    })) ?? []
                  }
                  emptyOptionsLabel={tTechnologies(
                    'form.sections.technologies.emptyText',
                  )}
                />

                {field.state.value && field.state.value.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">
                      {tTechnologies('form.fields.selectedTechnologies', {
                        count: field.state.value.length,
                      })}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {field.state.value.map((technologyId: number) => {
                        const technology = technologies?.data.find(
                          (a) => a.id === technologyId,
                        );
                        return technology ? (
                          <TechnologyCard
                            key={technology.id}
                            technology={technology}
                          />
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form.AppField>
        </FormLayout>
      </div>

      <div className="pt-4">
        <FormLayout
          title={tBuses('sections.chromatics')}
          className="w-full max-w-none"
        >
          <form.AppField name="chromaticId">
            {(field) => (
              <field.SelectInput
                label={tBuses('fields.chromatics')}
                placeholder={tBuses('form.placeholders.chromatics')}
                emptyOptionsLabel={tBuses(
                  'form.placeholders.emptyOptionsLabel',
                )}
                items={
                  chromatics?.data.map((chromatic) => ({
                    id: chromatic.id.toString(),
                    name: chromatic.name,
                  })) || []
                }
                disabled={isLoadingChromatics}
              />
            )}
          </form.AppField>
        </FormLayout>
      </div>

      <div className="pt-4">
        <FormLayout
          title={tBuses('sections.busCrew')}
          className="w-full max-w-none"
        >
          <form.AppField name="driverIds">
            {(field) => (
              <div className="space-y-4">
                <field.MultiSelectInput
                  label={''}
                  placeholder={tDrivers('form.sections.drivers.addDriver')}
                  items={
                    selectedDrivers.map((driver) => ({
                      id: driver.id.toString(),
                      name: driver.firstName + ' ' + driver.lastName,
                      description: driver.busLineId.toString(),
                    })) ?? []
                  }
                  emptyOptionsLabel={tDrivers(
                    'form.sections.drivers.emptyText',
                  )}
                />

                {field.state.value && field.state.value.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">
                      {tDrivers('form.sections.drivers.selectedDrivers', {
                        count: field.state.value.length,
                      })}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {field.state.value.map((driverId: number) => {
                        const driver = selectedDrivers.find(
                          (a) => a.id === driverId,
                        );
                        return driver ? (
                          <DriverCard key={driver.id} driver={driver} />
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form.AppField>
        </FormLayout>
      </div>

      <FormFooter>
        <form.AppForm>
          <form.SubmitButton>
            {defaultValues
              ? tBuses('actions.update')
              : tBuses('actions.create')}
          </form.SubmitButton>
        </form.AppForm>
      </FormFooter>
    </Form>
  );
}
