import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { AVAILABLE_FACILITIES } from '../../inventory/facilities/facilities.constants';
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
    operatingHours: {
      monday: { open: '08:00', close: '20:00' },
      tuesday: { open: '08:00', close: '20:00' },
      wednesday: { open: '08:00', close: '20:00' },
      thursday: { open: '08:00', close: '20:00' },
      friday: { open: '08:00', close: '20:00' },
      saturday: { open: '08:00', close: '20:00' },
      sunday: { open: '08:00', close: '20:00' },
    },
    facilities: () => {
      const facilities = AVAILABLE_FACILITIES;
      const count = Math.floor(Math.random() * 4) + 2; // Random number between 2-5
      const shuffled = facilities.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    },
    code: `TRM${sequence + ID_OFFSET}`,
    slug: `t-terminal-${sequence + ID_OFFSET}`,
    active: true,
  }),
});
