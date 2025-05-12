import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { ID_OFFSET } from './constants';
import { extractTablesFromSchema } from './factory-utils';
import { stateFactory } from './state.factory';

export const cityFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'cities',
  resolver: ({ sequence, use }) => ({
    id: sequence + ID_OFFSET,
    name: `City ${sequence + ID_OFFSET}`,
    stateId: () =>
      use(stateFactory)
        .create()
        .then((state) => state.id),
    latitude: 0.0 + sequence,
    longitude: 0.0 + sequence,
    timezone: 'UTC',
    active: true,
    slug: `city-${sequence + ID_OFFSET}`,
  }),
});
