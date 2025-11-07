import { FieldErrorCollector } from '@repo/base-repo';
import { EntityUtils } from '@/shared/domain/entity-utils';
import { assertIsValidTollbooth } from '@/inventory/locations/tollbooths/tollbooths.guard';
import type {
  PathwayOptionToll,
  SyncTollsInput,
} from '@/inventory/routing/pathway-options-tolls/pathway-options-tolls.types';
import { pathwayUsageValidationService } from '../shared/pathway-usage-validation.service';
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

/**
 * Internal payload type for creating pathway options with calculated avgSpeedKmh
 * Used internally to pass calculated avgSpeedKmh to repository
 */
type CreatePathwayOptionPayloadWithCalculatedSpeed =
  CreatePathwayOptionPayload & {
    avgSpeedKmh?: number;
  };

/**
 * Internal payload type for updating pathway options with calculated avgSpeedKmh
 * Used internally to pass calculated avgSpeedKmh to repository
 */
type UpdatePathwayOptionPayloadWithCalculatedSpeed =
  UpdatePathwayOptionPayload & {
    avgSpeedKmh?: number;
  };

export function createPathwayOptionEntity(
  dependencies: PathwayOptionEntityDependencies,
) {
  const {
    pathwayOptionsRepository,
    pathwayOptionTollsRepository,
    nodesRepository,
    tollboothRepository,
  } = dependencies;

  // Destructure utilities from the mixin
  const { isEntityPersisted } = EntityUtils;

  /**
   * Validates and calculates average speed from required distance and time
   * @param input - Object with distance and time values
   * @returns Object with calculated avgSpeedKmh
   * @throws {FieldValidationError} If distanceKm or typicalTimeMin are missing or invalid
   */
  function calculateAvgSpeed(
    input: MetricsCalculationInput,
  ): MetricsCalculationResult {
    const { distanceKm, typicalTimeMin } = input;
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
      avgSpeedKmh: Number(calculatedSpeed.toFixed(2)),
    };
  }

  /**
   * Calculates pass time in minutes for a toll based on distance and average speed
   * @param distance - Distance to the toll point in kilometers
   * @param avgSpeedKmh - Average speed in kilometers per hour
   * @returns Calculated pass time in minutes (rounded to nearest integer)
   * @throws {Error} If avgSpeedKmh is not positive
   */
  function calculatePassTimeMin(distance: number, avgSpeedKmh: number): number {
    if (!avgSpeedKmh || avgSpeedKmh <= 0) {
      throw new Error(
        'avgSpeedKmh must be a positive number to calculate passTimeMin',
      );
    }

    return Math.round((distance * 60) / avgSpeedKmh);
  }

  /**
   * Calculates and adds avgSpeedKmh to a payload if distanceKm and typicalTimeMin are available
   * Returns a new object with the calculated avgSpeedKmh, maintaining immutability
   * @param payload - Payload to enrich with calculated avgSpeedKmh
   * @returns New payload object with calculated avgSpeedKmh if applicable
   */
  function addCalculatedAvgSpeedToPayload<
    T extends {
      distanceKm?: number;
      typicalTimeMin?: number;
      avgSpeedKmh?: number;
    },
  >(payload: T): T {
    if (payload.distanceKm && payload.typicalTimeMin) {
      const calculatedMetrics = calculateAvgSpeed({
        distanceKm: payload.distanceKm,
        typicalTimeMin: payload.typicalTimeMin,
      });
      return {
        ...payload,
        avgSpeedKmh: calculatedMetrics.avgSpeedKmh,
      };
    }
    return payload;
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
   * Validates that all toll nodes are valid tollbooths with required data
   * Uses batch fetching for performance (single query)
   * @param tollsInput - Array of toll inputs to validate
   * @param collector - Field error collector
   */
  async function validateTollNodesAreTollbooths(
    tollsInput: SyncTollsInput[],
    collector: FieldErrorCollector,
  ): Promise<void> {
    if (tollsInput.length === 0) {
      return;
    }

    const nodeIds = tollsInput.map((toll) => toll.nodeId);

    // Single batch query - fetch all tollbooths at once
    const tollbooths = await tollboothRepository.findByIds(nodeIds);

    // Create a map for O(1) lookup
    const tollboothMap = new Map(tollbooths.map((tb) => [tb.id, tb]));

    // Validate each node
    for (const nodeId of nodeIds) {
      const tollbooth = tollboothMap.get(nodeId);

      if (!tollbooth) {
        // Node doesn't exist or is not a tollbooth
        pathwayOptionErrors.tollNodeNotTollbooth(collector, nodeId);
      } else {
        // Node is a tollbooth, validate business rules
        try {
          assertIsValidTollbooth(tollbooth);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          pathwayOptionErrors.invalidTollboothData(
            collector,
            `Node ${nodeId}: ${errorMessage}`,
          );
        }
      }
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
    await validateTollNodesAreTollbooths(tollsInput, collector);

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
    if (!payload.distanceKm || !payload.typicalTimeMin) {
      const collector = new FieldErrorCollector();
      if (!payload.distanceKm) {
        pathwayOptionErrors.distanceRequired(collector, payload.distanceKm);
      }
      if (!payload.typicalTimeMin) {
        pathwayOptionErrors.timeRequired(collector, payload.typicalTimeMin);
      }
      collector.throwIfErrors();
    }

    // Type guard: After validation above, both values should be available.
    // This check helps TypeScript narrow the types and throws if validation somehow failed.
    if (!payload.distanceKm || !payload.typicalTimeMin) {
      throw new Error(
        'Internal error: distanceKm and typicalTimeMin must be defined after validation',
      );
    }

    const calculatedMetrics = calculateAvgSpeed({
      distanceKm: payload.distanceKm,
      typicalTimeMin: payload.typicalTimeMin,
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

        const basePayload: CreatePathwayOptionPayloadWithCalculatedSpeed = {
          pathwayId: data.pathwayId,
          name: data.name ?? undefined,
          description: data.description ?? undefined,
          distanceKm: data.distanceKm ?? undefined,
          typicalTimeMin: data.typicalTimeMin ?? undefined,
          isDefault: data.isDefault ?? undefined,
          isPassThrough: data.isPassThrough ?? undefined,
          passThroughTimeMin: data.passThroughTimeMin ?? undefined,
          sequence: data.sequence ?? undefined,
          active: data.active ?? undefined,
        };

        const payload = addCalculatedAvgSpeedToPayload(basePayload);

        const savedPathwayOption = await pathwayOptionsRepository.create(
          payload as CreatePathwayOptionPayload,
        );
        return createEntityFromData(savedPathwayOption);
      },

      update: async (
        payload: UpdatePathwayOptionPayload,
      ): Promise<PathwayOptionEntity> => {
        if (!isPersisted || !data.id) {
          throw new Error('Cannot update non-persisted PathwayOption');
        }

        // Clean up passThroughTimeMin when isPassThrough is set to false
        // This must be done BEFORE validation to avoid validation errors
        let cleanedPayload = { ...payload };
        if (payload.isPassThrough === false) {
          cleanedPayload = {
            ...cleanedPayload,
            passThroughTimeMin: null,
          };
        }

        // Validate business rules with cleaned data
        const updatedData = { ...data, ...cleanedPayload };
        validatePathwayOptionRules(updatedData);

        // Check if metrics are being modified
        const isModifyingMetrics =
          (cleanedPayload.distanceKm !== undefined &&
            cleanedPayload.distanceKm !== data.distanceKm) ||
          (cleanedPayload.typicalTimeMin !== undefined &&
            cleanedPayload.typicalTimeMin !== data.typicalTimeMin);

        // If modifying metrics, validate that option is not in use by active legs
        if (isModifyingMetrics) {
          const usageInfo =
            await pathwayUsageValidationService.checkPathwayOptionUsage(
              data.pathwayId,
              data.id,
            );

          if (usageInfo.inUse) {
            const collector = new FieldErrorCollector();
            pathwayOptionErrors.cannotModifyMetricsInUse(collector, {
              routeIds: usageInfo.routeIds,
              activeLegsCount: usageInfo.activeLegsCount,
            });
            collector.throwIfErrors();
            throw new Error('Unreachable'); // TypeScript guard
          }
        }

        // Calculate metrics if distance or time are being updated
        let updatePayload: UpdatePathwayOptionPayloadWithCalculatedSpeed = {
          ...cleanedPayload,
        };
        if (
          cleanedPayload.distanceKm !== undefined ||
          cleanedPayload.typicalTimeMin !== undefined
        ) {
          // Get the values to use for calculation (from payload or existing data)
          const distanceKm =
            cleanedPayload.distanceKm ?? data.distanceKm ?? null;
          const typicalTimeMin =
            cleanedPayload.typicalTimeMin ?? data.typicalTimeMin ?? null;

          // Only calculate if both values are available
          if (distanceKm !== null && typicalTimeMin !== null) {
            const calculatedMetrics = calculateAvgSpeed({
              distanceKm,
              typicalTimeMin,
            });

            updatePayload = {
              ...updatePayload,
              distanceKm: calculatedMetrics.distanceKm,
              typicalTimeMin: calculatedMetrics.typicalTimeMin,
              avgSpeedKmh: calculatedMetrics.avgSpeedKmh,
            };
          }
        }

        const updatedPathwayOption = await pathwayOptionsRepository.update(
          data.id,
          updatePayload as UpdatePathwayOptionPayload,
        );

        // If avgSpeedKmh changed, recalculate passTimeMin for all existing tolls
        const oldAvgSpeedKmh = data.avgSpeedKmh ?? null;
        const newAvgSpeedKmh = updatedPathwayOption.avgSpeedKmh ?? null;

        if (
          newAvgSpeedKmh &&
          newAvgSpeedKmh > 0 &&
          oldAvgSpeedKmh !== newAvgSpeedKmh
        ) {
          // Get all existing tolls for this option
          const existingTolls =
            await pathwayOptionTollsRepository.findByOptionId(data.id);

          // Calculate new passTimeMin for each toll with valid distance
          const tollUpdates = existingTolls
            .filter((toll) => toll.distance !== null && toll.distance > 0)
            .map((toll) => ({
              id: toll.id,
              passTimeMin: calculatePassTimeMin(
                toll.distance as number,
                newAvgSpeedKmh,
              ),
            }));

          // Update all tolls in batch
          if (tollUpdates.length > 0) {
            await pathwayOptionTollsRepository.updateMany(tollUpdates);
          }
        }

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
          pathwayOptionErrors.cannotSyncTollsOnNonPersisted(collector);
          collector.throwIfErrors();
          throw new Error('Unreachable'); // TypeScript guard
        }

        const optionId = data.id;

        // Validate that option is not in use by active legs before syncing tolls
        const usageInfo =
          await pathwayUsageValidationService.checkPathwayOptionUsage(
            data.pathwayId,
            data.id,
          );

        if (usageInfo.inUse) {
          const collector = new FieldErrorCollector();
          pathwayOptionErrors.cannotSyncTollsInUse(collector, {
            routeIds: usageInfo.routeIds,
            activeLegsCount: usageInfo.activeLegsCount,
          });
          collector.throwIfErrors();
          throw new Error('Unreachable'); // TypeScript guard
        }

        // Validate business rules
        await validateTollsBusinessRules(tollsInput);

        // Get avgSpeedKmh from current option to calculate passTimeMin
        if (!data.avgSpeedKmh || data.avgSpeedKmh <= 0) {
          const collector = new FieldErrorCollector();
          pathwayOptionErrors.avgSpeedKmhRequiredForTolls(
            collector,
            data.avgSpeedKmh ?? null,
          );
          collector.throwIfErrors();
          throw new Error('Unreachable'); // TypeScript guard
        }

        const avgSpeedKmh = data.avgSpeedKmh;

        // Destructive sync: delete all existing tolls
        await pathwayOptionTollsRepository.deleteByOptionId(optionId);

        // Create new tolls with auto-assigned sequence (1..N) and calculated passTimeMin
        if (tollsInput.length > 0) {
          const tollPayloads = tollsInput.map((toll, index) => {
            // Calculate passTimeMin automatically from distance and avgSpeedKmh
            const calculatedPassTimeMin = calculatePassTimeMin(
              toll.distance,
              avgSpeedKmh,
            );

            return {
              pathwayOptionId: optionId,
              nodeId: toll.nodeId,
              sequence: index + 1,
              passTimeMin: calculatedPassTimeMin,
              distance: toll.distance,
            };
          });

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
      validateTollNodesAreTollbooths,
    },
  };
}
