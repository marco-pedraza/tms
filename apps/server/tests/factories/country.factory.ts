import { defineFactory } from '@praha/drizzle-factory';
import { extractTablesFromSchema } from './factory-utils';
import { schema } from '../../db';
import { ID_OFFSET } from './constants';

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
