import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { buses } from '@repo/ims-client';
import useQueryAllSeatDiagrams from '@/app/seat-diagrams/hooks/use-query-all-seat-diagrams';
import useQueryAllTechnologies from '@/app/technologies/hooks/use-query-all-technologies';
import useQueryAllBusLines from '@/bus-lines/hooks/use-query-all-bus-lines';
import useQueryAllBusModels from '@/bus-models/hooks/use-query-all-bus-models';
import busLicensePlateTypesTranslationKeys from '@/buses/translations/bus-license-plate-types-translations-keys';
import busStatusTranslationKeys from '@/buses/translations/bus-status-translations-keys';
import Form from '@/components/form/form';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import TechnologyCard from '@/components/ui/technology-card';
import useForm from '@/hooks/use-form';
import useQueryAllNodes from '@/nodes/hooks/use-query-all-nodes';
import { requiredIntegerSchema } from '@/schemas/number';
import {
  BusStatus,
  busLicensePlateTypes,
  busStatuses,
} from '@/services/ims-client';
import useQueryAllTransporters from '@/transporters/hooks/use-query-all-transporters';
import { UseValidationsTranslationsResult } from '@/types/translations';
import injectTranslatedErrorsToForm from '@/utils/inject-translated-errors-to-form';

const createBusFormSchema = (tValidations: UseValidationsTranslationsResult) =>
  z.object({
    // basic information
    economicNumber: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') }),
    registrationNumber: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') }),
    licensePlateType: z
      .enum(busLicensePlateTypes as [string, ...string[]], {
        message: tValidations('required'),
      })
      .transform((val) => val as buses.BusLicensePlateType),
    licensePlateNumber: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') }),
    availableForTourismOnly: z.boolean(),
    status: z
      .enum(busStatuses as [string, ...string[]], {
        message: tValidations('required'),
      })
      .transform((val) => val as buses.BusStatus),
    circulationCard: z
      .string()
      .trim()
      .transform((val) => val || null),
    transporterId: z.string().transform((val) => (val ? parseInt(val) : null)),
    alternateTransporterId: z
      .string()
      .transform((val) => (val ? parseInt(val) : null)),
    busLineId: z.string().transform((val) => (val ? parseInt(val) : null)),
    baseId: z.string().transform((val) => (val ? parseInt(val) : null)),
    active: z.boolean(),
    // model and manufacturer information
    purchaseDate: z.string().min(1, { message: tValidations('required') }),
    expirationDate: z.string().min(1, { message: tValidations('required') }),
    erpClientNumber: z
      .string()
      .trim()
      .transform((val) => val || null),
    modelId: z
      .string()
      .min(1, { message: tValidations('required') })
      .transform((val) => parseInt(val)),
    // Seat diagram
    seatDiagramId: requiredIntegerSchema(tValidations),
    // Technical information
    vehicleId: z
      .string()
      .trim()
      .transform((val) => val || null),
    serialNumber: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') }),
    engineNumber: z
      .string()
      .trim()
      .transform((val) => val || null),
    chassisNumber: z
      .string()
      .trim()
      .min(1, { message: tValidations('required') }),
    grossVehicleWeight: z
      .string()
      .min(1, { message: tValidations('required') })
      .transform((val) => parseFloat(val)),
    sctPermit: z
      .string()
      .trim()
      .transform((val) => val || null),
    // Maintenance information
    currentKilometer: z
      .string()
      .transform((val) => (val ? parseFloat(val) : null)),
    gpsId: z
      .string()
      .trim()
      .transform((val) => val || null),
    lastMaintenanceDate: z.string().transform((val) => val || null),
    nextMaintenanceDate: z.string().transform((val) => val || null),
    technologyIds: z.array(z.number()).optional(),
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
  const tValidations = useTranslations('validations');
  const busSchema = createBusFormSchema(tValidations);
  const { data: technologies } = useQueryAllTechnologies();

  const rawDefaultValues: BusFormRawValues = defaultValues
    ? {
        ...defaultValues,
        circulationCard: defaultValues.circulationCard || '',
        transporterId: defaultValues.transporterId?.toString() || '',
        alternateTransporterId:
          defaultValues.alternateTransporterId?.toString() || '',
        busLineId: defaultValues.busLineId?.toString() || '',
        baseId: defaultValues.baseId?.toString() || '',
        purchaseDate: defaultValues.purchaseDate || '',
        expirationDate: defaultValues.expirationDate || '',
        erpClientNumber: defaultValues.erpClientNumber || '',
        modelId: defaultValues.modelId?.toString() || '',
        vehicleId: defaultValues.vehicleId || '',
        engineNumber: defaultValues.engineNumber || '',
        grossVehicleWeight: defaultValues.grossVehicleWeight?.toString() || '',
        sctPermit: defaultValues.sctPermit || '',
        currentKilometer: defaultValues.currentKilometer?.toString() || '',
        gpsId: defaultValues.gpsId || '',
        lastMaintenanceDate: defaultValues.lastMaintenanceDate || '',
        nextMaintenanceDate: defaultValues.nextMaintenanceDate || '',
        seatDiagramId: defaultValues.seatDiagramId?.toString() || '',
        technologyIds: defaultValues.technologyIds || [],
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
        seatDiagramId: '',
        active: true,
        technologyIds: [],
      };

  const form = useForm({
    defaultValues: rawDefaultValues,
    validators: {
      onChange: busSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = busSchema.safeParse(value);
        if (parsed.success) {
          await onSubmit(parsed.data);
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
  const { data: busModels } = useQueryAllBusModels();
  const { data: seatDiagrams } = useQueryAllSeatDiagrams();
  const { data: transporters } = useQueryAllTransporters();
  const { data: busLines } = useQueryAllBusLines();
  const { data: nodes } = useQueryAllNodes();

  return (
    <Form onSubmit={form.handleSubmit}>
      <FormLayout title={tBuses('sections.basicInfo')}>
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
            <field.SelectInput
              label={tBuses('fields.transporter')}
              placeholder={tBuses('form.placeholders.transporter')}
              emptyOptionsLabel={tBuses('form.placeholders.emptyOptionsLabel')}
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
            <field.SelectInput
              label={tBuses('fields.alternateTransporter')}
              placeholder={tBuses('form.placeholders.alternateTransporter')}
              emptyOptionsLabel={tBuses('form.placeholders.emptyOptionsLabel')}
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
            <field.SelectInput
              label={tBuses('fields.busLine')}
              placeholder={tBuses('form.placeholders.busLine')}
              emptyOptionsLabel={tBuses('form.placeholders.emptyOptionsLabel')}
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
            <field.SelectInput
              label={tBuses('fields.base')}
              placeholder={tBuses('form.placeholders.base')}
              emptyOptionsLabel={tBuses('form.placeholders.emptyOptionsLabel')}
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
        <FormLayout title={tBuses('sections.modelInfo')}>
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
                      'seatDiagramId',
                      model.defaultBusDiagramModelId.toString(),
                    );
                  }
                }
              },
            }}
          >
            {(field) => (
              <field.SelectInput
                label={tBuses('fields.model')}
                placeholder={tBuses('form.placeholders.model')}
                emptyOptionsLabel={tBuses(
                  'form.placeholders.emptyOptionsLabel',
                )}
                items={
                  busModels?.data.map(
                    (model: { id: number; model: string }) => ({
                      id: model.id.toString(),
                      name: model.model,
                    }),
                  ) || []
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
        <FormLayout title={tBuses('sections.technicalInfo')}>
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
        <FormLayout title={tBuses('sections.maintenanceInfo')}>
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
        <FormLayout title={tBuses('sections.seatDiagram')}>
          <form.AppField name="seatDiagramId">
            {(field) => {
              const seatDiagram = seatDiagrams?.data.find(
                (seatDiagram) =>
                  seatDiagram.id.toString() === field.state.value,
              );
              return (
                <>
                  <field.SelectInput
                    label={tBuses('fields.seatDiagram')}
                    placeholder={tBuses('form.placeholders.seatDiagram')}
                    emptyOptionsLabel={tBuses(
                      'form.placeholders.emptyOptionsLabel',
                    )}
                    isRequired
                    items={
                      seatDiagrams?.data.map((seatDiagram) => ({
                        id: seatDiagram.id.toString(),
                        name: seatDiagram.name,
                      })) || []
                    }
                  />
                  {seatDiagram && (
                    <div className="space-y-4 pt-4">
                      {seatDiagram.seatsPerFloor.map((floor) => (
                        <div
                          key={floor.floorNumber}
                          className="border rounded-lg p-4"
                        >
                          <h4 className="font-medium mb-2">
                            {tSeatDiagrams('fields.floor', {
                              floorNumber: floor.floorNumber,
                            })}
                          </h4>
                          <dl className="grid grid-cols-[1fr_1fr] gap-2 text-sm">
                            <dt>{tSeatDiagrams('fields.numRows')}:</dt>
                            <dd>{floor.numRows || '-'}</dd>
                            <dt>{tSeatDiagrams('fields.seatsLeft')}:</dt>
                            <dd>{floor.seatsLeft || '-'}</dd>
                            <dt>{tSeatDiagrams('fields.seatsRight')}:</dt>
                            <dd>{floor.seatsRight || '-'}</dd>
                          </dl>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            }}
          </form.AppField>
        </FormLayout>
      </div>

      <div className="pt-4">
        <FormLayout title={tTechnologies('sections.technologies')}>
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
