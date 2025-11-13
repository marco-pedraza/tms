import { FieldErrorCollector } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
import { EntityUtils } from '@/shared/domain/entity-utils';
import { standardFieldErrors } from '@/shared/errors';
import { rollingPlanVersions } from './rolling-plan-versions.schema';
import type {
  CreateRollingPlanVersionPayload,
  RollingPlanVersion,
  RollingPlanVersionEntity,
  RollingPlanVersionEntityDependencies,
} from './rolling-plan-versions.types';

export function createRollingPlanVersionEntity(
  dependencies: RollingPlanVersionEntityDependencies,
) {
  const { rollingPlanVersionsRepository } = dependencies;

  const { isEntityPersisted } = EntityUtils;

  /**
   * Validates uniqueness constraints for rolling plan version data
   * Name must be unique per rolling plan (scoped uniqueness)
   * @param payload - Rolling plan version data to validate
   * @param collector - Error collector to accumulate validation errors
   */
  async function validateUniqueness(
    payload: CreateRollingPlanVersionPayload,
    collector: FieldErrorCollector,
  ): Promise<void> {
    // Name must be unique per rolling plan (scoped uniqueness)
    const { rollingPlanId, name } = payload;

    if (name !== undefined && rollingPlanId !== undefined) {
      const fieldsToCheck = [
        {
          field: rollingPlanVersions.name,
          value: name,
          scope: {
            field: rollingPlanVersions.rollingPlanId,
            value: rollingPlanId,
          },
        },
      ];

      // Check uniqueness with scope (no currentId for creation)
      await rollingPlanVersionsRepository
        .checkUniqueness(fieldsToCheck)
        .then((conflicts) => {
          // Add errors for each conflict found
          for (const conflict of conflicts) {
            const error = standardFieldErrors.duplicate(
              'Rolling Plan Version',
              conflict.field,
              conflict.value as string,
            );
            collector.addError(
              error.field,
              error.code,
              error.message,
              error.value,
            );
          }
        })
        .catch(() => {
          // If checkUniqueness fails, skip uniqueness validation
          // This prevents unhandled errors from breaking the validation flow
        });
    }
  }

  /**
   * Validates all business rules for rolling plan version creation
   * @param payload - The rolling plan version payload to validate
   * @param collector - Error collector to accumulate validation errors
   */
  async function validateRollingPlanVersionPayload(
    payload: CreateRollingPlanVersionPayload,
    collector: FieldErrorCollector,
  ): Promise<void> {
    // Validate uniqueness constraints
    await validateUniqueness(payload, collector);
  }

  /**
   * Creates a rolling plan version entity from existing rolling plan version data
   * @param versionData - The rolling plan version data
   * @returns A rolling plan version entity with domain behavior
   */
  function createInstance(
    versionData: Partial<RollingPlanVersion>,
  ): RollingPlanVersionEntity {
    const isPersisted = isEntityPersisted(versionData.id);

    /**
     * Saves the rolling plan version entity to the database within a transaction
     * @param tx - Database transaction instance (required)
     * @returns The persisted rolling plan version entity
     */
    async function save(
      tx: TransactionalDB,
    ): Promise<RollingPlanVersionEntity> {
      const collector = new FieldErrorCollector();

      if (isPersisted) {
        // Already persisted, return new instance with same data (no-op save)
        return createInstance(versionData);
      }

      const payload = versionData as CreateRollingPlanVersionPayload;

      // Validate all business rules and collect errors
      await validateRollingPlanVersionPayload(payload, collector);

      // Throw all collected errors at once
      collector.throwIfErrors();

      // Create in database (repository already has transaction if needed)
      const version = await rollingPlanVersionsRepository.create(payload, tx);

      return createInstance(version);
    }

    function toRollingPlanVersion(): RollingPlanVersion {
      // Validate required fields exist
      if (
        versionData.id === undefined ||
        versionData.rollingPlanId === undefined ||
        versionData.name === undefined ||
        versionData.state === undefined
      ) {
        throw new Error(
          'Cannot convert to RollingPlanVersion: missing required fields',
        );
      }

      return {
        id: versionData.id,
        rollingPlanId: versionData.rollingPlanId,
        name: versionData.name,
        state: versionData.state,
        notes: versionData.notes ?? null,
        activatedAt: versionData.activatedAt ?? null,
        deactivatedAt: versionData.deactivatedAt ?? null,
        createdAt: versionData.createdAt ?? null,
        updatedAt: versionData.updatedAt ?? null,
      };
    }

    // Use spread operator to provide direct access to all properties
    return {
      ...versionData,
      isPersisted,
      save,
      toRollingPlanVersion,
    } as RollingPlanVersionEntity;
  }

  /**
   * Creates a new rolling plan version entity from payload data (not yet persisted)
   * @param payload - The rolling plan version creation data
   * @returns A new RollingPlanVersionEntity instance ready to be saved
   */
  function create(
    payload: CreateRollingPlanVersionPayload,
  ): RollingPlanVersionEntity {
    // Force state to "draft" on creation
    // Use spread operator with defaults for optional fields
    const versionData = {
      ...payload,
      state: 'draft' as const, // Always set to draft on creation
      // createdAt and updatedAt will be set by the database automatically
    };

    return createInstance(versionData);
  }

  return {
    create,
  };
}
