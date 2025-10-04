import { schema } from '@/db';
import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import {
  generateAlphabeticCode,
  generateE164Phone,
  generateId,
} from './factory-utils';
import { extractTablesFromSchema } from './factory-utils';

/**
 * Factory for creating user test data
 */
export const userFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'users',
  resolver: () => {
    const id = generateId();

    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    return {
      id,
      username: faker.internet
        .username({
          firstName,
          lastName,
        })
        .toLowerCase(),
      email: faker.internet.email().toLowerCase(),
      passwordHash:
        '$2a$10$cTLxwk5De44nDMYW9Cu3kufkS1BRRZCY36ySNS0NqTNGHEncY38AK', // "pass" hash
      firstName,
      lastName,
      phone: generateE164Phone('52', 10), // Mexico phone numbers
      position: faker.person.jobTitle(),
      employeeId: generateAlphabeticCode(8),
      mfaSettings: null,
      lastLogin: null,
      active: faker.datatype.boolean(0.5),
      isSystemAdmin: faker.datatype.boolean(0.5),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
