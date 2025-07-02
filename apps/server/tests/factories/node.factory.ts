import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { cityFactory } from './city.factory';
import { extractTablesFromSchema, generateId } from './factory-utils';
import { installationFactory } from './installation.factory';
import { populationFactory } from './populations.factory';

export const nodeFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'nodes',
  resolver: ({ sequence, use }) => {
    const id = generateId(sequence);

    return {
      id,
      code: `NODE${String(sequence).padStart(3, '0')}`,
      name: `Node ${id}`,
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      radius: faker.number.float({ min: 0.5, max: 10.0, fractionDigits: 2 }),
      cityId: () =>
        use(cityFactory)
          .create()
          .then((city) => city.id),
      populationId: () =>
        use(populationFactory)
          .create()
          .then((population) => population.id),
      installationId: faker.helpers.maybe(
        () =>
          use(installationFactory)
            .create()
            .then((installation) => installation.id),
        { probability: 0.7 },
      ),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
