import { states } from './states.schema';
import {
  CreateStatePayload,
  State,
  States,
  UpdateStatePayload,
  PaginatedStates,
} from './states.types';
import { createBaseRepository } from '../../shared/base-repository';
import { countryRepository } from '../countries/countries.repository';
import { PaginationParams } from '../../shared/types';

const DEFAULT_ERROR_MESSAGE = 'State with this name or code already exists';

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
  >(states, 'State');

  /**
   * Validates that a country exists in the database
   * @param countryId - The ID of the country to validate
   * @throws {NotFoundError} If the country does not exist
   */
  const validateCountryExists = async (countryId: number): Promise<void> => {
    await countryRepository.findOne(countryId);
  };

  /**
   * Validates that state name and code are unique
   * @param name - State name to validate
   * @param code - State code to validate
   * @param excludeId - Optional ID to exclude from validation
   */
  const validateStateUniqueness = async (
    name: string,
    code: string,
    excludeId?: number,
  ): Promise<void> => {
    await baseRepository.validateUniqueness(
      [
        { field: states.name, value: name },
        { field: states.code, value: code },
      ],
      excludeId,
      DEFAULT_ERROR_MESSAGE,
    );
  };

  /**
   * Creates a new state with country validation
   * @param data - The state data to create
   * @returns {Promise<State>} The created state
   */
  const create = async (data: CreateStatePayload): Promise<State> => {
    await validateCountryExists(data.countryId);
    await validateStateUniqueness(data.name, data.code);
    return baseRepository.create(data);
  };

  /**
   * Updates a state with country and uniqueness validation
   * @param id - The ID of the state to update
   * @param data - The state data to update
   * @returns {Promise<State>} The updated state
   */
  const update = async (
    id: number,
    data: UpdateStatePayload,
  ): Promise<State> => {
    const existingState = await baseRepository.findOne(id);

    if (data.countryId) {
      await validateCountryExists(data.countryId);
    }

    if (data.name || data.code) {
      await validateStateUniqueness(
        data.name || existingState.name,
        data.code || existingState.code,
        id,
      );
    }

    return baseRepository.update(id, data);
  };

  /**
   * Retrieves all states with pagination
   * @param params - Pagination parameters
   * @returns {Promise<PaginatedStates>} Paginated list of states
   */
  const listPaginated = async (
    params: PaginationParams,
  ): Promise<PaginatedStates> => {
    return baseRepository.findAllPaginated({
      ...params,
      sortBy: params.sortBy || 'name',
      sortDirection: params.sortDirection || 'asc',
    });
  };

  /**
   * Retrieves all states (deprecated: use listPaginated instead)
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
