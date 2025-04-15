import { api } from 'encore.dev/api';
import { cityRepository } from './cities.repository';
import type {
  CreateCityPayload,
  UpdateCityPayload,
  City,
  PaginatedCities,
  Cities,
} from './cities.types';
import { createControllerErrorHandler } from '../../shared/controller-utils';
import { PaginationParams } from '../../shared/types';

const withErrorHandling = createControllerErrorHandler('CitiesController');

/**
 * Creates a new city.
 * @param params - The city data to create
 * @returns {Promise<City>} The created city
 * @throws {APIError} If the city creation fails
 */
export const createCity = api(
  { method: 'POST', path: '/cities', expose: true },
  async (params: CreateCityPayload): Promise<City> => {
    return await withErrorHandling('createCity', () =>
      cityRepository.create(params),
    );
  },
);

/**
 * Retrieves a city by its ID.
 * @param params - Object containing the city ID
 * @param params.id - The ID of the city to retrieve
 * @returns {Promise<City>} The found city
 * @throws {APIError} If the city is not found or retrieval fails
 */
export const getCity = api(
  { method: 'GET', path: '/cities/:id', expose: true },
  async ({ id }: { id: number }): Promise<City> => {
    return await withErrorHandling('getCity', () => cityRepository.findOne(id));
  },
);

/**
 * Retrieves all cities.
 * @returns {Promise<City[]>} List of all cities
 * @throws {APIError} If retrieval fails
 */
export const listCities = api(
  { method: 'GET', path: '/cities', expose: true },
  async (): Promise<Cities> => {
    const cities = await cityRepository.findAll();
    return { cities };
  },
);

/**
 * Retrieves cities with pagination.
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedCities>} Paginated list of cities
 * @throws {APIError} If retrieval fails
 */
export const listCitiesPaginated = api(
  { method: 'GET', path: '/cities/paginated', expose: true },
  async (params: PaginationParams): Promise<PaginatedCities> => {
    return await withErrorHandling('listCitiesPaginated', () =>
      cityRepository.findAllPaginated(params),
    );
  },
);

/**
 * Updates an existing city.
 * @param params - Object containing the city ID and update data
 * @param params.id - The ID of the city to update
 * @returns {Promise<City>} The updated city
 * @throws {APIError} If the city is not found or update fails
 */
export const updateCity = api(
  { method: 'PUT', path: '/cities/:id', expose: true },
  async ({
    id,
    ...data
  }: UpdateCityPayload & { id: number }): Promise<City> => {
    return await withErrorHandling('updateCity', () =>
      cityRepository.update(id, data),
    );
  },
);

/**
 * Deletes a city by its ID.
 * @param params - Object containing the city ID
 * @param params.id - The ID of the city to delete
 * @returns {Promise<City>} The deleted city
 * @throws {APIError} If the city is not found or deletion fails
 */
export const deleteCity = api(
  { method: 'DELETE', path: '/cities/:id', expose: true },
  async ({ id }: { id: number }): Promise<City> => {
    return await withErrorHandling('deleteCity', () =>
      cityRepository.delete(id),
    );
  },
);
