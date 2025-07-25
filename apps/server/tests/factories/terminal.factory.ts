import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { AVAILABLE_TIMEZONES } from '../../inventory/timezones/timezones.constants';
import { createSlug } from '../../shared/utils';
import { cityFactory } from './city.factory';
import {
  extractTablesFromSchema,
  generateAlphabeticCode,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

export const terminalFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'terminals',
  resolver: ({ use }) => {
    const id = generateId();
    const name = generateAlphabeticName('Terminal');

    return {
      id,
      name,
      address: faker.location.streetAddress(),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      code: generateAlphabeticCode(5), // Generate unique 5-letter code for better uniqueness
      slug: createSlug(name, 't'),
      timezone: faker.helpers.arrayElement(AVAILABLE_TIMEZONES).id,
      cityId: () =>
        use(cityFactory)
          .create()
          .then((city) => city.id),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
