import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { countryFactory } from './country.factory';
import { extractTablesFromSchema, generateId } from './factory-utils';

export const stateFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'states',
  resolver: ({ sequence, use }) => {
    const id = generateId(sequence);
    return {
      id,
      name: `State ${id}`,
      code: `ST${id}`,
      countryId: () =>
        use(countryFactory)
          .create()
          .then((country) => country.id),
      active: true,
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
