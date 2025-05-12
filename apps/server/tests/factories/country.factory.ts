import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { ID_OFFSET } from './constants';
import { extractTablesFromSchema } from './factory-utils';

export const countryFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'countries',
  resolver: ({ sequence }) => ({
    id: sequence + ID_OFFSET,
    name: `Country ${sequence + ID_OFFSET}`,
    code: `CC${sequence + ID_OFFSET}`,
    active: true,
  }),
});
