import { db } from '@/planning/db-service';
import type {
  CreateRollingPlanVersionPayload,
  RollingPlanVersion,
} from './rolling-plan-versions.types';
import { rollingPlanVersionRepository } from './rolling-plan-versions.repository';
import { createRollingPlanVersionEntity } from './rolling-plan-version.entity';

/**
 * Application service for rolling plan version operations
 */
export function createRollingPlanVersionApplicationService() {
  // Create rolling plan version entity instance
  const rollingPlanVersionEntity = createRollingPlanVersionEntity({
    rollingPlanVersionsRepository: {
      create: rollingPlanVersionRepository.create,
      findOne: rollingPlanVersionRepository.findOne,
      checkUniqueness: rollingPlanVersionRepository.checkUniqueness,
    },
  });

  /**
   * Creates a new rolling plan version with validation
   * @param payload - The rolling plan version creation data
   * @returns The created rolling plan version
   * @throws {FieldValidationError} If validation fails
   */
  async function createRollingPlanVersion(
    payload: CreateRollingPlanVersionPayload,
  ): Promise<RollingPlanVersion> {
    // Create entity and save
    const version = rollingPlanVersionEntity.create(payload);
    const savedVersion = await version.save(db);

    return savedVersion.toRollingPlanVersion();
  }

  return {
    createRollingPlanVersion,
  };
}

export const rollingPlanVersionApplicationService =
  createRollingPlanVersionApplicationService();
