import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import {
  AmenityCategory,
  AmenityType,
} from '@/inventory/shared-entities/amenities/amenities.types';
import { schema } from '../../db';
import {
  extractTablesFromSchema,
  generateAlphabeticName,
} from './factory-utils';

export const amenityFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'amenities',
  resolver: () => {
    const amenityType = faker.helpers.arrayElement(Object.values(AmenityType));
    const category = faker.helpers.arrayElement(Object.values(AmenityCategory));

    return {
      // Remove manual ID generation - let PostgreSQL bigserial handle it
      name: generateAlphabeticName(
        `${category.charAt(0).toUpperCase() + category.slice(1)} Amenity`,
      ),
      category,
      amenityType,
      description: faker.helpers.maybe(() => faker.lorem.sentence(), {
        probability: 0.7,
      }),
      iconName: faker.helpers.maybe(
        () =>
          faker.helpers.arrayElement([
            'wifi',
            'tv',
            'air-vent',
            'bath',
            'coffee',
            'accessibility',
            'usb',
            'battery',
            'bluetooth',
            'lamp',
            'armchair',
            'shield',
            'camera',
            'info',
            'users',
            'package',
            'credit-card',
            'home',
            'car',
            'video',
          ]),
        { probability: 0.8 },
      ),
      active: faker.helpers.arrayElement([true, true, true, false]), // 75% active
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
