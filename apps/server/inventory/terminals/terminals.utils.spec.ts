import { expect, describe, it } from 'vitest';
import { ValidationError } from '../../shared/errors';
import {
  isValidTimeFormat,
  isValidTimeSlot,
  validateOperatingHours,
  timeToMinutes,
} from './terminals.utils';
import { OperatingHours, TimeSlot } from './terminals.types';

describe('Terminal Utils', () => {
  describe('isValidTimeFormat', () => {
    it('should validate correct time formats', () => {
      expect(isValidTimeFormat('08:00')).toBe(true);
      expect(isValidTimeFormat('15:30')).toBe(true);
      expect(isValidTimeFormat('23:59')).toBe(true);
      expect(isValidTimeFormat('00:00')).toBe(true);
    });

    it('should reject invalid time formats', () => {
      expect(isValidTimeFormat('8:00')).toBe(false); // Missing leading zero
      expect(isValidTimeFormat('24:00')).toBe(false); // Hour out of range
      expect(isValidTimeFormat('12:60')).toBe(false); // Minute out of range
      expect(isValidTimeFormat('12.30')).toBe(false); // Wrong separator
      expect(isValidTimeFormat('12:3')).toBe(false); // Missing minute digit
      expect(isValidTimeFormat('')).toBe(false); // Empty string
    });
  });

  describe('timeToMinutes', () => {
    it('should convert time to minutes correctly', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('01:00')).toBe(60);
      expect(timeToMinutes('01:30')).toBe(90);
      expect(timeToMinutes('13:45')).toBe(13 * 60 + 45);
      expect(timeToMinutes('23:59')).toBe(23 * 60 + 59);
    });
  });

  describe('isValidTimeSlot', () => {
    it('should validate time slots with open time before close time', () => {
      expect(isValidTimeSlot({ open: '08:00', close: '20:00' })).toBe(true);
      expect(isValidTimeSlot({ open: '00:00', close: '23:59' })).toBe(true);
      expect(isValidTimeSlot({ open: '08:30', close: '08:45' })).toBe(true);
    });

    it('should allow closing at midnight (00:00)', () => {
      expect(isValidTimeSlot({ open: '08:00', close: '00:00' })).toBe(true);
    });

    it('should reject invalid time slots', () => {
      expect(isValidTimeSlot({ open: '20:00', close: '08:00' })).toBe(false); // Close before open
      expect(isValidTimeSlot({ open: 'invalid', close: '20:00' })).toBe(false); // Invalid open time
      expect(isValidTimeSlot({ open: '08:00', close: 'invalid' })).toBe(false); // Invalid close time
      expect(isValidTimeSlot({} as TimeSlot)).toBe(false); // Missing times
      expect(isValidTimeSlot({ open: '08:00' } as TimeSlot)).toBe(false); // Missing close time
      expect(isValidTimeSlot({ close: '20:00' } as TimeSlot)).toBe(false); // Missing open time
    });
  });

  describe('validateOperatingHours', () => {
    it('should validate valid operating hours with arrays', () => {
      const operatingHours: OperatingHours = {
        monday: [{ open: '08:00', close: '20:00' }],
        tuesday: [
          { open: '08:00', close: '12:00' },
          { open: '13:00', close: '20:00' },
        ],
        wednesday: [{ open: '08:00', close: '20:00' }],
      };

      expect(() => {
        validateOperatingHours(operatingHours);
      }).not.toThrow();
    });

    it('should validate valid operating hours with legacy format', () => {
      const operatingHours = {
        monday: { open: '08:00', close: '20:00' },
        tuesday: { open: '08:00', close: '20:00' },
      };

      expect(() => {
        validateOperatingHours(operatingHours as unknown as OperatingHours);
      }).not.toThrow();
    });

    it('should throw ValidationError for invalid operating hours', () => {
      const operatingHours: OperatingHours = {
        monday: [{ open: '08:00', close: '20:00' }],
        tuesday: [{ open: '25:00', close: '20:00' }], // Invalid time
      };

      expect(() => {
        validateOperatingHours(operatingHours);
      }).toThrow(ValidationError);
      expect(() => {
        validateOperatingHours(operatingHours);
      }).toThrow(/Invalid time format for tuesday/);
    });

    it('should throw ValidationError for non-object/array time slots', () => {
      const invalidOperatingHours = {
        monday: [{ open: '08:00', close: '20:00' }],
        tuesday: 'invalid value', // Invalid type
      } as unknown as OperatingHours;

      expect(() => {
        validateOperatingHours(invalidOperatingHours);
      }).toThrow(ValidationError);
      expect(() => {
        validateOperatingHours(invalidOperatingHours);
      }).toThrow(/Invalid value for tuesday/);
    });

    it('should throw ValidationError for invalid legacy format', () => {
      const operatingHours = {
        monday: { open: '08:00', close: '20:00' },
        tuesday: { open: '08:00', close: '25:00' }, // Invalid time
      };

      expect(() => {
        validateOperatingHours(operatingHours as unknown as OperatingHours);
      }).toThrow(ValidationError);
      expect(() => {
        validateOperatingHours(operatingHours as unknown as OperatingHours);
      }).toThrow(/Invalid time format for tuesday/);
    });

    it('should handle empty or undefined days', () => {
      const operatingHours: OperatingHours = {
        monday: [{ open: '08:00', close: '20:00' }],
        // Tuesday is undefined
        wednesday: [], // Empty array
      };

      expect(() => {
        validateOperatingHours(operatingHours);
      }).not.toThrow();
    });

    it('should handle null or undefined operating hours', () => {
      expect(() => {
        validateOperatingHours(null as unknown as OperatingHours);
      }).not.toThrow();
      expect(() => {
        validateOperatingHours(undefined as unknown as OperatingHours);
      }).not.toThrow();
    });
  });
});
