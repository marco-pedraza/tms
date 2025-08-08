import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import {
  extractTablesFromSchema,
  generateAlphabeticCode,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

export const busLineFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'busLines',
  resolver: ({ sequence }) => {
    const id = generateId(sequence);

    return {
      id,
      name: generateAlphabeticName('Bus Line'),
      code: generateAlphabeticCode(6, 'BL'),
      pricePerKilometer: faker.number.int({ min: 1, max: 10 }),
      fleetSize: faker.number.int({ min: 1, max: 100 }),
      website: faker.internet.url(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      active: faker.helpers.arrayElement([true, true, true, false]), // 75% active
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
