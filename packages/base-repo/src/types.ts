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

/**
 * Type for a database or transaction, allows to swap between a regular database and a transaction to create a transactional repository
 */
export type TransactionalDB = DrizzleDB | DrizzleTransaction;

/**
 * Extract column names from a table, only includes actual columns
 */
export type ColumnFieldNames<TTable> = TTable extends { $inferSelect: infer U }
  ? keyof U
  : Extract<keyof TTable, string>;

/**
 * Type for ordering options
 */
export type OrderBy<TTable> = {
  field: ColumnFieldNames<TTable>;
  direction: 'asc' | 'desc';
}[];

/**
 * Simple filters type for filtering query results by matching fields
 */
export type Filters<T> = {
  [K in keyof T]?: T[K];
};

/**
 * Options for querying entities
 * @template TFilters - The type of filters that can be applied
 */
export interface QueryOptions<T, TTable> {
  orderBy?: OrderBy<TTable>;
  filters?: Filters<T>;
}

/**
 * Type for searchable fields
 */
export type SearchableFields = PgColumn[];

/**
 * Repository configuration options
 */
export interface RepositoryConfig {
  /** Fields that can be searched with search and searchPaginated methods */
  searchableFields?: SearchableFields;
}

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
 * Query options combining pagination and ordering
 */
export interface PaginationParams<T, TTable> {
  page?: number;
  pageSize?: number;
  orderBy?: OrderBy<TTable>;
  filters?: Filters<T>;
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
  db: TransactionalDB,
) => SQL<unknown>;

/**
 * Represents a scope factory function that returns a scope function
 * @template TTable - The database table type
 */
export type ScopeFactoryFunction<TTable extends TableWithId> = (
  ...args: unknown[]
) => ScopeFunction<TTable>;

/**
 * Collection of named scope functions
 * @template TTable - The database table type
 */
export type ScopesConfig<TTable extends TableWithId> = {
  [key: string]: ScopeFunction<TTable> | ScopeFactoryFunction<TTable>;
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
  findAll(options?: QueryOptions<T, TTable>): Promise<T[]>;
  findAllBy(
    field: PgColumn,
    value: unknown,
    options?: QueryOptions<T, TTable>,
  ): Promise<T[]>;
  findAllPaginated(query?: PaginationParams<T, TTable>): Promise<{
    data: T[];
    pagination: PaginationMeta;
  }>;
  create(data: CreateT): Promise<T>;
  update(id: number, data: UpdateT): Promise<T>;
  delete(id: number): Promise<T>;
  deleteAll(): Promise<number>;
  findBy<K extends keyof T>(field: PgColumn, value: T[K]): Promise<T | null>;
  findByPaginated<K extends keyof T>(
    field: PgColumn,
    value: T[K],
    query?: PaginationParams<T, TTable>,
  ): Promise<{
    data: T[];
    pagination: PaginationMeta;
  }>;
  existsBy<K extends keyof T>(
    field: PgColumn,
    value: T[K],
    excludeId?: number,
  ): Promise<boolean>;
  validateUniqueness(
    fields: UniqueFieldConfig<TTable>[],
    excludeId?: number,
    errorMessage?: string,
  ): Promise<void>;
  validateRelationExists(
    relatedTable: TableWithId,
    relationId: number,
    relationName?: string,
  ): Promise<void>;
  transaction<R>(
    callback: (
      txRepo: BaseRepository<T, CreateT, UpdateT, TTable>,
    ) => Promise<R>,
  ): Promise<R>;
  search(term: string): Promise<T[]>;
  searchPaginated(
    term: string,
    query?: PaginationParams<T, TTable>,
  ): Promise<{
    data: T[];
    pagination: PaginationMeta;
  }>;
  /**
   * Builds query conditions and ordering without executing the query
   * @param params - Parameters for building the query
   * @returns SQL expressions for where conditions and ordering
   */
  buildQueryExpressions(
    params?: QueryOptions<T, TTable> & { searchTerm?: string },
  ): {
    baseWhere?: SQL;
    baseOrderBy?: SQL[];
  };
  __internal?: {
    db: TransactionalDB;
    table: TTable;
    config?: RepositoryConfig;
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
> extends Omit<
    BaseRepository<T, CreateT, UpdateT, TTable>,
    'transaction' | 'search' | 'searchPaginated'
  > {
  scope(
    scopeParams: ScopeParams,
  ): ScopedRepository<T, CreateT, UpdateT, TTable>;
  transaction<R>(
    callback: (
      txRepo: ScopedRepository<T, CreateT, UpdateT, TTable>,
    ) => Promise<R>,
  ): Promise<R>;
  search(term: string): Promise<T[]>;
  searchPaginated(
    term: string,
    params?: PaginationParams<T, TTable>,
  ): Promise<{
    data: T[];
    pagination: PaginationMeta;
  }>;
}

/**
 * Internal state for the scoped repository
 * @template TTable - The database table type
 */
export interface ScopeState<TTable extends TableWithId> {
  conditions: SQL<unknown>[];
}
