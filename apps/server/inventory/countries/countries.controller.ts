import { api } from 'encore.dev/api';
import { countryHandler } from './countries.handler';
import type {
  CreateCountryDto,
  UpdateCountryDto,
  CountryResponse,
  CountriesResponse,
} from './countries.types';
import { parseApiError } from '../../shared/errors';

/**
 * Creates a new country.
 * @param params - The country data to create
 * @returns {Promise<CountryResponse>} The created country
 * @throws {APIError} If the country creation fails
 */
export const createCountry = api(
  { method: 'POST', path: '/countries' },
  async (params: CreateCountryDto): Promise<CountryResponse> => {
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
 * @returns {Promise<CountryResponse>} The found country
 * @throws {APIError} If the country is not found or retrieval fails
 */
export const getCountry = api(
  { method: 'GET', path: '/countries/:id' },
  async ({ id }: { id: number }): Promise<CountryResponse> => {
    try {
      return await countryHandler.findOne(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves all countries.
 * @returns {Promise<CountriesResponse>} An object containing an array of countries
 * @throws {APIError} If the retrieval fails
 */
export const listCountries = api(
  { method: 'GET', path: '/countries' },
  async (): Promise<CountriesResponse> => {
    try {
      const { countries } = await countryHandler.findAll();
      return { countries };
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
 * @returns {Promise<CountryResponse>} The updated country
 * @throws {APIError} If the country is not found or update fails
 */
export const updateCountry = api(
  { method: 'PUT', path: '/countries/:id' },
  async ({
    id,
    ...data
  }: UpdateCountryDto & { id: number }): Promise<CountryResponse> => {
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
 * @returns {Promise<CountryResponse>} The deleted country
 * @throws {APIError} If the country is not found or deletion fails
 */
export const deleteCountry = api(
  { method: 'DELETE', path: '/countries/:id' },
  async ({ id }: { id: number }): Promise<CountryResponse> => {
    try {
      return await countryHandler.delete(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);
