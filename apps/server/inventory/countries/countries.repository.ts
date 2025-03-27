import { countries } from './countries.schema';
import type {
  Country,
  CreateCountryPayload,
  UpdateCountryPayload,
  Countries,
} from './countries.types';
import { createBaseRepository } from '../../shared/base-repository';

const DEFAULT_ERROR_MESSAGE = 'Country with this name or code already exists';

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
  >(countries, 'Country');

  /**
   * Validates that both country name and code are unique
   * @param {string} name - The country name to validate
   * @param {string} code - The country code to validate
   * @param {number} [excludeId] - Optional ID to exclude from validation (for updates)
   * @throws {DuplicateError} If either name or code is already in use
   */
  const validateUniqueNameAndCode = async (
    name: string,
    code: string,
    excludeId?: number,
  ): Promise<void> => {
    await baseRepository.validateUniqueness(
      [
        { field: countries.name, value: name },
        { field: countries.code, value: code },
      ],
      excludeId,
      DEFAULT_ERROR_MESSAGE,
    );
  };

  /**
   * Creates a new country with unique name and code validation
   * @param {CreateCountryPayload} data - The country data to create
   * @returns {Promise<Country>} The created country
   */
  const create = async (data: CreateCountryPayload): Promise<Country> => {
    await validateUniqueNameAndCode(data.name, data.code);
    return baseRepository.create(data);
  };

  /**
   * Updates a country with unique name and code validation
   * @param {number} id - The ID of the country to update
   * @param {UpdateCountryPayload} data - The country data to update
   * @returns {Promise<Country>} The updated country
   */
  const update = async (
    id: number,
    data: UpdateCountryPayload,
  ): Promise<Country> => {
    if (data.name || data.code) {
      await validateUniqueNameAndCode(data.name || '', data.code || '', id);
    }
    return baseRepository.update(id, data);
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
