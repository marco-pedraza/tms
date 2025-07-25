import { fakerES_MX as faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import { db } from '../../../inventory/db-service';
import { EventType } from '../../../inventory/event-types/event-types.types';
import { Node } from '../../../inventory/nodes/nodes.types';
import { eventTypeFactory, nodeEventFactory } from '../../../tests/factories';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FactoryDb = any;

// Event Types Seed Data
const EVENT_TYPES_DATA = [
  {
    name: 'Llegada a Terminal',
    code: 'LLEGADA',
    description: 'Evento de llegada del autobús a terminal',
    baseTime: 15,
    needsCost: false,
    needsQuantity: true,
    integration: false,
  },
  {
    name: 'Salida de Terminal',
    code: 'SALIDA',
    description: 'Evento de salida del autobús desde terminal',
    baseTime: 10,
    needsCost: false,
    needsQuantity: true,
    integration: false,
  },
  {
    name: 'Parada en Ruta',
    code: 'PARADA',
    description: 'Parada intermedia durante el viaje',
    baseTime: 5,
    needsCost: false,
    needsQuantity: true,
    integration: false,
  },
  {
    name: 'Mantenimiento',
    code: 'MANTEN',
    description: 'Actividad de mantenimiento del vehículo',
    baseTime: 120,
    needsCost: true,
    needsQuantity: false,
    integration: false,
  },
  {
    name: 'Carga de Combustible',
    code: 'COMBUSTIBLE',
    description: 'Reabastecimiento de combustible',
    baseTime: 20,
    needsCost: true,
    needsQuantity: true,
    integration: false,
  },
  {
    name: 'Revisión Técnica',
    code: 'REVISION',
    description: 'Inspección técnica del vehículo',
    baseTime: 60,
    needsCost: true,
    needsQuantity: false,
    integration: false,
  },
  {
    name: 'Cambio de Conductor',
    code: 'CAMBIO_CONDUCTOR',
    description: 'Relevo de conductor en punto de control',
    baseTime: 15,
    needsCost: false,
    needsQuantity: false,
    integration: false,
  },
  {
    name: 'Control de Documentos',
    code: 'DOCUMENTOS',
    description: 'Verificación de documentación',
    baseTime: 10,
    needsCost: false,
    needsQuantity: false,
    integration: false,
  },
  {
    name: 'Carga de Equipaje',
    code: 'EQUIPAJE',
    description: 'Carga y descarga de equipaje',
    baseTime: 25,
    needsCost: false,
    needsQuantity: true,
    integration: false,
  },
  {
    name: 'Limpieza',
    code: 'LIMPIEZA',
    description: 'Limpieza del vehículo',
    baseTime: 30,
    needsCost: true,
    needsQuantity: false,
    integration: false,
  },
  {
    name: 'Sincronización GPS',
    code: 'GPS_SYNC',
    description: 'Sincronización con sistema GPS',
    baseTime: 2,
    needsCost: false,
    needsQuantity: false,
    integration: true,
  },
  {
    name: 'Reporte Automático',
    code: 'AUTO_REPORT',
    description: 'Reporte automático del sistema',
    baseTime: 1,
    needsCost: false,
    needsQuantity: false,
    integration: true,
  },
] as const;

/**
 * Seeds event types
 */
export async function seedEventTypes(
  factoryDb: FactoryDb,
): Promise<EventType[]> {
  const eventTypes = (await eventTypeFactory(factoryDb).create(
    EVENT_TYPES_DATA,
  )) as EventType[];

  console.log(`Seeded ${eventTypes.length} event types`);
  return eventTypes;
}

/**
 * Seeds node events based on nodes and their installation types
 */
export async function seedNodeEvents(
  nodes: Node[],
  eventTypes: EventType[],
  factoryDb: FactoryDb,
): Promise<void> {
  const nodeEventPayloads = [];

  // Get nodes that have installations
  const nodesWithInstallations = nodes.filter(
    (node) => node.installationId !== null,
  );

  for (const node of nodesWithInstallations) {
    // Skip nodes without installation IDs
    const installationId = node.installationId;
    if (!installationId) continue;

    // Find the installation type for this node
    const installation = await db.query.installations.findFirst({
      where: (installations) => eq(installations.id, installationId),
    });

    const installationTypeId = installation?.installationTypeId;
    if (!installationTypeId) continue;

    // Find event types available for this installation type
    const availableEventTypeIds =
      await db.query.eventTypeInstallationTypes.findMany({
        where: (etit) => eq(etit.installationTypeId, installationTypeId),
        columns: { eventTypeId: true },
      });

    const availableEventTypes = eventTypes.filter((et) =>
      availableEventTypeIds.some((aet) => aet.eventTypeId === et.id),
    );

    // Create 1-3 events per node
    const eventCount = faker.number.int({ min: 1, max: 3 });
    const selectedEventTypes = faker.helpers.arrayElements(
      availableEventTypes,
      eventCount,
    );

    for (const eventType of selectedEventTypes) {
      nodeEventPayloads.push({
        nodeId: node.id,
        eventTypeId: eventType.id,
        customTime: faker.helpers.maybe(
          () => faker.number.int({ min: 5, max: 180 }),
          { probability: 0.3 },
        ),
      });
    }
  }

  if (nodeEventPayloads.length > 0) {
    await nodeEventFactory(factoryDb).create(nodeEventPayloads);
  }

  console.log(`Seeded ${nodeEventPayloads.length} node events`);
}
