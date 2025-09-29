/**
 * Base interface for domain entities that need persistence tracking
 * @template TEntity - The specific entity type (e.g., Pathway, PathwayOption)
 * @template TUpdatePayload - The payload type for updates
 */
export interface BaseDomainEntity<TEntity, TUpdatePayload> {
  /** ID (optional if not persisted yet) */
  readonly id?: number;

  /** Whether this entity has been persisted to the database */
  readonly isPersisted: boolean;

  /**
   * Saves the entity to the database if not already persisted
   * @returns A new entity instance with the persisted data
   */
  save(): Promise<TEntity>;

  /**
   * Updates the entity (only available for persisted entities)
   * @param payload - Update data
   * @returns A new entity instance with updated data
   */
  update(payload: TUpdatePayload): Promise<TEntity>;
}
