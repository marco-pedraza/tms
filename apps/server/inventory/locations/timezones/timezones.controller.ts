import { api } from 'encore.dev/api';
import type { Timezone, Timezones } from './timezones.types';
import { timezoneRepository } from './timezones.repository';

/**
 * Retrieves a timezone by its ID.
 * @param params - Object containing the timezone ID
 * @param params.id - The ID of the timezone to retrieve
 * @returns {Timezone} The found timezone
 * @throws {Error} If the timezone is not found
 */
export const getTimezone = api(
  { expose: true, method: 'GET', path: '/timezones/:id' },
  ({ id }: { id: string }): Timezone => {
    return timezoneRepository.findOne(id);
  },
);

/**
 * Retrieves all timezones.
 * @returns {Timezones} An object containing an array of timezones
 */
export const listTimezones = api(
  { expose: true, method: 'GET', path: '/timezones' },
  (): Timezones => {
    return timezoneRepository.findAll();
  },
);
