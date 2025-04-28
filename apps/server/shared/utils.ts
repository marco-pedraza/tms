/**
 * Utilities for creating and managing URL-friendly slugs
 */

/**
 * Creates a URL-friendly slug from a string
 *
 * @param source - The source string to create a slug from
 * @param prefix - Optional prefix to add to the slug (will be separated by a hyphen)
 * @returns A normalized, URL-friendly slug in kebab-case format
 */
export const createSlug = (source: string, prefix?: string): string => {
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
    const formattedPrefix = prefix.toLowerCase().replace(/[^a-z0-9]/g, '');
    slug = `${formattedPrefix}-${slug}`;
  }

  return slug;
};
