import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { extractTablesFromSchema, generateId } from './factory-utils';

export const installationFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'installations',
  resolver: ({ sequence }) => {
    const id = generateId(sequence);
    return {
      id,
      name: `Installation ${sequence}`,
      address: `${sequence} Test Street`,
      description: `Test installation ${sequence}`,
    };
  },
});
