import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgColumn, PgTable, PgTransaction } from 'drizzle-orm/pg-core';
import { SQL } from 'drizzle-orm';

/**
 * Type for the database query builder
 * This encapsulates NodePgDatabase to avoid Symbol.iterator TypeScript errors
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DrizzleDB = NodePgDatabase<any>;

/**
 * Type for query results from Drizzle operations
 * Used to provide a specific type for query operations
 */
export type DrizzleQueryResult<T> = T;

/**
 * Type for Drizzle transactions
 * This is a wrapper around the PgTransaction type to avoid Symbol.iterator TypeScript errors
 */
export type DrizzleTransaction = PgTransaction<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  Record<string, never>,
  Record<string, never>
>;

export type TransactionalDB = DrizzleDB | DrizzleTransaction;

/**
 * Generic type for paginated results
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  /** Current page number (1-based) */
  currentPage: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items across all pages */
  totalCount: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page available */
  hasNextPage: boolean;
  /** Whether there is a previous page available */
  hasPreviousPage: boolean;
}

/**
 * Parameters for pagination requests
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Column to sort by */
  sortBy?: string;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

export type TableWithId = PgTable & {
  id: PgColumn;
};

/**
 * Represents a column from a specific table
 */
export type TableColumn<TTable> = {
  [K in keyof TTable]: TTable[K] extends PgColumn ? TTable[K] : never;
}[keyof TTable];

/**
 * Configuration for validating unique fields in an entity
 * @template TTable - The database table type
 */
export type UniqueFieldConfig<TTable extends TableWithId> = {
  /**
   * The database column to check for uniqueness
   */
  field: TableColumn<TTable>;
  /**
   * The value to check for uniqueness
   */
  value: unknown;
  /**
   * Optional scope for the uniqueness check
   */
  scope?: {
    field: TableColumn<TTable>;
    value: unknown;
  };
};

/**
 * Represents a scope function that returns an SQL condition
 * @template TTable - The database table type
 */
export type ScopeFunction<TTable extends TableWithId> = (
  table: TTable,
  db: DrizzleDB,
) => SQL<unknown>;

/**
 * Collection of named scope functions
 * @template TTable - The database table type
 */
export type ScopesConfig<TTable extends TableWithId> = {
  [key: string]:
    | ScopeFunction<TTable>
    | ((...params: unknown[]) => ScopeFunction<TTable>);
};

/**
 * Type for scope parameters - either a string name or an array with name and parameters
 */
export type ScopeParams = string | [string, ...unknown[]];

/**
 * Interface representing the base repository
 * @template T - The entity type
 * @template CreateT - The type for creating a new entity
 * @template UpdateT - The type for updating an existing entity
 * @template TTable - The database table type
 */
export interface BaseRepository<
  T,
  CreateT,
  UpdateT,
  TTable extends TableWithId,
> {
  findOne(id: number): Promise<T>;
  findAll(options?: {
    orderBy?: Array<{ field: PgColumn; direction: 'asc' | 'desc' }>;
  }): Promise<T[]>;
  findAllBy(
    field: PgColumn,
    value: unknown,
    options?: {
      orderBy?: Array<{ field: PgColumn; direction: 'asc' | 'desc' }>;
    },
  ): Promise<T[]>;
  findAllPaginated(params?: PaginationParams): Promise<{
    data: T[];
    pagination: PaginationMeta;
  }>;
  create(data: CreateT): Promise<T>;
  update(id: number, data: UpdateT): Promise<T>;
  delete(id: number): Promise<T>;
  deleteAll(): Promise<number>;
  findBy(field: PgColumn, value: unknown): Promise<T | null>;
  findByPaginated(
    field: PgColumn,
    value: unknown,
    params?: PaginationParams,
  ): Promise<{
    data: T[];
    pagination: PaginationMeta;
  }>;
  existsBy(
    field: PgColumn,
    value: unknown,
    excludeId?: number,
  ): Promise<boolean>;
  validateUniqueness?(
    fields: UniqueFieldConfig<TTable>[],
    excludeId?: number,
    errorMessage?: string,
  ): Promise<void>;
  validateRelationExists?(
    relatedTable: TableWithId,
    relationId: number,
    relationName?: string,
  ): Promise<void>;
  transaction<R>(
    callback: (
      txRepo: BaseRepository<T, CreateT, UpdateT, TTable>,
    ) => Promise<R>,
  ): Promise<R>;
  // Internal state we need to access
  __internal?: {
    /**
     * Database connection instance
     * Using TransactionalDB type to support both regular DB and transaction contexts
     */
    db: TransactionalDB;
    /**
     * Table definition for the entity
     */
    table: TTable;
  };
}

/**
 * Base repository enhanced with scoping capabilities
 * @template T - The entity type
 * @template CreateT - The type for creating a new entity
 * @template UpdateT - The type for updating an existing entity
 * @template TTable - The database table type
 */
export interface ScopedRepository<
  T,
  CreateT,
  UpdateT,
  TTable extends TableWithId,
> extends BaseRepository<T, CreateT, UpdateT, TTable> {
  scope(
    scopeParams: ScopeParams,
  ): ScopedRepository<T, CreateT, UpdateT, TTable>;
}

/**
 * Internal state for the scoped repository
 * @template TTable - The database table type
 */
export interface ScopeState<TTable extends TableWithId> {
  conditions: SQL<unknown>[];
}
