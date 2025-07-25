import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import {
  extractTablesFromSchema,
  generateAlphabeticName,
  generateId,
} from './factory-utils';

export const installationTypeFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'installationTypes',
  resolver: () => {
    const id = generateId();

    return {
      id,
      name: generateAlphabeticName('Installation Type'),
      active: true,
    };
  },
});
