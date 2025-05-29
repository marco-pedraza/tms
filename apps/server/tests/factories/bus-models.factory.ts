import { fakerES_MX as faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { busDiagramModelFactory } from './bus-diagram-models.factory';
import { ID_OFFSET } from './constants';
import { extractTablesFromSchema } from './factory-utils';

export const busModelFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'busModels',
  resolver: ({ sequence, use }) => {
    const manufacturers = [
      'Volvo',
      'Mercedes-Benz',
      'Irizar',
      'Marcopolo',
      'Scania',
    ];
    const engineTypes = ['Diesel', 'Electric', 'Hybrid', 'Natural Gas'];
    const distributionTypes = [
      'Intercity',
      'Regional',
      'Charter',
      'Suburban',
      'Tourist',
      'Executive',
      'Premium',
      'VIP',
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
      id: sequence + ID_OFFSET,
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
      engineType: faker.helpers.arrayElement(engineTypes),
      distributionType: faker.helpers.arrayElement(distributionTypes),
      active: faker.helpers.maybe(() => false, { probability: 0.1 }) || true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
});
