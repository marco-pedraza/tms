import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { extractTablesFromSchema, generateId } from './factory-utils';
import { installationSchemaFactory } from './installation-schemas.factory';
import { installationFactory } from './installation.factory';

export const installationPropertyFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'installationProperties',
  resolver: ({ sequence, use }) => {
    const id = generateId(sequence);

    return {
      id,
      value: `Property Value ${id}`,
      installationId: () =>
        use(installationFactory)
          .create()
          .then((installation) => installation.id),
      installationSchemaId: () =>
        use(installationSchemaFactory)
          .create()
          .then((schema) => schema.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
});
