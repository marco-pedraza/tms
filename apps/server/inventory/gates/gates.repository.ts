import { gates } from './gates.schema';
import type {
  Gate,
  CreateGatePayload,
  UpdateGatePayload,
  PaginatedGates,
} from './gates.types';
import { createBaseRepository } from '../../shared/base-repository';
import { terminalRepository } from '../terminals/terminals.repository';
import { PaginationParams } from '../../shared/types';
import { eq, count } from 'drizzle-orm';
import { db } from '../../db';
import { withPagination } from '../../shared/bd-utils';

/**
 * Creates a repository for managing gate entities
 * @returns {Object} An object containing gate-specific operations and base CRUD operations
 */
export const createGateRepository = () => {
  const baseRepository = createBaseRepository<
    Gate,
    CreateGatePayload,
    UpdateGatePayload,
    typeof gates
  >(gates, 'Gate');

  /**
   * Validates that a terminal exists in the database
   * @param terminalId - The ID of the terminal to validate
   */
  const validateTerminalExists = async (terminalId: number): Promise<void> => {
    await terminalRepository.findOne(terminalId);
  };

  /**
   * Creates a new gate with terminal validation
   * @param data - The gate data to create
   * @returns The created gate
   */
  const create = async (data: CreateGatePayload): Promise<Gate> => {
    await validateTerminalExists(data.terminalId);
    return baseRepository.create(data);
  };

  /**
   * Updates a gate with validations
   * @param id - The ID of the gate to update
   * @param data - The gate data to update
   * @returns The updated gate
   */
  const update = async (id: number, data: UpdateGatePayload): Promise<Gate> => {
    if (data.terminalId) {
      await validateTerminalExists(data.terminalId);
    }
    return baseRepository.update(id, data);
  };

  /**
   * Lists gates with pagination
   * @param params - Pagination parameters
   * @returns Paginated list of gates
   */
  const listPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedGates> => {
    return baseRepository.findAllPaginated({
      ...params,
      sortBy: params.sortBy || 'id',
      sortDirection: params.sortDirection || 'asc',
    });
  };

  /**
   * Lists gates for a specific terminal with pagination
   * @param terminalId - The terminal ID to filter by
   * @param params - Pagination parameters
   * @returns Paginated list of gates
   */
  const findByTerminal = async (
    terminalId: number,
    params: PaginationParams = {},
  ): Promise<PaginatedGates> => {
    // Validate that the terminal exists
    await validateTerminalExists(terminalId);

    // Create the base query with terminal filter
    const query = db
      .select()
      .from(gates)
      .where(eq(gates.terminalId, terminalId))
      .$dynamic();

    // Count query with the same filter
    const countQuery = db
      .select({ count: count() })
      .from(gates)
      .where(eq(gates.terminalId, terminalId));

    // Apply pagination and get results with metadata
    return withPagination<typeof query, Gate>(query, countQuery, params);
  };

  return {
    ...baseRepository,
    create,
    update,
    findAllPaginated: listPaginated,
    findByTerminal,
  };
};

// Export the gate repository instance
export const gateRepository = createGateRepository();
