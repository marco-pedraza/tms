import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { extractTablesFromSchema, generateId } from './factory-utils';

export const serviceTypeFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'serviceTypes',
  resolver: ({ sequence }) => {
    const id = generateId(sequence);
    return {
      id,
      name: `Service Type ${id}`,
      description: `Description for service type ${id}`,
      active: true,
    };
  },
});
