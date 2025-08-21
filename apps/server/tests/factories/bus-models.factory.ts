import { fakerES_MX as faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { EngineType } from '@/inventory/fleet/bus-models/bus-models.types';
import { schema } from '../../db';
import { busDiagramModelFactory } from './bus-diagram-models.factory';
import { extractTablesFromSchema, generateId } from './factory-utils';

export const busModelFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'busModels',
  resolver: ({ sequence, use }) => {
    const id = generateId(sequence);
    const manufacturers = [
      'Volvo',
      'Mercedes-Benz',
      'Irizar',
      'Marcopolo',
      'Scania',
    ];

    const possibleAmenities = [
      'Wifi',
      'Power Outlets',
      'Air Conditioning',
      'TV Screens',
      'USB Ports',
      'Reading Lights',
      'Footrests',
      'Reclining Seats',
      'Onboard Bathroom',
      'Beverage Service',
      'Entertainment System',
      'Blankets',
      'Food Service',
    ];

    return {
      id,
      defaultBusDiagramModelId: () =>
        use(busDiagramModelFactory)
          .create()
          .then((model) => model.id),
      manufacturer: faker.helpers.arrayElement(manufacturers),
      model: faker.vehicle.model(),
      year: faker.number.int({ min: 2018, max: 2026 }),
      seatingCapacity: faker.number.int({ min: 35, max: 60 }),
      numFloors: faker.helpers.maybe(() => 2, { probability: 0.1 }) || 1,
      amenities: faker.helpers.arrayElements(
        possibleAmenities,
        faker.number.int({ min: 2, max: 6 }),
      ),
      engineType: faker.helpers.arrayElement(Object.values(EngineType)),
      active: faker.helpers.maybe(() => false, { probability: 0.1 }) ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
});
