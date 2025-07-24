import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { eventTypeFactory } from './event-types.factory';
import { extractTablesFromSchema, generateId } from './factory-utils';
import { installationTypeFactory } from './installation-types.factory';

export const eventTypeInstallationTypeFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'eventTypeInstallationTypes',
  resolver: ({ sequence, use }) => {
    const id = generateId(sequence);

    return {
      id,
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
