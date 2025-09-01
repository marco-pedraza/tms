import { fakerES_MX as faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { extractTablesFromSchema, generateId } from './factory-utils';

export const timeOffFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'driverTimeOffs',
  resolver: ({ sequence }) => {
    const id = generateId(sequence);
    const timeOffTypes = [
      'VACATION',
      'LEAVE',
      'SICK_LEAVE',
      'PERSONAL_DAY',
      'OTHER',
    ];

    // Simple solution: each time-off starts on a different day
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + sequence * 7); // Each time-off starts 7 days apart

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 2); // Always 3 days duration

    return {
      id,
      driverId: 0, // Will be set when creating
      startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      endDate: endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      type: faker.helpers.arrayElement(timeOffTypes),
      reason: faker.helpers.maybe(() => faker.lorem.sentence(), {
        probability: 0.7,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
  },
});
