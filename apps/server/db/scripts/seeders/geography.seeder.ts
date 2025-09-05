import { fakerES_MX as faker } from '@faker-js/faker';
import { createSlug } from '@/shared/utils';
import type { City } from '@/inventory/locations/cities/cities.types';
import type { Country } from '@/inventory/locations/countries/countries.types';
import { populationCities } from '@/inventory/locations/populations/populations.schema';
import type { Population } from '@/inventory/locations/populations/populations.types';
import type { State } from '@/inventory/locations/states/states.types';
import { AVAILABLE_TIMEZONES } from '@/inventory/locations/timezones/timezones.constants';
import {
  cityFactory,
  countryFactory,
  populationFactory,
  stateFactory,
} from '@/factories';
import {
  CLIENT_DATA_FILES,
  hasClientData,
  loadClientData,
  removeDuplicatesByAnyKey,
} from './client-data.utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FactoryDb = any;

/**
 * Extracts states from client JSON data
 * @param clientCode - Client identifier
 * @param parentCountry - The country to create states for
 */
async function extractStatesFromClientData(
  clientCode: string,
  parentCountry: Country,
): Promise<Array<{ name: string; code: string; countryId: number }>> {
  const stateNames = new Set<string>();

  // Get states from cities_by_state.json only
  if (hasClientData(clientCode, CLIENT_DATA_FILES.CITIES_BY_STATE)) {
    const citiesByState = (await loadClientData(
      clientCode,
      CLIENT_DATA_FILES.CITIES_BY_STATE,
    )) as Record<string, string[]>;

    // Extract state names from the keys
    Object.keys(citiesByState).forEach((stateName) => {
      stateNames.add(stateName.trim());
    });
  }

  // Convert to array and create state objects
  const stateNamesArray = Array.from(stateNames).sort();
  console.log(
    `   🔍 States found in client data: ${stateNamesArray.join(', ')}`,
  );

  const states = stateNamesArray.map((stateName) => ({
    name: stateName,
    code: generateStateCode(stateName),
    countryId: parentCountry.id,
  }));

  return states;
}

/**
 * Generates a state code from state name
 * @param stateName - Full state name
 */
function generateStateCode(stateName: string): string {
  // Create a simple state code from the first letters of words
  const words = stateName.split(' ');
  let code = '';

  for (const word of words) {
    if (word.length > 0) {
      code += word.charAt(0).toUpperCase();
    }
  }

  // Ensure minimum length of 2 characters
  if (code.length < 2) {
    code = stateName.substring(0, 2).toUpperCase();
  }

  // Limit to 4 characters maximum
  return code.substring(0, 4);
}

/**
 * Extracts cities from client JSON data
 * @param clientCode - Client identifier
 * @param states - Array of states to match cities against
 */
async function extractCitiesFromClientData(
  clientCode: string,
  states: State[],
): Promise<
  Array<{
    name: string;
    stateId: number;
    latitude: number;
    longitude: number;
    timezone: string;
    slug: string;
  }>
> {
  const cityData: Array<{ name: string; stateName: string }> = [];

  // Get cities from cities_by_state.json only
  if (hasClientData(clientCode, CLIENT_DATA_FILES.CITIES_BY_STATE)) {
    const citiesByState = (await loadClientData(
      clientCode,
      CLIENT_DATA_FILES.CITIES_BY_STATE,
    )) as Record<string, string[]>;

    // Extract cities with their state names
    Object.entries(citiesByState).forEach(([stateName, cityNames]) => {
      cityNames.forEach((cityName) => {
        cityData.push({ name: cityName, stateName: stateName.trim() });
      });
    });
  }

  // Remove duplicates and match with states
  const uniqueCityData = removeDuplicatesByAnyKey(cityData, [
    (city) => `${city.name}-${city.stateName}`,
  ]);

  // Convert to city objects with state IDs
  const cities = uniqueCityData
    .map((cityData) => {
      const state = states.find((s) => s.name === cityData.stateName);
      if (!state) {
        console.warn(
          `⚠️ State not found for city ${cityData.name}: ${cityData.stateName}`,
        );
        return null;
      }

      return {
        name: cityData.name,
        stateId: state.id,
        latitude: generateLatitudeForMexico(),
        longitude: generateLongitudeForMexico(),
        timezone: 'America/Mexico_City', // Default timezone for Mexico
        slug: createSlug(cityData.name, state.code || 'c'),
      };
    })
    .filter((city): city is NonNullable<typeof city> => city !== null);

  return cities;
}

/**
 * Generates a realistic latitude for Mexico (between 14.5 and 32.7)
 */
function generateLatitudeForMexico(): number {
  return faker.number.float({ min: 14.5, max: 32.7 });
}

/**
 * Generates a realistic longitude for Mexico (between -118.4 and -86.7)
 */
function generateLongitudeForMexico(): number {
  return faker.number.float({ min: -118.4, max: -86.7 });
}

/**
 * Creates cities from client data in batches with proper error handling
 * @param citiesFromClient - Array of city data to create
 * @param factoryDb - Factory database instance
 * @param statesCount - Number of states for logging
 */
async function createCitiesFromClientData(
  citiesFromClient: Array<{
    name: string;
    stateId: number;
    latitude: number;
    longitude: number;
    timezone: string;
    slug: string;
  }>,
  factoryDb: FactoryDb,
  statesCount: number,
): Promise<City[]> {
  const allCities: City[] = [];
  const BATCH_SIZE = 200;

  console.log(
    `   🏗️ Creating ${citiesFromClient.length} cities using factory...`,
  );

  for (let i = 0; i < citiesFromClient.length; i += BATCH_SIZE) {
    const batch = citiesFromClient.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(citiesFromClient.length / BATCH_SIZE);

    console.log(
      `   📦 Processing batch ${batchNumber} of ${totalBatches} (${batch.length} cities)`,
    );

    // Process each city in the batch
    for (const cityData of batch) {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          const city = (await cityFactory(factoryDb).create({
            ...cityData,
          })) as unknown as City;
          allCities.push(city);
          break; // Success, exit retry loop
        } catch {
          attempts++;
          if (attempts >= maxAttempts) {
            console.warn(
              `   ⚠️ Failed to create city ${cityData.name} after ${maxAttempts} attempts`,
            );
            break; // Give up after max attempts
          }
          // No delay needed - removed for performance
        }
      }
    }

    // No delay between batches needed - removed for performance
  }

  console.log(
    `   ✅ Created ${allCities.length} cities from client data across ${statesCount} states`,
  );
  return allCities;
}

/**
 * Seeds countries
 * @param factoryDb - Factory database instance
 * @param clientCode - Optional client code for logging purposes
 */
export async function seedCountries(
  factoryDb: FactoryDb,
  clientCode?: string,
): Promise<Country[]> {
  const logPrefix = clientCode
    ? `🇲🇽 Seeding countries for client: ${clientCode.toUpperCase()}`
    : '🌍 Seeding countries';

  console.log(logPrefix);

  // Always create the same set of countries (Mexico is always included)
  const countryPayloads = [
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
  ];

  const countries = (await countryFactory(factoryDb).create(
    countryPayloads,
  )) as unknown as Country[];

  const resultMessage = clientCode
    ? `   ✓ Created ${countries.length} countries: ${countries.map((c) => c.name).join(', ')}`
    : `Seeded ${countries.length} countries`;

  console.log(resultMessage);
  return countries;
}

/**
 * Seeds states for a given country
 * @param parentCountry - The country to create states for
 * @param factoryDb - Factory database instance
 * @param clientCode - Optional client code to use specific data (e.g., 'gfa')
 */
export async function seedStates(
  parentCountry: Country,
  factoryDb: FactoryDb,
  clientCode?: string,
): Promise<State[]> {
  if (clientCode) {
    // Try to load client data from JSON files
    const statesFromClient = await extractStatesFromClientData(
      clientCode,
      parentCountry,
    );

    if (statesFromClient.length > 0) {
      const states = (await stateFactory(factoryDb).create(
        statesFromClient.map((state) => ({
          ...state,
        })),
      )) as unknown as State[];

      console.log(
        `Seeded ${states.length} states (client: ${clientCode.toUpperCase()})`,
      );
      return states;
    }
  }

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
    uniqueStates.map((state) => ({
      ...state,
    })),
  )) as unknown as State[];

  console.log(`Seeded ${states.length} states`);
  return states;
}

/**
 * Seeds cities for given states
 * @param states - Array of states to create cities for
 * @param factoryDb - Factory database instance
 * @param clientCode - Optional client code to use specific data (e.g., 'gfa')
 */
export async function seedCities(
  states: State[],
  factoryDb: FactoryDb,
  clientCode?: string,
): Promise<City[]> {
  if (clientCode) {
    // Try to load client data from JSON files
    const citiesFromClient = await extractCitiesFromClientData(
      clientCode,
      states,
    );

    if (citiesFromClient.length > 0) {
      const cities = await createCitiesFromClientData(
        citiesFromClient,
        factoryDb,
        states.length,
      );
      console.log(
        `Seeded ${cities.length} cities (client: ${clientCode.toUpperCase()})`,
      );
      return cities;
    }
  }

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

  const cities = (await cityFactory(factoryDb).create(
    uniqueCities.map((city) => ({
      ...city,
    })),
  )) as unknown as City[];

  console.log(`Seeded ${cities.length} cities`);
  return cities;
}

/**
 * Extract population data from client JSON files
 * @param clientCode - Client code (e.g., 'gfa')
 * @returns Array of population data with their cities
 */
async function extractPopulationsFromClientData(
  clientCode: string,
): Promise<
  Array<{ code: string; name: string; description?: string; cities: string[] }>
> {
  const populationsData: Array<{
    code: string;
    name: string;
    description?: string;
    cities: string[];
  }> = [];

  if (hasClientData(clientCode, CLIENT_DATA_FILES.CITIES_BY_POPULATION)) {
    const populationFile = (await loadClientData(
      clientCode,
      CLIENT_DATA_FILES.CITIES_BY_POPULATION,
    )) as {
      populations: Array<{
        code: string;
        name: string;
        state: string;
        cities: string[];
      }>;
    };

    populationFile.populations.forEach((population) => {
      // Generate unique code by combining original code with state abbreviation
      const stateAbbr = population.state
        .split(' ')
        .map((word) => word.substring(0, 2).toUpperCase())
        .join('');
      const uniqueCode = `${population.code}-${stateAbbr}`;

      populationsData.push({
        code: uniqueCode,
        name: `${population.name} - ${population.state}`, // Add state to name format
        description: `Population in ${population.state}`,
        cities: population.cities,
      });
    });
  }

  return populationsData;
}

/**
 * Seeds populations from client JSON data or generates random ones
 * @param factoryDb - Factory database instance
 * @param clientCode - Optional client code for client-specific data
 * @returns Array of created populations
 */
export async function seedPopulations(
  factoryDb: FactoryDb,
  clientCode?: string,
): Promise<Population[]> {
  console.log('👥 Seeding populations...');

  if (clientCode) {
    console.log(
      `👥 Seeding populations for client: ${clientCode.toUpperCase()}`,
    );
    const populationsFromClient =
      await extractPopulationsFromClientData(clientCode);

    if (populationsFromClient.length > 0) {
      console.log(
        `   📊 Found ${populationsFromClient.length} populations in JSON data`,
      );

      return await createPopulationsFromClientData(
        populationsFromClient,
        factoryDb,
      );
    }
  }

  // Default behavior - generate random populations
  console.log('👥 Seeding populations with random data');

  const POPULATION_COUNT = 20;
  const rawPopulations = Array.from({ length: POPULATION_COUNT }, () => ({
    code: `POP${faker.string.alphanumeric(3).toUpperCase()}`,
    name: `Population ${faker.location.city()}`,
    description: faker.lorem.sentence(),
    active: true,
  }));

  const populations = await Promise.all(
    rawPopulations.map(async (populationData) => {
      return (await populationFactory(factoryDb).create(
        populationData,
      )) as unknown as Population;
    }),
  );

  console.log(`   ✅ Created ${populations.length} random populations`);
  return populations;
}

/**
 * Creates populations from client data with proper error handling
 * @param populationsFromClient - Array of population data to create
 * @param factoryDb - Factory database instance
 */
async function createPopulationsFromClientData(
  populationsFromClient: Array<{
    code: string;
    name: string;
    description?: string;
    cities: string[];
  }>,
  factoryDb: FactoryDb,
): Promise<Population[]> {
  const allPopulations: Population[] = [];
  const BATCH_SIZE = 100;

  console.log(
    `   🏗️ Creating ${populationsFromClient.length} populations using factory...`,
  );

  for (let i = 0; i < populationsFromClient.length; i += BATCH_SIZE) {
    const batch = populationsFromClient.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(populationsFromClient.length / BATCH_SIZE);

    console.log(
      `   📦 Processing batch ${batchNumber} of ${totalBatches} (${batch.length} populations)`,
    );

    // Process each population in the batch
    for (const populationData of batch) {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          const population = (await populationFactory(factoryDb).create({
            code: populationData.code,
            name: populationData.name,
            description: populationData.description || null,
            active: true,
          })) as unknown as Population;
          allPopulations.push(population);
          break; // Success, exit retry loop
        } catch {
          attempts++;
          if (attempts >= maxAttempts) {
            console.warn(
              `   ⚠️ Failed to create population ${populationData.name} after ${maxAttempts} attempts`,
            );
            break; // Give up after max attempts
          }
          // No delay needed - removed for performance
        }
      }
    }

    // No delay between batches needed - removed for performance
  }

  console.log(
    `   ✅ Created ${allPopulations.length} populations from client data`,
  );

  return allPopulations;
}

/**
 * Seeds population-city relationships from client JSON data
 * @param populations - Array of created populations
 * @param cities - Array of created cities
 * @param factoryDb - Factory database instance
 * @param clientCode - Client code for client-specific data
 * @returns Number of relationships created
 */
export async function seedPopulationCities(
  populations: Population[],
  cities: City[],
  factoryDb: FactoryDb,
  clientCode: string,
): Promise<number> {
  console.log('🔗 Seeding population-city relationships...');

  if (!clientCode) {
    console.log(
      '   ⚠️ No client code provided, skipping population-city relationships',
    );
    return 0;
  }

  // Create a map of city names to city IDs for quick lookup
  const cityMap = new Map<string, number>();
  cities.forEach((city) => {
    cityMap.set(city.name, city.id);
  });

  // Create a map of population codes to population IDs for quick lookup
  const populationMap = new Map<string, number>();
  populations.forEach((population) => {
    populationMap.set(population.code, population.id);
  });

  // Get client data and filter to only include populations that were actually created
  const populationsFromClient =
    await extractPopulationsFromClientData(clientCode);
  const existingPopulationsData = populationsFromClient.filter((popData) =>
    populationMap.has(popData.code),
  );

  if (existingPopulationsData.length === 0) {
    console.log(
      '   ⚠️ No matching populations found between JSON and created populations, skipping relationships',
    );
    return 0;
  }

  let relationshipsCreated = 0;

  console.log(
    `   🏗️ Creating relationships for ${existingPopulationsData.length} existing populations (${populationsFromClient.length} total in JSON)...`,
  );

  let relationshipSuccessCount = 0;
  let relationshipFailureCount = 0;
  let populationsNotFound = 0;
  let citiesNotFound = 0;
  let duplicateCitySkipped = 0;
  const missingCities: string[] = [];
  const missingPopulations: string[] = [];
  const assignedCities = new Set<number>(); // Track already assigned cities

  for (const populationData of existingPopulationsData) {
    const populationId = populationMap.get(populationData.code);

    if (!populationId) {
      console.warn(
        `   ⚠️ Population not found for code: ${populationData.code}`,
      );
      populationsNotFound++;
      missingPopulations.push(
        `${populationData.code} (${populationData.name})`,
      );
      continue;
    }

    for (const cityName of populationData.cities) {
      const cityId = cityMap.get(cityName);

      if (!cityId) {
        console.warn(
          `   ⚠️ City not found: ${cityName} for population ${populationData.name}`,
        );
        citiesNotFound++;
        if (!missingCities.includes(cityName)) {
          missingCities.push(cityName);
        }
        continue;
      }

      // Skip if city is already assigned to another population
      if (assignedCities.has(cityId)) {
        duplicateCitySkipped++;
        continue;
      }

      try {
        // Use direct database insert to avoid transaction issues
        await factoryDb.insert(populationCities).values({
          populationId,
          cityId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        relationshipsCreated++;
        relationshipSuccessCount++;
        assignedCities.add(cityId); // Mark city as assigned
      } catch (error) {
        console.warn(
          `   ⚠️ Failed to create relationship between population ${populationData.name} and city ${cityName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        relationshipFailureCount++;
      }
    }
  }

  console.log(
    `   ✅ Created ${relationshipsCreated} population-city relationships`,
  );

  // Detailed logging summary
  console.log(`   📊 Relationship Summary:`);
  console.log(`      ✅ Successful relationships: ${relationshipSuccessCount}`);
  console.log(`      ❌ Failed relationships: ${relationshipFailureCount}`);
  console.log(`      🏢 Populations not found: ${populationsNotFound}`);
  console.log(`      🏙️ Cities not found: ${citiesNotFound}`);
  console.log(`      🔄 Duplicate cities skipped: ${duplicateCitySkipped}`);

  if (missingPopulations.length > 0) {
    console.log(`   ❌ Missing populations (${missingPopulations.length}):`);
    missingPopulations.slice(0, 5).forEach((pop, index) => {
      console.log(`      ${index + 1}. ${pop}`);
    });
    if (missingPopulations.length > 5) {
      console.log(`      ... and ${missingPopulations.length - 5} more`);
    }
  }

  if (missingCities.length > 0) {
    console.log(`   ❌ Missing cities (${missingCities.length}):`);
    missingCities.slice(0, 10).forEach((city, index) => {
      console.log(`      ${index + 1}. ${city}`);
    });
    if (missingCities.length > 10) {
      console.log(`      ... and ${missingCities.length - 10} more`);
    }
  }

  return relationshipsCreated;
}
