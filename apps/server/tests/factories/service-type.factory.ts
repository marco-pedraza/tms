import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { ID_OFFSET } from './constants';
import { extractTablesFromSchema } from './factory-utils';

export const serviceTypeFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'serviceTypes',
  resolver: ({ sequence }) => ({
    id: sequence + ID_OFFSET,
    name: `Service Type ${sequence + ID_OFFSET}`,
    description: `Description for service type ${sequence + ID_OFFSET}`,
    active: true,
  }),
});
