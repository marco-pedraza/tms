import { api } from 'encore.dev/api';
import type {
  ListTollboothsQueryParams,
  ListTollboothsResult,
  Tollbooth,
  TollboothRepository,
} from './tollbooths.types';
import { tollboothRepository as defaultTollboothRepository } from './tollbooths.repository';
import {
  assertAreValidTollbooths,
  assertIsValidTollbooth,
} from './tollbooths.guard';

// Allow dependency injection for testing
let tollboothRepository: TollboothRepository = defaultTollboothRepository;

export function setTollboothRepository(repo: TollboothRepository) {
  tollboothRepository = repo;
}

export function resetTollboothRepository() {
  tollboothRepository = defaultTollboothRepository;
}

/**
 * Retrieves a tollbooth by its node ID
 * @param params - Object containing the tollbooth node ID
 * @param params.id - The node ID of the tollbooth to retrieve
 * @returns The found tollbooth
 * @throws {NotFoundError} When the tollbooth is not found
 * @throws {ValidationError} When the tollbooth data is invalid
 */
export const getTollbooth = api(
  {
    expose: true,
    method: 'GET',
    path: '/tollbooths/:id',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<Tollbooth> => {
    const tollbooth = await tollboothRepository.findOne(id);
    assertIsValidTollbooth(tollbooth);
    return tollbooth;
  },
);

/**
 * Retrieves all tollbooths without pagination
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns Unified response with data property containing array of tollbooths
 * @throws {ValidationError} When any tollbooth data is invalid
 */
export const listTollbooths = api(
  {
    expose: true,
    method: 'POST',
    path: '/tollbooths/list',
    auth: true,
  },
  async (params: ListTollboothsQueryParams): Promise<ListTollboothsResult> => {
    const tollbooths = await tollboothRepository.findAll(params);
    assertAreValidTollbooths(tollbooths);
    return {
      data: tollbooths,
    };
  },
);
