import { terminals } from './terminals.schema';
import type {
  Terminal,
  CreateTerminalPayload,
  UpdateTerminalPayload,
  PaginatedTerminals,
} from './terminals.types';
import { createBaseRepository } from '@repo/base-repo';
import { PaginationParams } from '../../shared/types';
import { db } from '../db-service';
import { validateOperatingHours } from './terminals.utils';
import { createSlug } from '../../shared/utils';

const SLUG_PREFIX = 't';
/**
 * Creates a repository for managing terminal entities
 * @returns {Object} An object containing terminal-specific operations and base CRUD operations
 */
export const createTerminalRepository = () => {
  const baseRepository = createBaseRepository<
    Terminal,
    CreateTerminalPayload & { slug: string },
    UpdateTerminalPayload & { slug?: string },
    typeof terminals
  >(db, terminals, 'Terminal', {
    searchableFields: [terminals.name, terminals.code, terminals.slug],
  });

  /**
   * Creates a new terminal with auto-generated slug
   * @param data - The terminal data to create
   * @returns The created terminal
   */
  const create = async (data: CreateTerminalPayload): Promise<Terminal> => {
    if (data.operatingHours) {
      validateOperatingHours(data.operatingHours);
    }
    const slug = createSlug(data.name, SLUG_PREFIX);
    return await baseRepository.create({ ...data, slug });
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
    if (data.operatingHours) {
      validateOperatingHours(data.operatingHours);
    }
    const updateData: UpdateTerminalPayload & { slug?: string } = { ...data };
    if (data.name) {
      updateData.slug = createSlug(data.name, SLUG_PREFIX);
    }
    return await baseRepository.update(id, updateData);
  };

  /**
   * Lists terminals with pagination
   * @param params - Pagination parameters
   * @returns Paginated list of terminals
   */
  const listPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedTerminals> => {
    return await baseRepository.findAllPaginated(params);
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
