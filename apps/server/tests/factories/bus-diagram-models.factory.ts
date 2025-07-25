import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import {
  extractTablesFromSchema,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

export const busDiagramModelFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'busDiagramModels',
  resolver: () => {
    const id = generateId();
    const floorCount = faker.helpers.maybe(() => 2, { probability: 0.25 }) || 1;

    // Calculate seats configuration
    const seatsPerFloor = Array.from({ length: floorCount }, (_, index) => {
      // Fewer seats on upper floor if double decker
      const rowCount =
        index === 0
          ? faker.number.int({ min: 10, max: 15 })
          : faker.number.int({ min: 8, max: 12 });
      const seatsPerRow = faker.number.int({ min: 3, max: 5 });
      return {
        floor: index + 1,
        rows: rowCount,
        seatsPerRow,
      };
    });

    // Calculate total seats
    const totalSeats = seatsPerFloor.reduce(
      (sum, floor) => sum + floor.rows * floor.seatsPerRow,
      0,
    );

    return {
      id,
      name: generateAlphabeticName('Bus Diagram Model'),
      description: faker.lorem.sentence(),
      maxCapacity: totalSeats + faker.number.int({ min: 0, max: 6 }), // Slight buffer for staff
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
