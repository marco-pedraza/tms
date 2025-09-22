import { UTCDate } from '@date-fns/utc';
import { format, formatRelative } from 'date-fns';

/**
 * Parses a date string and formats it for input of type date
 * @param date - Date string with utc timezone, for example: 2025-09-15T00:00:00.000Z
 * @returns Date string in format: yyyy-MM-dd, for example: 2025-09-15. Useful as value for input of type date.
 */
export function parseAndFormatDateForInput(date: string) {
  return format(new UTCDate(date), 'yyyy-MM-dd');
}

/**
 * Parses a date string and formats it for humans.
 *
 * @param date - Date string with utc timezone, for example: 2025-09-15T00:00:00.000Z
 * @returns string - With format: dd 'de' MMMM 'de' yyyy, for example: 15 de septiembre de 2025.
 */
export function parseAndFormatDateForHumans(date: string) {
  return format(new UTCDate(date), "dd 'de' MMMM 'de' yyyy");
}

/**
 * Parses a date string and formats it for humans relative to the current date.
 *
 * @param date - Date string with utc timezone, for example: 2025-09-15T00:00:00.000Z
 * @returns string - With format: dd 'de' MMMM 'de' yyyy, for example: 15 de septiembre de 2025.
 */
export function parseAndFormatDateForHumansRelative(date: string) {
  return formatRelative(new UTCDate(date), new Date());
}
