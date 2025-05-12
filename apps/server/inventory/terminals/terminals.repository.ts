import { eq, inArray } from 'drizzle-orm';
import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { createSlug } from '../../shared/utils';
import { db } from '../db-service';
import { terminals } from './terminals.schema';
import type {
  CreateTerminalPayload,
  PaginatedTerminalsWithCity,
  PaginationParamsTerminals,
  Terminal,
  TerminalWithCity,
  TerminalsQueryOptions,
  UpdateTerminalPayload,
} from './terminals.types';
import { validateOperatingHours } from './terminals.utils';

const SLUG_PREFIX = 't';
/**
 * Creates a repository for managing terminal entities
 * @returns {Object} An object containing terminal-specific operations and base CRUD operations
 */
export function createTerminalRepository() {
  const baseRepository = createBaseRepository<
    Terminal,
    CreateTerminalPayload & { slug: string },
    UpdateTerminalPayload & { slug?: string },
    typeof terminals
  >(db, terminals, 'Terminal', {
    searchableFields: [terminals.name, terminals.code, terminals.slug],
  });

  /**
   * Finds a terminal with its associated city
   * @param id - The ID of the terminal to find
   * @returns The terminal with its associated city
   */
  async function findOneWithCity(id: number): Promise<TerminalWithCity> {
    const terminal = await db.query.terminals.findFirst({
      where: eq(terminals.id, id),
      with: { city: true },
    });

    if (!terminal) {
      throw new NotFoundError('Terminal not found');
    }

    return terminal;
  }

  /**
   * Creates a new terminal with auto-generated slug
   * @param data - The terminal data to create
   * @returns The created terminal
   */
  async function create(data: CreateTerminalPayload): Promise<Terminal> {
    if (data.operatingHours) {
      validateOperatingHours(data.operatingHours);
    }

    const slug = createSlug(data.name, SLUG_PREFIX);

    return await baseRepository.create({ ...data, slug });
  }

  /**
   * Updates a terminal
   * @param id - The ID of the terminal to update
   * @param data - The terminal data to update
   * @returns The updated terminal
   */
  async function update(
    id: number,
    data: UpdateTerminalPayload,
  ): Promise<Terminal> {
    if (data.operatingHours) {
      validateOperatingHours(data.operatingHours);
    }

    const updateData: UpdateTerminalPayload & { slug?: string } = { ...data };

    if (data.name) {
      updateData.slug = createSlug(data.name, SLUG_PREFIX);
    }

    return await baseRepository.update(id, updateData);
  }

  /**
   * Finds all terminals with their associated cities
   * @param params - Query options for filtering and sorting
   * @returns List of terminals with their associated cities
   */
  async function findAllWithCity(
    params: TerminalsQueryOptions,
  ): Promise<TerminalWithCity[]> {
    const { baseWhere, baseOrderBy } =
      baseRepository.buildQueryExpressions(params);

    return await db.query.terminals.findMany({
      with: { city: true },
      where: baseWhere,
      orderBy: baseOrderBy,
    });
  }

  /**
   * Lists terminals with pagination
   * @param params - Pagination parameters
   * @returns Paginated list of terminals
   */
  async function listPaginated(
    params: PaginationParamsTerminals = {},
  ): Promise<PaginatedTerminalsWithCity> {
    const { data, pagination } = await baseRepository.findAllPaginated(params);

    if (data.length === 0) {
      return { data: [], pagination };
    }

    const { baseOrderBy } = baseRepository.buildQueryExpressions(params);
    const ids = data.map((terminal) => terminal.id);

    const terminalsWithCity = await db.query.terminals.findMany({
      where: inArray(terminals.id, ids),
      orderBy: baseOrderBy,
      with: { city: true },
    });

    return { data: terminalsWithCity, pagination };
  }

  return {
    ...baseRepository,
    create,
    update,
    findAllPaginated: listPaginated,
    findOneWithCity,
    findAllWithCity,
  };
}

// Export the terminal repository instance
export const terminalRepository = createTerminalRepository();
