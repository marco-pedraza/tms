import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { createSlug } from '../../shared/utils';
import { countryFactory } from './country.factory';
import {
  extractTablesFromSchema,
  generateAlphabeticCode,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

export const stateFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'states',
  resolver: ({ use }) => {
    const id = generateId();
    const name = generateAlphabeticName('State');

    return {
      id,
      name,
      code: generateAlphabeticCode(2),
      slug: createSlug(name),
      countryId: () =>
        use(countryFactory)
          .create()
          .then((country) => country.id),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
