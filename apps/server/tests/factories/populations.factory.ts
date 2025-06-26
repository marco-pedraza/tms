import { fakerES_MX as faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { ID_OFFSET } from './constants';
import { extractTablesFromSchema } from './factory-utils';

export const populationFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'populations',
  resolver: ({ sequence }) => {
    const populationTypes = ['Metropolitan', 'Suburban', 'Tourist'];

    const basePopulationType = faker.helpers.arrayElement(populationTypes);
    const regionName = faker.location.state();

    return {
      id: sequence + ID_OFFSET,
      code: `POP${String(sequence).padStart(3, '0')}`,
      name: `${basePopulationType} ${regionName}`,
      description: faker.helpers.maybe(
        () =>
          `Population for ${basePopulationType.toLowerCase()} areas in ${regionName} region`,
        { probability: 0.7 },
      ),
      active: faker.helpers.weightedArrayElement([
        { weight: 0.8, value: true },
        { weight: 0.2, value: false },
      ]),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
