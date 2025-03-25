import { db } from '../db';
import { NotFoundError, ValidationError } from './errors';
import { eq, and, count } from 'drizzle-orm';
import type { PaginationParams } from './types';

/**
 * Base handler class with common CRUD operations
 */
export class BaseHandler<T, CreateT, UpdateT> {
  constructor(
    protected table: unknown,
    protected entityName: string,
  ) {}

  /**
   * Finds an entity by ID
   * @param id - ID of the entity to find
   * @returns Found entity
   * @throws {NotFoundError} If the entity is not found
   */
  async findOne(id: number): Promise<T> {
    const [entity] = await db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);

    if (!entity) {
      throw new NotFoundError(`${this.entityName} with id ${id} not found`);
    }

    return entity;
  }

  /**
   * Finds all entities
   * @returns All entities
   */
  async findAll(): Promise<T[]> {
    return await db.select().from(this.table);
  }

  /**
   * Finds all entities with pagination
   * @param params - Pagination parameters
   * @returns Paginated entities
   */
  async findAllPaginated(
    params: PaginationParams,
  ): Promise<{ data: T[]; pagination: unknown }> {
    const { page = 1, pageSize = 10 } = params;
    const offset = (page - 1) * pageSize;

    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(this.table);

    const result = await db
      .select()
      .from(this.table)
      .limit(pageSize)
      .offset(offset);

    return {
      data: result,
      pagination: {
        page,
        pageSize,
        totalItems: Number(totalCount),
        totalPages: Math.ceil(Number(totalCount) / pageSize),
      },
    };
  }

  /**
   * Creates a new entity
   * @param data - Entity data to create
   * @returns Created entity
   */
  async create(data: CreateT): Promise<T> {
    try {
      const [entity] = await db.insert(this.table).values(data).returning();
      return entity;
    } catch (error) {
      throw new ValidationError(
        `Failed to create ${this.entityName}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Updates an entity
   * @param id - ID of the entity to update
   * @param data - Entity data to update
   * @returns Updated entity
   * @throws {NotFoundError} If the entity is not found
   */
  async update(id: number, data: UpdateT): Promise<T> {
    await this.findOne(id);

    const [entity] = await db
      .update(this.table)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(this.table.id, id))
      .returning();

    return entity;
  }

  /**
   * Deletes an entity
   * @param id - ID of the entity to delete
   * @returns Deleted entity
   * @throws {NotFoundError} If the entity is not found
   */
  async delete(id: number): Promise<T> {
    await this.findOne(id);

    const [entity] = await db
      .delete(this.table)
      .where(eq(this.table.id, id))
      .returning();

    return entity;
  }

  /**
   * Finds an entity by a specific field
   * @param field - Field to search by
   * @param value - Value to search for
   * @returns Found entity or null if not found
   */
  protected async findByField<V>(field: unknown, value: V): Promise<T | null> {
    const [entity] = await db
      .select()
      .from(this.table)
      .where(eq(field, value))
      .limit(1);

    return entity || null;
  }

  /**
   * Checks if an entity with a specific field value exists
   * @param field - Field to check
   * @param value - Value to check for
   * @param excludeId - Optional ID to exclude from the check
   * @returns True if entity exists, false otherwise
   */
  protected async existsByField<V>(
    field: unknown,
    value: V,
    excludeId?: number,
  ): Promise<boolean> {
    try {
      const query = excludeId
        ? and(eq(field, value), eq(this.table.id, excludeId).not())
        : eq(field, value);

      const [result] = await db
        .select({ count: count() })
        .from(this.table)
        .where(query);

      return Number(result.count) > 0;
    } catch (error) {
      console.error(`Error checking if field exists: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Re-throw a more specific error instead of a generic one
      throw new Error(`Failed to check if ${this.entityName} exists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
