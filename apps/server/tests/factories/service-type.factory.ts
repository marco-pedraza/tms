import { schema } from '@/db';
import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import {
  extractTablesFromSchema,
  generateAlphabeticCode,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

export const serviceTypeFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'serviceTypes',
  resolver: () => {
    const id = generateId();
    return {
      id,
      name: generateAlphabeticName('Service Type'),
      code: generateAlphabeticCode(4, 'ST'),
      description: faker.helpers.maybe(() => faker.lorem.sentence(), {
        probability: 0.7,
      }),
      active: faker.helpers.arrayElement([true, true, true, false]), // 75% active
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
