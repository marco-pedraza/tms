import { fakerES_MX as faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import {
  MedicalCheckResult,
  MedicalCheckSource,
} from '@/inventory/fleet/drivers/medical-checks/medical-checks.types';
import { schema } from '../../db';
import { extractTablesFromSchema, generateId } from './factory-utils';

export const medicalCheckFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'driverMedicalChecks',
  resolver: ({ sequence }) => {
    const id = generateId(sequence);

    // Generate a check date within the last year
    const checkDate = faker.date.past({ years: 1 });

    // Days until next check: 30, 90, 180, or 365 days
    const daysUntilNextCheck = faker.helpers.arrayElement([30, 90, 180, 365]);

    // Calculate next check date
    const nextCheckDate = new Date(checkDate);
    nextCheckDate.setDate(checkDate.getDate() + daysUntilNextCheck);

    const results = Object.values(MedicalCheckResult);

    return {
      id,
      driverId: 0, // Will be set when creating
      checkDate: checkDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      nextCheckDate: nextCheckDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      daysUntilNextCheck,
      source: MedicalCheckSource.MANUAL,
      result: faker.helpers.arrayElement(results),
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), {
        probability: 0.6,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
  },
});
