import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { createSlug } from '../../shared/utils';
import {
  extractTablesFromSchema,
  generateAlphabeticCode,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

export const countryFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'countries',
  resolver: () => {
    const id = generateId();
    const name = generateAlphabeticName('Country');

    return {
      id,
      name,
      code: generateAlphabeticCode(2),
      slug: createSlug(name),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
