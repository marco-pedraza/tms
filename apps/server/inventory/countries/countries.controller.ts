import { api } from 'encore.dev/api';
import { countryHandler } from './countries.handler';
import type {
  CreateCountryPayload,
  UpdateCountryPayload,
  Country,
  PaginatedCountries,
} from './countries.types';
import { parseApiError } from '../../shared/errors';
import { PaginationParams } from '../../shared/types';

/**
 * Creates a new country.
 * @param params - The country data to create
 * @returns {Promise<Country>} The created country
 * @throws {APIError} If the country creation fails
 */
export const createCountry = api(
  { expose: true, method: 'POST', path: '/countries' },
  async (params: CreateCountryPayload): Promise<Country> => {
    try {
      return await countryHandler.create(params);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
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
    try {
      return await countryHandler.findOne(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves countries with pagination.
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedCountries>} Paginated list of countries
 * @throws {APIError} If retrieval fails
 */
export const listCountries = api(
  { expose: true, method: 'GET', path: '/countries/paginated' },
  async (params: PaginationParams): Promise<PaginatedCountries> => {
    try {
      return await countryHandler.findAll(params);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Updates an existing country.
 * @param params - Object containing the country ID and update data
 * @param params.id - The ID of the country to update
 * @param params.data - The country data to update
 * @returns {Promise<Country>} The updated country
 * @throws {APIError} If the country is not found or update fails
 */
export const updateCountry = api(
  { expose: true, method: 'PUT', path: '/countries/:id' },
  async ({
    id,
    ...data
  }: UpdateCountryPayload & { id: number }): Promise<Country> => {
    try {
      return await countryHandler.update(id, data);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
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
  { expose: true, method: 'DELETE', path: '/countries/:id' },
  async ({ id }: { id: number }): Promise<Country> => {
    try {
      return await countryHandler.delete(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);
