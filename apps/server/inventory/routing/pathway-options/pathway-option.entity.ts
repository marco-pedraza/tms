import { FieldErrorCollector } from '@repo/base-repo';
import { EntityUtils } from '@/shared/domain/entity-utils';
import type {
  PathwayOptionToll,
  SyncTollsInput,
} from '@/inventory/routing/pathway-options-tolls/pathway-options-tolls.types';
import type {
  MetricsCalculationInput,
  MetricsCalculationResult,
  PathwayOptionEntity,
  PathwayOptionEntityDependencies,
} from './pathway-option.entity.types';
import type {
  CreatePathwayOptionPayload,
  PathwayOption,
  UpdatePathwayOptionPayload,
} from './pathway-options.types';
import { pathwayOptionErrors } from './pathway-option.errors';

export function createPathwayOptionEntity(
  dependencies: PathwayOptionEntityDependencies,
) {
  const {
    pathwayOptionsRepository,
    pathwayOptionTollsRepository,
    nodesRepository,
  } = dependencies;

  // Desestructurar las utilidades del mixin
  const { isEntityPersisted } = EntityUtils;

  /**
   * Validates and calculates average speed from required distance and time
   * @param input - Object with metrics values
   * @returns Object with calculated avgSpeedKmh
   * @throws {FieldValidationError} If distanceKm or typicalTimeMin are missing or invalid
   */
  function calculateAvgSpeed(
    input: MetricsCalculationInput,
  ): MetricsCalculationResult {
    const { distanceKm, typicalTimeMin, avgSpeedKmh } = input;
    const collector = new FieldErrorCollector();

    // Validate distanceKm is provided and positive
    if (!distanceKm || distanceKm <= 0) {
      pathwayOptionErrors.distanceRequired(collector, distanceKm);
    }

    // Validate typicalTimeMin is provided and positive
    if (!typicalTimeMin || typicalTimeMin <= 0) {
      pathwayOptionErrors.timeRequired(collector, typicalTimeMin);
    }

    // Throw all validation errors at once
    collector.throwIfErrors();

    // At this point, both values are guaranteed to be valid numbers
    // Use type guards to ensure TypeScript understands they are not null
    if (!distanceKm || !typicalTimeMin) {
      // This should never happen due to validation above, but satisfies TypeScript
      throw new Error(
        'Invalid state: distanceKm and typicalTimeMin must be valid',
      );
    }

    const calculatedSpeed = (distanceKm * 60) / typicalTimeMin;

    return {
      distanceKm,
      typicalTimeMin,
      avgSpeedKmh: avgSpeedKmh ?? Number(calculatedSpeed.toFixed(2)),
    };
  }

  /**
   * Validates pass-through business rule
   * @param data - Data containing pass-through flags
   * @throws {FieldValidationError} If validation fails
   */
  function validatePassThroughRule(data: {
    isPassThrough?: boolean | null;
    passThroughTimeMin?: number | null;
  }): void {
    const collector = new FieldErrorCollector();

    if (
      data.isPassThrough === true &&
      (!data.passThroughTimeMin || data.passThroughTimeMin <= 0)
    ) {
      pathwayOptionErrors.passThroughRequiresTime(
        collector,
        data.passThroughTimeMin,
      );
    }

    if (data.isPassThrough === false && data.passThroughTimeMin != null) {
      pathwayOptionErrors.passThroughTimeWithoutFlag(
        collector,
        data.passThroughTimeMin ?? null,
      );
    }

    collector.throwIfErrors();
  }

  /**
   * Validates default and active relationship
   * @param data - Data containing default and active flags
   * @throws {FieldValidationError} If validation fails
   */
  function validateDefaultActiveRule(data: {
    isDefault?: boolean | null;
    active?: boolean | null;
  }): void {
    const collector = new FieldErrorCollector();

    if (data.isDefault === true && data.active === false) {
      pathwayOptionErrors.defaultRequiresActive(collector, data.active);
    }

    collector.throwIfErrors();
  }

  /**
   * Validates pathway option data according to business rules
   * @param data - The pathway option data to validate
   * @throws {FieldValidationError} If there are validation violations
   */
  function validatePathwayOptionRules(
    data:
      | CreatePathwayOptionPayload
      | UpdatePathwayOptionPayload
      | Partial<PathwayOption>,
  ): void {
    validatePassThroughRule(data);
    validateDefaultActiveRule(data);
  }

  /**
   * Validates no duplicate nodes in tolls array
   * @param tollsInput - Array of toll inputs
   * @param collector - Error collector
   */
  function validateNoDuplicateTollNodes(
    tollsInput: SyncTollsInput[],
    collector: FieldErrorCollector,
  ): void {
    const nodeIds = tollsInput.map((t) => t.nodeId);
    const seenNodes = new Set<number>();
    const duplicates = new Set<number>();

    for (const nodeId of nodeIds) {
      if (seenNodes.has(nodeId)) {
        duplicates.add(nodeId);
      }
      seenNodes.add(nodeId);
    }

    if (duplicates.size > 0) {
      pathwayOptionErrors.duplicateTollNode(
        collector,
        Array.from(duplicates).join(', '),
      );
    }
  }

  /**
   * Validates no consecutive duplicate nodes in tolls array
   * @param tollsInput - Array of toll inputs
   * @param collector - Error collector
   */
  function validateNoConsecutiveDuplicates(
    tollsInput: SyncTollsInput[],
    collector: FieldErrorCollector,
  ): void {
    for (let i = 1; i < tollsInput.length; i++) {
      if (tollsInput[i].nodeId === tollsInput[i - 1].nodeId) {
        pathwayOptionErrors.consecutiveDuplicateToll(
          collector,
          `positions ${i} and ${i + 1}`,
        );
      }
    }
  }

  /**
   * Validates all toll nodes exist in database using bulk query
   * @param tollsInput - Array of toll inputs
   * @param collector - Error collector
   */
  async function validateTollNodesExist(
    tollsInput: SyncTollsInput[],
    collector: FieldErrorCollector,
  ): Promise<void> {
    const nodeIds = tollsInput.map((t) => t.nodeId);
    const existingNodes = await nodesRepository.findByIds(nodeIds);
    const existingNodeIds = new Set(existingNodes.map((n) => n.id));
    const missingNodes = nodeIds.filter((id) => !existingNodeIds.has(id));

    if (missingNodes.length > 0) {
      pathwayOptionErrors.tollNodeNotFound(collector, missingNodes.join(', '));
    }
  }

  /**
   * Validates tolls business rules
   * @param tollsInput - Array of toll inputs to validate
   * @throws {FieldValidationError} If there are validation violations
   */
  async function validateTollsBusinessRules(
    tollsInput: SyncTollsInput[],
  ): Promise<void> {
    const collector = new FieldErrorCollector();

    validateNoDuplicateTollNodes(tollsInput, collector);
    validateNoConsecutiveDuplicates(tollsInput, collector);
    await validateTollNodesExist(tollsInput, collector);

    collector.throwIfErrors();
  }

  /**
   * Creates a new pathway option entity (not persisted)
   * @param payload - The pathway option creation data
   * @returns A new pathway option entity
   * @throws {FieldValidationError} If validation fails
   */
  function create(payload: CreatePathwayOptionPayload): PathwayOptionEntity {
    // Validate business rules
    validatePathwayOptionRules(payload);

    // Always validate and calculate metrics (distanceKm and typicalTimeMin are required)
    const calculatedMetrics = calculateAvgSpeed({
      distanceKm: payload.distanceKm ?? null,
      typicalTimeMin: payload.typicalTimeMin ?? null,
      avgSpeedKmh: payload.avgSpeedKmh ?? null,
    });

    // Create entity data with calculated metrics
    const entityData: Omit<PathwayOption, 'id'> = {
      pathwayId: payload.pathwayId,
      name: payload.name ?? null,
      description: payload.description ?? null,
      distanceKm: calculatedMetrics.distanceKm,
      typicalTimeMin: calculatedMetrics.typicalTimeMin,
      avgSpeedKmh: calculatedMetrics.avgSpeedKmh,
      isDefault: payload.isDefault ?? false,
      isPassThrough: payload.isPassThrough ?? false,
      passThroughTimeMin: payload.passThroughTimeMin ?? null,
      sequence: payload.sequence ?? null,
      active: payload.active ?? true,
      createdAt: null,
      updatedAt: null,
      deletedAt: null,
    };

    return createEntityFromData(entityData);
  }

  /**
   * Finds a pathway option by ID
   * @param id - The pathway option ID to find
   * @returns The pathway option entity
   * @throws {NotFoundError} If pathway option is not found
   */
  async function findOne(id: number): Promise<PathwayOptionEntity> {
    const pathwayOption = await pathwayOptionsRepository.findOne(id);
    return createEntityFromData(pathwayOption);
  }

  /**
   * Creates a pathway option entity from existing data
   * @param data - The pathway option data
   * @returns A pathway option entity with domain behavior
   */
  function createEntityFromData(
    data: Partial<PathwayOption> & { pathwayId: number },
  ): PathwayOptionEntity {
    const isPersisted = isEntityPersisted(data.id);

    // Create clean data object ensuring proper null handling
    const cleanData = {
      id: data.id,
      pathwayId: data.pathwayId,
      name: data.name ?? null,
      description: data.description ?? null,
      distanceKm: data.distanceKm ?? null,
      typicalTimeMin: data.typicalTimeMin ?? null,
      avgSpeedKmh: data.avgSpeedKmh ?? null,
      isDefault: data.isDefault ?? null,
      isPassThrough: data.isPassThrough ?? null,
      passThroughTimeMin: data.passThroughTimeMin ?? null,
      sequence: data.sequence ?? null,
      active: data.active ?? null,
      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? null,
      deletedAt: data.deletedAt ?? null,
    };

    return {
      // Spread all data properties
      ...cleanData,

      // Entity metadata
      isPersisted,

      // Entity methods
      save: async (): Promise<PathwayOptionEntity> => {
        if (isPersisted) {
          throw new Error('PathwayOption is already persisted');
        }

        const payload: CreatePathwayOptionPayload = {
          pathwayId: data.pathwayId,
          name: data.name ?? undefined,
          description: data.description ?? undefined,
          distanceKm: data.distanceKm ?? undefined,
          typicalTimeMin: data.typicalTimeMin ?? undefined,
          avgSpeedKmh: data.avgSpeedKmh ?? undefined,
          isDefault: data.isDefault ?? undefined,
          isPassThrough: data.isPassThrough ?? undefined,
          passThroughTimeMin: data.passThroughTimeMin ?? undefined,
          sequence: data.sequence ?? undefined,
          active: data.active ?? undefined,
        };

        const savedPathwayOption =
          await pathwayOptionsRepository.create(payload);
        return createEntityFromData(savedPathwayOption);
      },

      update: async (
        payload: UpdatePathwayOptionPayload,
      ): Promise<PathwayOptionEntity> => {
        if (!isPersisted || !data.id) {
          throw new Error('Cannot update non-persisted PathwayOption');
        }

        // Validate business rules with new data
        const updatedData = { ...data, ...payload };
        validatePathwayOptionRules(updatedData);

        // Calculate metrics if distance or time are being updated
        let updatePayload = { ...payload };
        if (
          payload.distanceKm !== undefined ||
          payload.typicalTimeMin !== undefined
        ) {
          const calculatedMetrics = calculateAvgSpeed({
            distanceKm: payload.distanceKm ?? data.distanceKm ?? null,
            typicalTimeMin:
              payload.typicalTimeMin ?? data.typicalTimeMin ?? null,
            avgSpeedKmh: payload.avgSpeedKmh ?? null, // Force recalculation unless explicitly provided
          });

          updatePayload = {
            ...updatePayload,
            distanceKm: calculatedMetrics.distanceKm,
            typicalTimeMin: calculatedMetrics.typicalTimeMin,
            avgSpeedKmh: calculatedMetrics.avgSpeedKmh,
          };
        }

        const updatedPathwayOption = await pathwayOptionsRepository.update(
          data.id,
          updatePayload,
        );
        return createEntityFromData(updatedPathwayOption);
      },

      toPathwayOption: (): PathwayOption => {
        if (!isPersisted || !data.id) {
          throw new Error(
            'Cannot convert non-persisted entity to PathwayOption',
          );
        }

        return {
          id: data.id,
          pathwayId: data.pathwayId,
          name: data.name ?? null,
          description: data.description ?? null,
          distanceKm: data.distanceKm ?? null,
          typicalTimeMin: data.typicalTimeMin ?? null,
          avgSpeedKmh: data.avgSpeedKmh ?? null,
          isDefault: data.isDefault ?? null,
          isPassThrough: data.isPassThrough ?? null,
          passThroughTimeMin: data.passThroughTimeMin ?? null,
          sequence: data.sequence ?? null,
          active: data.active ?? null,
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
          deletedAt: data.deletedAt ?? null,
        };
      },

      syncTolls: async (
        tollsInput: SyncTollsInput[],
      ): Promise<PathwayOptionEntity> => {
        if (!isPersisted || !data.id) {
          const collector = new FieldErrorCollector();
          pathwayOptionErrors.cannotSyncTollsOnNonPersisted(collector, null);
          collector.throwIfErrors();
          throw new Error('Unreachable'); // TypeScript guard
        }

        const optionId = data.id;

        // Validate business rules
        await validateTollsBusinessRules(tollsInput);

        // Destructive sync: delete all existing tolls
        await pathwayOptionTollsRepository.deleteByOptionId(optionId);

        // Create new tolls with auto-assigned sequence (1..N)
        if (tollsInput.length > 0) {
          const tollPayloads = tollsInput.map((toll, index) => ({
            pathwayOptionId: optionId,
            nodeId: toll.nodeId,
            sequence: index + 1,
            passTimeMin: toll.passTimeMin,
            distance: toll.distance,
          }));

          await pathwayOptionTollsRepository.createMany(tollPayloads);
        }

        // Return fresh instance
        const updated = await pathwayOptionsRepository.findOne(optionId);
        return createEntityFromData(updated);
      },

      /**
       * Gets all tolls for this pathway option ordered by sequence
       * @returns Array of pathway option tolls
       * @throws {FieldValidationError} If entity is not persisted
       */
      getTolls: async (): Promise<PathwayOptionToll[]> => {
        if (!isPersisted || !data.id) {
          const collector = new FieldErrorCollector();
          pathwayOptionErrors.cannotGetTollsFromNonPersisted(collector, null);
          collector.throwIfErrors();
          throw new Error('Unreachable'); // TypeScript guard TODO: Simplify this
        }

        return await pathwayOptionTollsRepository.findByOptionId(data.id);
      },
    } as PathwayOptionEntity;
  }

  return {
    create,
    findOne,
    fromData: createEntityFromData,
    calculateMetrics: calculateAvgSpeed,
    // Export validation functions for reuse
    validators: {
      validateNoDuplicateTollNodes,
      validateNoConsecutiveDuplicates,
      validateTollNodesExist,
    },
  };
}
