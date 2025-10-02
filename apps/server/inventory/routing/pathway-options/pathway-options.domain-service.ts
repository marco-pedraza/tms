import { FieldErrorCollector } from '@repo/base-repo';
import type { SyncTollsInput } from '../pathway-options-tolls/pathway-options-tolls.types';
import { pathwayErrors } from '../pathways/pathway.errors';
import type {
  AddPathwayOptionPayload,
  BulkSyncOptionInput,
  BulkSyncOptionInputInternal,
  BulkSyncOptionsPayload,
  CategorizedOperations,
  PathwayEntity,
  UpdatePathwayOptionPayloadClean,
} from '../pathways/pathways.types';
import type { PathwayOption } from './pathway-options.types';

/**
 * Dependencies required by the pathway option domain service
 * Repositories can be either regular or transaction-wrapped
 */
export interface PathwayOptionDomainServiceDependencies {
  pathwayOptionRepository: {
    findByIds: (ids: number[]) => Promise<PathwayOption[]>;
  };
  nodeRepository: {
    findByIds: (ids: number[]) => Promise<{ id: number }[]>;
  };
  pathwayOptionEntityFactory: {
    validators: {
      validateNoDuplicateTollNodes: (
        tolls: SyncTollsInput[],
        collector: FieldErrorCollector,
      ) => void;
      validateNoConsecutiveDuplicates: (
        tolls: SyncTollsInput[],
        collector: FieldErrorCollector,
      ) => void;
    };
  };
}

/**
 * Domain service for complex pathway option operations
 * Repositories can be regular or transaction-wrapped (injected by Application Service)
 * This allows the same domain logic to work both with and without transactions
 */
export function createPathwayOptionDomainService(
  dependencies: PathwayOptionDomainServiceDependencies,
) {
  const {
    pathwayOptionRepository,
    nodeRepository,
    pathwayOptionEntityFactory,
  } = dependencies;

  /**
   * Validates that all toll nodes exist in database
   * Uses injected repository (can be regular or transaction-wrapped)
   * @param options - Array of option inputs
   * @param collector - Field error collector
   */
  async function validateAllTollNodesExist(
    options: BulkSyncOptionInput[],
    collector: FieldErrorCollector,
  ): Promise<void> {
    // Collect all unique node IDs from all options
    const allNodeIds = new Set<number>();
    for (const option of options) {
      if (option.tolls && option.tolls.length > 0) {
        for (const toll of option.tolls) {
          allNodeIds.add(toll.nodeId);
        }
      }
    }

    if (allNodeIds.size === 0) {
      return; // No tolls to validate
    }

    // Single batch query for all nodes (uses injected repository)
    const nodeIdsArray = Array.from(allNodeIds);
    const existingNodes = await nodeRepository.findByIds(nodeIdsArray);
    const existingNodeIds = new Set(existingNodes.map((n) => n.id));

    // Find missing nodes
    const missingNodes = nodeIdsArray.filter((id) => !existingNodeIds.has(id));

    if (missingNodes.length > 0) {
      pathwayErrors.tollNodesNotFound(collector, missingNodes.join(', '));
    }
  }

  /**
   * Validates tolls for a single option using entity validators
   * Wraps entity validators to add option index context to error fields
   * @param tolls - Array of toll inputs for the option
   * @param optionIndex - Index of the option in the array (for error context)
   * @param collector - Field error collector
   */
  function validateTollsForOption(
    tolls: SyncTollsInput[],
    optionIndex: number,
    collector: FieldErrorCollector,
  ): void {
    // Create a temporary collector to capture entity validation errors
    const tempCollector = new FieldErrorCollector();

    // Reuse entity validators
    pathwayOptionEntityFactory.validators.validateNoDuplicateTollNodes(
      tolls,
      tempCollector,
    );
    pathwayOptionEntityFactory.validators.validateNoConsecutiveDuplicates(
      tolls,
      tempCollector,
    );

    // Transfer errors with updated field path to include option index
    for (const error of tempCollector.getErrors()) {
      collector.addError(
        `options[${optionIndex}].${error.field}`,
        error.code,
        error.message,
        error.value,
      );
    }
  }

  /**
   * Validates the complete bulk sync payload with all business rules
   * Uses injected repositories (can be regular or transaction-wrapped)
   * @param pathwayId - The ID of the pathway
   * @param options - Array of option inputs to validate
   * @throws {FieldValidationError} If any validation fails
   */
  async function validateBulkSyncPayload(
    pathwayId: number,
    options: BulkSyncOptionInput[],
  ): Promise<void> {
    const collector = new FieldErrorCollector();

    // ═══════════════════════════════════════════════════════════
    // VALIDATION 1: At least one option
    // ═══════════════════════════════════════════════════════════
    if (options.length === 0) {
      pathwayErrors.emptyOptions(collector, null);
    }

    // ═══════════════════════════════════════════════════════════
    // VALIDATION 2: Only one option can be default
    // ═══════════════════════════════════════════════════════════
    const defaultCount = options.filter((o) => o.isDefault === true).length;
    if (defaultCount > 1) {
      pathwayErrors.multipleDefaults(collector, defaultCount);
    }

    // ═══════════════════════════════════════════════════════════
    // VALIDATION 3: Unique names within the array
    // ═══════════════════════════════════════════════════════════
    const names = options
      .filter((o) => o.name)
      .map((o) => o.name.toLowerCase().trim());
    const duplicateNames = names.filter(
      (name, index) => names.indexOf(name) !== index,
    );

    if (duplicateNames.length > 0) {
      const uniqueDuplicates = [...new Set(duplicateNames)];
      pathwayErrors.duplicateOptionNames(
        collector,
        uniqueDuplicates.join(', '),
      );
    }

    // ═══════════════════════════════════════════════════════════
    // VALIDATION 4: IDs belong to correct pathway (uses repository)
    // ═══════════════════════════════════════════════════════════
    const idsToUpdate = options
      .filter((o) => o.id !== undefined)
      .map((o) => o.id as number);

    if (idsToUpdate.length > 0) {
      const existingOptions =
        await pathwayOptionRepository.findByIds(idsToUpdate);

      // Validate all options exist
      const foundIds = new Set(existingOptions.map((o) => o.id));
      const missingIds = idsToUpdate.filter((id) => !foundIds.has(id));

      if (missingIds.length > 0) {
        pathwayErrors.optionsNotFound(collector, missingIds.join(', '));
      }

      // Validate they belong to the correct pathway
      const wrongPathway = existingOptions.filter(
        (o) => o.pathwayId !== pathwayId,
      );

      if (wrongPathway.length > 0) {
        const wrongIds = wrongPathway.map((o) => o.id).join(', ');
        pathwayErrors.optionsFromDifferentPathway(collector, wrongIds);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // VALIDATION 5: Toll nodes exist (batch validation with repository)
    // ═══════════════════════════════════════════════════════════
    await validateAllTollNodesExist(options, collector);

    // ═══════════════════════════════════════════════════════════
    // VALIDATION 6: Validate tolls structure for each option
    // ═══════════════════════════════════════════════════════════
    for (const [index, option] of options.entries()) {
      if (option.tolls && option.tolls.length > 0) {
        validateTollsForOption(option.tolls, index, collector);
      }
    }

    // Throw all errors at once
    collector.throwIfErrors();
  }

  /**
   * Assigns a default option if needed, following priority rules
   * Modifies the options array in place to ensure exactly one default
   *
   * Priority order:
   * 1. If user explicitly marked an option as default (isDefault: true), use it
   * 2. If current default option is still in payload, preserve it
   * 3. If no default specified, set first option as default
   *
   * @param options - Array of option inputs (modified in place)
   * @param currentOptions - Current pathway options from database
   */
  function assignDefaultOptionIfNeeded(
    options: BulkSyncOptionInput[],
    currentOptions: PathwayOption[],
  ): void {
    // ═══════════════════════════════════════════════════════════
    // CASE 1: User explicitly specified a default
    // ═══════════════════════════════════════════════════════════
    const explicitDefault = options.find((o) => o.isDefault === true);

    if (explicitDefault) {
      // Remove default from all other options
      options.forEach((o) => {
        if (o !== explicitDefault) {
          o.isDefault = false;
        }
      });
      return;
    }

    // ═══════════════════════════════════════════════════════════
    // CASE 2: Preserve current default if it's still in payload
    // ═══════════════════════════════════════════════════════════
    const currentDefault = currentOptions.find((o) => o.isDefault);

    if (currentDefault) {
      const defaultInPayload = options.find((o) => o.id === currentDefault.id);

      if (defaultInPayload) {
        // Current default is still in payload, keep it
        defaultInPayload.isDefault = true;

        // Remove default from all others
        options.forEach((o) => {
          if (o !== defaultInPayload) {
            o.isDefault = false;
          }
        });
        return;
      }

      // Current default is NOT in payload - will be deleted
      // Do NOT auto-assign - let validation catch this error
      // The validation will fail in ensureMinimumOptionsAndDefaultPresence
      return;
    }

    // ═══════════════════════════════════════════════════════════
    // CASE 3: No current default exists (initial creation) → assign first as default
    // ═══════════════════════════════════════════════════════════
    if (options.length > 0) {
      options[0].isDefault = true;

      // Ensure others are not default
      for (let i = 1; i < options.length; i++) {
        options[i].isDefault = false;
      }
    }
  }

  /**
   * Categorizes bulk sync operations into create, update, and delete
   * Converts API types to internal types with tempId for tracking new options
   *
   * @param options - Array of option inputs from API
   * @param currentOptions - Current pathway options from database
   * @returns Categorized operations with internal types
   */
  function categorizeOperations(
    options: BulkSyncOptionInput[],
    currentOptions: PathwayOption[],
  ): CategorizedOperations {
    const toCreate: [number, BulkSyncOptionInputInternal][] = [];
    const toUpdate: BulkSyncOptionInputInternal[] = [];
    const toDelete: PathwayOption[] = [];

    let tempIdCounter = 1;

    // Categorize options in input
    for (const option of options) {
      if (option.id) {
        // Has ID → update
        toUpdate.push(option);
      } else {
        // No ID → create with tempId
        const tempId = tempIdCounter++;
        const internalOption: BulkSyncOptionInputInternal = {
          ...option,
          tempId,
        };
        toCreate.push([tempId, internalOption]);
      }
    }

    // Find options to delete (in DB but not in input)
    const inputIds = new Set(
      options.filter((o) => o.id !== undefined).map((o) => o.id as number),
    );

    for (const currentOption of currentOptions) {
      if (!inputIds.has(currentOption.id)) {
        toDelete.push(currentOption);
      }
    }

    return {
      toCreate,
      toUpdate,
      toDelete,
    };
  }

  /**
   * Ensures pathway maintains minimum required options and valid default after sync
   * Validates that active pathways keep at least one option and default option is preserved
   *
   * @param pathwayEntity - The pathway entity instance
   * @param currentOptions - Current pathway options from database
   * @param operations - Categorized operations
   * @throws {FieldValidationError} If validation fails
   */
  function ensureMinimumOptionsAndDefaultPresence(
    pathwayEntity: PathwayEntity,
    currentOptions: PathwayOption[],
    operations: CategorizedOperations,
  ): void {
    const collector = new FieldErrorCollector();

    // Get pathway data to check if active
    const pathway = pathwayEntity.toPathway();

    // ═══════════════════════════════════════════════════════════
    // RULE 1: Active pathway must have at least one option after sync
    // ═══════════════════════════════════════════════════════════
    const finalOptionsCount =
      currentOptions.length -
      operations.toDelete.length +
      operations.toCreate.length;

    if (pathway.active && finalOptionsCount === 0) {
      pathwayErrors.cannotRemoveAllOptionsFromActivePathway(collector, null);
    }

    // ═══════════════════════════════════════════════════════════
    // RULE 2: Must have a new default if removing current default
    // ═══════════════════════════════════════════════════════════
    const currentDefault = currentOptions.find((o) => o.isDefault);
    const isDefaultBeingDeleted =
      currentDefault &&
      operations.toDelete.some((o) => o.id === currentDefault.id);

    if (isDefaultBeingDeleted) {
      // Check if there's a new default in creates or updates
      const hasNewDefault =
        operations.toUpdate.some((o) => o.isDefault === true) ||
        operations.toCreate.some(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ([_tempId, o]) => o.isDefault === true,
        );

      if (!hasNewDefault) {
        pathwayErrors.cannotRemoveDefaultOption(collector, currentDefault.id);
      }
    }

    // Throw all errors at once
    collector.throwIfErrors();
  }

  /**
   * Executes bulk sync operations in the SAFE order
   * NEW ORDER - Creates/updates FIRST, then deletes (safer for default option handling)
   *
   * Order:
   * 1. Create new options
   * 2. Update existing options
   * 3. Set new default option
   * 4. Delete non-default options
   * 5. Delete old default option (safe because new default is already set)
   *
   * @param pathwayEntity - The pathway entity instance (transaction-aware)
   * @param operations - Categorized operations
   * @returns Map of tempId -> real ID for created options
   */
  async function executeBulkSyncOperations(
    pathwayEntity: PathwayEntity,
    operations: CategorizedOperations,
  ): Promise<[PathwayEntity, Map<number, number>]> {
    const optionIdsMap = new Map<number, number>();
    let currentEntity = pathwayEntity;

    // ───────────────────────────────────────────────────────────
    // STEP 1: Create new options FIRST
    // ───────────────────────────────────────────────────────────
    for (const [tempId, optionInput] of operations.toCreate) {
      const optionPayload: AddPathwayOptionPayload = {
        name: optionInput.name,
        description: optionInput.description ?? undefined,
        distanceKm: optionInput.distanceKm,
        typicalTimeMin: optionInput.typicalTimeMin,
        avgSpeedKmh: optionInput.avgSpeedKmh,
        isPassThrough: optionInput.isPassThrough,
        passThroughTimeMin: optionInput.passThroughTimeMin ?? undefined,
        sequence: optionInput.sequence ?? undefined,
        active: optionInput.active,
        isDefault: optionInput.isDefault,
      };

      currentEntity = await currentEntity.addOption(optionPayload);

      // Get the ID of the newly created option
      const createdOptions = await currentEntity.options;
      const createdOption = createdOptions.find(
        (o) =>
          o.name === optionInput.name &&
          o.distanceKm === optionInput.distanceKm,
      );

      if (createdOption) {
        optionIdsMap.set(tempId, createdOption.id);
      }
    }

    // ───────────────────────────────────────────────────────────
    // STEP 2: Update existing options
    // ───────────────────────────────────────────────────────────
    for (const optionInput of operations.toUpdate) {
      const updatePayload: UpdatePathwayOptionPayloadClean = {
        name: optionInput.name,
        description: optionInput.description ?? undefined,
        distanceKm: optionInput.distanceKm,
        typicalTimeMin: optionInput.typicalTimeMin,
        avgSpeedKmh: optionInput.avgSpeedKmh,
        isPassThrough: optionInput.isPassThrough,
        passThroughTimeMin: optionInput.passThroughTimeMin ?? undefined,
        sequence: optionInput.sequence ?? undefined,
        active: optionInput.active,
      };

      currentEntity = await currentEntity.updateOption(
        optionInput.id as number,
        updatePayload,
      );
    }

    // ───────────────────────────────────────────────────────────
    // STEP 3: Set new default option (BEFORE deleting anything)
    // ───────────────────────────────────────────────────────────
    const newDefaultInput =
      operations.toUpdate.find((o) => o.isDefault === true) ??
      operations.toCreate
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(([_tempId, input]) => input)
        .find((o) => o.isDefault === true);

    if (newDefaultInput) {
      let defaultId: number | undefined;

      if (newDefaultInput.id) {
        defaultId = newDefaultInput.id;
      } else if (newDefaultInput.tempId !== undefined) {
        defaultId = optionIdsMap.get(newDefaultInput.tempId);
      }

      if (defaultId) {
        currentEntity = await currentEntity.setDefaultOption(defaultId);
      }
    }

    // ───────────────────────────────────────────────────────────
    // STEP 4: Delete non-default options (safe now)
    // ───────────────────────────────────────────────────────────
    for (const option of operations.toDelete.filter((o) => !o.isDefault)) {
      currentEntity = await currentEntity.removeOption(option.id);
    }

    // ───────────────────────────────────────────────────────────
    // STEP 5: Delete old default option (safe because new default is set)
    // ───────────────────────────────────────────────────────────
    for (const option of operations.toDelete.filter((o) => o.isDefault)) {
      currentEntity = await currentEntity.removeOption(option.id);
    }

    return [currentEntity, optionIdsMap];
  }

  /**
   * Synchronizes tolls for all options that have tolls defined
   * Skips options where tolls is undefined (keeps existing tolls)
   *
   * @param pathwayEntity - The pathway entity instance (transaction-aware)
   * @param options - Array of option inputs (internal type with tempId)
   * @param optionIdsMap - Map of tempId -> real ID for created options
   * @returns Updated pathway entity with synced tolls
   */
  async function syncAllOptionTolls(
    pathwayEntity: PathwayEntity,
    options: BulkSyncOptionInputInternal[],
    optionIdsMap: Map<number, number>,
  ): Promise<PathwayEntity> {
    let currentEntity = pathwayEntity;

    for (const optionInput of options) {
      // Only sync if tolls is defined (can be empty array or with values)
      if (optionInput.tolls !== undefined) {
        // Resolve the real ID of the option
        let finalId: number | undefined;

        if (optionInput.id) {
          finalId = optionInput.id;
        } else if (optionInput.tempId !== undefined) {
          finalId = optionIdsMap.get(optionInput.tempId);
        }

        if (finalId) {
          currentEntity = await currentEntity.syncOptionTolls(
            finalId,
            optionInput.tolls,
          );
        }
      }
    }

    return currentEntity;
  }

  /**
   * Bulk synchronizes pathway options with create/update/delete operations
   * This is the main domain service method that executes the complete bulk sync action
   *
   * @param pathwayEntity - The pathway entity instance (transaction-aware)
   * @param pathwayId - The ID of the pathway
   * @param payload - Bulk sync payload with options array
   * @returns The updated pathway
   * @throws {FieldValidationError} If validation fails
   */
  async function bulkSyncOptions(
    pathwayEntity: PathwayEntity,
    pathwayId: number,
    payload: BulkSyncOptionsPayload,
  ): Promise<PathwayEntity> {
    // ═══════════════════════════════════════════════════════════
    // STEP 1: Validate complete payload
    // ═══════════════════════════════════════════════════════════
    await validateBulkSyncPayload(pathwayId, payload.options);

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Get current state
    // ═══════════════════════════════════════════════════════════
    const currentOptions = await pathwayEntity.options;

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Assign default if needed
    // ═══════════════════════════════════════════════════════════
    assignDefaultOptionIfNeeded(payload.options, currentOptions);

    // ═══════════════════════════════════════════════════════════
    // STEP 4: Categorize operations
    // ═══════════════════════════════════════════════════════════
    const operations = categorizeOperations(payload.options, currentOptions);

    // ═══════════════════════════════════════════════════════════
    // STEP 4.5: Ensure minimum options and default presence
    // ═══════════════════════════════════════════════════════════
    ensureMinimumOptionsAndDefaultPresence(
      pathwayEntity,
      currentOptions,
      operations,
    );

    // ═══════════════════════════════════════════════════════════
    // STEP 5: Execute operations in SAFE order (creates/updates first)
    // ═══════════════════════════════════════════════════════════
    const [updatedEntityAfterOperations, optionIdsMap] =
      await executeBulkSyncOperations(pathwayEntity, operations);

    // ═══════════════════════════════════════════════════════════
    // STEP 6: Synchronize tolls for all options
    // ═══════════════════════════════════════════════════════════
    const allOptionsInternal = [
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ...operations.toCreate.map(([_tempId, opt]) => opt),
      ...operations.toUpdate,
    ];

    const finalEntity = await syncAllOptionTolls(
      updatedEntityAfterOperations,
      allOptionsInternal,
      optionIdsMap,
    );

    // ═══════════════════════════════════════════════════════════
    // STEP 7: Return updated entity
    // ═══════════════════════════════════════════════════════════
    return finalEntity;
  }

  return {
    // Validations (uses injected repositories - can work with or without transaction)
    validateBulkSyncPayload,
    // Business logic (no DB access)
    assignDefaultOptionIfNeeded,
    categorizeOperations,
    // Main action verb - executes complete bulk sync operation
    bulkSyncOptions,
  };
}
