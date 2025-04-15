import { api } from 'encore.dev/api';
import { stateRepository } from './states.repository';
import {
  CreateStatePayload,
  UpdateStatePayload,
  State,
  States,
  PaginatedStates,
} from './states.types';
import { PaginationParams } from '../../shared/types';

/**
 * Creates a new state.
 * @param params - The state data to create
 * @returns {Promise<State>} The created state
 * @throws {APIError} If the state creation fails
 */
export const createState = api(
  { method: 'POST', path: '/states', expose: true },
  async (params: CreateStatePayload): Promise<State> => {
    return await stateRepository.create(params);
  },
);

/**
 * Retrieves a state by its ID.
 * @param params - Object containing the state ID
 * @param params.id - The ID of the state to retrieve
 * @returns {Promise<State>} The found state
 * @throws {APIError} If the state is not found or retrieval fails
 */
export const getState = api(
  { method: 'GET', path: '/states/:id', expose: true },
  async ({ id }: { id: number }): Promise<State> => {
    return await stateRepository.findOne(id);
  },
);

/**
 * Retrieves all states without pagination (useful for dropdowns).
 * @returns {Promise<States>} An object containing an array of states
 * @throws {APIError} If the retrieval fails
 */
export const listStates = api(
  { method: 'GET', path: '/states', expose: true },
  async (): Promise<States> => {
    return await stateRepository.findAll();
  },
);

/**
 * Retrieves states with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedStates>} Paginated list of states
 * @throws {APIError} If retrieval fails
 */
export const listStatesPaginated = api(
  { method: 'GET', path: '/states/paginated', expose: true },
  async (params: PaginationParams): Promise<PaginatedStates> => {
    return await stateRepository.listPaginated(params);
  },
);

/**
 * Updates an existing state.
 * @param params - Object containing the state ID and update data
 * @param params.id - The ID of the state to update
 * @param params.data - The state data to update
 * @returns {Promise<State>} The updated state
 * @throws {APIError} If the state is not found or update fails
 */
export const updateState = api(
  { method: 'PUT', path: '/states/:id', expose: true },
  async ({
    id,
    ...data
  }: UpdateStatePayload & { id: number }): Promise<State> => {
    return await stateRepository.update(id, data);
  },
);

/**
 * Deletes a state by its ID.
 * @param params - Object containing the state ID
 * @param params.id - The ID of the state to delete
 * @returns {Promise<State>} The deleted state
 * @throws {APIError} If the state is not found or deletion fails
 */
export const deleteState = api(
  { method: 'DELETE', path: '/states/:id', expose: true },
  async ({ id }: { id: number }): Promise<State> => {
    return await stateRepository.delete(id);
  },
);
