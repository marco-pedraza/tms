import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { extractTablesFromSchema } from './factory-utils';

export const nodeEventFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'nodeEvents',
  resolver: () => {
    return {
      // Remove manual ID generation - let PostgreSQL bigserial handle it
      nodeId: null, // Will be provided by the seeder or test
      eventTypeId: null, // Will be provided by the seeder or test
      customTime: faker.helpers.maybe(
        () => faker.number.int({ min: 10, max: 180 }),
        { probability: 0.3 },
      ), // 30% chance of having custom time
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
});
