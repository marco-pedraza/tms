/**
 * Determines if an entity is persisted based on its ID
 * @param id - The entity ID (can be number, null, or undefined)
 * @returns true if the entity is persisted (has a valid ID), false otherwise
 */
export function isEntityPersisted(id: number | null | undefined): boolean {
  return id !== undefined && id !== null && id > 0;
}

/**
 * Ensures an entity is persisted before allowing operations
 * @param isPersisted - Whether the entity is persisted
 * @param errorMessage - Custom error message (optional)
 * @throws {Error} If the entity is not persisted
 */
export function requirePersisted(
  isPersisted: boolean,
  errorMessage = 'Operation requires a persisted entity',
): void {
  if (!isPersisted) {
    throw new Error(errorMessage);
  }
}

/**
 * Mixin object with common entity utilities
 * Use this to avoid repeated imports in entity factories
 */
export const EntityUtils = {
  isEntityPersisted,
  requirePersisted,
} as const;
