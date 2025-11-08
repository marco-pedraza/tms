import { api } from 'encore.dev/api';
import type {
  CreateRollingPlanPayload,
  ListRollingPlansQueryParams,
  ListRollingPlansResult,
  PaginatedListRollingPlansQueryParams,
  PaginatedListRollingPlansResult,
  RollingPlan,
  RollingPlanWithRelations,
  UpdateRollingPlanPayload,
} from './rolling-plans.types';
import { rollingPlanRepository } from './rolling-plans.repository';
import { rollingPlanApplicationService } from './rolling-plans.application-service';

/**
 * Creates a new rolling plan.
 * @param params - The rolling plan data to create
 * @returns {Promise<RollingPlanWithRelations>} The created rolling plan with relations
 * @throws {APIError} If the rolling plan creation fails
 */
export const createRollingPlan = api(
  {
    expose: true,
    method: 'POST',
    path: '/rolling-plans/create',
    auth: true,
  },
  async (
    params: CreateRollingPlanPayload,
  ): Promise<RollingPlanWithRelations> => {
    return await rollingPlanApplicationService.createRollingPlan(params);
  },
);

/**
 * Retrieves all rolling plans without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListRollingPlansResult>} Unified response with data property containing array of rolling plans
 * @throws {APIError} If retrieval fails
 */
export const listRollingPlans = api(
  {
    expose: true,
    method: 'POST',
    path: '/rolling-plans/list/all',
    auth: true,
  },
  async (
    params: ListRollingPlansQueryParams,
  ): Promise<ListRollingPlansResult> => {
    const rollingPlans = await rollingPlanRepository.findAll(params);
    return {
      data: rollingPlans,
    };
  },
);

/**
 * Retrieves rolling plans with pagination and includes related information.
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListRollingPlansResult>} Unified paginated response with data and pagination properties including related entities (busline, serviceType, busModel, baseNode)
 * @throws {APIError} If retrieval fails
 */
export const listRollingPlansPaginated = api(
  {
    expose: true,
    method: 'POST',
    path: '/rolling-plans/list',
    auth: true,
  },
  async (
    params: PaginatedListRollingPlansQueryParams,
  ): Promise<PaginatedListRollingPlansResult> => {
    const result = await rollingPlanRepository.findAllPaginated(params);

    return await rollingPlanRepository.appendRelations(
      result.data,
      result.pagination,
    );
  },
);

/**
 * Retrieves a rolling plan by its ID with all related entities.
 * @param params - Object containing the rolling plan ID
 * @param params.id - The ID of the rolling plan to retrieve
 * @returns {Promise<RollingPlanWithRelations>} The found rolling plan with relations (busline, serviceType, busModel, baseNode)
 * @throws {APIError} If the rolling plan is not found or retrieval fails
 */
export const getRollingPlan = api(
  {
    expose: true,
    method: 'GET',
    path: '/rolling-plans/:id',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<RollingPlanWithRelations> => {
    return await rollingPlanRepository.findOneWithRelations(id);
  },
);

/**
 * Updates an existing rolling plan.
 * @param params - Object containing the rolling plan ID and update data
 * @param params.id - The ID of the rolling plan to update
 * @returns {Promise<RollingPlanWithRelations>} The updated rolling plan with relations
 * @throws {APIError} If the rolling plan is not found or update fails
 */
export const updateRollingPlan = api(
  {
    expose: true,
    method: 'PUT',
    path: '/rolling-plans/:id/update',
    auth: true,
  },
  async ({
    id,
    ...data
  }: UpdateRollingPlanPayload & {
    id: number;
  }): Promise<RollingPlanWithRelations> => {
    return await rollingPlanApplicationService.updateRollingPlan(id, data);
  },
);

/**
 * Deletes a rolling plan by its ID.
 * @param params - Object containing the rolling plan ID
 * @param params.id - The ID of the rolling plan to delete
 * @returns {Promise<RollingPlan>} The deleted rolling plan
 * @throws {APIError} If the rolling plan is not found or deletion fails
 */
export const deleteRollingPlan = api(
  {
    expose: true,
    method: 'DELETE',
    path: '/rolling-plans/:id/delete',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<RollingPlan> => {
    return await rollingPlanApplicationService.deleteRollingPlan(id);
  },
);
