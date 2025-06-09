import { api } from 'encore.dev/api';
import type { Facilities, Facility } from './facilities.types';
import { facilityRepository } from './facilities.repository';

/**
 * Retrieves a facility by its code.
 * @param params - Object containing the facility code
 * @param params.code - The code of the facility to retrieve
 * @returns {Facility} The found facility
 * @throws {NotFoundError} If the facility is not found
 */
export const getFacility = api(
  { expose: true, method: 'GET', path: '/facilities/:code' },
  ({ code }: { code: string }): Facility => {
    return facilityRepository.findOne(code);
  },
);

/**
 * Retrieves all facilities.
 * @returns {Facilities} An object containing an array of facilities
 */
export const listFacilities = api(
  { expose: true, method: 'GET', path: '/facilities' },
  (): Facilities => {
    return facilityRepository.findAll();
  },
);
