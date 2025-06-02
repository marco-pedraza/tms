import { fakerES_MX as faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { busDiagramModelFactory } from './bus-diagram-models.factory';
import { ID_OFFSET } from './constants';
import { extractTablesFromSchema } from './factory-utils';

export const seatDiagramFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'seatDiagrams',
  resolver: ({ sequence, use }) => {
    const floorCount = faker.helpers.maybe(() => 2, { probability: 0.25 }) || 1;
    const layoutNames = [
      'Standard',
      'Executive',
      'Premium',
      'Luxury',
      'Tourist',
      'Custom',
    ];

    // Calculate seats configuration
    const seatsPerFloor = Array.from({ length: floorCount }, (_, index) => {
      // Fewer seats on upper floor if double decker
      const rowCount =
        index === 0
          ? faker.number.int({ min: 10, max: 16 })
          : faker.number.int({ min: 8, max: 12 });

      // Usually 4 seats per row, sometimes 3 for premium layouts
      const seatsPerRow =
        faker.helpers.maybe(() => 3, { probability: 0.2 }) || 4;

      return { rows: rowCount, seatsPerRow };
    });

    // Calculate total seats
    const totalSeats = seatsPerFloor.reduce(
      (sum, floor) => sum + floor.rows * floor.seatsPerRow,
      0,
    );

    return {
      id: sequence + ID_OFFSET,
      busDiagramModelId: () =>
        use(busDiagramModelFactory)
          .create()
          .then((model) => model.id),
      name: `${faker.helpers.arrayElement(layoutNames)} Diagram ${faker.number.int({ min: 100, max: 999 })}`,
      description: faker.lorem.sentence(),
      maxCapacity: totalSeats + faker.number.int({ min: 0, max: 6 }), // Slight buffer for staff
      observations: faker.helpers.maybe(() => faker.lorem.paragraph(), {
        probability: 0.5,
      }),
      numFloors: floorCount,
      seatsPerFloor,
      totalSeats,
      isFactoryDefault:
        faker.helpers.maybe(() => false, { probability: 0.1 }) || true,
      active: faker.helpers.maybe(() => false, { probability: 0.1 }) || true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
});
