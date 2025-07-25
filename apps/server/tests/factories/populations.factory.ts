import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import {
  extractTablesFromSchema,
  generateAlphabeticCode,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

export const populationFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'populations',
  resolver: () => {
    const id = generateId();

    return {
      id,
      code: generateAlphabeticCode(3, 'POP'),
      name: generateAlphabeticName('Population'),
      description: faker.helpers.maybe(() => faker.lorem.sentence(), {
        probability: 0.7,
      }),
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
