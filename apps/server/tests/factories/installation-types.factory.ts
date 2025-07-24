import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { extractTablesFromSchema, generateId } from './factory-utils';

export const installationTypeFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'installationTypes',
  resolver: ({ sequence }) => {
    const id = generateId(sequence);
    return {
      id,
      name: `Installation Type ${id}`,
      code: `IT${String(sequence).padStart(3, '0')}`,
      description: faker.helpers.maybe(() => faker.lorem.sentence(), {
        probability: 0.7,
      }),
      active: faker.datatype.boolean(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
