import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { extractTablesFromSchema, generateId } from './factory-utils';

export const installationSchemaFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'installationSchemas',
  resolver: ({ sequence }) => {
    const id = generateId(sequence);
    const fieldTypes = [
      'string',
      'long_text',
      'number',
      'boolean',
      'date',
      'enum',
    ];
    const fieldType = faker.helpers.arrayElement(fieldTypes);

    // Generate appropriate options based on field type
    let options = {};
    if (fieldType === 'enum') {
      options = {
        enumValues: [
          `Option ${sequence}A`,
          `Option ${sequence}B`,
          `Option ${sequence}C`,
        ],
      };
    }

    return {
      id,
      name: `field_${id}`,
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
