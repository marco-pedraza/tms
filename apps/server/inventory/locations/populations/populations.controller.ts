import { api } from 'encore.dev/api';
import type { ListCitiesResult } from '@/inventory/locations/cities/cities.types';
import type {
  AssignCitiesPayload,
  CreatePopulationPayload,
  FindPopulationByAssignedCityResult,
  ListAvailableCitiesResult,
  ListPopulationsQueryParams,
  ListPopulationsResult,
  PaginatedListPopulationsQueryParams,
  PaginatedListPopulationsResult,
  Population,
  PopulationWithRelations,
  UpdatePopulationPayload,
} from './populations.types';
import { populationRepository } from './populations.repository';
import {
  validateCityAssignment,
  validateCityListAssignment,
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
 * Retrieves a population by its ID with related cities information.
 * @param params - Object containing the population ID
 * @param params.id - The ID of the population to retrieve
 * @returns {Promise<PopulationWithRelations>} The found population with related cities
 * @throws {APIError} If the population is not found or retrieval fails
 */
export const getPopulation = api(
  { expose: true, method: 'GET', path: '/populations/:id' },
  async ({ id }: { id: number }): Promise<PopulationWithRelations> => {
    return await populationRepository.findOneWithRelations(id);
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
    const result = await populationRepository.findAllPaginated(params);
    return await populationRepository.appendRelations(
      result.data,
      result.pagination,
      params,
    );
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
  }: AssignCitiesPayload & {
    id: number;
  }): Promise<PopulationWithRelations> => {
    await validateCityListAssignment(id, data);
    return await populationUseCases.assignCities(id, data);
  },
);

/**
 * Assigns a city to a population.
 * @param params - Object containing the population ID and city ID
 * @param params.id - The ID of the population to assign the city to
 * @param params.cityId - The ID of the city to assign to the population
 * @returns {Promise<Population>} The updated population
 * @throws {APIError} If the population or city is not found or assignment fails
 */
export const assignCityToPopulation = api(
  {
    expose: true,
    method: 'PUT',
    path: '/populations/:id/cities/assign/one',
  },
  async ({
    id,
    cityId,
  }: {
    id: number;
    cityId: number;
  }): Promise<PopulationWithRelations> => {
    await validateCityAssignment(id, cityId);
    return await populationUseCases.assignCityToPopulation(id, cityId);
  },
);

/**
 * Unassign a city from a population.
 * @param params - Object containing the population ID and city ID
 * @param params.id - The ID of the population to unassign the city from
 * @param params.cityId - The ID of the city to unassign from the population
 * @returns {Promise<Population>} The updated population
 * @throws {APIError} If the population or city is not found or unassignment fails
 */
export const unassignCityFromPopulation = api(
  {
    expose: true,
    method: 'PUT',
    path: '/populations/:id/cities/unassign/one',
  },
  async ({
    id,
    cityId,
  }: {
    id: number;
    cityId: number;
  }): Promise<PopulationWithRelations> => {
    return await populationUseCases.unassignCityFromPopulation(id, cityId);
  },
);

/**
 * Retrieves available cities for assignment to a population.
 * Returns cities not assigned to any population, or if populationId is provided,
 * includes cities assigned to that specific population.
 * @param params - Object with optional populationId query parameter
 * @param params.populationId - Optional population ID query parameter to include its assigned cities
 * @returns {Promise<ListAvailableCitiesResult>} Unified response with data property containing array of cities with state and country information
 * @throws {APIError} If retrieval fails
 */
export const listAvailableCities = api(
  { expose: true, method: 'GET', path: '/populations/cities' },
  async (params: {
    populationId?: number;
  }): Promise<ListAvailableCitiesResult> => {
    return await populationUseCases.findAvailableCities(params);
  },
);

/**
 * Retrieves cities assigned to a specific population.
 * @param params - Object containing the population ID
 * @param params.id - The ID of the population to get cities for
 * @returns {Promise<ListCitiesResult>} Unified response with data property containing array of cities assigned to the population
 * @throws {APIError} If the population is not found or retrieval fails
 */
export const getPopulationCities = api(
  { expose: true, method: 'GET', path: '/populations/:id/cities' },
  async ({ id }: { id: number }): Promise<ListCitiesResult> => {
    const cities = await populationUseCases.getPopulationCities(id);
    return {
      data: cities,
    };
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

/**
 * Finds a population by its assigned city.
 * @param params - Object containing the city ID
 * @param params.cityId - The ID of the city to find the population by
 * @returns {Promise<FindPopulationByAssignedCityResult>} The found population with related cities or undefined if no population is assigned to the city
 * @throws {APIError} If the population is not found or retrieval fails
 */
export const findPopulationByAssignedCity = api(
  { expose: true, method: 'GET', path: '/populations/find/:cityId' },
  async (params: {
    cityId: number;
  }): Promise<FindPopulationByAssignedCityResult> => {
    const { cityId } = params;
    const population =
      await populationUseCases.findPopulationByAssignedCity(cityId);
    return {
      data: population,
    };
  },
);
