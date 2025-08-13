import { fakerES_MX as faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { BusStatus } from '../../inventory/buses/buses.types';
import { extractTablesFromSchema, generateId } from './factory-utils';

export const busFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'buses',
  resolver: ({ sequence }) => {
    const id = generateId(sequence);
    const statuses = Object.values(BusStatus);
    const licensePlateTypes = ['federal', 'state', 'tourist', 'standard'];

    return {
      id,
      economicNumber: `ECO${faker.string.numeric(3)}`,
      registrationNumber: `TEST${String(id).padStart(3, '0')}`,
      licensePlateType: faker.helpers.arrayElement(licensePlateTypes),
      licensePlateNumber: `PL${faker.string.numeric(5)}`,
      circulationCard: `CC${faker.string.numeric(5)}`,
      availableForTurismOnly:
        faker.helpers.maybe(() => true, { probability: 0.25 }) ?? false,
      status: faker.helpers.arrayElement(statuses),
      transporterId: null, // Will be set by the seeder
      alternateTransporterId: null, // Optional field
      busLineId: null, // Optional field
      baseId: null, // Optional field
      purchaseDate: faker.date.past({ years: 5 }),
      expirationDate: faker.date.future({ years: 10 }),
      erpClientNumber: `ERP${faker.string.alphanumeric(5).toUpperCase()}`,
      modelId: null, // Will be set by the seeder
      vehicleId: `VEH${faker.string.alphanumeric(5).toUpperCase()}`,
      serialNumber: `SER${faker.string.alphanumeric(5).toUpperCase()}`,
      engineNumber: `ENG${faker.string.alphanumeric(5).toUpperCase()}`,
      chassisNumber: `CHS${faker.string.alphanumeric(5).toUpperCase()}`,
      grossVehicleWeight: faker.number
        .int({ min: 15000, max: 20000 })
        .toString(),
      sctPermit: `SCT${faker.string.numeric(5)}`,
      currentKilometer: faker.number
        .int({ min: 10000, max: 500000 })
        .toString(),
      gpsId: `GPS${faker.string.alphanumeric(5).toUpperCase()}`,
      lastMaintenanceDate: faker.helpers.maybe(
        () => faker.date.past({ years: 1 }),
        { probability: 0.8 },
      ),
      nextMaintenanceDate: faker.helpers.maybe(
        () => faker.date.future({ years: 1 }),
        { probability: 0.6 },
      ),
      seatDiagramId: null, // Will be set by the seeder
      active: faker.helpers.maybe(() => true, { probability: 0.9 }) ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
