import { expect, describe, test } from 'vitest';
import { listTimezones, getTimezone } from './timezones.controller';
import { AVAILABLE_TIMEZONES } from './timezones.constants';

describe('TimezoneController', () => {
  describe('listTimezones', () => {
    test('should return all timezones', async () => {
      const response = await listTimezones();

      expect(response).toHaveProperty('timezones');
      expect(Array.isArray(response.timezones)).toBe(true);
      expect(response.timezones.length).toBe(AVAILABLE_TIMEZONES.length);

      // Verify first timezone in list matches
      expect(response.timezones[0].id).toBe(AVAILABLE_TIMEZONES[0].id);
    });
  });

  describe('getTimezone', () => {
    test('should return a specific timezone by id', async () => {
      const testTimezoneId = AVAILABLE_TIMEZONES[0].id;
      const response = await getTimezone({ id: testTimezoneId });

      expect(response.id).toBe(testTimezoneId);
    });
  });
});
