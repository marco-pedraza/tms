import { api } from 'encore.dev/api';
import { stateRepository } from './states.repository';
import type {
  CreateStatePayload,
  UpdateStatePayload,
  State,
  States,
  PaginatedStates,
  PaginationParamsStates,
  StatesQueryOptions,
} from './states.types';

/**
 * Creates a new state.
 */
export const createState = api(
  { expose: true, method: 'POST', path: '/states' },
  async (params: CreateStatePayload): Promise<State> => {
    return await stateRepository.create(params);
  },
);

/**
 * Retrieves a state by its ID.
 */
export const getState = api(
  { expose: true, method: 'GET', path: '/states/:id' },
  async ({ id }: { id: number }): Promise<State> => {
    return await stateRepository.findOne(id);
  },
);

/**
 * Retrieves all states without pagination (useful for dropdowns).
 */
export const listStates = api(
  { expose: true, method: 'POST', path: '/get-states' },
  async (params: StatesQueryOptions): Promise<States> => {
    const states = await stateRepository.findAll(params);
    return {
      states,
    };
  },
);

/**
 * Retrieves states with pagination (useful for tables).
 */
export const listStatesPaginated = api(
  { expose: true, method: 'POST', path: '/get-states/paginated' },
  async (params: PaginationParamsStates): Promise<PaginatedStates> => {
    return await stateRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing state.
 */
export const updateState = api(
  { expose: true, method: 'PUT', path: '/states/:id' },
  async ({
    id,
    ...data
  }: UpdateStatePayload & { id: number }): Promise<State> => {
    return await stateRepository.update(id, data);
  },
);

/**
 * Deletes a state by its ID.
 */
export const deleteState = api(
  { expose: true, method: 'DELETE', path: '/states/:id' },
  async ({ id }: { id: number }): Promise<State> => {
    return await stateRepository.delete(id);
  },
);

/**
 * Searches for states by matching a search term against name and code.
 */
export const searchStates = api(
  { expose: true, method: 'GET', path: '/states/search' },
  async ({ term }: { term: string }): Promise<States> => {
    const states = await stateRepository.search(term);
    return {
      states,
    };
  },
);

/**
 * Searches for states with pagination by matching a search term against name and code.
 */
export const searchStatesPaginated = api(
  { expose: true, method: 'POST', path: '/states/search/paginated' },
  async ({
    term,
    ...params
  }: PaginationParamsStates & { term: string }): Promise<PaginatedStates> => {
    return await stateRepository.searchPaginated(term, params);
  },
);
