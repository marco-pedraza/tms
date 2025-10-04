import { schema } from '@/db';
import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import {
  extractTablesFromSchema,
  generateAlphabeticCode,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

/**
 * Factory for creating department test data
 */
export const departmentFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'departments',
  resolver: () => {
    const id = generateId();
    return {
      id,
      name: generateAlphabeticName('Department'),
      code: generateAlphabeticCode(6),
      description: faker.lorem.sentence(),
      isActive: true,
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
