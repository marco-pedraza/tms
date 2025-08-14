import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { eventTypeFactory } from './event-types.factory';
import { extractTablesFromSchema } from './factory-utils';
import { installationTypeFactory } from './installation-types.factory';

export const eventTypeInstallationTypeFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'eventTypeInstallationTypes',
  resolver: ({ use }) => {
    return {
      // Remove manual ID generation - let PostgreSQL bigserial handle it
      eventTypeId: () =>
        use(eventTypeFactory)
          .create()
          .then((eventType) => eventType.id),
      installationTypeId: () =>
        use(installationTypeFactory)
          .create()
          .then((installationType) => installationType.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
});
