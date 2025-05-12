import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { transporterFactory } from './transporters.factory';
import { serviceTypeFactory } from './service-type.factory';
import { ID_OFFSET } from './constants';
import { extractTablesFromSchema } from './factory-utils';

export const busLineFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'busLines',
  resolver: ({ sequence, use }) => ({
    id: sequence + ID_OFFSET,
    name: `Bus Line ${sequence + ID_OFFSET}`,
    code: `BL${sequence + ID_OFFSET}`,
    transporterId: () =>
      use(transporterFactory)
        .create()
        .then((t) => t.id ?? ID_OFFSET),
    serviceTypeId: () =>
      use(serviceTypeFactory)
        .create()
        .then((s) => s.id ?? ID_OFFSET),
    description: `Description for bus line ${sequence + ID_OFFSET}`,
    logoUrl: `https://placehold.co/300x150/${sequence % 2 ? 'FF0000' : '00CC00'}/FFFFFF.png?text=Bus+Line+${sequence + ID_OFFSET}`,
    primaryColor: '#0077CC',
    secondaryColor: '#FFCC00',
    active: true,
  }),
});
