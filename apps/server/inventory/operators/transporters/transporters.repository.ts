import { and, eq, inArray, isNull } from 'drizzle-orm';
import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { PaginationMeta } from '@/shared/types';
import { transporters } from './transporters.schema';
import type {
  CreateTransporterPayload,
  ListTransportersQueryParams,
  PaginatedListTransportersQueryParams,
  PaginatedListTransportersResult,
  Transporter,
  TransporterWithCity,
  UpdateTransporterPayload,
} from './transporters.types';

/**
 * Creates a repository for managing transporter entities
 * @returns {Object} An object containing transporter-specific operations and base CRUD operations
 */
export const createTransporterRepository = () => {
  const baseRepository = createBaseRepository<
    Transporter,
    CreateTransporterPayload,
    UpdateTransporterPayload,
    typeof transporters
  >(db, transporters, 'Transporter', {
    searchableFields: [transporters.name, transporters.code],
    softDeleteEnabled: true,
  });

  /**
   * Finds a transporter with its associated headquarter city
   * @param id - The ID of the transporter to find
   * @returns The transporter with its associated headquarter city
   */
  async function findOneWithCity(id: number): Promise<TransporterWithCity> {
    const transporter = await db.query.transporters.findFirst({
      where: and(eq(transporters.id, id), isNull(transporters.deletedAt)),
      with: { headquarterCity: true },
    });

    if (!transporter) {
      throw new NotFoundError('Transporter not found');
    }

    return transporter;
  }

  /**
   * Finds all transporters with their associated headquarter cities
   * @param params - Query options for filtering and sorting
   * @returns List of transporters with their associated headquarter cities
   */
  async function findAllWithCity(
    params: ListTransportersQueryParams,
  ): Promise<TransporterWithCity[]> {
    const { baseWhere, baseOrderBy } =
      baseRepository.buildQueryExpressions(params);

    return await db.query.transporters.findMany({
      with: { headquarterCity: true },
      where: baseWhere
        ? and(baseWhere, isNull(transporters.deletedAt))
        : isNull(transporters.deletedAt),
      orderBy: baseOrderBy,
    });
  }

  /**
   * Appends relations (headquarter city) to transporters
   *
   * This function takes a list of transporters and enriches them with related headquarter city information.
   * It's designed to be used after getting paginated results from the base repository.
   *
   * @param transportersResult - Array of transporters to append relations to
   * @param pagination - Pagination metadata
   * @param params - Query parameters for ordering
   * @returns Transporters with relations and pagination metadata
   */
  const appendRelations = async (
    transportersResult: Transporter[],
    pagination: PaginationMeta,
    params: PaginatedListTransportersQueryParams,
  ): Promise<PaginatedListTransportersResult> => {
    // Return early if no transporters to process
    if (transportersResult.length === 0) {
      return {
        data: [],
        pagination,
      };
    }

    const { baseOrderBy } = baseRepository.buildQueryExpressions(params);
    const ids = transportersResult.map((transporter) => transporter.id);

    const transportersWithRelations = await db.query.transporters.findMany({
      where: and(inArray(transporters.id, ids), isNull(transporters.deletedAt)),
      orderBy: baseOrderBy,
      with: {
        headquarterCity: true,
      },
    });

    return {
      data: transportersWithRelations,
      pagination,
    };
  };

  return {
    ...baseRepository,
    findOneWithCity,
    findAllWithCity,
    appendRelations,
  };
};

// Export the transporter repository instance
export const transporterRepository = createTransporterRepository();
