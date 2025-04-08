import { terminals } from './terminals.schema';
import type {
  Terminal,
  CreateTerminalPayload,
  UpdateTerminalPayload,
  PaginatedTerminals,
} from './terminals.types';
import { createBaseRepository } from '@repo/base-repo';
import { cityRepository } from '../cities/cities.repository';
import { PaginationParams } from '../../shared/types';
import { db } from '@/db';

/**
 * Creates a repository for managing terminal entities
 * @returns {Object} An object containing terminal-specific operations and base CRUD operations
 */
export const createTerminalRepository = () => {
  const baseRepository = createBaseRepository<
    Terminal,
    CreateTerminalPayload,
    UpdateTerminalPayload,
    typeof terminals
  >(db, terminals, 'Terminal');

  /**
   * Creates a new terminal
   * @param data - The terminal data to create
   * @returns The created terminal
   */
  const create = async (data: CreateTerminalPayload): Promise<Terminal> => {
    return baseRepository.create(data);
  };

  /**
   * Updates a terminal
   * @param id - The ID of the terminal to update
   * @param data - The terminal data to update
   * @returns The updated terminal
   */
  const update = async (
    id: number,
    data: UpdateTerminalPayload,
  ): Promise<Terminal> => {
    return baseRepository.update(id, data);
  };

  /**
   * Lists terminals with pagination
   * @param params - Pagination parameters
   * @returns Paginated list of terminals
   */
  const listPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedTerminals> => {
    return baseRepository.findAllPaginated(params);
  };

  return {
    ...baseRepository,
    create,
    update,
    findAllPaginated: listPaginated,
  };
};

// Export the terminal repository instance
export const terminalRepository = createTerminalRepository();
