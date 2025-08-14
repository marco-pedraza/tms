import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import {
  extractTablesFromSchema,
  generateAlphabeticCode,
  generateAlphabeticName,
  generateE164Phone,
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
      description: faker.helpers.maybe(() => faker.lorem.sentence(), {
        probability: 0.7,
      }),
      pricePerKilometer: faker.number.float({
        min: 1.0,
        max: 100.0,
        fractionDigits: 2,
      }),
      fleetSize: faker.helpers.maybe(
        () => faker.number.int({ min: 10, max: 1000 }),
        { probability: 0.5 },
      ),
      website: faker.helpers.maybe(() => faker.internet.url(), {
        probability: 0.5,
      }),
      email: faker.helpers.maybe(() => faker.internet.email(), {
        probability: 0.5,
      }),
      phone: faker.helpers.maybe(() => generateE164Phone('52', 10), {
        probability: 0.5,
      }),
      active: faker.helpers.arrayElement([true, true, true, false]), // 75% active
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
