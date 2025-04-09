import { countries } from './countries.schema';
import type {
  Country,
  CreateCountryPayload,
  UpdateCountryPayload,
  Countries,
} from './countries.types';
import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/db';

/**
 * Creates a repository for managing country entities
 * @returns {Object} An object containing country-specific operations and base CRUD operations
 */
export const createCountryRepository = () => {
  const baseRepository = createBaseRepository<
    Country,
    CreateCountryPayload,
    UpdateCountryPayload,
    typeof countries
  >(db, countries, 'Country');

  /**
   * Creates a new country
   * @param {CreateCountryPayload} data - The country data to create
   * @returns {Promise<Country>} The created country
   */
  const create = async (data: CreateCountryPayload): Promise<Country> => {
    return await baseRepository.create(data);
  };

  /**
   * Updates a country
   * @param {number} id - The ID of the country to update
   * @param {UpdateCountryPayload} data - The country data to update
   * @returns {Promise<Country>} The updated country
   */
  const update = async (
    id: number,
    data: UpdateCountryPayload,
  ): Promise<Country> => {
    return await baseRepository.update(id, data);
  };

  /**
   * Retrieves all countries
   * @returns {Promise<Countries>} Object containing array of countries
   */
  const findAll = async (): Promise<Countries> => {
    const countriesList = await baseRepository.findAll();
    return {
      countries: countriesList,
    };
  };

  return {
    ...baseRepository,
    create,
    update,
    findAll,
  };
};

// Export the country repository instance
export const countryRepository = createCountryRepository();
