import { defineFactory } from '@praha/drizzle-factory';
import { extractTablesFromSchema } from './factory-utils';
import { schema } from '../../db';
import { countryFactory } from './country.factory';
import { ID_OFFSET } from './constants';

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
