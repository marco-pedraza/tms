import { api } from 'encore.dev/api';
import { countryRepository } from './countries.repository';
import type {
  CreateCountryPayload,
  UpdateCountryPayload,
  Country,
  Countries,
  PaginatedCountries,
} from './countries.types';
import { createControllerErrorHandler } from '../../shared/controller-utils';
import { PaginationParams } from '../../shared/types';

const withErrorHandling = createControllerErrorHandler('CountriesController');

/**
 * Creates a new country.
 * @param params - The country data to create
 * @returns {Promise<Country>} The created country
 * @throws {APIError} If the country creation fails
 */
export const createCountry = api(
  { expose: true, method: 'POST', path: '/countries' },
  async (params: CreateCountryPayload): Promise<Country> => {
    return withErrorHandling('createCountry', () =>
      countryRepository.create(params),
    );
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
    return withErrorHandling('getCountry', () => countryRepository.findOne(id));
  },
);

/**
 * Retrieves all countries without pagination (useful for dropdowns).
 * @returns {Promise<Countries>} An object containing an array of countries
 * @throws {APIError} If retrieval fails
 */
export const listCountries = api(
  { method: 'GET', path: '/countries' },
  async (): Promise<Countries> => {
    return withErrorHandling('listCountries', () =>
      countryRepository.findAll(),
    );
  },
);

/**
 * Retrieves countries with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedCountries>} Paginated list of countries
 * @throws {APIError} If retrieval fails
 */
export const listCountriesPaginated = api(
  { expose: true, method: 'GET', path: '/countries/paginated' },
  async (params: PaginationParams): Promise<PaginatedCountries> => {
    return withErrorHandling('listCountriesPaginated', () =>
      countryRepository.findAllPaginated(params),
    );
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
    return withErrorHandling('updateCountry', () =>
      countryRepository.update(id, data),
    );
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
    return withErrorHandling('deleteCountry', () =>
      countryRepository.delete(id),
    );
  },
);
