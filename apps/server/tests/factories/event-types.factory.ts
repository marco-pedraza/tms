import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import {
  extractTablesFromSchema,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

export const eventTypeFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'eventTypes',
  resolver: () => {
    const id = generateId();

    return {
      id,
      name: generateAlphabeticName('Event Type'),
      active: true,
    };
  },
});
