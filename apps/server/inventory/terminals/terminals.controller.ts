import { api } from 'encore.dev/api';
import type {
  CreateTerminalPayload,
  PaginatedTerminals,
  PaginatedTerminalsWithCity,
  PaginationParamsTerminals,
  Terminal,
  TerminalWithCity,
  Terminals,
  TerminalsQueryOptions,
  UpdateTerminalPayload,
} from './terminals.types';
import { terminalRepository } from './terminals.repository';

/**
 * Creates a new terminal.
 */
export const createTerminal = api(
  { expose: true, method: 'POST', path: '/terminals' },
  async (params: CreateTerminalPayload): Promise<Terminal> => {
    return await terminalRepository.create(params);
  },
);

/**
 * Retrieves a terminal by its ID.
 */
export const getTerminal = api(
  { expose: true, method: 'GET', path: '/terminals/:id' },
  async ({ id }: { id: number }): Promise<TerminalWithCity> => {
    return await terminalRepository.findOneWithCity(id);
  },
);

/**
 * Retrieves all terminals without pagination (useful for dropdowns).
 */
export const listTerminals = api(
  { expose: true, method: 'POST', path: '/get-terminals' },
  async (params: TerminalsQueryOptions): Promise<Terminals> => {
    const terminals = await terminalRepository.findAllWithCity(params);
    return {
      terminals,
    };
  },
);

/**
 * Retrieves terminals with pagination (useful for tables).
 */
export const listTerminalsPaginated = api(
  { expose: true, method: 'POST', path: '/get-terminals/paginated' },
  async (
    params: PaginationParamsTerminals,
  ): Promise<PaginatedTerminalsWithCity> => {
    return await terminalRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing terminal.
 */
export const updateTerminal = api(
  { expose: true, method: 'PUT', path: '/terminals/:id' },
  async ({
    id,
    ...data
  }: UpdateTerminalPayload & { id: number }): Promise<Terminal> => {
    return await terminalRepository.update(id, data);
  },
);

/**
 * Deletes a terminal by its ID.
 */
export const deleteTerminal = api(
  { expose: true, method: 'DELETE', path: '/terminals/:id' },
  async ({ id }: { id: number }): Promise<Terminal> => {
    return await terminalRepository.delete(id);
  },
);

/**
 * Searches for terminals by matching a search term against name, code, and slug.
 */
export const searchTerminals = api(
  { expose: true, method: 'GET', path: '/terminals/search' },
  async ({ term }: { term: string }): Promise<Terminals> => {
    const terminals = await terminalRepository.search(term);
    return {
      terminals,
    };
  },
);

/**
 * Searches for terminals with pagination by matching a search term against name, code, and slug.
 */
export const searchTerminalsPaginated = api(
  { expose: true, method: 'POST', path: '/terminals/search/paginated' },
  async ({
    term,
    ...params
  }: PaginationParamsTerminals & {
    term: string;
  }): Promise<PaginatedTerminals> => {
    return await terminalRepository.searchPaginated(term, params);
  },
);
