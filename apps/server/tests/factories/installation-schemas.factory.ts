import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import {
  extractTablesFromSchema,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

export const installationSchemaFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'installationSchemas',
  resolver: () => {
    const id = generateId();
    const fieldTypes = ['text', 'number', 'boolean', 'date', 'select'];
    const fieldType = faker.helpers.arrayElement(fieldTypes);

    let options: string[] | null = null;
    if (fieldType === 'select') {
      // Generate some select options
      const optionCount = faker.number.int({ min: 2, max: 5 });
      options = Array.from(
        { length: optionCount },
        (_, index) => `Option ${index + 1}`,
      );
    }

    return {
      id,
      name: generateAlphabeticName('Schema Field'),
      description: faker.helpers.maybe(() => faker.lorem.sentence(), {
        probability: 0.7,
      }),
      type: fieldType,
      options: options,
      required: faker.datatype.boolean(),
      installationTypeId: null, // Will be provided by the seeder or test
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
