import { FieldErrorCollector } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
import { EntityUtils } from '@/shared/domain/entity-utils';
import { standardFieldErrors } from '@/shared/errors';
import { rollingPlans } from './rolling-plans.schema';
import type {
  CreateRollingPlanPayload,
  RollingPlan,
  RollingPlanEntity,
  RollingPlanEntityDependencies,
  UpdateRollingPlanPayload,
} from './rolling-plans.types';
import { rollingPlanErrors } from './rolling-plan.errors';

export function createRollingPlanEntity(
  dependencies: RollingPlanEntityDependencies,
) {
  const { rollingPlansRepository, inventoryAdapter } = dependencies;

  const { isEntityPersisted } = EntityUtils;

  /**
   * Internal payload types that include the derived serviceTypeId field
   * These types are used internally when creating/updating rolling plans
   * to pass the inferred serviceTypeId to the repository
   */
  type InternalCreatePayload = CreateRollingPlanPayload & {
    serviceTypeId: number;
  };

  type InternalUpdatePayload = UpdateRollingPlanPayload & {
    serviceTypeId: number;
  };

  /**
   * Validates that related entities exist using inventory adapter
   * @param payload - Rolling plan payload to validate
   * @param collector - Error collector to accumulate validation errors
   */
  async function validateRelatedEntities(
    payload: CreateRollingPlanPayload | UpdateRollingPlanPayload,
    collector: FieldErrorCollector,
  ): Promise<void> {
    // Validate busline exists
    if (payload.buslineId) {
      await inventoryAdapter.getBusLine(payload.buslineId).catch(() => {
        rollingPlanErrors.buslineNotFound(collector, payload.buslineId);
      });
    }

    // Validate bus model exists
    if (payload.busModelId) {
      await inventoryAdapter.getBusModel(payload.busModelId).catch(() => {
        rollingPlanErrors.busModelNotFound(collector, payload.busModelId);
      });
    }

    // Validate base node exists
    if (payload.baseNodeId) {
      await inventoryAdapter.getNode(payload.baseNodeId).catch(() => {
        rollingPlanErrors.baseNodeNotFound(collector, payload.baseNodeId);
      });
    }
  }

  // Valid day keys for operationDays validation
  type ValidDayKey =
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';
  const VALID_DAY_KEYS: readonly ValidDayKey[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ] as const;

  /**
   * Helper to get value from payload or existing rolling plan
   * @param payloadValue - Value from payload
   * @param existingValue - Value from existing rolling plan
   * @returns The value to use (payload takes precedence)
   */
  function getValue<T>(
    payloadValue: T | undefined,
    existingValue: T | undefined,
  ): T | undefined {
    return payloadValue ?? existingValue;
  }

  /**
   * Validates operationDays configuration for specific_days operation type
   * @param operationDays - The operation days object to validate
   * @param collector - Error collector to accumulate validation errors
   */
  function validateOperationDays(
    operationDays: Record<string, unknown> | null | undefined,
    collector: FieldErrorCollector,
  ): void {
    if (operationDays === undefined || operationDays === null) {
      rollingPlanErrors.operationDaysRequired(collector);
      return;
    }

    // Validate that operationDays is an object (not array, not primitive)
    if (typeof operationDays !== 'object' || Array.isArray(operationDays)) {
      rollingPlanErrors.operationDaysInvalidType(collector);
      return;
    }

    const keys = Object.keys(operationDays);
    const values = Object.values(operationDays);

    // Validate that all keys are valid day names
    const invalidKeys = keys.filter(
      (key) => !VALID_DAY_KEYS.includes(key as ValidDayKey),
    );
    if (invalidKeys.length > 0) {
      rollingPlanErrors.operationDaysInvalidKeys(collector);
      return;
    }

    // Validate that all values are exactly true (not false, not other values)
    const invalidValues = values.filter((value) => value !== true);
    if (invalidValues.length > 0) {
      rollingPlanErrors.operationDaysInvalidValues(collector);
      return;
    }

    // Validate that at least one day is configured
    if (keys.length === 0) {
      rollingPlanErrors.operationDaysAtLeastOne(collector);
    }
  }

  /**
   * Validates continuous operation type requirements
   * @param cycleDurationDays - Cycle duration in days
   * @param collector - Error collector to accumulate validation errors
   */
  function validateContinuousOperation(
    cycleDurationDays: number | null | undefined,
    collector: FieldErrorCollector,
  ): void {
    if (cycleDurationDays === undefined || cycleDurationDays === null) {
      rollingPlanErrors.cycleDurationDaysRequired(collector);
    } else if (cycleDurationDays < 1) {
      rollingPlanErrors.cycleDurationDaysInvalid(collector);
    }
  }

  /**
   * Determines if validation should be performed for updates
   * @param existingRollingPlan - Optional existing rolling plan data
   * @param payload - Rolling plan payload to validate
   * @returns Whether validation should be performed
   */
  function shouldValidateOperationType(
    existingRollingPlan: Partial<RollingPlan> | undefined,
    payload: CreateRollingPlanPayload | UpdateRollingPlanPayload,
  ): boolean {
    // For creation, always validate
    if (!existingRollingPlan) {
      return true;
    }

    // For updates, validate if operationType is being changed
    const isOperationTypeChanging =
      payload.operationType !== undefined &&
      payload.operationType !== existingRollingPlan.operationType;

    // Or if cycleDurationDays/operationDays are being set
    const isOperationDataChanging =
      payload.cycleDurationDays !== undefined ||
      payload.operationDays !== undefined;

    return isOperationTypeChanging || isOperationDataChanging;
  }

  /**
   * Validates operation type specific requirements
   * @param payload - Rolling plan payload to validate
   * @param collector - Error collector to accumulate validation errors
   * @param existingRollingPlan - Optional existing rolling plan data for updates
   */
  function validateOperationTypeRequirements(
    payload: CreateRollingPlanPayload | UpdateRollingPlanPayload,
    collector: FieldErrorCollector,
    existingRollingPlan?: Partial<RollingPlan>,
  ): void {
    // Determine the operation type to validate
    const operationType = getValue(
      payload.operationType,
      existingRollingPlan?.operationType,
    );

    if (!operationType) {
      return;
    }

    // Check if validation should be performed
    if (!shouldValidateOperationType(existingRollingPlan, payload)) {
      return;
    }

    if (operationType === 'continuous') {
      const cycleDurationDays = getValue(
        payload.cycleDurationDays,
        existingRollingPlan?.cycleDurationDays,
      );
      validateContinuousOperation(cycleDurationDays, collector);
    } else if (operationType === 'specific_days') {
      const operationDays = getValue(
        payload.operationDays,
        existingRollingPlan?.operationDays,
      );
      validateOperationDays(operationDays, collector);
    }
  }

  /**
   * Validates uniqueness constraints for rolling plan data
   * Name must be unique per busline (scoped uniqueness)
   * @param payload - Rolling plan data to validate
   * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
   * @param collector - Error collector to accumulate validation errors
   */
  async function validateUniqueness(
    payload: CreateRollingPlanPayload | UpdateRollingPlanPayload,
    currentId: number | undefined,
    collector: FieldErrorCollector,
  ): Promise<void> {
    // Name must be unique per busline (scoped uniqueness)
    // We need buslineId to check scoped uniqueness
    // For updates, if buslineId is not in payload, get it from existing entity
    let buslineId = payload.buslineId;
    const name = payload.name;

    // If updating and buslineId is not in payload, get it from existing entity
    if (currentId && !buslineId && name) {
      await rollingPlansRepository
        .findOne(currentId)
        .then((existingPlan) => {
          buslineId = existingPlan.buslineId;
        })
        .catch(() => {
          // If entity not found, skip uniqueness check (will be caught by other validations)
          // Don't set buslineId, which will cause the uniqueness check to be skipped
        });
    }

    if (name !== undefined && buslineId !== undefined) {
      const fieldsToCheck = [
        {
          field: rollingPlans.name,
          value: name,
          scope: {
            field: rollingPlans.buslineId,
            value: buslineId,
          },
        },
      ];

      // Check uniqueness with scope
      await rollingPlansRepository
        .checkUniqueness(fieldsToCheck, currentId)
        .then((conflicts) => {
          // Add errors for each conflict found
          for (const conflict of conflicts) {
            const error = standardFieldErrors.duplicate(
              'Rolling Plan',
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
   * Sanitizes payload by nullifying incompatible fields based on effective operation type
   * @param payload - The rolling plan payload to sanitize (may include internal types with serviceTypeId)
   * @param existingRollingPlan - Optional existing rolling plan data to compute effective operation type
   * @returns Sanitized payload with incompatible fields nullified
   */
  function sanitizePayloadByOperationType(
    payload:
      | CreateRollingPlanPayload
      | UpdateRollingPlanPayload
      | InternalCreatePayload
      | InternalUpdatePayload,
    existingRollingPlan?: Partial<RollingPlan>,
  ):
    | CreateRollingPlanPayload
    | UpdateRollingPlanPayload
    | InternalCreatePayload
    | InternalUpdatePayload {
    // Compute effective operation type: use payload if provided, otherwise fall back to existing
    const effectiveOperationType =
      payload.operationType ?? existingRollingPlan?.operationType;

    if (!effectiveOperationType) {
      // No operation type available, return payload as-is
      return payload;
    }

    // Create sanitized payload copy
    const sanitized = { ...payload };

    // Nullify incompatible fields based on effective operation type
    if (effectiveOperationType === 'specific_days') {
      // For specific_days, cycleDurationDays must be null
      sanitized.cycleDurationDays = null;
    } else if (effectiveOperationType === 'continuous') {
      // For continuous, operationDays must be null
      sanitized.operationDays = null;
    }

    return sanitized;
  }

  /**
   * Validates all business rules for rolling plan creation or update
   * @param payload - The rolling plan payload to validate
   * @param collector - Error collector to accumulate validation errors
   * @param existingRollingPlan - Optional existing rolling plan data for updates
   */
  async function validateRollingPlanPayload(
    payload: CreateRollingPlanPayload | UpdateRollingPlanPayload,
    collector: FieldErrorCollector,
    existingRollingPlan?: Partial<RollingPlan>,
  ): Promise<void> {
    // Determine which IDs to validate based on what's being updated
    const buslineId = payload.buslineId ?? existingRollingPlan?.buslineId;
    const busModelId = payload.busModelId ?? existingRollingPlan?.busModelId;
    const baseNodeId = payload.baseNodeId ?? existingRollingPlan?.baseNodeId;
    const operationType =
      payload.operationType ?? existingRollingPlan?.operationType;

    // For creation, all IDs are required
    // For updates, validate only what's being changed
    const payloadToValidate = {
      ...payload,
      buslineId,
      busModelId,
      baseNodeId,
      operationType,
    };

    // Validate uniqueness constraints
    const currentId = existingRollingPlan?.id;
    await validateUniqueness(payloadToValidate, currentId, collector);

    // Validate related entities exist
    await validateRelatedEntities(payloadToValidate, collector);

    // Validate operation type specific requirements
    validateOperationTypeRequirements(
      payloadToValidate,
      collector,
      existingRollingPlan,
    );
  }

  /**
   * Creates a rolling plan entity from existing rolling plan data
   * @param rollingPlanData - The rolling plan data
   * @returns A rolling plan entity with domain behavior
   */
  function createInstance(
    rollingPlanData: Partial<RollingPlan>,
  ): RollingPlanEntity {
    const isPersisted = isEntityPersisted(rollingPlanData.id);

    /**
     * Saves the rolling plan entity to the database within a transaction
     * @param tx - Database transaction instance (required)
     * @returns The persisted rolling plan entity
     */
    async function save(tx: TransactionalDB): Promise<RollingPlanEntity> {
      const collector = new FieldErrorCollector();

      if (isPersisted) {
        // Already persisted, return same instance
        return createInstance(rollingPlanData);
      }

      const payload = rollingPlanData as CreateRollingPlanPayload;

      // Validate all business rules and collect errors
      await validateRollingPlanPayload(payload, collector);

      // Throw all collected errors at once
      collector.throwIfErrors();

      // Get bus line to infer serviceTypeId (already validated, so it exists)
      const busline = await inventoryAdapter.getBusLine(payload.buslineId);

      // Create internal payload with inferred serviceTypeId
      const internalPayload: InternalCreatePayload = {
        ...payload,
        serviceTypeId: busline.serviceTypeId,
      };

      // Sanitize payload by nullifying incompatible fields based on effective operation type
      const sanitizedPayload = sanitizePayloadByOperationType(
        internalPayload,
      ) as InternalCreatePayload;

      // Create in database (repository already has transaction if needed)
      const rollingPlan = await rollingPlansRepository.create(
        sanitizedPayload,
        tx,
      );

      return createInstance(rollingPlan);
    }

    async function update(
      payload: UpdateRollingPlanPayload,
      tx: TransactionalDB,
    ): Promise<RollingPlanEntity> {
      const collector = new FieldErrorCollector();

      // Validate entity is persisted
      if (!isPersisted) {
        rollingPlanErrors.updateNotPersisted(collector, rollingPlanData.id);
      }

      if (!rollingPlanData.id) {
        throw new Error(
          'Internal error: rolling plan ID should exist for updates',
        );
      }

      // Validate update payload business rules
      await validateRollingPlanPayload(payload, collector, rollingPlanData);

      // Throw all collected errors at once
      collector.throwIfErrors();

      // Infer serviceTypeId from bus line only if buslineId is being updated
      // If buslineId is not being updated, serviceTypeId remains unchanged in the database
      let payloadWithServiceType:
        | UpdateRollingPlanPayload
        | InternalUpdatePayload = payload;

      if (payload.buslineId !== undefined) {
        // buslineId is being updated, get bus line to infer serviceTypeId (already validated, so it exists)
        const busline = await inventoryAdapter.getBusLine(payload.buslineId);
        // Create internal payload with inferred serviceTypeId
        payloadWithServiceType = {
          ...payload,
          serviceTypeId: busline.serviceTypeId,
        } as InternalUpdatePayload;
      }

      // Sanitize payload by nullifying incompatible fields based on effective operation type
      // This happens after validation but before saving to database
      const sanitizedPayload = sanitizePayloadByOperationType(
        payloadWithServiceType,
        rollingPlanData,
      ) as UpdateRollingPlanPayload | InternalUpdatePayload;

      // Update in database (repository already has transaction if needed)
      const updatedRollingPlan = await rollingPlansRepository.update(
        rollingPlanData.id,
        sanitizedPayload,
        tx,
      );

      return createInstance(updatedRollingPlan);
    }

    function toRollingPlan(): RollingPlan {
      // Validate required fields exist
      if (
        rollingPlanData.id === undefined ||
        rollingPlanData.name === undefined ||
        rollingPlanData.buslineId === undefined ||
        rollingPlanData.serviceTypeId === undefined ||
        rollingPlanData.busModelId === undefined ||
        rollingPlanData.baseNodeId === undefined ||
        rollingPlanData.operationType === undefined ||
        rollingPlanData.active === undefined
      ) {
        throw new Error(
          'Cannot convert to RollingPlan: missing required fields',
        );
      }

      return {
        id: rollingPlanData.id,
        name: rollingPlanData.name,
        buslineId: rollingPlanData.buslineId,
        serviceTypeId: rollingPlanData.serviceTypeId,
        busModelId: rollingPlanData.busModelId,
        baseNodeId: rollingPlanData.baseNodeId,
        operationType: rollingPlanData.operationType,
        cycleDurationDays: rollingPlanData.cycleDurationDays ?? null,
        operationDays: rollingPlanData.operationDays ?? null,
        active: rollingPlanData.active,
        notes: rollingPlanData.notes ?? null,
        createdAt: rollingPlanData.createdAt ?? null,
        updatedAt: rollingPlanData.updatedAt ?? null,
      };
    }

    // Use spread operator to provide direct access to all properties
    return {
      ...rollingPlanData,
      isPersisted,
      save,
      update,
      toRollingPlan,
    } as RollingPlanEntity;
  }

  /**
   * Creates a new rolling plan entity from payload data (not yet persisted)
   * @param payload - The rolling plan creation data
   * @returns A new RollingPlanEntity instance ready to be saved
   */
  function create(payload: CreateRollingPlanPayload): RollingPlanEntity {
    // Use spread operator with defaults for optional fields
    const rollingPlanData = {
      ...payload,
      active: payload.active ?? true,
      // createdAt and updatedAt will be set by the database automatically
    };

    return createInstance(rollingPlanData);
  }

  /**
   * Finds a rolling plan by ID from the database
   * @param id - The rolling plan ID to find
   * @returns The rolling plan entity
   * @throws {NotFoundError} If rolling plan is not found
   */
  async function findOne(id: number): Promise<RollingPlanEntity> {
    const rollingPlan = await rollingPlansRepository.findOne(id);
    return createInstance(rollingPlan);
  }

  return {
    create,
    findOne,
  };
}
