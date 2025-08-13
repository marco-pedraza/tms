import { api } from 'encore.dev/api';
import type {
  Country,
  CreateCountryPayload,
  ListCountriesQueryParams,
  ListCountriesResult,
  PaginatedListCountriesQueryParams,
  PaginatedListCountriesResult,
  UpdateCountryPayload,
} from './countries.types';
import { countryRepository } from './countries.repository';
import { validateCountry } from './countries.domain';

/**
 * Creates a new country.
 * @param params - The country data to create
 * @returns {Promise<Country>} The created country
 * @throws {APIError} If the country creation fails
 */
export const createCountry = api(
  { expose: true, method: 'POST', path: '/countries/create' },
  async (params: CreateCountryPayload): Promise<Country> => {
    await validateCountry(params);
    return await countryRepository.create(params);
  },
);

/**
 * Retrieves a country by its ID.
 * @param params - Object containing the country ID
 * @param params.id - The ID of the country to retrieve
 * @returns {Promise<Country>} The found country
 * @throws {APIError} If the country is not found or retrieval fails
 */
export const getCountry = api(
  { expose: true, method: 'GET', path: '/countries/:id' },
  async ({ id }: { id: number }): Promise<Country> => {
    return await countryRepository.findOne(id);
  },
);

/**
 * Retrieves all countries without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListCountriesResult>} Unified response with data property containing array of countries
 * @throws {APIError} If retrieval fails
 */
export const listCountries = api(
  { expose: true, method: 'POST', path: '/countries/list/all' },
  async (params: ListCountriesQueryParams): Promise<ListCountriesResult> => {
    const countries = await countryRepository.findAll(params);
    return {
      data: countries,
    };
  },
);

/**
 * Retrieves countries with pagination (useful for tables).
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListCountriesResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listCountriesPaginated = api(
  { expose: true, method: 'POST', path: '/countries/list' },
  async (
    params: PaginatedListCountriesQueryParams,
  ): Promise<PaginatedListCountriesResult> => {
    return await countryRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing country.
 * @param params - Object containing the country ID and update data
 * @param params.id - The ID of the country to update
 * @returns {Promise<Country>} The updated country
 * @throws {APIError} If the country is not found or update fails
 */
export const updateCountry = api(
  { expose: true, method: 'PUT', path: '/countries/:id/update' },
  async ({
    id,
    ...data
  }: UpdateCountryPayload & { id: number }): Promise<Country> => {
    await validateCountry(data, id);
    return await countryRepository.update(id, data);
  },
);

/**
 * Deletes a country by its ID.
 * @param params - Object containing the country ID
 * @param params.id - The ID of the country to delete
 * @returns {Promise<Country>} The deleted country
 * @throws {APIError} If the country is not found or deletion fails
 */
export const deleteCountry = api(
  { expose: true, method: 'DELETE', path: '/countries/:id/delete' },
  async ({ id }: { id: number }): Promise<Country> => {
    return await countryRepository.delete(id);
  },
);
