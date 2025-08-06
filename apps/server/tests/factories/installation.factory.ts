import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import {
  extractTablesFromSchema,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

// Helper function to generate realistic operating hours
function generateOperatingHours() {
  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  // Common business hours patterns
  const patterns = [
    // Standard business hours (Mon-Fri: 9-17, Sat: 9-13)
    {
      weekdays: [{ open: '09:00', close: '17:00' }],
      saturday: [{ open: '09:00', close: '13:00' }],
    },
    // Extended hours (Mon-Fri: 8-18, Sat: 8-16, Sun: 10-14)
    {
      weekdays: [{ open: '08:00', close: '18:00' }],
      saturday: [{ open: '08:00', close: '16:00' }],
      sunday: [{ open: '10:00', close: '14:00' }],
    },
    // 24/7 operation
    {
      weekdays: [{ open: '00:00', close: '23:59' }],
      saturday: [{ open: '00:00', close: '23:59' }],
      sunday: [{ open: '00:00', close: '23:59' }],
    },
    // Night shift (Mon-Fri: 22-06)
    {
      weekdays: [{ open: '22:00', close: '06:00' }],
    },
    // Multiple time slots format (new format)
    {
      weekdays: [
        { open: '09:00', close: '12:00' },
        { open: '13:00', close: '17:00' },
      ],
      saturday: [{ open: '09:00', close: '13:00' }],
    },
  ];

  const pattern = faker.helpers.arrayElement(patterns);
  // Remove 0-2 days from the days array
  const daysToRemove = faker.helpers.arrayElements(days, { min: 0, max: 2 });

  const operatingHours: Record<
    string,
    { open: string; close: string } | { open: string; close: string }[]
  > = {};
  for (const day of days) {
    if (daysToRemove.includes(day)) continue;
    let dayHours;
    if (day === 'saturday') {
      dayHours = pattern.saturday;
    } else if (day === 'sunday') {
      dayHours = pattern.sunday;
    } else {
      dayHours = pattern.weekdays;
    }

    if (dayHours !== undefined) {
      operatingHours[day] = dayHours;
    }
  }

  return operatingHours;
}

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
      operatingHours: faker.helpers.maybe(() => generateOperatingHours(), {
        probability: 0.8, // 80% chance of having operating hours
      }),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
