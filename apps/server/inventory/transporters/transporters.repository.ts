import { eq, inArray } from 'drizzle-orm';
import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { transporters } from './transporters.schema';
import type {
  CreateTransporterPayload,
  PaginatedTransportersWithCity,
  PaginationParamsTransporters,
  Transporter,
  TransporterWithCity,
  TransportersQueryOptions,
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
  });

  /**
   * Finds a transporter with its associated headquarter city
   * @param id - The ID of the transporter to find
   * @returns The transporter with its associated headquarter city
   */
  async function findOneWithCity(id: number): Promise<TransporterWithCity> {
    const transporter = await db.query.transporters.findFirst({
      where: eq(transporters.id, id),
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
    params: TransportersQueryOptions,
  ): Promise<TransporterWithCity[]> {
    const { baseWhere, baseOrderBy } =
      baseRepository.buildQueryExpressions(params);

    return await db.query.transporters.findMany({
      with: { headquarterCity: true },
      where: baseWhere,
      orderBy: baseOrderBy,
    });
  }

  /**
   * Lists transporters with pagination and their associated headquarter cities
   * @param params - Pagination parameters
   * @returns Paginated list of transporters with their headquarter cities
   */
  async function listPaginated(
    params: PaginationParamsTransporters = {},
  ): Promise<PaginatedTransportersWithCity> {
    const { data, pagination } = await baseRepository.findAllPaginated(params);

    if (data.length === 0) {
      return { data: [], pagination };
    }

    const { baseOrderBy } = baseRepository.buildQueryExpressions(params);
    const ids = data.map((transporter) => transporter.id);

    const transportersWithCity = await db.query.transporters.findMany({
      where: inArray(transporters.id, ids),
      orderBy: baseOrderBy,
      with: { headquarterCity: true },
    });

    return { data: transportersWithCity, pagination };
  }

  /**
   * Searches for transporters and includes their headquarter city
   * @param term - Search term
   * @returns List of matching transporters with headquarter city information
   */
  async function searchWithCity(term: string): Promise<TransporterWithCity[]> {
    const results = await baseRepository.search(term);

    if (results.length === 0) {
      return [];
    }

    const ids = results.map((transporter) => transporter.id);

    return await db.query.transporters.findMany({
      where: inArray(transporters.id, ids),
      with: { headquarterCity: true },
    });
  }

  /**
   * Searches for transporters with pagination and includes their headquarter city
   * @param term - Search term
   * @param params - Pagination parameters
   * @returns Paginated search results with headquarter city information
   */
  async function searchPaginatedWithCity(
    term: string,
    params: PaginationParamsTransporters = {},
  ): Promise<PaginatedTransportersWithCity> {
    const { data, pagination } = await baseRepository.searchPaginated(
      term,
      params,
    );

    if (data.length === 0) {
      return { data: [], pagination };
    }

    const { baseOrderBy } = baseRepository.buildQueryExpressions(params);
    const ids = data.map((transporter) => transporter.id);

    const transportersWithCity = await db.query.transporters.findMany({
      where: inArray(transporters.id, ids),
      orderBy: baseOrderBy,
      with: { headquarterCity: true },
    });

    return { data: transportersWithCity, pagination };
  }

  return {
    ...baseRepository,
    findOneWithCity,
    findAllWithCity,
    findAllPaginated: listPaginated,
    search: searchWithCity,
    searchPaginated: searchPaginatedWithCity,
  };
};

// Export the transporter repository instance
export const transporterRepository = createTransporterRepository();
