import { api } from 'encore.dev/api';
import { terminalRepository } from './terminals.repository';
import type {
  CreateTerminalPayload,
  UpdateTerminalPayload,
  Terminal,
  PaginatedTerminals,
} from './terminals.types';
import { PaginationParams } from '../../shared/types';

/**
 * Creates a new terminal.
 * @param params - The terminal data to create
 * @returns {Promise<Terminal>} The created terminal
 * @throws {APIError} If the terminal creation fails
 */
export const createTerminal = api(
  { method: 'POST', path: '/terminals' },
  async (params: CreateTerminalPayload): Promise<Terminal> => {
    return await terminalRepository.create(params);
  },
);

/**
 * Retrieves a terminal by its ID.
 * @param params - Object containing the terminal ID
 * @param params.id - The ID of the terminal to retrieve
 * @returns {Promise<Terminal>} The found terminal
 * @throws {APIError} If the terminal is not found or retrieval fails
 */
export const getTerminal = api(
  { method: 'GET', path: '/terminals/:id', expose: true },
  async ({ id }: { id: number }): Promise<Terminal> => {
    return await terminalRepository.findOne(id);
  },
);

/**
 * Retrieves terminals with pagination.
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedTerminals>} Paginated list of terminals
 * @throws {APIError} If retrieval fails
 */
export const listTerminals = api(
  { method: 'GET', path: '/terminals', expose: true },
  async (params: PaginationParams): Promise<PaginatedTerminals> => {
    return await terminalRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing terminal.
 * @param params - Object containing the terminal ID and update data
 * @param params.id - The ID of the terminal to update
 * @returns {Promise<Terminal>} The updated terminal
 * @throws {APIError} If the terminal is not found or update fails
 */
export const updateTerminal = api(
  { method: 'PUT', path: '/terminals/:id', expose: true },
  async ({
    id,
    ...data
  }: UpdateTerminalPayload & { id: number }): Promise<Terminal> => {
    return await terminalRepository.update(id, data);
  },
);

/**
 * Deletes a terminal by its ID.
 * @param params - Object containing the terminal ID
 * @param params.id - The ID of the terminal to delete
 * @returns {Promise<Terminal>} The deleted terminal
 * @throws {APIError} If the terminal is not found or deletion fails
 */
export const deleteTerminal = api(
  { method: 'DELETE', path: '/terminals/:id', expose: true },
  async ({ id }: { id: number }): Promise<Terminal> => {
    return await terminalRepository.delete(id);
  },
);
