import { fakerES_MX as faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import { BusLine } from '../../inventory/bus-lines/bus-lines.types';
import { BusModel } from '../../inventory/bus-models/bus-models.types';
import { Bus } from '../../inventory/buses/buses.types';
import { City } from '../../inventory/cities/cities.types';
import { Country } from '../../inventory/countries/countries.types';
import { db } from '../../inventory/db-service';
import { EventType } from '../../inventory/event-types/event-types.types';
import { InstallationProperty } from '../../inventory/installation-properties/installation-properties.types';
import { InstallationSchema } from '../../inventory/installation-schemas/installation-schemas.types';
import { InstallationType } from '../../inventory/installation-types/installation-types.types';
import { Installation } from '../../inventory/installations/installations.types';
import { labelNodes } from '../../inventory/labels/labels.schema';
import { Label } from '../../inventory/labels/labels.types';
import { Node } from '../../inventory/nodes/nodes.types';
import { populationCities } from '../../inventory/populations/populations.schema';
import { Population } from '../../inventory/populations/populations.types';
import { CreateSimpleRoutePayload } from '../../inventory/routes/routes.types';
import { routeUseCases } from '../../inventory/routes/routes.use-cases';
import { State } from '../../inventory/states/states.types';
import { Terminal } from '../../inventory/terminals/terminals.types';
import { AVAILABLE_TIMEZONES } from '../../inventory/timezones/timezones.constants';
import { Transporter } from '../../inventory/transporters/transporters.types';
import { createSlug } from '../../shared/utils';
import {
  cityFactory,
  countryFactory,
  driverFactory,
  eventTypeFactory,
  eventTypeInstallationTypeFactory,
  installationFactory,
  installationPropertyFactory,
  installationSchemaFactory,
  installationTypeFactory,
  labelFactory,
  nodeEventFactory,
  nodeFactory,
  stateFactory,
  terminalFactory,
} from '../../tests/factories';
import { busLineFactory } from '../../tests/factories/bus-line.factory';
import { busModelFactory } from '../../tests/factories/bus-models.factory';
import { busFactory } from '../../tests/factories/buses.factory';
import { getFactoryDb } from '../../tests/factories/factory-utils';
import { populationFactory } from '../../tests/factories/populations.factory';
import { seatDiagramZoneFactory } from '../../tests/factories/seat-diagram-zones.factory';
import { seatDiagramFactory } from '../../tests/factories/seat-diagrams.factory';
import { transporterFactory } from '../../tests/factories/transporters.factory';

const factoryDb = getFactoryDb(db);

/**
 * Remove duplicates from an array based on any of the provided unique key functions (OR logic).
 * If any key is duplicated, the item is removed.
 */
function removeDuplicatesByAnyKey<T>(
  array: T[],
  keyFns: Array<(item: T) => unknown>,
): T[] {
  const seenSets = keyFns.map(() => new Set<string>());
  return array.filter((item) => {
    for (let i = 0; i < keyFns.length; i++) {
      const key = String(keyFns[i](item));
      if (seenSets[i].has(key)) return false;
    }
    for (let i = 0; i < keyFns.length; i++) {
      seenSets[i].add(String(keyFns[i](item)));
    }
    return true;
  });
}

async function seedCountries(): Promise<Country[]> {
  const countries = (await countryFactory(factoryDb).create([
    {
      name: 'Mexico',
      code: 'MX',
    },
    {
      name: 'United States',
      code: 'US',
    },
    {
      name: 'Canada',
      code: 'CA',
    },
  ])) as Country[];

  console.log(`Seeded ${countries.length} countries`);

  return countries;
}

async function seedStates(parentCountry: Country) {
  const STATE_COUNT = 32;
  const rawStates = Array.from({ length: STATE_COUNT }, () => ({
    name: faker.location.state(),
    code: faker.location.state({ abbreviated: true }),
    countryId: parentCountry.id,
  }));

  // Remove duplicates by name or code
  const uniqueStates = removeDuplicatesByAnyKey(rawStates, [
    (s) => s.name,
    (s) => s.code,
  ]);

  const states = (await stateFactory(factoryDb).create(
    uniqueStates,
  )) as State[];

  console.log(`Seeded ${states.length} states`);

  return states;
}

async function seedCities(states: State[]) {
  const CITY_COUNT = 50;
  const rawCities = Array.from({ length: CITY_COUNT }, () => {
    const randomState = states[Math.floor(Math.random() * states.length)];
    const name = faker.location.city();
    const slug = createSlug(name, 'c');
    return {
      name,
      stateId: randomState.id,
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      timezone: faker.helpers.arrayElement(AVAILABLE_TIMEZONES).id,
      slug,
    };
  });

  // Remove duplicates by city name
  const uniqueCities = removeDuplicatesByAnyKey(rawCities, [
    (city) => city.name,
  ]);

  const cities = (await cityFactory(factoryDb).create(uniqueCities)) as City[];

  console.log(`Seeded ${cities.length} cities`);
  return cities;
}

async function seedTerminals(cities: City[]) {
  const TERMINAL_COUNT = 100;
  const rawTerminals = Array.from({ length: TERMINAL_COUNT }, () => {
    const randomCity = cities[Math.floor(Math.random() * cities.length)];

    const name = faker.location.city();
    const slug = createSlug(name, 't');

    return {
      name,
      slug,
      cityId: randomCity.id,
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      address: faker.location.streetAddress(),
    };
  });

  // Remove duplicates by name or code
  const uniqueTerminals = removeDuplicatesByAnyKey(rawTerminals, [
    (terminal) => terminal.name,
  ]);

  const terminals = (await terminalFactory(factoryDb).create(
    uniqueTerminals,
  )) as Terminal[];

  console.log(`Seeded ${terminals.length} terminals`);

  return terminals;
}

async function seedTransporters(cities: City[]) {
  const TRANSPORTER_COUNT = 10;
  const transporterPayloads = Array.from({ length: TRANSPORTER_COUNT }, () => ({
    headquarterCityId: cities[Math.floor(Math.random() * cities.length)].id,
  }));

  const transporters = await Promise.all(
    transporterPayloads.map(
      (payload) =>
        transporterFactory(factoryDb).create(payload) as Promise<Transporter>,
    ),
  );

  console.log(`Seeded ${transporters.length} transporters`);

  return transporters;
}

async function seedBusLines(transporters: Transporter[]) {
  const allBusLines = [];

  for (const transporter of transporters) {
    const busLineCount = Math.floor(Math.random() * 3) + 1; // 1 to 3
    const rawBusLines = await Promise.all(
      Array.from({ length: busLineCount }, () =>
        busLineFactory(factoryDb).create({ transporterId: transporter.id }),
      ),
    );
    // Remove duplicates by name and code for this transporter
    const uniqueBusLines = removeDuplicatesByAnyKey(rawBusLines, [
      (line) => line.name,
      (line) => line.code,
    ]);
    allBusLines.push(...uniqueBusLines);
  }

  console.log(`Seeded ${allBusLines.length} bus lines`);

  return allBusLines;
}

async function seedSimpleRoutes(terminals: Terminal[]) {
  // Generate simple route payloads using available terminals
  const simpleRoutePayloads: CreateSimpleRoutePayload[] = [];

  for (let i = 0; i < terminals.length - 1; i++) {
    simpleRoutePayloads.push({
      name: `Simple Route ${i + 1}`,
      description: `Auto-generated simple route ${i + 1}`,
      originTerminalId: terminals[i].id,
      destinationTerminalId: terminals[i + 1].id,
      pathwayName: `Pathway for Simple Route ${i + 1}`,
      distance: 100 + i * 10,
      typicalTime: 120 + i * 5,
      meta: { stops: 2 },
      tollRoad: false,
      active: true,
      baseTime: 110 + i * 5,
      connectionCount: 0,
      isCompound: false,
    });
  }

  const createdRoutes = [];

  for (const payload of simpleRoutePayloads) {
    const route = await routeUseCases.createSimpleRoute(payload);
    createdRoutes.push(route);
  }

  console.log(`Seeded ${createdRoutes.length} simple routes`);

  return createdRoutes;
}

async function seedCompoundRoutes(simpleRoutes: { id: number }[]) {
  // Generate multiple compound routes with different combinations
  const compoundRoutePayloads = [];
  const numCompoundRoutes = Math.max(2, Math.floor(simpleRoutes.length / 2));
  const MAX_SEGMENTS = 10;

  for (let i = 0; i < numCompoundRoutes; i++) {
    // Pick a random start index and length (at least 2, at most MAX_SEGMENTS)
    const start = Math.floor(Math.random() * (simpleRoutes.length - 1));
    const maxLength = Math.min(MAX_SEGMENTS, simpleRoutes.length - start);
    const length = 2 + Math.floor(Math.random() * Math.max(1, maxLength - 1));
    const routeIds = simpleRoutes.slice(start, start + length).map((r) => r.id);
    if (routeIds.length < 2 || routeIds.length > MAX_SEGMENTS) continue;
    compoundRoutePayloads.push({
      name: `Compound Route ${i + 1}`,
      description: `Auto-generated compound route ${i + 1} (routes: ${routeIds.join(', ')})`,
      routeIds,
    });
  }

  // Also add a sequential combination for coverage
  if (simpleRoutes.length >= 3) {
    const seqLength = Math.min(3, MAX_SEGMENTS);
    compoundRoutePayloads.push({
      name: 'Compound Route Sequential',
      description: 'Sequential combination of first three simple routes',
      routeIds: simpleRoutes.slice(0, seqLength).map((r) => r.id),
    });
  }

  const createdCompoundRoutes = [];

  for (const payload of compoundRoutePayloads) {
    const route = await routeUseCases.createCompoundRoute(payload);
    createdCompoundRoutes.push(route);
  }

  console.log(`Seeded ${createdCompoundRoutes.length} compound routes`);

  return createdCompoundRoutes;
}

async function seedBusModels() {
  const BUS_MODEL_COUNT = 5;
  const busModelPayloads = Array.from({ length: BUS_MODEL_COUNT }, () => ({}));
  const busModels = await busModelFactory(factoryDb).create(busModelPayloads);
  console.log(
    `Seeded ${busModels.length} bus models (with ${busModels.length} seat layout models)`,
  );
  return busModels;
}

async function seedBuses(busModels: BusModel[]) {
  const BUS_COUNT = 40;

  // First, create seat layout models and seat diagrams
  const busPayloads = await Promise.all(
    Array.from({ length: BUS_COUNT }, async () => {
      const busModel = busModels[Math.floor(Math.random() * busModels.length)];

      // Create a seat diagram using the bus model's default seat layout model
      const seatDiagram = await seatDiagramFactory(factoryDb).create();

      return {
        modelId: busModel.id,
        seatDiagramId: seatDiagram.id,
      };
    }),
  );

  const buses = await busFactory(factoryDb).create(busPayloads);
  console.log(
    `Seeded ${buses.length} buses (with ${buses.length} seat layout models and ${buses.length} seat diagrams)`,
  );
  return buses;
}

async function seedDiagramZones(buses: Bus[]) {
  // Extract unique seat diagram IDs from buses
  const uniqueSeatDiagramIds = Array.from(
    new Set(buses.map((bus) => bus.seatDiagramId)),
  );

  const diagramZonePayloads = [];

  // Create 1 to 2 zones for each seat diagram
  for (const diagramId of uniqueSeatDiagramIds) {
    const zoneCount = 1 + Math.floor(Math.random() * 2); // 1 to 2 zones

    // Create first zone (business)
    diagramZonePayloads.push({
      seatDiagramId: diagramId,
      params: {
        zoneType: 0, // Business
      },
    });

    // If we need a second zone, create it as premium
    if (zoneCount === 2) {
      diagramZonePayloads.push({
        seatDiagramId: diagramId,
        params: {
          zoneType: 1, // Premium
        },
      });
    }
  }

  const diagramZones =
    await seatDiagramZoneFactory(factoryDb).create(diagramZonePayloads);
  console.log(`Seeded ${diagramZones.length} diagram zones`);
  return diagramZones;
}

async function seedPopulations(cities: City[], states: State[]) {
  const POPULATION_COUNT = 20;

  // Track assigned cities to ensure each city is only assigned to one population
  const assignedCityIds = new Set<number>();

  // Group cities by state for geographic coherence
  const citiesByState = cities.reduce<Record<number, City[]>>((acc, city) => {
    if (!acc[city.stateId]) {
      acc[city.stateId] = [];
    }
    acc[city.stateId].push(city);
    return acc;
  }, {});

  const stateIds = Object.keys(citiesByState).map(Number);

  // Create populations with geographic coherence
  const populations = [];
  const populationTypes = ['Metropolitan', 'Suburban', 'Tourist'];

  for (let i = 0; i < POPULATION_COUNT; i++) {
    const shouldHaveCities = Math.random() < 0.7; // 70% will have cities

    if (shouldHaveCities && stateIds.length > 0) {
      // Select a random state
      const selectedStateId =
        stateIds[Math.floor(Math.random() * stateIds.length)];
      const stateCities = citiesByState[selectedStateId];
      const selectedState = states.find((s) => s.id === selectedStateId);

      if (stateCities.length > 0 && selectedState) {
        // Filter out cities that have already been assigned to other populations
        const availableCities = stateCities.filter(
          (city) => !assignedCityIds.has(city.id),
        );

        if (availableCities.length > 0) {
          // Generate population with geographically coherent name
          const populationType = faker.helpers.arrayElement(populationTypes);
          const populationData = {
            name: `${populationType} ${selectedState.name}`,
            description: faker.helpers.maybe(
              () =>
                `Population for ${populationType.toLowerCase()} areas in ${selectedState.name} region`,
              { probability: 0.7 },
            ),
          };

          // Create the population (factory handles all other fields)
          const population = (await populationFactory(factoryDb).create(
            populationData,
          )) as Population;
          populations.push(population);

          // Select 1-3 cities from available cities in the same state
          const numCities = Math.min(
            Math.floor(Math.random() * 3) + 1, // 1 to 3 cities
            availableCities.length, // But not more than available unassigned cities
          );
          const selectedCities = availableCities
            .sort(() => 0.5 - Math.random())
            .slice(0, numCities);

          // Create population-city associations and mark cities as assigned
          for (const city of selectedCities) {
            await db.insert(populationCities).values({
              populationId: population.id,
              cityId: city.id,
            });
            assignedCityIds.add(city.id); // Mark city as assigned
          }
        } else {
          // No available cities in this state, create population without cities
          const population = (await populationFactory(factoryDb).create(
            {},
          )) as Population;
          populations.push(population);
        }
      } else {
        // Fallback: create population without cities using factory defaults
        const population = (await populationFactory(factoryDb).create(
          {},
        )) as Population;
        populations.push(population);
      }
    } else {
      // Create population without cities using factory defaults
      const population = (await populationFactory(factoryDb).create(
        {},
      )) as Population;
      populations.push(population);
    }
  }

  console.log(
    `Seeded ${populations.length} populations with geographic coherence`,
  );
  console.log(`Assigned ${assignedCityIds.size} cities to populations`);
  return populations;
}

async function seedInstallations(
  installationTypes: InstallationType[],
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

async function seedNodes(
  cities: City[],
  populations: Population[],
  installations: Installation[],
): Promise<Node[]> {
  const NODE_COUNT = 10;
  const nodePayloads = [];

  // Create nodes for each installation (1:1 relationship)
  installations.forEach((installation) => {
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomPopulation =
      populations[Math.floor(Math.random() * populations.length)];

    nodePayloads.push({
      cityId: randomCity.id,
      populationId: randomPopulation.id,
      installationId: installation.id, // Each installation gets exactly one node
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      radius: faker.number.float({ min: 0.5, max: 10.0, fractionDigits: 2 }),
      deletedAt: null,
    });
  });

  // Create remaining nodes without installations
  const remainingNodeCount = NODE_COUNT - installations.length;
  for (let i = 0; i < remainingNodeCount; i++) {
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomPopulation =
      populations[Math.floor(Math.random() * populations.length)];

    nodePayloads.push({
      cityId: randomCity.id,
      populationId: randomPopulation.id,
      installationId: null, // No installation for these nodes
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      radius: faker.number.float({ min: 0.5, max: 10.0, fractionDigits: 2 }),
      deletedAt: null,
    });
  }

  const nodes = (await nodeFactory(factoryDb).create(nodePayloads)) as Node[];

  console.log(
    `Seeded ${nodes.length} nodes (${installations.length} with installations, ${remainingNodeCount} without)`,
  );
  return nodes;
}

async function seedDrivers(
  transporters: Transporter[],
  busLines: BusLine[],
  buses: Bus[],
) {
  const DRIVER_COUNT = 80;
  const driverPayloads = Array.from({ length: DRIVER_COUNT }, () => {
    // First select a random transporter
    const transporter =
      transporters[Math.floor(Math.random() * transporters.length)];

    // Then filter busLines to only those belonging to the selected transporter
    const transporterBusLines = busLines.filter(
      (line) => line.transporterId === transporter.id,
    );

    // If no busLines for this transporter, skip this iteration
    if (transporterBusLines.length === 0) {
      return null;
    }

    // Select a random busLine from the filtered list
    const busLine =
      transporterBusLines[
        Math.floor(Math.random() * transporterBusLines.length)
      ];

    return {
      transporterId: transporter.id,
      busLineId: busLine.id,
      busId: buses[Math.floor(Math.random() * buses.length)].id,
    };
  }).filter(Boolean); // Remove any null entries

  const drivers = await driverFactory(factoryDb).create(driverPayloads);
  console.log(`Seeded ${drivers.length} drivers`);
  return drivers;
}

async function seedLabels(): Promise<Label[]> {
  const LABEL_COUNT = 15;
  const labelPayloads = Array.from({ length: LABEL_COUNT }, () => ({}));

  const labels = (await labelFactory(factoryDb).create(
    labelPayloads,
  )) as Label[];
  console.log(`Seeded ${labels.length} labels`);
  return labels;
}

async function seedLabelNodes(labels: Label[], nodes: Node[]) {
  // Create random label-node associations
  // Each node can have 0-3 labels, and each label can be associated with multiple nodes
  const labelNodeAssociations = [];

  for (const node of nodes) {
    // Random number of labels per node (0-3)
    const labelCount = Math.floor(Math.random() * 4); // 0 to 3 labels

    if (labelCount > 0) {
      // Select random labels for this node
      const selectedLabels = labels
        .sort(() => 0.5 - Math.random())
        .slice(0, labelCount);

      for (const label of selectedLabels) {
        labelNodeAssociations.push({
          labelId: label.id,
          nodeId: node.id,
        });
      }
    }
  }

  // Insert label-node associations
  if (labelNodeAssociations.length > 0) {
    await db.insert(labelNodes).values(labelNodeAssociations);
  }

  console.log(`Assigned labels to nodes`);
  return labelNodeAssociations;
}

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

async function seedInstallationTypes(): Promise<InstallationType[]> {
  const installationTypes = (await installationTypeFactory(factoryDb).create(
    INSTALLATION_TYPES_DATA,
  )) as InstallationType[];

  console.log(`Seeded ${installationTypes.length} installation types`);
  return installationTypes;
}

async function seedEventTypes(): Promise<EventType[]> {
  const eventTypes = (await eventTypeFactory(factoryDb).create(
    EVENT_TYPES_DATA,
  )) as EventType[];

  console.log(`Seeded ${eventTypes.length} event types`);
  return eventTypes;
}

async function seedInstallationSchemas(
  installationTypes: InstallationType[],
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

async function seedEventTypeInstallationTypes(
  eventTypes: EventType[],
  installationTypes: InstallationType[],
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

async function seedInstallationProperties(
  installations: Installation[],
  installationSchemas: InstallationSchema[],
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

async function seedNodeEvents(
  nodes: Node[],
  eventTypes: EventType[],
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

export async function seedInventory(): Promise<void> {
  try {
    const countries = await seedCountries();
    const mexicoCountry = countries.find((country) => country.code === 'MX');
    if (!mexicoCountry) {
      throw new Error('Mexico country not found');
    }
    const states = await seedStates(mexicoCountry);
    const cities = await seedCities(states);
    const terminals = await seedTerminals(cities);
    const populations = await seedPopulations(cities, states);

    // Seed installation types and event types first (they have no dependencies)
    const installationTypes = await seedInstallationTypes();
    const eventTypes = await seedEventTypes();

    // Create associations between event types and installation types
    await seedEventTypeInstallationTypes(eventTypes, installationTypes);

    // Create installation schemas for the installation types
    const installationSchemas =
      await seedInstallationSchemas(installationTypes);

    const installations = await seedInstallations(installationTypes);
    const nodes = await seedNodes(cities, populations, installations);

    // Create installation properties based on existing installations and schemas
    await seedInstallationProperties(installations, installationSchemas);

    // Create node events based on nodes and their installation types
    await seedNodeEvents(nodes, eventTypes);

    // Seed labels and associate them with nodes
    const labels = await seedLabels();
    await seedLabelNodes(labels, nodes);

    const transporters = await seedTransporters(cities);
    const busLines = await seedBusLines(transporters);
    // Seed simple and compound routes
    const simpleRoutes = await seedSimpleRoutes(terminals);
    await seedCompoundRoutes(simpleRoutes);
    const busModels = (await seedBusModels()) as BusModel[];
    const buses = (await seedBuses(busModels)) as Bus[];
    await seedDiagramZones(buses);
    await seedDrivers(transporters, busLines as BusLine[], buses);

    console.log('Inventory seeding completed successfully!');
  } catch (error) {
    console.error('Error during inventory seeding:', error);
    throw error; // Let the caller handle the error instead of exiting
  }
}

const shouldRunSeeder = process.argv.includes('--seed');
if (shouldRunSeeder) {
  seedInventory()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Unhandled error in seedInventory script:', error);
      process.exit(1);
    });
}
