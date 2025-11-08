import { inventoryAdapter } from '@/planning/adapters/inventory.adapter';
import { db } from '@/planning/db-service';
import type {
  CreateRollingPlanPayload,
  RollingPlan,
  RollingPlanWithRelations,
  UpdateRollingPlanPayload,
} from './rolling-plans.types';
import { rollingPlanRepository } from './rolling-plans.repository';
import { createRollingPlanEntity } from './rolling-plan.entity';

/**
 * Application service for rolling plan operations
 */
export function createRollingPlanApplicationService() {
  // Create rolling plan entity instance
  const rollingPlanEntity = createRollingPlanEntity({
    rollingPlansRepository: {
      create: rollingPlanRepository.create,
      update: rollingPlanRepository.update,
      findOne: rollingPlanRepository.findOne,
      checkUniqueness: rollingPlanRepository.checkUniqueness,
    },
    inventoryAdapter,
  });

  /**
   * Creates a new rolling plan with validation
   * @param payload - The rolling plan creation data
   * @returns The created rolling plan with relations
   * @throws {FieldValidationError} If validation fails
   * @throws {NotFoundError} If referenced entities are not found
   */
  async function createRollingPlan(
    payload: CreateRollingPlanPayload,
  ): Promise<RollingPlanWithRelations> {
    // Create entity and save
    const rollingPlan = rollingPlanEntity.create(payload);
    const savedRollingPlan = await rollingPlan.save(db);

    // Return with relations
    return await rollingPlanRepository.findOneWithRelations(
      savedRollingPlan.toRollingPlan().id,
    );
  }

  /**
   * Updates an existing rolling plan with validation
   * @param id - The rolling plan ID to update
   * @param payload - The rolling plan update data
   * @returns The updated rolling plan with relations
   * @throws {FieldValidationError} If validation fails
   * @throws {NotFoundError} If rolling plan is not found
   */
  async function updateRollingPlan(
    id: number,
    payload: UpdateRollingPlanPayload,
  ): Promise<RollingPlanWithRelations> {
    // Find entity and update (no transaction needed - single table operation)
    const rollingPlan = await rollingPlanEntity.findOne(id);
    await rollingPlan.update(payload, db);

    // Return with relations
    return await rollingPlanRepository.findOneWithRelations(id);
  }

  /**
   * Deletes a rolling plan by its ID (soft delete)
   * @param id - The rolling plan ID to delete
   * @returns The deleted rolling plan
   * @throws {NotFoundError} If rolling plan is not found
   */
  async function deleteRollingPlan(id: number): Promise<RollingPlan> {
    return await rollingPlanRepository.delete(id);
  }

  return {
    createRollingPlan,
    updateRollingPlan,
    deleteRollingPlan,
  };
}

export const rollingPlanApplicationService =
  createRollingPlanApplicationService();
