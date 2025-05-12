import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { ID_OFFSET } from './constants';
import { countryFactory } from './country.factory';
import { extractTablesFromSchema } from './factory-utils';

export const stateFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'states',
  resolver: ({ sequence, use }) => ({
    id: sequence + ID_OFFSET,
    name: `State ${sequence + ID_OFFSET}`,
    code: `ST${sequence + ID_OFFSET}`,
    countryId: () =>
      use(countryFactory)
        .create()
        .then((country) => country.id),
    active: true,
  }),
});
