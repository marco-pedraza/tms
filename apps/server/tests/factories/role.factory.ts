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
 * Factory for creating role test data
 */
export const roleFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'roles',
  resolver: () => {
    const id = generateId();
    return {
      id,
      code: generateAlphabeticCode(4),
      name: generateAlphabeticName('Role'),
      description: faker.lorem.sentence(),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
