/**
 * Shared utility functions
 */

function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Creates a URL-friendly slug from a string
 *
 * @param source - The source string to create a slug from
 * @param prefix - Optional prefix to add to the slug (will be separated by a hyphen)
 * @returns A normalized, URL-friendly slug in kebab-case format
 */
export const createSlug = (
  source: string,
  prefix?: string,
  suffix?: string,
): string => {
  // Convert to lowercase
  let slug = source.toLowerCase();

  // Remove accents/diacritics
  slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Replace spaces with hyphens
  slug = slug.replace(/\s+/g, '-');

  // Remove any remaining non-alphanumeric characters
  slug = slug.replace(/[^a-z0-9-]/g, '');

  // Remove duplicate hyphens
  slug = slug.replace(/-+/g, '-');

  // Remove leading and trailing hyphens
  slug = slug.replace(/^-|-$/g, '');

  // Add prefix if provided
  if (prefix) {
    // Convert prefix to lowercase and remove special characters and hyphens
    const formattedPrefix = normalizeString(prefix);
    slug = `${formattedPrefix}-${slug}`;
  }

  // Add suffix if provided
  if (suffix) {
    // Convert suffix to lowercase and remove special characters and hyphens
    const formattedSuffix = normalizeString(suffix);
    slug = `${slug}-${formattedSuffix}`;
  }

  return slug;
};

/**
 * Helper function to compare two string arrays for equality regardless of order
 * @param arr1 - First array to compare
 * @param arr2 - Second array to compare
 * @returns True if arrays contain the same elements regardless of order
 */
export function arraysEqual(arr1: string[], arr2: string[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }

  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();

  return sorted1.every((value, index) => value === sorted2[index]);
}
