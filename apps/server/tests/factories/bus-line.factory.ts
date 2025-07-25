import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import {
  extractTablesFromSchema,
  generateAlphabeticCode,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

export const busLineFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'busLines',
  resolver: () => {
    const id = generateId();

    return {
      id,
      name: generateAlphabeticName('Bus Line'),
      code: generateAlphabeticCode(6, 'BL'),
      active: true,
    };
  },
});
