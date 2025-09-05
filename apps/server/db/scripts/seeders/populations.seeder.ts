import { fakerES_MX as faker } from '@faker-js/faker';
import { cityRepository } from '@/inventory/locations/cities/cities.repository';
import type { City } from '@/inventory/locations/cities/cities.types';
import { populationCities } from '@/inventory/locations/populations/populations.schema';
import type { Population } from '@/inventory/locations/populations/populations.types';
import { stateRepository } from '@/inventory/locations/states/states.repository';
// Removed unused State import
import { populationFactory } from '@/factories';
import {
  CLIENT_DATA_FILES,
  hasClientData,
  loadClientData,
} from './client-data.utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FactoryDb = any;

/**
 * Seeds populations with geographic coherence
 */
export async function seedPopulations(
  factoryDb: FactoryDb,
  clientCode?: string,
): Promise<Population[]> {
  const logPrefix = clientCode
    ? `👥 Seeding populations for client: ${clientCode.toUpperCase()}`
    : '👥 Seeding populations';

  console.log(logPrefix);

  // Try to use client data if available
  if (
    clientCode &&
    hasClientData(clientCode, CLIENT_DATA_FILES.CITIES_BY_POPULATION)
  ) {
    console.log(`   📊 Found populations in JSON data`);

    const populationsData = (await loadClientData(
      clientCode,
      CLIENT_DATA_FILES.CITIES_BY_POPULATION,
    )) as {
      name?: string;
      poblacion?: string;
      code?: string;
      codigo?: string;
    }[];

    console.log(
      `   🏗️ Creating ${populationsData.length} populations using factory...`,
    );

    const populationPayloads = populationsData.map((popData) => ({
      name: popData.name ?? popData.poblacion,
      code: popData.code ?? popData.codigo,
      deletedAt: null,
    }));

    const populations = (await populationFactory(factoryDb).create(
      populationPayloads,
    )) as unknown as Population[];

    console.log(
      `   ✅ Created ${populations.length} populations from client data`,
    );
    return populations;
  }

  // Fallback to random data
  console.log('👥 Seeding populations with random data');

  // Get cities and states from database for random seeding
  const cities = await cityRepository.findAll();
  const states = await stateRepository.findAll();

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
            await factoryDb.insert(populationCities).values({
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
