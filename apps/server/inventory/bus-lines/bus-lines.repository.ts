import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { PaginationMeta } from '../../shared/types';
import { db } from '../db-service';
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
   * @returns The bus line with related transporter and service type
   * @throws {NotFoundError} If the bus line is not found
   */
  const findOneWithRelations = async (
    id: number,
  ): Promise<BusLineWithTransporterAndServiceType> => {
    const line = await db.query.busLines.findFirst({
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
   * @returns Bus lines with relations and pagination metadata
   */
  const appendRelations = async (
    busLinesResult: BusLine[],
    pagination: PaginationMeta,
    params: PaginatedListBusLinesQueryParams,
  ): Promise<PaginatedListBusLinesResult> => {
    // Return early if no bus lines to process
    if (busLinesResult.length === 0) {
      return { data: [], pagination };
    }

    const { baseOrderBy } = baseRepository.buildQueryExpressions(params);
    const ids = busLinesResult.map((b) => b.id);

    const busLinesWithRelations = await db.query.busLines.findMany({
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

  return {
    ...baseRepository,
    findOneWithRelations,
    appendRelations,
  };
};

// Export the bus line repository instance
export const busLineRepository = createBusLineRepository();
