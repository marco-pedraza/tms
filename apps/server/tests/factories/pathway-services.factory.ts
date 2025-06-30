import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { extractTablesFromSchema, generateId } from './factory-utils';

export const pathwayServicesFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'pathwayServices',
  resolver: ({ sequence }) => {
    const id = generateId(sequence);
    return {
      id,
      name: `Pathway Service ${id}`,
      serviceType: `Type${(sequence % 3) + 1}`,
      latitude: 19.4 + sequence * 0.01,
      longitude: -99.1 + sequence * 0.01,
      category: `Category${(sequence % 5) + 1}`,
      provider: `Provider${(sequence % 4) + 1}`,
      providerScheduleHours: { mon: '08:00-18:00', tue: '08:00-18:00' },
      duration: 20,
    };
  },
});
