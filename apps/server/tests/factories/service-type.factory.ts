import { defineFactory } from '@praha/drizzle-factory';
import { serviceTypes } from '../../db/schema';
import { ID_OFFSET } from './constants';

export const serviceTypeFactory = defineFactory({
  schema: { serviceTypes },
  table: 'serviceTypes',
  resolver: ({ sequence }) => ({
    id: sequence + ID_OFFSET,
    name: `Service Type ${sequence + ID_OFFSET}`,
    description: `Description for service type ${sequence + ID_OFFSET}`,
    active: true,
  }),
});
