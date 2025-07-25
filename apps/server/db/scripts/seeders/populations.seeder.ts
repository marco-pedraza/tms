import { fakerES_MX as faker } from '@faker-js/faker';
import { City } from '../../../inventory/cities/cities.types';
import { db } from '../../../inventory/db-service';
import { Installation } from '../../../inventory/installations/installations.types';
import { Node } from '../../../inventory/nodes/nodes.types';
import { populationCities } from '../../../inventory/populations/populations.schema';
import { Population } from '../../../inventory/populations/populations.types';
import { State } from '../../../inventory/states/states.types';
import { nodeFactory, populationFactory } from '../../../tests/factories';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FactoryDb = any;

/**
 * Seeds populations with geographic coherence
 */
export async function seedPopulations(
  cities: City[],
  states: State[],
  factoryDb: FactoryDb,
): Promise<Population[]> {
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

/**
 * Seeds nodes with proper distribution between installations and standalone nodes
 */
export async function seedNodes(
  cities: City[],
  populations: Population[],
  installations: Installation[],
  factoryDb: FactoryDb,
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
