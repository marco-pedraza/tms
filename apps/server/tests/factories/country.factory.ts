import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { extractTablesFromSchema, generateId } from './factory-utils';

export const countryFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'countries',
  resolver: ({ sequence }) => {
    const id = generateId(sequence);
    return {
      id,
      name: `Country ${id}`,
      code: `CC${id}`,
      active: true,
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
