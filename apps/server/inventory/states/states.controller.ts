import { api } from 'encore.dev/api';
import { stateHandler } from './states.handler';
import {
  CreateStatePayload,
  UpdateStatePayload,
  State,
  States,
} from './states.types';
import { parseApiError } from '../../shared/errors';

/**
 * Creates a new state.
 * @param params - The state data to create
 * @returns {Promise<State>} The created state
 * @throws {APIError} If the state creation fails
 */
export const createState = api(
  { method: 'POST', path: '/states' },
  async (params: CreateStatePayload): Promise<State> => {
    try {
      return await stateHandler.create(params);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
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
    try {
      return await stateHandler.findOne(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves all states.
 * @returns {Promise<States>} An object containing an array of states
 * @throws {APIError} If the retrieval fails
 */
export const listStates = api(
  { method: 'GET', path: '/states' },
  async (): Promise<States> => {
    try {
      return await stateHandler.findAll();
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
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
    try {
      return await stateHandler.update(id, data);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
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
    try {
      return await stateHandler.delete(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);
