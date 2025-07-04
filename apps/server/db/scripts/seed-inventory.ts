import { fakerES_MX as faker } from '@faker-js/faker';
import { BusLine } from '../../inventory/bus-lines/bus-lines.types';
import { BusModel } from '../../inventory/bus-models/bus-models.types';
import { Bus } from '../../inventory/buses/buses.types';
import { City } from '../../inventory/cities/cities.types';
import { Country } from '../../inventory/countries/countries.types';
import { db } from '../../inventory/db-service';
import { Installation } from '../../inventory/installations/installations.types';
import { Node } from '../../inventory/nodes/nodes.types';
import { PathwayService } from '../../inventory/pathway-services/pathway-services.types';
import { pathwayUseCases } from '../../inventory/pathways/pathways.use-cases';
import { populationCities } from '../../inventory/populations/populations.schema';
import { Population } from '../../inventory/populations/populations.types';
import {
  CreateSimpleRoutePayload,
  Route,
} from '../../inventory/routes/routes.types';
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
  installationFactory,
  nodeFactory,
  stateFactory,
  terminalFactory,
} from '../../tests/factories';
import { busLineFactory } from '../../tests/factories/bus-line.factory';
import { busModelFactory } from '../../tests/factories/bus-models.factory';
import { busFactory } from '../../tests/factories/buses.factory';
import { getFactoryDb } from '../../tests/factories/factory-utils';
import { pathwayServicesFactory } from '../../tests/factories/pathway-services.factory';
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

async function seedPathwayServices() {
  const PATHWAY_SERVICE_COUNT = 15; // Increased count to account for potential duplicates
  const rawPathwayPayload = Array.from(
    { length: PATHWAY_SERVICE_COUNT },
    () => ({
      name: faker.commerce.productAdjective(),
    }),
  );
  // Remove duplicates by name
  const uniquePathwayServices = removeDuplicatesByAnyKey(rawPathwayPayload, [
    (service) => service.name,
  ]);

  const pathwayServices = (await pathwayServicesFactory(factoryDb).create(
    uniquePathwayServices,
  )) as PathwayService[];

  console.log(`Seeded ${pathwayServices.length} pathway services`);

  return pathwayServices;
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

async function assignServicesToAllPathways(
  simpleRoutes: Route[],
  pathwayServices: PathwayService[],
) {
  for (const simpleRoute of simpleRoutes) {
    if (!simpleRoute.pathwayId) {
      console.log(`Skipping route ${simpleRoute.id} as it has no pathwayId`);
      continue;
    }

    const numServices = Math.floor(Math.random() * 3) + 1;
    const servicesToAssign = pathwayServices
      .sort(() => 0.5 - Math.random())
      .slice(0, numServices);
    for (const service of servicesToAssign) {
      await pathwayUseCases.assignServicesToPathway({
        pathwayId: simpleRoute.pathwayId,
        pathwayServiceId: service.id,
        distanceFromOrigin: Math.floor(Math.random() * 100),
        mandatory: Math.random() > 0.5,
      });
    }
  }
  console.log('Assigned pathway services to all pathways of simple routes');
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

async function seedInstallations(): Promise<Installation[]> {
  const INSTALLATION_COUNT = 8;
  const installationPayloads = Array.from(
    { length: INSTALLATION_COUNT },
    () => ({ deletedAt: null }),
  );

  const installations = (await installationFactory(factoryDb).create(
    installationPayloads,
  )) as Installation[];

  console.log(`Seeded ${installations.length} installations`);
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
    const installations = await seedInstallations();
    await seedNodes(cities, populations, installations);
    const transporters = await seedTransporters(cities);
    const busLines = await seedBusLines(transporters);
    const pathwayServices = (await seedPathwayServices()) as PathwayService[];
    // Seed simple and compound routes
    const simpleRoutes = await seedSimpleRoutes(terminals);
    await assignServicesToAllPathways(simpleRoutes, pathwayServices);
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
