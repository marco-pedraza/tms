import { faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { extractTablesFromSchema, generateId } from './factory-utils';

export const labelFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'labels',
  resolver: ({ sequence }) => {
    const id = generateId(sequence);
    const colors = [
      '#FF0000',
      '#0F0',
      '#00F',
      '#FFFF00',
      '#FF00FF',
      '#00FFFF',
      '#FFA500',
      '#800080',
      '#FFC0CB',
      '#A52A2A',
      '#808080',
      '#000000',
    ];

    return {
      id,
      name: faker.word.adjective() + ' ' + faker.word.adjective(),
      description: faker.helpers.maybe(() => faker.lorem.sentence(), {
        probability: 0.7,
      }),
      color: faker.helpers.arrayElement(colors),
      active: faker.datatype.boolean(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.1,
      }),
    };
  },
});
