import { api } from 'encore.dev/api';
import { stateHandler } from './states.handler';
import {
  CreateStateDto,
  UpdateStateDto,
  StateResponse,
  StatesResponse,
} from './states.types';
import { parseApiError } from '../../shared/errors';

/**
 * Creates a new state.
 * @param params - The state data to create
 * @returns {Promise<StateResponse>} The created state
 * @throws {APIError} If the state creation fails
 */
export const createState = api(
  { method: 'POST', path: '/states' },
  async (params: CreateStateDto): Promise<StateResponse> => {
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
 * @returns {Promise<StateResponse>} The found state
 * @throws {APIError} If the state is not found or retrieval fails
 */
export const getState = api(
  { method: 'GET', path: '/states/:id' },
  async ({ id }: { id: number }): Promise<StateResponse> => {
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
 * @returns {Promise<StatesResponse>} An object containing an array of states
 * @throws {APIError} If the retrieval fails
 */
export const listStates = api(
  { method: 'GET', path: '/states' },
  async (): Promise<StatesResponse> => {
    try {
      const { states } = await stateHandler.findAll();
      return { states };
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
 * @returns {Promise<StateResponse>} The updated state
 * @throws {APIError} If the state is not found or update fails
 */
export const updateState = api(
  { method: 'PUT', path: '/states/:id' },
  async ({
    id,
    ...data
  }: UpdateStateDto & { id: number }): Promise<StateResponse> => {
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
 * @returns {Promise<StateResponse>} The deleted state
 * @throws {APIError} If the state is not found or deletion fails
 */
export const deleteState = api(
  { method: 'DELETE', path: '/states/:id' },
  async ({ id }: { id: number }): Promise<StateResponse> => {
    try {
      return await stateHandler.delete(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);
