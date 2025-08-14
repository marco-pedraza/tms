import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import {
  extractTablesFromSchema,
  generateAlphabeticName,
} from './factory-utils';

export const eventTypeFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'eventTypes',
  resolver: () => {
    return {
      // Remove manual ID generation - let PostgreSQL bigserial handle it
      name: generateAlphabeticName('Event Type'),
      active: true,
    };
  },
});
