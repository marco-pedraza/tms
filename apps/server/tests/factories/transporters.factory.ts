import { defineFactory } from '@praha/drizzle-factory';
import { extractTablesFromSchema } from './factory-utils';
import { schema } from '../../db';
import { cityFactory } from './city.factory';
import { ID_OFFSET } from './constants';

export const transporterFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'transporters',
  resolver: ({ sequence, use }) => ({
    id: sequence + ID_OFFSET,
    name: `Transporter ${sequence + ID_OFFSET}`,
    code: `TR${sequence + ID_OFFSET}`,
    description: `Description for transporter ${sequence + ID_OFFSET}`,
    website: `https://transporter${sequence + ID_OFFSET}.com`,
    email: `transporter${sequence + ID_OFFSET}@example.com`,
    phone: `+123456789${sequence + ID_OFFSET}`,
    headquarterCityId: () =>
      use(cityFactory)
        .create()
        .then((city) => city.id),
    logoUrl: `https://dummyimage.com/200x100/0066cc/ffffff.png&text=Transporter+${sequence + ID_OFFSET}`,
    contactInfo: `Contact info for transporter ${sequence + ID_OFFSET}`,
    licenseNumber: `LIC${sequence + ID_OFFSET}`,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
});
