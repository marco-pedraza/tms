import { api } from 'encore.dev/api';
import type {
  AssignCitiesPayload,
  CreatePopulationPayload,
  ListPopulationsQueryParams,
  ListPopulationsResult,
  PaginatedListPopulationsQueryParams,
  PaginatedListPopulationsResult,
  Population,
  UpdatePopulationPayload,
} from './populations.types';
import { populationRepository } from './populations.repository';
import {
  validateCityAssignment,
  validatePopulation,
} from './populations.domain';
import { populationUseCases } from './populations.use-cases';

/**
 * Creates a new population.
 * @param params - The population data to create
 * @returns {Promise<Population>} The created population
 * @throws {APIError} If the population creation fails
 */
export const createPopulation = api(
  { expose: true, method: 'POST', path: '/populations/create' },
  async (params: CreatePopulationPayload): Promise<Population> => {
    await validatePopulation(params);
    return await populationRepository.create(params);
  },
);

/**
 * Retrieves a population by its ID.
 * @param params - Object containing the population ID
 * @param params.id - The ID of the population to retrieve
 * @returns {Promise<Population>} The found population
 * @throws {APIError} If the population is not found or retrieval fails
 */
export const getPopulation = api(
  { expose: true, method: 'GET', path: '/populations/:id' },
  async ({ id }: { id: number }): Promise<Population> => {
    return await populationRepository.findOne(id);
  },
);

/**
 * Retrieves all populations without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListPopulationsResult>} Unified response with data property containing array of populations
 * @throws {APIError} If retrieval fails
 */
export const listPopulations = api(
  { expose: true, method: 'POST', path: '/populations/list/all' },
  async (
    params: ListPopulationsQueryParams,
  ): Promise<ListPopulationsResult> => {
    const populations = await populationRepository.findAll(params);
    return {
      data: populations,
    };
  },
);

/**
 * Retrieves populations with pagination (useful for tables).
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListPopulationsResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listPopulationsPaginated = api(
  { expose: true, method: 'POST', path: '/populations/list' },
  async (
    params: PaginatedListPopulationsQueryParams,
  ): Promise<PaginatedListPopulationsResult> => {
    return await populationRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing population.
 * @param params - Object containing the population ID and update data
 * @param params.id - The ID of the population to update
 * @returns {Promise<Population>} The updated population
 * @throws {APIError} If the population is not found or update fails
 */
export const updatePopulation = api(
  { expose: true, method: 'PUT', path: '/populations/:id/update' },
  async ({
    id,
    ...data
  }: UpdatePopulationPayload & { id: number }): Promise<Population> => {
    await validatePopulation(data, id);
    return await populationRepository.update(id, data);
  },
);

/**
 * Assigns cities to a population, replacing all existing assignments.
 * @param params - Object containing the population ID and city assignment data
 * @param params.id - The ID of the population to assign cities to
 * @param params.cityIds - Array of city IDs to assign
 * @returns {Promise<Population>} The updated population
 * @throws {APIError} If the population or any city is not found, or if there are duplicate city IDs
 */
export const assignCitiesToPopulation = api(
  { expose: true, method: 'PUT', path: '/populations/:id/cities/assign' },
  async ({
    id,
    ...data
  }: AssignCitiesPayload & { id: number }): Promise<Population> => {
    await validateCityAssignment(id, data);
    return await populationUseCases.assignCities(id, data);
  },
);

/**
 * Deletes a population by its ID.
 * @param params - Object containing the population ID
 * @param params.id - The ID of the population to delete
 * @returns {Promise<Population>} The deleted population
 * @throws {APIError} If the population is not found or deletion fails
 */
export const deletePopulation = api(
  { expose: true, method: 'DELETE', path: '/populations/:id/delete' },
  async ({ id }: { id: number }): Promise<Population> => {
    return await populationRepository.delete(id);
  },
);
