import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import {
  extractTablesFromSchema,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

export const serviceTypeFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'serviceTypes',
  resolver: () => {
    const id = generateId();
    return {
      id,
      name: generateAlphabeticName('Service Type'),
      active: true,
    };
  },
});
