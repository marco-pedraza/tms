import { fakerES_MX as faker } from '@faker-js/faker';
import type { EventType } from '@/inventory/locations/event-types/event-types.types';
import type { InstallationProperty } from '@/inventory/locations/installation-properties/installation-properties.types';
import type { InstallationSchema } from '@/inventory/locations/installation-schemas/installation-schemas.types';
import type { InstallationType } from '@/inventory/locations/installation-types/installation-types.types';
import type { Installation } from '@/inventory/locations/installations/installations.types';
import {
  eventTypeInstallationTypeFactory,
  installationFactory,
  installationPropertyFactory,
  installationSchemaFactory,
  installationTypeFactory,
} from '@/tests/factories';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FactoryDb = any;

// Installation Types Seed Data
const INSTALLATION_TYPES_DATA = [
  {
    name: 'Terminal de Pasajeros',
    code: 'TERMINAL',
    description:
      'Terminal principal para el embarque y desembarque de pasajeros',
  },
  {
    name: 'Parada de Autobús',
    code: 'PARADA',
    description: 'Punto de parada intermedio durante la ruta',
  },
  {
    name: 'Centro de Mantenimiento',
    code: 'MANTEN',
    description: 'Instalación para mantenimiento y revisión de vehículos',
  },
  {
    name: 'Oficina Administrativa',
    code: 'OFICINA',
    description: 'Instalación administrativa y de gestión',
  },
  {
    name: 'Estación de Combustible',
    code: 'COMBUST',
    description: 'Estación para reabastecimiento de combustible',
  },
  {
    name: 'Punto de Control',
    code: 'CONTROL',
    description: 'Punto de control y monitoreo de rutas',
  },
  {
    name: 'Centro de Distribución',
    code: 'DISTRIB',
    description: 'Centro para distribución y logística',
  },
  {
    name: 'Zona de Descanso',
    code: 'DESCANSO',
    description: 'Área de descanso para conductores y personal',
  },
] as const;

// Event Type - Installation Type Mapping
const EVENT_INSTALLATION_MAPPING = {
  TERMINAL: [
    'LLEGADA',
    'SALIDA',
    'EQUIPAJE',
    'LIMPIEZA',
    'DOCUMENTOS',
    'GPS_SYNC',
    'AUTO_REPORT',
  ],
  PARADA: ['PARADA', 'GPS_SYNC', 'AUTO_REPORT'],
  MANTEN: ['MANTEN', 'REVISION', 'LIMPIEZA', 'GPS_SYNC', 'AUTO_REPORT'],
  OFICINA: ['DOCUMENTOS', 'AUTO_REPORT'],
  COMBUST: ['COMBUSTIBLE', 'GPS_SYNC', 'AUTO_REPORT'],
  CONTROL: ['DOCUMENTOS', 'CAMBIO_CONDUCTOR', 'GPS_SYNC', 'AUTO_REPORT'],
  DISTRIB: ['EQUIPAJE', 'LIMPIEZA', 'GPS_SYNC', 'AUTO_REPORT'],
  DESCANSO: ['CAMBIO_CONDUCTOR', 'LIMPIEZA', 'GPS_SYNC', 'AUTO_REPORT'],
} as const;

/**
 * Schema Builders - Functions to create schema configurations for specific installation types
 */
function createTerminalSchemas(installationTypeId: number) {
  return [
    {
      name: 'capacity',
      description: 'Número máximo de pasajeros que puede atender',
      type: 'number',
      options: {},
      required: true,
      installationTypeId,
    },
    {
      name: 'platforms',
      description: 'Cantidad de plataformas de abordaje',
      type: 'number',
      options: {},
      required: true,
      installationTypeId,
    },
    {
      name: 'services',
      description: 'Servicios adicionales en el terminal',
      type: 'enum',
      options: {
        enumValues: [
          'Cafetería',
          'Baños',
          'WiFi',
          'Sala de Espera',
          'Información',
        ],
      },
      required: false,
      installationTypeId,
    },
  ];
}

function createParadaSchemas(installationTypeId: number) {
  return [
    {
      name: 'bench_capacity',
      description: 'Número de personas que pueden sentarse',
      type: 'number',
      options: {},
      required: false,
      installationTypeId,
    },
  ];
}

function createMantenSchemas(installationTypeId: number) {
  return [
    {
      name: 'service_bays',
      description: 'Número de bahías para mantenimiento',
      type: 'number',
      options: {},
      required: true,
      installationTypeId,
    },
    {
      name: 'equipment',
      description: 'Tipo de equipo de mantenimiento',
      type: 'enum',
      options: {
        enumValues: [
          'Elevador',
          'Fosa',
          'Compresor',
          'Soldadora',
          'Herramientas',
        ],
      },
      required: false,
      installationTypeId,
    },
  ];
}

function createOficinaSchemas(installationTypeId: number) {
  return [
    {
      name: 'office_area',
      description: 'Área total de la oficina en metros cuadrados',
      type: 'number',
      options: {},
      required: true,
      installationTypeId,
    },
    {
      name: 'departments',
      description: 'Departamentos que operan en la oficina',
      type: 'enum',
      options: {
        enumValues: [
          'Administración',
          'Recursos Humanos',
          'Finanzas',
          'Operaciones',
          'Ventas',
        ],
      },
      required: false,
      installationTypeId,
    },
  ];
}

function createGenericSchemas(installationTypeId: number) {
  return [
    {
      name: 'operating_hours',
      description: 'Horario en que opera la instalación',
      type: 'string',
      options: {},
      required: false,
      installationTypeId,
    },
    {
      name: 'contact_person',
      description: 'Nombre de la persona responsable',
      type: 'string',
      options: {},
      required: false,
      installationTypeId,
    },
  ];
}

/**
 * Schema builders mapping
 */
const SCHEMA_BUILDERS = {
  TERMINAL: createTerminalSchemas,
  PARADA: createParadaSchemas,
  MANTEN: createMantenSchemas,
  OFICINA: createOficinaSchemas,
} as const;

/**
 * Value generators for different schema types and field names
 */
const VALUE_GENERATORS = {
  number: {
    capacity: () => faker.number.int({ min: 50, max: 500 }).toString(),
    platforms: () => faker.number.int({ min: 2, max: 12 }).toString(),
    bench_capacity: () => faker.number.int({ min: 5, max: 20 }).toString(),
    service_bays: () => faker.number.int({ min: 2, max: 8 }).toString(),
    office_area: () => faker.number.int({ min: 100, max: 1000 }).toString(),
    default: () => faker.number.int({ min: 1, max: 100 }).toString(),
  },
  string: {
    operating_hours: () => '06:00 - 22:00',
    contact_person: () => faker.person.fullName(),
    default: () => faker.lorem.words(3),
  },
  boolean: () => faker.datatype.boolean().toString(),
  date: () => faker.date.recent().toISOString().split('T')[0],
  long_text: () => faker.lorem.paragraph(),
  enum: (enumValues: string[]) => {
    return enumValues.length > 0
      ? faker.helpers.arrayElement(enumValues)
      : 'Default Value';
  },
} as const;

/**
 * Generate a value for an installation property based on schema type and name
 */
function generatePropertyValue(schema: InstallationSchema): string {
  const { type, name, options } = schema;

  switch (type) {
    case 'number': {
      const generator =
        VALUE_GENERATORS.number[name as keyof typeof VALUE_GENERATORS.number] ||
        VALUE_GENERATORS.number.default;
      return generator();
    }

    case 'string': {
      const generator =
        VALUE_GENERATORS.string[name as keyof typeof VALUE_GENERATORS.string] ||
        VALUE_GENERATORS.string.default;
      return generator();
    }

    case 'boolean':
      return VALUE_GENERATORS.boolean();

    case 'date':
      return VALUE_GENERATORS.date();

    case 'long_text':
      return VALUE_GENERATORS.long_text();

    case 'enum':
      return VALUE_GENERATORS.enum(options?.enumValues ?? []);

    default:
      return faker.lorem.words(3);
  }
}

/**
 * Seeds installation types
 */
export async function seedInstallationTypes(
  factoryDb: FactoryDb,
): Promise<InstallationType[]> {
  const installationTypes = (await installationTypeFactory(factoryDb).create(
    INSTALLATION_TYPES_DATA,
  )) as InstallationType[];

  console.log(`Seeded ${installationTypes.length} installation types`);
  return installationTypes;
}

/**
 * Seeds installation schemas for the given installation types
 */
export async function seedInstallationSchemas(
  installationTypes: InstallationType[],
  factoryDb: FactoryDb,
): Promise<InstallationSchema[]> {
  const schemaPayloads = [];

  for (const installationType of installationTypes) {
    const schemaBuilder =
      SCHEMA_BUILDERS[installationType.code as keyof typeof SCHEMA_BUILDERS];

    if (schemaBuilder) {
      // Use specific schema builder for this installation type
      schemaPayloads.push(...schemaBuilder(installationType.id));
    } else {
      // Use generic schemas for other installation types
      schemaPayloads.push(...createGenericSchemas(installationType.id));
    }
  }

  const installationSchemas = (await installationSchemaFactory(
    factoryDb,
  ).create(schemaPayloads)) as InstallationSchema[];

  console.log(`Seeded ${installationSchemas.length} installation schemas`);
  return installationSchemas;
}

/**
 * Seeds event type - installation type associations
 */
export async function seedEventTypeInstallationTypes(
  eventTypes: EventType[],
  installationTypes: InstallationType[],
  factoryDb: FactoryDb,
): Promise<void> {
  const associations = [];

  for (const installationType of installationTypes) {
    const eventCodes =
      EVENT_INSTALLATION_MAPPING[
        installationType.code as keyof typeof EVENT_INSTALLATION_MAPPING
      ] || [];

    for (const eventCode of eventCodes) {
      const eventType = eventTypes.find((et) => et.code === eventCode);
      if (eventType) {
        associations.push({
          eventTypeId: eventType.id,
          installationTypeId: installationType.id,
        });
      }
    }
  }

  await eventTypeInstallationTypeFactory(factoryDb).create(associations);
  console.log(
    `Seeded ${associations.length} event type - installation type associations`,
  );
}

/**
 * Seeds installations
 */
export async function seedInstallations(
  installationTypes: InstallationType[],
  factoryDb: FactoryDb,
): Promise<Installation[]> {
  const INSTALLATION_COUNT = 8;

  const installationPayloads = Array.from(
    { length: INSTALLATION_COUNT },
    (_, index) => {
      // Assign installation types cyclically to ensure we have examples of each type
      const installationType =
        installationTypes[index % installationTypes.length];

      return {
        installationTypeId: installationType.id,
        deletedAt: null,
      };
    },
  );

  const installations = (await installationFactory(factoryDb).create(
    installationPayloads,
  )) as Installation[];

  console.log(
    `Seeded ${installations.length} installations with types assigned`,
  );
  return installations;
}

/**
 * Seeds installation properties based on installations and schemas
 */
export async function seedInstallationProperties(
  installations: Installation[],
  installationSchemas: InstallationSchema[],
  factoryDb: FactoryDb,
): Promise<InstallationProperty[]> {
  const propertyPayloads = [];

  for (const installation of installations) {
    // Find schemas for this installation's type
    const relevantSchemas = installationSchemas.filter(
      (schema) => schema.installationTypeId === installation.installationTypeId,
    );

    for (const schema of relevantSchemas) {
      const value = generatePropertyValue(schema);

      propertyPayloads.push({
        value,
        installationId: installation.id,
        installationSchemaId: schema.id,
      });
    }
  }

  const installationProperties = (await installationPropertyFactory(
    factoryDb,
  ).create(propertyPayloads)) as InstallationProperty[];

  console.log(
    `Seeded ${installationProperties.length} installation properties`,
  );
  return installationProperties;
}
