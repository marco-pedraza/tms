import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { createSlug } from '@/shared/utils';
import { schema } from '../../db';
import { AVAILABLE_TIMEZONES } from '../../inventory/locations/timezones/timezones.constants';
import {
  extractTablesFromSchema,
  generateAlphabeticName,
  generateId,
} from './factory-utils';
import { stateFactory } from './state.factory';

export const cityFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'cities',
  resolver: ({ use }) => {
    const id = generateId();
    const name = generateAlphabeticName('City');

    return {
      id,
      name,
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      timezone: faker.helpers.arrayElement(AVAILABLE_TIMEZONES).id,
      slug: createSlug(name),
      stateId: () =>
        use(stateFactory)
          .create()
          .then((state) => state.id),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
