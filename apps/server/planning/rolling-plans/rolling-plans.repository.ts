import { inventoryAdapter } from '@/planning/adapters/inventory.adapter';
import { db } from '@/planning/db-service';
import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { PaginationMeta } from '@/shared/types';
import { rollingPlans } from './rolling-plans.schema';
import type {
  CreateRollingPlanPayload,
  PaginatedListRollingPlansResult,
  RollingPlan,
  RollingPlanWithRelations,
  UpdateRollingPlanPayload,
} from './rolling-plans.types';

/**
 * Creates a repository for managing rolling plan entities
 */
export function createRollingPlanRepository() {
  const baseRepository = createBaseRepository<
    RollingPlan,
    CreateRollingPlanPayload,
    UpdateRollingPlanPayload,
    typeof rollingPlans
  >(db, rollingPlans, 'Rolling Plan', {
    searchableFields: [rollingPlans.name],
    softDeleteEnabled: true,
  });

  /**
   * Finds a single rolling plan with its relations using inventory adapter
   * @param id - The ID of the rolling plan to find
   * @returns The rolling plan with related entities
   * @throws {NotFoundError} If the rolling plan is not found
   * @throws {NotFoundError} If any related entity (busline, serviceType, busModel, baseNode) is not found via inventory adapter
   * @throws {Error} If any inventory adapter call fails (network errors, runtime errors, etc.)
   */
  async function findOneWithRelations(
    id: number,
  ): Promise<RollingPlanWithRelations> {
    // Get the base rolling plan
    const plan = await baseRepository.findOne(id);

    // Fetch related entities using inventory adapter (ACL)
    const [busline, serviceType, busModel, baseNode] = await Promise.all([
      inventoryAdapter.getBusLine(plan.buslineId),
      inventoryAdapter.getServiceType(plan.serviceTypeId),
      inventoryAdapter.getBusModel(plan.busModelId),
      inventoryAdapter.getNode(plan.baseNodeId),
    ]);

    return {
      ...plan,
      busline,
      serviceType,
      busModel,
      baseNode,
    };
  }

  /**
   * Appends relations to rolling plans using inventory adapter
   *
   * This function takes a list of rolling plans and enriches them with related entities.
   * It's designed to be used after getting paginated results from the base repository.
   *
   * @param rollingPlansResult - Array of rolling plans to append relations to
   * @param pagination - Pagination metadata
   * @returns Rolling plans with relations and pagination metadata
   */
  async function appendRelations(
    rollingPlansResult: RollingPlan[],
    pagination: PaginationMeta,
  ): Promise<PaginatedListRollingPlansResult> {
    if (rollingPlansResult.length === 0) {
      return { data: [], pagination };
    }

    // Extract unique IDs for batch fetching
    const buslineIds = [...new Set(rollingPlansResult.map((p) => p.buslineId))];
    const serviceTypeIds = [
      ...new Set(rollingPlansResult.map((p) => p.serviceTypeId)),
    ];
    const busModelIds = [
      ...new Set(rollingPlansResult.map((p) => p.busModelId)),
    ];
    const nodeIds = [...new Set(rollingPlansResult.map((p) => p.baseNodeId))];

    // Fetch all related entities in parallel using inventory adapter (ACL)
    const [buslines, serviceTypes, busModels, nodes] = await Promise.all([
      inventoryAdapter.getBusLinesByIds(buslineIds),
      inventoryAdapter.getServiceTypesByIds(serviceTypeIds),
      inventoryAdapter.getBusModelsByIds(busModelIds),
      inventoryAdapter.getNodesByIds(nodeIds),
    ]);

    // Create lookup maps for efficient matching
    const buslineMap = new Map(buslines.map((b) => [b.id, b]));
    const serviceTypeMap = new Map(serviceTypes.map((s) => [s.id, s]));
    const busModelMap = new Map(busModels.map((b) => [b.id, b]));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Combine data
    const rollingPlansWithRelations = rollingPlansResult.map((plan) => {
      const busline = buslineMap.get(plan.buslineId);
      const serviceType = serviceTypeMap.get(plan.serviceTypeId);
      const busModel = busModelMap.get(plan.busModelId);
      const baseNode = nodeMap.get(plan.baseNodeId);

      // Validate that all required relations were found
      if (!busline || !serviceType || !busModel || !baseNode) {
        throw new NotFoundError(
          `Missing related entities for rolling plan ${plan.id}: ` +
            `busline=${!!busline}, serviceType=${!!serviceType}, ` +
            `busModel=${!!busModel}, baseNode=${!!baseNode}`,
        );
      }

      return {
        ...plan,
        busline,
        serviceType,
        busModel,
        baseNode,
      };
    });

    return {
      data: rollingPlansWithRelations,
      pagination,
    };
  }

  return {
    ...baseRepository,
    findOneWithRelations,
    appendRelations,
  };
}

// Export the rolling plan repository instance
export const rollingPlanRepository = createRollingPlanRepository();
