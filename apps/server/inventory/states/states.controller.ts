import { api } from 'encore.dev/api';
import { stateRepository } from './states.repository';
import {
  CreateStatePayload,
  UpdateStatePayload,
  State,
  States,
  PaginatedStates,
} from './states.types';
import { createControllerErrorHandler } from '../../shared/controller-utils';
import { PaginationParams } from '../../shared/types';

const withErrorHandling = createControllerErrorHandler('StatesController');

/**
 * Creates a new state.
 * @param params - The state data to create
 * @returns {Promise<State>} The created state
 * @throws {APIError} If the state creation fails
 */
export const createState = api(
  { method: 'POST', path: '/states' },
  async (params: CreateStatePayload): Promise<State> => {
    return withErrorHandling('createState', () =>
      stateRepository.create(params),
    );
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
  { method: 'GET', path: '/states/:id' },
  async ({ id }: { id: number }): Promise<State> => {
    return withErrorHandling('getState', () => stateRepository.findOne(id));
  },
);

/**
 * Retrieves all states without pagination (useful for dropdowns).
 * @returns {Promise<States>} An object containing an array of states
 * @throws {APIError} If the retrieval fails
 */
export const listStates = api(
  { method: 'GET', path: '/states' },
  async (): Promise<States> => {
    return withErrorHandling('listStates', () => stateRepository.findAll());
  },
);

/**
 * Retrieves states with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedStates>} Paginated list of states
 * @throws {APIError} If retrieval fails
 */
export const listStatesPaginated = api(
  { method: 'GET', path: '/states/paginated' },
  async (params: PaginationParams): Promise<PaginatedStates> => {
    return withErrorHandling('listStatesPaginated', () =>
      stateRepository.listPaginated(params),
    );
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
  { method: 'PUT', path: '/states/:id' },
  async ({
    id,
    ...data
  }: UpdateStatePayload & { id: number }): Promise<State> => {
    return withErrorHandling('updateState', () =>
      stateRepository.update(id, data),
    );
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
  { method: 'DELETE', path: '/states/:id' },
  async ({ id }: { id: number }): Promise<State> => {
    return withErrorHandling('deleteState', () => stateRepository.delete(id));
  },
);
