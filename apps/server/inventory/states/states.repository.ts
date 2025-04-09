import { states } from './states.schema';
import {
  CreateStatePayload,
  State,
  States,
  UpdateStatePayload,
  PaginatedStates,
} from './states.types';
import { createBaseRepository } from '@repo/base-repo';
import { PaginationParams } from '../../shared/types';
import { db } from '@/db';

/**
 * Creates a repository for managing state entities
 * @returns {Object} An object containing state-specific operations and base CRUD operations
 */
export const createStateRepository = () => {
  const baseRepository = createBaseRepository<
    State,
    CreateStatePayload,
    UpdateStatePayload,
    typeof states
  >(db, states, 'State');

  /**
   * Creates a new state
   * @param data - The state data to create
   * @returns {Promise<State>} The created state
   */
  const create = async (data: CreateStatePayload): Promise<State> => {
    return await baseRepository.create(data);
  };

  /**
   * Updates a state
   * @param id - The ID of the state to update
   * @param data - The state data to update
   * @returns {Promise<State>} The updated state
   */
  const update = async (
    id: number,
    data: UpdateStatePayload,
  ): Promise<State> => {
    return await baseRepository.update(id, data);
  };

  /**
   * Retrieves all states with pagination
   * @param params - Pagination parameters
   * @returns {Promise<PaginatedStates>} Paginated list of states
   */
  const listPaginated = async (
    params: PaginationParams,
  ): Promise<PaginatedStates> => {
    return await baseRepository.findAllPaginated(params);
  };

  /**
   * Retrieves all states
   * @returns {Promise<States>} Object containing array of states
   */
  const findAll = async (): Promise<States> => {
    const statesList = await baseRepository.findAll();
    return {
      states: statesList,
    };
  };

  return {
    ...baseRepository,
    create,
    update,
    findAll,
    listPaginated,
  };
};

// Export the state repository instance
export const stateRepository = createStateRepository();
