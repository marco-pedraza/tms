import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { createSlug } from '@/shared/utils';
import { schema } from '../../db';
import { cityFactory } from './city.factory';
import {
  extractTablesFromSchema,
  generateAlphabeticCode,
  generateAlphabeticName,
  generateId,
} from './factory-utils';
import { populationFactory } from './populations.factory';

export const nodeFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'nodes',
  resolver: ({ use }) => {
    const id = generateId();
    const name = generateAlphabeticName('Node');

    return {
      id,
      name,
      code: generateAlphabeticCode(4, 'NOD'),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      radius: faker.number.float({ min: 0.5, max: 10.0, fractionDigits: 2 }),
      slug: createSlug(name, 'n'),
      allowsBoarding: faker.helpers.arrayElement([true, false]),
      allowsAlighting: faker.helpers.arrayElement([true, false]),
      active: faker.helpers.arrayElement([true, true, true, false]), // 75% active
      cityId: () =>
        use(cityFactory)
          .create()
          .then((city) => city.id),
      populationId: () =>
        use(populationFactory)
          .create()
          .then((population) => population.id),
      // Optional installation - 70% chance of having one
      installationId: faker.helpers.maybe(
        () => null, // We'll set this externally when creating with installations
        { probability: 0.3 },
      ),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
