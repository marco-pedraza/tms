import { fakerES_MX as faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import {
  extractTablesFromSchema,
  generateE164Phone,
  generateId,
} from './factory-utils';

export const driverFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'drivers',
  resolver: ({ sequence }) => {
    const id = generateId(sequence);
    const driverStatuses = [
      'active',
      'inactive',
      'suspended',
      'on_leave',
      'terminated',
      'in_training',
      'probation',
    ];

    return {
      id,
      driverKey: `DRV${String(id).padStart(3, '0')}`,
      payrollKey: `PAY${String(id).padStart(3, '0')}`,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),

      address: `${faker.location.streetAddress(true)}, ${faker.location.county()}, ${faker.location.city()}, ${faker.location.state()} ${faker.location.zipCode('#####')}`,
      phone: faker.helpers.maybe(() => generateE164Phone('52', 10), {
        probability: 0.6,
      }),
      email: faker.helpers.maybe(() => faker.internet.email(), {
        probability: 0.6,
      }),
      ...faker.helpers.maybe(
        () => ({
          emergencyContactName: faker.person.fullName(),
          emergencyContactPhone: generateE164Phone('52', 10),
          emergencyContactRelationship: faker.helpers.arrayElement([
            'Padre',
            'Madre',
            'Esposo(a)',
            'Hijo(a)',
            'Hermano(a)',
            'Primo(a)',
            'Amigo(a)',
            'Vecino(a)',
          ]),
        }),
        {
          probability: 0.6,
        },
      ),

      hireDate: faker.helpers.maybe(() => faker.date.past({ years: 7 }), {
        probability: 0.6,
      }),
      status: faker.helpers.arrayElement(driverStatuses),
      statusDate: faker.date.recent({ days: 365 }),
      license: `LIC${faker.string.alphanumeric(5).toUpperCase()}`,
      licenseExpiry: faker.date.future({ years: 3 }),

      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
