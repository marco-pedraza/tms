import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { extractTablesFromSchema, generateId } from './factory-utils';
import { serviceTypeFactory } from './service-type.factory';
import { transporterFactory } from './transporters.factory';

export const busLineFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'busLines',
  resolver: ({ sequence, use }) => {
    const id = generateId(sequence);
    return {
      id,
      name: `Bus Line ${id}`,
      code: `BL${id}`,
      transporterId: () =>
        use(transporterFactory)
          .create()
          .then((t) => t.id ?? generateId()),
      serviceTypeId: () =>
        use(serviceTypeFactory)
          .create()
          .then((s) => s.id ?? generateId()),
      description: `Description for bus line ${id}`,
      logoUrl: `https://placehold.co/300x150/${sequence % 2 ? 'FF0000' : '00CC00'}/FFFFFF.png?text=Bus+Line+${id}`,
      primaryColor: '#0077CC',
      secondaryColor: '#FFCC00',
      active: true,
    };
  },
});
