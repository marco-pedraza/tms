import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { cityFactory } from './city.factory';
import { ID_OFFSET } from './constants';
import { extractTablesFromSchema } from './factory-utils';

export const terminalFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'terminals',
  resolver: ({ sequence, use }) => ({
    id: sequence + ID_OFFSET,
    name: `Terminal ${sequence + ID_OFFSET}`,
    address: `Address ${sequence + ID_OFFSET}`,
    cityId: () =>
      use(cityFactory)
        .create()
        .then((city) => city.id),
    latitude: 37.774929 + sequence,
    longitude: -122.419418 + sequence,
    contactphone: `+123456789${sequence + ID_OFFSET}`,
    operatingHours: { open: '08:00', close: '20:00' },
    facilities: { wifi: true, parking: true },
    code: `TRM${sequence + ID_OFFSET}`,
    slug: `t-terminal-${sequence + ID_OFFSET}`,
    active: true,
  }),
});
