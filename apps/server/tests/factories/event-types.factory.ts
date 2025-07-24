import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { extractTablesFromSchema, generateId } from './factory-utils';

export const eventTypeFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'eventTypes',
  resolver: ({ sequence }) => {
    const id = generateId(sequence);

    return {
      id,
      name: `Event Type ${id}`,
      code: `EVT${String(sequence).padStart(3, '0')}`,
      description: faker.helpers.maybe(() => faker.lorem.sentence(), {
        probability: 0.7,
      }),
      baseTime: faker.number.int({ min: 15, max: 120 }), // 15 to 120 minutes
      needsCost: faker.datatype.boolean(),
      needsQuantity: faker.datatype.boolean(),
      integration: faker.helpers.maybe(() => true, { probability: 0.2 }), // 20% chance of being integration
      active: faker.datatype.boolean(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
