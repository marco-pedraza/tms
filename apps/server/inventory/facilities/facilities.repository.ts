import { NotFoundError } from '../../shared/errors';
import { Facilities, Facility } from './facilities.types';
import { AVAILABLE_FACILITIES } from './facilities.constants';

/**
 * Repository for managing facility data
 * Uses static data instead of database access
 */
export const facilityRepository = {
  /**
   * Returns all available facilities
   * @returns {Facilities} List of facilities wrapped in an object
   */
  findAll(): Facilities {
    return {
      facilities: AVAILABLE_FACILITIES,
    };
  },

  /**
   * Returns a specific facility by code
   * @param {string} code - The facility code to look for
   * @returns {Facility} The facility if found
   * @throws {NotFoundError} If the facility is not found
   */
  findOne(code: string): Facility {
    const facility = AVAILABLE_FACILITIES.find(
      (facility) => facility.code === code,
    );

    if (!facility) {
      throw new NotFoundError(`Facility with code ${code} not found`);
    }

    return facility;
  },

  /**
   * Validates if a facility code exists
   * @param {string} code - The facility code to validate
   * @returns {boolean} True if the facility exists, false otherwise
   */
  exists(code: string): boolean {
    return AVAILABLE_FACILITIES.some((facility) => facility.code === code);
  },

  /**
   * Validates multiple facility codes
   * @param {string[]} codes - Array of facility codes to validate
   * @returns {string[]} Array of invalid facility codes (empty if all are valid)
   */
  validateCodes(codes: string[]): string[] {
    return codes.filter((code) => !this.exists(code));
  },

  /**
   * Returns facilities by their codes
   * @param {string[]} codes - Array of facility codes to retrieve
   * @returns {Facility[]} Array of facility objects
   * @throws {NotFoundError} If any facility code is not found
   */
  findByCodes(codes: string[]): Facility[] {
    if (!codes || codes.length === 0) {
      return [];
    }

    const invalidCodes = this.validateCodes(codes);

    if (invalidCodes.length > 0) {
      throw new NotFoundError(
        `Facilities not found with codes: ${invalidCodes.join(', ')}`,
      );
    }

    return codes.map((code) =>
      AVAILABLE_FACILITIES.find((facility) => facility.code === code),
    ) as Facility[];
  },
};
