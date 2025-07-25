import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import {
  extractTablesFromSchema,
  generateAlphabeticCode,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

export const transporterFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'transporters',
  resolver: () => {
    const id = generateId();
    return {
      id,
      name: generateAlphabeticName('Transporter'),
      code: generateAlphabeticCode(4, 'TR'), // Generate unique 4-letter code with TR prefix
      active: true,
    };
  },
});
