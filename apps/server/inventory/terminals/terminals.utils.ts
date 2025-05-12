import { ValidationError } from '../../shared/errors';
import { OperatingHours, TimeSlot } from './terminals.types';

/**
 * Regular expression for validating time in 24-hour format (HH:MM)
 */
export const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Validates if a string is a valid time in 24-hour format (HH:MM)
 * @param time - Time string to validate
 * @returns Whether the time is in valid format
 */
export function isValidTimeFormat(time: string): boolean {
  return TIME_FORMAT_REGEX.test(time);
}

/**
 * Converts time string (HH:MM) to minutes for comparison
 * @param time - Time string in format HH:MM
 * @returns Total minutes (hours * 60 + minutes)
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Validates a time slot to ensure open time is before close time
 * @param slot - Time slot with open and close times
 * @returns Whether the time slot is valid
 */
export function isValidTimeSlot(slot: TimeSlot): boolean {
  if (!slot?.open || !slot.close) {
    return false;
  }

  if (!isValidTimeFormat(slot.open) || !isValidTimeFormat(slot.close)) {
    return false;
  }

  // Convert times to minutes for comparison
  const openMinutes = timeToMinutes(slot.open);
  const closeMinutes = timeToMinutes(slot.close);

  // Allow for overnight hours (when close time is less than open time)
  // or exact 24 hours (close at midnight)
  return openMinutes < closeMinutes || slot.close === '00:00';
}

/**
 * Days of the week for operating hours
 */
export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

/**
 * Validates operating hours time slots
 * @param hours - Operating hours object
 * @throws {ValidationError} If any time slot is invalid
 */
export function validateOperatingHours(hours: OperatingHours): void {
  if (!hours) return;

  for (const day of DAYS_OF_WEEK) {
    const timeSlots = hours[day as keyof OperatingHours];

    if (!timeSlots) continue;

    if (Array.isArray(timeSlots)) {
      // New format: array of time slots
      for (const slot of timeSlots) {
        if (!isValidTimeSlot(slot)) {
          throw new ValidationError(
            `Invalid time format for ${day}. Use HH:MM format (24-hour) with valid time values.`,
          );
        }
      }
    } else if (typeof timeSlots === 'object') {
      // Legacy format: single time slot as object
      if (!isValidTimeSlot(timeSlots as unknown as TimeSlot)) {
        throw new ValidationError(
          `Invalid time format for ${day}. Use HH:MM format (24-hour) with valid time values.`,
        );
      }
    } else {
      // Anything that is not an object/array is definitely invalid
      throw new ValidationError(
        `Invalid value for ${day}. Expected an array or object of time slots.`,
      );
    }
  }
}
