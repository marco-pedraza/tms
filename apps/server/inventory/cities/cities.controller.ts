import { api } from 'encore.dev/api';
import type {
  City,
  CityWithRelations,
  CreateCityPayload,
  ListCitiesQueryParams,
  ListCitiesResult,
  PaginatedListCitiesQueryParams,
  PaginatedListCitiesResult,
  UpdateCityPayload,
} from './cities.types';
import { cityRepository } from './cities.repository';
import { validateCity } from './cities.domain';

/**
 * Creates a new city.
 * @param params - The city data to create
 * @returns {Promise<City>} The created city
 * @throws {APIError} If the city creation fails
 */
export const createCity = api(
  { expose: true, method: 'POST', path: '/cities/create' },
  async (params: CreateCityPayload): Promise<City> => {
    await validateCity(params);
    return await cityRepository.create(params);
  },
);

/**
 * Retrieves a city by its ID with related state and country information.
 * @param params - Object containing the city ID
 * @param params.id - The ID of the city to retrieve
 * @returns {Promise<CityWithRelations>} The found city with state and country information
 * @throws {APIError} If the city is not found or retrieval fails
 */
export const getCity = api(
  { expose: true, method: 'GET', path: '/cities/:id' },
  async ({ id }: { id: number }): Promise<CityWithRelations> => {
    return await cityRepository.findOneWithRelations(id);
  },
);

/**
 * Retrieves all cities without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListCitiesResult>} Unified response with data property containing array of cities
 * @throws {APIError} If retrieval fails
 */
export const listCities = api(
  { expose: true, method: 'POST', path: '/cities/list/all' },
  async (params: ListCitiesQueryParams): Promise<ListCitiesResult> => {
    const cities = params.searchTerm
      ? await cityRepository.search(params.searchTerm)
      : await cityRepository.findAll(params);
    return {
      data: cities,
    };
  },
);

/**
 * Retrieves cities with pagination and includes state and country information.
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListCitiesResult>} Unified paginated response with data and pagination properties including related state and country information
 * @throws {APIError} If retrieval fails
 */
export const listCitiesPaginated = api(
  { expose: true, method: 'POST', path: '/cities/list' },
  async (
    params: PaginatedListCitiesQueryParams,
  ): Promise<PaginatedListCitiesResult> => {
    const citiesResult = params.searchTerm
      ? await cityRepository.searchPaginated(params.searchTerm, params)
      : await cityRepository.findAllPaginated(params);

    return await cityRepository.appendRelations(
      citiesResult.data,
      citiesResult.pagination,
      params,
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
  { expose: true, method: 'PUT', path: '/cities/:id/update' },
  async ({
    id,
    ...data
  }: UpdateCityPayload & { id: number }): Promise<City> => {
    await validateCity(data, id);
    return await cityRepository.update(id, data);
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
  { expose: true, method: 'DELETE', path: '/cities/:id/delete' },
  async ({ id }: { id: number }): Promise<City> => {
    return await cityRepository.delete(id);
  },
);
