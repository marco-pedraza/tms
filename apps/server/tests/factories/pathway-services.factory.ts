import { defineFactory } from '@praha/drizzle-factory';
import { extractTablesFromSchema } from './factory-utils';
import { schema } from '../../db';
import { ID_OFFSET } from './constants';

export const pathwayServicesFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'pathwayServices',
  resolver: ({ sequence }) => ({
    id: sequence + ID_OFFSET,
    name: `Pathway Service ${sequence + ID_OFFSET}`,
    serviceType: `Type${(sequence % 3) + 1}`,
    latitude: 19.4 + sequence * 0.01,
    longitude: -99.1 + sequence * 0.01,
    category: `Category${(sequence % 5) + 1}`,
    provider: `Provider${(sequence % 4) + 1}`,
    providerScheduleHours: { mon: '08:00-18:00', tue: '08:00-18:00' },
    duration: 20,
  }),
});
