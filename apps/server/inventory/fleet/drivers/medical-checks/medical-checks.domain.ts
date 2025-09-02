/**
 * Normalizes a date to start of day in local timezone to avoid timezone issues
 * @param date - Date to normalize (string or Date object)
 * @returns Date object normalized to start of day in local timezone
 */
export function normalizeToStartOfDay(date: string | Date): Date {
  if (typeof date === 'string') {
    // If it's a string in YYYY-MM-DD format, parse it as local date
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }
    // Otherwise parse as usual and normalize
    const parsed = new Date(date);
    return new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
      0,
      0,
      0,
      0,
    );
  }

  // If it's already a Date object, normalize to start of day
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
}

/**
 * Calculates the next check date by adding days to the check date
 * @param checkDate - The date of the current check
 * @param daysUntilNextCheck - Number of days to add
 * @returns The calculated next check date as ISO string
 */
export function calculateNextCheckDate(
  checkDate: string | Date,
  daysUntilNextCheck: number,
): string {
  const baseDate = normalizeToStartOfDay(checkDate);
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + daysUntilNextCheck);
  return nextDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}
