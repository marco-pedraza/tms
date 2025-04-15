import { AVAILABLE_TIMEZONES } from './timezones.constants';
import { Timezone, Timezones } from './timezones.types';

/**
 * Repository for managing timezone data
 * Uses static data instead of database access
 */
export const timezoneRepository = {
  /**
   * Returns all available timezones
   * @returns {Timezones} List of timezones wrapped in an object
   */
  findAll(): Timezones {
    return {
      timezones: AVAILABLE_TIMEZONES,
    };
  },

  /**
   * Returns a specific timezone by ID
   * @param {string} id - The timezone identifier to look for
   * @returns {Timezone} The timezone if found
   * @throws {Error} If the timezone is not found
   */
  findOne(id: string): Timezone {
    const timezone = AVAILABLE_TIMEZONES.find((timezone) => timezone.id === id);

    if (!timezone) {
      throw new Error(`Timezone with id ${id} not found`);
    }

    return timezone;
  },
};
