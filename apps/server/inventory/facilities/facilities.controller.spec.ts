import { describe, expect, it } from 'vitest';
import { NotFoundError } from '../../shared/errors';
import { AVAILABLE_FACILITIES } from './facilities.constants';
import { getFacility, listFacilities } from './facilities.controller';

describe('Facilities Controller', () => {
  describe('listFacilities', () => {
    it('should return all available facilities', async () => {
      const result = await listFacilities();

      expect(result).toEqual({
        facilities: AVAILABLE_FACILITIES,
      });
      expect(result.facilities).toHaveLength(AVAILABLE_FACILITIES.length);
    });
  });

  describe('getFacility', () => {
    it('should return a facility when valid code is provided', async () => {
      const facilityCode = 'restaurant';
      const result = await getFacility({ code: facilityCode });

      expect(result).toEqual({
        code: 'restaurant',
        name: 'Restaurante',
      });
    });

    it('should throw error when facility code does not exist', () => {
      const invalidCode = 'invalid_facility';

      expect(() => getFacility({ code: invalidCode })).toThrow(NotFoundError);
    });
  });
});
