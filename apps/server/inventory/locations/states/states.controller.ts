import { api } from 'encore.dev/api';
import type {
  CreateStatePayload,
  ListStatesQueryParams,
  ListStatesResult,
  PaginatedListStatesQueryParams,
  PaginatedListStatesResult,
  State,
  UpdateStatePayload,
} from './states.types';
import { stateRepository } from './states.repository';
import { validateState } from './states.domain';

/**
 * Creates a new state.
 */
export const createState = api(
  {
    expose: true,
    method: 'POST',
    path: '/states/create',
    auth: true,
  },
  async (params: CreateStatePayload): Promise<State> => {
    await validateState(params);
    return await stateRepository.create(params);
  },
);

/**
 * Retrieves a state by its ID.
 */
export const getState = api(
  {
    expose: true,
    method: 'GET',
    path: '/states/:id',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<State> => {
    return await stateRepository.findOne(id);
  },
);

/**
 * Retrieves all states without pagination (useful for dropdowns).
 */
export const listStates = api(
  {
    expose: true,
    method: 'POST',
    path: '/states/list/all',
    auth: true,
  },
  async (params: ListStatesQueryParams): Promise<ListStatesResult> => {
    const states = await stateRepository.findAll(params);
    return {
      data: states,
    };
  },
);

/**
 * Retrieves states with pagination (useful for tables).
 */
export const listStatesPaginated = api(
  {
    expose: true,
    method: 'POST',
    path: '/states/list',
    auth: true,
  },
  async (
    params: PaginatedListStatesQueryParams,
  ): Promise<PaginatedListStatesResult> => {
    return await stateRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing state.
 */
export const updateState = api(
  {
    expose: true,
    method: 'PUT',
    path: '/states/:id/update',
    auth: true,
  },
  async ({
    id,
    ...data
  }: UpdateStatePayload & { id: number }): Promise<State> => {
    await validateState(data, id);
    return await stateRepository.update(id, data);
  },
);

/**
 * Deletes a state by its ID.
 */
export const deleteState = api(
  {
    expose: true,
    method: 'DELETE',
    path: '/states/:id/delete',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<State> => {
    return await stateRepository.delete(id);
  },
);
