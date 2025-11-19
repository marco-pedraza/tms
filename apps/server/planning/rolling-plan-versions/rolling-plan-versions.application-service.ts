import { db } from '@/planning/db-service';
import { rollingPlanVersions } from './rolling-plan-versions.schema';
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

  /**
   * Generates a random uppercase suffix for unique naming
   * @param length - Length of the suffix (default: 4 characters)
   * @returns Random uppercase string
   */
  function generateRandomSuffix(length = 4): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let suffix = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * letters.length);
      suffix += letters[randomIndex];
    }

    return suffix;
  }

  /**
   * Generates a unique name for the cloned version
   * Uses base name + random uppercase suffix (e.g., "Version 1 ABCD")
   * @param baseName - The base name to use
   * @param rollingPlanId - The rolling plan ID for uniqueness check
   * @returns A unique name for the cloned version
   */
  async function generateUniqueCloneName(
    baseName: string,
    rollingPlanId: number,
  ): Promise<string> {
    let clonedName = `${baseName} ${generateRandomSuffix()}`;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loop

    // Check if the name already exists and generate a unique one
    while (attempts < maxAttempts) {
      const fieldsToCheck = [
        {
          field: rollingPlanVersions.name,
          value: clonedName,
          scope: {
            field: rollingPlanVersions.rollingPlanId,
            value: rollingPlanId,
          },
        },
      ];

      const conflicts =
        await rollingPlanVersionRepository.checkUniqueness(fieldsToCheck);

      if (conflicts.length === 0) {
        return clonedName; // Name is unique
      }

      // Name exists, try with new random suffix
      attempts++;
      clonedName = `${baseName} ${generateRandomSuffix()}`;
    }

    // Fallback: if all attempts failed (very unlikely), use timestamp
    const timestamp = Date.now().toString().slice(-6);
    return `${baseName} ${timestamp}`;
  }

  /**
   * Clones an existing rolling plan version
   * Creates a new version in draft state with the same configuration but without activation history
   * @param sourceVersion - The source version to clone (already validated)
   * @param name - Optional name for the cloned version. If not provided, a name will be auto-generated
   * @returns The cloned rolling plan version
   * @throws {FieldValidationError} If validation fails
   */
  async function cloneRollingPlanVersion(
    sourceVersion: RollingPlanVersion,
    name?: string,
  ): Promise<RollingPlanVersion> {
    // Use provided name or generate a unique one
    const clonedName = name
      ? name
      : await generateUniqueCloneName(
          sourceVersion.name,
          sourceVersion.rollingPlanId,
        );

    // Create payload for cloned version (copy all fields except activation history)
    const clonePayload: CreateRollingPlanVersionPayload = {
      rollingPlanId: sourceVersion.rollingPlanId,
      name: clonedName,
      notes: sourceVersion.notes ?? undefined,
      // state will be set to 'draft' automatically by the entity
      // activatedAt and deactivatedAt are not copied (no activation history)
    };

    // Create the cloned version
    return await createRollingPlanVersion(clonePayload);
  }

  return {
    createRollingPlanVersion,
    cloneRollingPlanVersion,
  };
}

export const rollingPlanVersionApplicationService =
  createRollingPlanVersionApplicationService();
