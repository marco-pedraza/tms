import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { cityFactory } from './city.factory';
import { extractTablesFromSchema, generateId } from './factory-utils';

export const transporterFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'transporters',
  resolver: ({ sequence, use }) => {
    const id = generateId(sequence);
    return {
      id,
      name: `Transporter ${id}`,
      code: `TR${id % 99999999}`, // Limit to 8 digits max for varchar(10)
      description: `Description for transporter ${id}`,
      website: `https://transporter${id}.com`,
      email: `transporter${id}@example.com`,
      phone: `+123456789${id}`,
      headquarterCityId: () =>
        use(cityFactory)
          .create()
          .then((city) => city.id),
      logoUrl: `https://dummyimage.com/200x100/0066cc/ffffff.png&text=Transporter+${id}`,
      contactInfo: `Contact info for transporter ${id}`,
      licenseNumber: `LIC${id}`,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
});
