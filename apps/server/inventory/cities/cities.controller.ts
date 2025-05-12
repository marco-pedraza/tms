import { api } from 'encore.dev/api';
import type {
  Cities,
  CitiesQueryOptions,
  City,
  CreateCityPayload,
  PaginatedCities,
  PaginationParamsCities,
  UpdateCityPayload,
} from './cities.types';
import { cityRepository } from './cities.repository';

/**
 * Creates a new city.
 */
export const createCity = api(
  { expose: true, method: 'POST', path: '/cities' },
  async (params: CreateCityPayload): Promise<City> => {
    return await cityRepository.create(params);
  },
);

/**
 * Retrieves a city by its ID.
 */
export const getCity = api(
  { expose: true, method: 'GET', path: '/cities/:id' },
  async ({ id }: { id: number }): Promise<City> => {
    return await cityRepository.findOne(id);
  },
);

/**
 * Retrieves all cities without pagination (useful for dropdowns).
 */
export const listCities = api(
  { expose: true, method: 'POST', path: '/get-cities' },
  async (params: CitiesQueryOptions): Promise<Cities> => {
    const cities = await cityRepository.findAll(params);
    return {
      cities,
    };
  },
);

/**
 * Retrieves cities with pagination (useful for tables).
 */
export const listCitiesPaginated = api(
  { expose: true, method: 'POST', path: '/get-cities/paginated' },
  async (params: PaginationParamsCities): Promise<PaginatedCities> => {
    return await cityRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing city.
 */
export const updateCity = api(
  { expose: true, method: 'PUT', path: '/cities/:id' },
  async ({
    id,
    ...data
  }: UpdateCityPayload & { id: number }): Promise<City> => {
    return await cityRepository.update(id, data);
  },
);

/**
 * Deletes a city by its ID.
 */
export const deleteCity = api(
  { expose: true, method: 'DELETE', path: '/cities/:id' },
  async ({ id }: { id: number }): Promise<City> => {
    return await cityRepository.delete(id);
  },
);

/**
 * Searches for cities by matching a search term against name and slug.
 */
export const searchCities = api(
  { expose: true, method: 'GET', path: '/cities/search' },
  async ({ term }: { term: string }): Promise<Cities> => {
    const cities = await cityRepository.search(term);
    return {
      cities,
    };
  },
);

/**
 * Searches for cities with pagination by matching a search term against name and slug.
 */
export const searchCitiesPaginated = api(
  { expose: true, method: 'POST', path: '/cities/search/paginated' },
  async ({
    term,
    ...params
  }: PaginationParamsCities & { term: string }): Promise<PaginatedCities> => {
    return await cityRepository.searchPaginated(term, params);
  },
);
