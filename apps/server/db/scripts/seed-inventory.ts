import {
  cityFactory,
  countryFactory,
  stateFactory,
  terminalFactory,
} from '../../tests/factories';
import { getFactoryDb } from '../../tests/factories/factory-utils';
import { fakerES_MX as faker } from '@faker-js/faker';
import { db } from '../../inventory/db-service';
import { Country } from '../../inventory/countries/countries.types';
import { State } from '../../inventory/states/states.types';
import { City } from '../../inventory/cities/cities.types';
import { Terminal } from '../../inventory/terminals/terminals.types';
import { createSlug } from '../../shared/utils';
import { transporterFactory } from '../../tests/factories/transporters.factory';
import { busLineFactory } from '../../tests/factories/bus-line.factory';
import { Transporter } from '../../inventory/transporters/transporters.types';
import { pathwayServicesFactory } from '../../tests/factories/pathway-services.factory';
import { PathwayService } from '../../inventory/pathway-services/pathway-services.types';
import { routeUseCases } from '../../inventory/routes/routes.use-cases';
import {
  CreateSimpleRoutePayload,
  Route,
} from '../../inventory/routes/routes.types';
import { pathwayUseCases } from '../../inventory/pathways/pathways.use-cases';

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
      timezone: faker.location.timeZone(),
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

async function seedInventory() {
  try {
    const countries = await seedCountries();
    const mexicoCountry = countries.find((country) => country.code === 'MX');
    if (!mexicoCountry) {
      throw new Error('Mexico country not found');
    }
    const states = await seedStates(mexicoCountry);
    const cities = await seedCities(states);
    const terminals = await seedTerminals(cities);
    const transporters = await seedTransporters(cities);
    await seedBusLines(transporters);
    const pathwayServices = (await seedPathwayServices()) as PathwayService[];
    // Seed simple and compound routes
    const simpleRoutes = await seedSimpleRoutes(terminals);
    await assignServicesToAllPathways(simpleRoutes, pathwayServices);
    await seedCompoundRoutes(simpleRoutes);
    console.log('Inventory seeding completed successfully!');
  } catch (error) {
    console.error('Error during inventory seeding:', error);
    process.exit(1);
  }
}

seedInventory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error during inventory seeding:', error);
    process.exit(1);
  });
