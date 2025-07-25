import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import {
  extractTablesFromSchema,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

export const installationFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'installations',
  resolver: () => {
    const id = generateId();

    return {
      id,
      name: generateAlphabeticName('Installation'),
      address: faker.location.streetAddress(), // Required field
      description: faker.helpers.maybe(() => faker.lorem.sentence(), {
        probability: 0.7,
      }),
      contactPhone: faker.helpers.maybe(() => faker.phone.number(), {
        probability: 0.6,
      }),
      contactEmail: faker.helpers.maybe(() => faker.internet.email(), {
        probability: 0.6,
      }),
      website: faker.helpers.maybe(() => faker.internet.url(), {
        probability: 0.3,
      }),
      installationTypeId: null, // Will be provided by the seeder or test
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
