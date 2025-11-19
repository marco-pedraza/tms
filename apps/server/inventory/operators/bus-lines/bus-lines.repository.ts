import {
  NotFoundError,
  type TransactionalDB,
  createBaseRepository,
} from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { PaginationMeta } from '@/shared/types';
import { busLines } from './bus-lines.schema';
import type {
  BusLine,
  BusLineWithTransporterAndServiceType,
  CreateBusLinePayload,
  PaginatedListBusLinesQueryParams,
  PaginatedListBusLinesResult,
  UpdateBusLinePayload,
} from './bus-lines.types';

/**
 * Creates a repository for managing bus line entities
 * @returns {Object} An object containing bus line-specific operations and base CRUD operations
 */
export const createBusLineRepository = () => {
  const baseRepository = createBaseRepository<
    BusLine,
    CreateBusLinePayload,
    UpdateBusLinePayload,
    typeof busLines
  >(db, busLines, 'Bus Line', {
    searchableFields: [busLines.name, busLines.code],
    softDeleteEnabled: true,
  });

  /**
   * Finds a single bus line with its relations (transporter, serviceType)
   * @param id - The ID of the bus line to find
   * @param tx - Optional transaction instance
   * @returns The bus line with related transporter and service type
   * @throws {NotFoundError} If the bus line is not found
   */
  const findOneWithRelations = async (
    id: number,
    tx?: TransactionalDB,
  ): Promise<BusLineWithTransporterAndServiceType> => {
    const dbInstance = (tx as typeof db) ?? db;
    const line = await dbInstance.query.busLines.findFirst({
      where: (busLines, { eq, and, isNull }) =>
        and(eq(busLines.id, id), isNull(busLines.deletedAt)),
      with: {
        transporter: true,
        serviceType: true,
      },
    });

    if (!line) {
      throw new NotFoundError(`Bus Line with id ${id} not found`);
    }

    return line as BusLineWithTransporterAndServiceType;
  };

  /**
   * Appends relations (transporter and service type) to bus lines
   *
   * This function takes a list of bus lines and enriches them with related transporter and service type information.
   * It's designed to be used after getting paginated results from the base repository.
   *
   * @param busLinesResult - Array of bus lines to append relations to
   * @param pagination - Pagination metadata
   * @param params - Query parameters for ordering
   * @param tx - Optional transaction instance
   * @returns Bus lines with relations and pagination metadata
   */
  const appendRelations = async (
    busLinesResult: BusLine[],
    pagination: PaginationMeta,
    params: PaginatedListBusLinesQueryParams,
    tx?: TransactionalDB,
  ): Promise<PaginatedListBusLinesResult> => {
    // Return early if no bus lines to process
    if (busLinesResult.length === 0) {
      return { data: [], pagination };
    }

    const { baseOrderBy } = baseRepository.buildQueryExpressions(params);
    const ids = busLinesResult.map((b) => b.id);

    const dbInstance = (tx as typeof db) ?? db;
    const busLinesWithRelations = await dbInstance.query.busLines.findMany({
      where: (busLines, { inArray, and, isNull }) =>
        and(inArray(busLines.id, ids), isNull(busLines.deletedAt)),
      orderBy: baseOrderBy,
      with: {
        transporter: true,
        serviceType: true,
      },
    });

    return {
      data: busLinesWithRelations as BusLineWithTransporterAndServiceType[],
      pagination,
    };
  };

  /**
   * Creates a transaction-scoped version of this repository
   * Overrides baseRepository.withTransaction to preserve custom methods
   * @param tx - Transaction instance
   * @returns Transaction-scoped repository with all custom methods
   */
  function withTransaction(tx: TransactionalDB) {
    const txBaseRepository = baseRepository.withTransaction(tx);
    return {
      ...txBaseRepository,
      findOneWithRelations: (id: number) => findOneWithRelations(id, tx),
      appendRelations: (
        busLinesResult: BusLine[],
        pagination: PaginationMeta,
        params: PaginatedListBusLinesQueryParams,
      ) => appendRelations(busLinesResult, pagination, params, tx),
      withTransaction: (newTx: TransactionalDB) => withTransaction(newTx),
    };
  }

  return {
    ...baseRepository,
    findOneWithRelations,
    appendRelations,
    withTransaction,
  };
};

// Export the bus line repository instance
export const busLineRepository = createBusLineRepository();

/**
 * Type representing the complete bus line repository
 * Derived from the actual implementation
 */
export type BusLineRepository = typeof busLineRepository;
