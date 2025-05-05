import { api } from 'encore.dev/api';
import { countryRepository } from './countries.repository';
import type {
  CreateCountryPayload,
  UpdateCountryPayload,
  Country,
  Countries,
  PaginatedCountries,
  PaginationParamsCountries,
  CountriesQueryOptions,
} from './countries.types';

/**
 * Creates a new country.
 * @param params - The country data to create
 * @returns {Promise<Country>} The created country
 * @throws {APIError} If the country creation fails
 */
export const createCountry = api(
  { expose: true, method: 'POST', path: '/countries' },
  async (params: CreateCountryPayload): Promise<Country> => {
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
 * @returns {Promise<Countries>} An object containing an array of countries
 * @throws {APIError} If retrieval fails
 */
export const listCountries = api(
  { expose: true, method: 'POST', path: '/get-countries' },
  async (params: CountriesQueryOptions): Promise<Countries> => {
    const countries = await countryRepository.findAll(params);
    return {
      countries,
    };
  },
);

/**
 * Retrieves countries with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedCountries>} Paginated list of countries
 * @throws {APIError} If retrieval fails
 */
export const listCountriesPaginated = api(
  { expose: true, method: 'POST', path: '/get-countries/paginated' },
  async (params: PaginationParamsCountries): Promise<PaginatedCountries> => {
    return await countryRepository.findAllPaginated(params);
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
  { expose: true, method: 'DELETE', path: '/countries/:id' },
  async ({ id }: { id: number }): Promise<Country> => {
    return await countryRepository.delete(id);
  },
);

/**
 * Searches for countries by matching a search term against name and code.
 * @param params - Search parameters
 * @param params.term - The search term to match against country name and code
 * @returns {Promise<Countries>} List of matching countries
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchCountries = api(
  { expose: true, method: 'GET', path: '/countries/search' },
  async ({ term }: { term: string }): Promise<Countries> => {
    const countries = await countryRepository.search(term);
    return {
      countries,
    };
  },
);

/**
 * Searches for countries with pagination by matching a search term against name and code.
 * @param params - Search and pagination parameters
 * @param params.term - The search term to match against country name and code
 * @param params.page - Page number for pagination (optional, default: 1)
 * @param params.pageSize - Number of items per page (optional, default: 10)
 * @param params.orderBy - Sorting criteria (optional)
 * @param params.filters - Additional filters to apply (optional)
 * @returns {Promise<PaginatedCountries>} Paginated list of matching countries
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchCountriesPaginated = api(
  { expose: true, method: 'POST', path: '/countries/search/paginated' },
  async ({
    term,
    ...params
  }: PaginationParamsCountries & {
    term: string;
  }): Promise<PaginatedCountries> => {
    return await countryRepository.searchPaginated(term, params);
  },
);
