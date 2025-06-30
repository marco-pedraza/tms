import { fakerES_MX as faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { BusStatus } from '../../inventory/buses/buses.types';
import { busModelFactory } from './bus-models.factory';
import { extractTablesFromSchema, generateId } from './factory-utils';
import { seatDiagramFactory } from './seat-diagrams.factory';

export const busFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'buses',
  resolver: ({ sequence, use }) => {
    const id = generateId(sequence);
    const statuses = Object.values(BusStatus);
    const serviceTypes = ['regular', 'executive', 'premium', 'luxury'];
    const baseCodes = ['CDMX', 'GDL', 'MTY', 'CUN', 'OAX'];
    const licensePlateTypes = ['federal', 'state', 'tourist', 'standard'];

    return {
      id,
      registrationNumber: `TEST${String(id).padStart(3, '0')}`,
      modelId: () =>
        use(busModelFactory)
          .create()
          .then((model) => model.id),
      seatDiagramId: () =>
        use(seatDiagramFactory)
          .create()
          .then((diagram) => diagram.id),
      typeCode: (sequence % 5) + 100, // Similar to tests (typeCode: 100)
      brandCode: faker.helpers.arrayElement(['TST', 'BRD', 'MRC', 'VLV']),
      modelCode:
        faker.helpers.arrayElement(['MDL', 'MOD', 'BUS', 'TYP']) + sequence,
      maxCapacity: faker.number.int({ min: 40, max: 60 }),
      purchaseDate: faker.date.past({ years: 5 }),
      economicNumber: `ECO${faker.string.numeric(3)}`,
      licensePlateType: faker.helpers.arrayElement(licensePlateTypes),
      circulationCard: `CC${faker.string.numeric(5)}`,
      year: faker.date
        .between({ from: new Date(2018, 0, 1), to: new Date(2024, 0, 1) })
        .getFullYear(),
      sctPermit: `SCT${faker.string.numeric(5)}`,
      vehicleId: `VEH${faker.string.alphanumeric(5).toUpperCase()}`,
      grossVehicleWeight: faker.number.int({ min: 15000, max: 20000 }),
      engineNumber: `ENG${faker.string.alphanumeric(5).toUpperCase()}`,
      serialNumber: `SER${faker.string.alphanumeric(5).toUpperCase()}`,
      chassisNumber: `CHS${faker.string.alphanumeric(5).toUpperCase()}`,
      sapKey: `SAP${faker.string.alphanumeric(5).toUpperCase()}`,
      baseCode: faker.helpers.arrayElement(baseCodes),
      erpClientNumber: `ERP${faker.string.alphanumeric(5).toUpperCase()}`,
      costCenter: `CC-${faker.number.int({ min: 1, max: 20 })}`,
      fuelEfficiency: faker.number.float({
        min: 2.5,
        max: 9.5,
        fractionDigits: 1,
      }),
      alternateCompany: faker.helpers.maybe(() => faker.company.name(), {
        probability: 0.3,
      }),
      serviceType: faker.helpers.arrayElement(serviceTypes),
      commercialTourism:
        faker.helpers.maybe(() => true, { probability: 0.25 }) ?? false,
      available: faker.helpers.maybe(() => true, { probability: 0.9 }) ?? false,
      tourism: faker.helpers.maybe(() => true, { probability: 0.2 }) ?? false,
      status: faker.helpers.arrayElement(statuses),
      lastMaintenanceDate: faker.date.recent({ days: 90 }),
      nextMaintenanceDate: faker.date.soon({ days: 90 }),
      gpsId: `GPS${faker.string.alphanumeric(5).toUpperCase()}`,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
});
