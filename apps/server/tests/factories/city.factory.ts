import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { extractTablesFromSchema, generateId } from './factory-utils';
import { stateFactory } from './state.factory';

export const cityFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'cities',
  resolver: ({ sequence, use }) => {
    const id = generateId(sequence);
    return {
      id,
      name: `City ${id}`,
      stateId: () =>
        use(stateFactory)
          .create()
          .then((state) => state.id),
      latitude: 0.0 + sequence,
      longitude: 0.0 + sequence,
      timezone: 'UTC',
      active: true,
      slug: `city-${id}`,
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
