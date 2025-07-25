import { fakerES_MX as faker } from '@faker-js/faker';
import { City } from '../../../inventory/cities/cities.types';
import { Country } from '../../../inventory/countries/countries.types';
import { State } from '../../../inventory/states/states.types';
import { Terminal } from '../../../inventory/terminals/terminals.types';
import { AVAILABLE_TIMEZONES } from '../../../inventory/timezones/timezones.constants';
import { createSlug } from '../../../shared/utils';
import {
  cityFactory,
  countryFactory,
  stateFactory,
  terminalFactory,
} from '../../../tests/factories';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FactoryDb = any;

/**
 * Remove duplicates from an array based on any of the provided unique key functions (OR logic).
 * If any key is duplicated, the item is removed.
 */
function removeDuplicatesByAnyKey<T>(
  array: T[],
  keyFns: ((item: T) => unknown)[],
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

/**
 * Seeds countries
 */
export async function seedCountries(factoryDb: FactoryDb): Promise<Country[]> {
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

/**
 * Seeds states for a given country
 */
export async function seedStates(
  parentCountry: Country,
  factoryDb: FactoryDb,
): Promise<State[]> {
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

/**
 * Seeds cities for given states
 */
export async function seedCities(
  states: State[],
  factoryDb: FactoryDb,
): Promise<City[]> {
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

/**
 * Seeds terminals for given cities
 */
export async function seedTerminals(
  cities: City[],
  factoryDb: FactoryDb,
): Promise<Terminal[]> {
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

  // Remove duplicates by name
  const uniqueTerminals = removeDuplicatesByAnyKey(rawTerminals, [
    (terminal) => terminal.name,
  ]);

  const terminals = (await terminalFactory(factoryDb).create(
    uniqueTerminals,
  )) as Terminal[];

  console.log(`Seeded ${terminals.length} terminals`);
  return terminals;
}
