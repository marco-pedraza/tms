import { FieldErrorCollector } from '@repo/base-repo';
import { EntityUtils } from '@/shared/domain/entity-utils';
import type {
  PathwayOptionToll,
  SyncTollsInput,
} from '@/inventory/routing/pathway-options-tolls/pathway-options-tolls.types';
import type { PathwayOption } from '@/inventory/routing/pathway-options/pathway-options.types';
import type {
  CreatePathwayPayload,
  Pathway,
  UpdatePathwayPayload,
} from '@/inventory/routing/pathways/pathways.types';
import type {
  AddPathwayOptionPayload,
  PathwayEntity,
  PathwayEntityDependencies,
  UpdatePathwayOptionPayloadClean,
} from './pathways.types';
import { pathwayErrors } from './pathway.errors';

export function createPathwayEntity(dependencies: PathwayEntityDependencies) {
  const {
    pathwaysRepository,
    pathwayOptionsRepository,
    nodesRepository,
    pathwayOptionEntityFactory,
  } = dependencies;

  // Desestructurar las utilidades del mixin
  const { isEntityPersisted } = EntityUtils;

  /**
   * Validates origin and destination are different
   * @param data - Data containing origin and destination node IDs
   * @throws {FieldValidationError} If origin equals destination
   */
  function validateOriginDestinationRule(data: {
    originNodeId?: number;
    destinationNodeId?: number;
  }): void {
    if (
      data.originNodeId &&
      data.destinationNodeId &&
      data.originNodeId === data.destinationNodeId
    ) {
      const collector = new FieldErrorCollector();
      pathwayErrors.sameOriginDestination(collector, data.destinationNodeId);
      collector.throwIfErrors();
    }
  }

  /**
   * Validates empty trip business rule: empty trip cannot be sellable
   * @param data - Data containing empty trip and sellable flags
   * @throws {FieldValidationError} If empty trip is marked as sellable
   */
  function validateEmptyTripRule(data: {
    isEmptyTrip?: boolean;
    isSellable?: boolean;
  }): void {
    if (data.isEmptyTrip && data.isSellable) {
      const collector = new FieldErrorCollector();
      pathwayErrors.emptyTripSellable(collector, data.isSellable);
      collector.throwIfErrors();
    }
  }

  /**
   * Validates pathway data according to business rules
   * @param data - The pathway data to validate
   * @throws {FieldValidationError} If there are validation violations
   */
  function validatePathwayRules(
    data: CreatePathwayPayload | UpdatePathwayPayload | Partial<Pathway>,
  ): void {
    validateOriginDestinationRule(data);
    validateEmptyTripRule(data);
  }

  /**
   * Validates that nodes exist and returns their city IDs
   * @param originNodeId - The origin node ID
   * @param destinationNodeId - The destination node ID
   * @returns Object with origin and destination city IDs
   * @throws {FieldValidationError} If any node is not found
   */
  async function validateNodesAndGetCities(
    originNodeId: number,
    destinationNodeId: number,
  ): Promise<{ originCityId: number; destinationCityId: number }> {
    const collector = new FieldErrorCollector();
    let originNode: { id: number; cityId: number } | null = null;
    let destinationNode: { id: number; cityId: number } | null = null;

    // Try to find origin node
    try {
      originNode = await nodesRepository.findOne(originNodeId);
    } catch {
      // Node not found, add specific error to collector
      pathwayErrors.originNodeNotFound(collector, originNodeId);
    }

    // Try to find destination node
    try {
      destinationNode = await nodesRepository.findOne(destinationNodeId);
    } catch {
      // Node not found, add specific error to collector
      pathwayErrors.destinationNodeNotFound(collector, destinationNodeId);
    }

    // Throw all collected errors
    collector.throwIfErrors();

    // At this point, if we haven't thrown, both nodes must exist
    if (!originNode || !destinationNode) {
      throw new Error('Internal error: nodes should exist after validation');
    }

    return {
      originCityId: originNode.cityId,
      destinationCityId: destinationNode.cityId,
    };
  }

  /**
   * Validates pathway activation (requires options)
   * @param pathwayId - The pathway ID to validate
   * @param requestedActive - Whether activation is requested
   * @throws {FieldValidationError} If pathway cannot be activated
   */
  async function validatePathwayActivation(
    pathwayId: number,
    requestedActive: boolean,
  ): Promise<void> {
    if (!requestedActive) return;

    const collector = new FieldErrorCollector();
    const options = await pathwayOptionsRepository.findByPathwayId(pathwayId);

    if (options.length === 0) {
      pathwayErrors.activationWithoutOptions(collector);
    }

    collector.throwIfErrors();
  }

  function createInstance(pathwayData: Partial<Pathway>): PathwayEntity {
    const isPersisted = isEntityPersisted(pathwayData.id);

    // Cache for loaded options (lazy loading)
    let optionsCache: PathwayOption[] | null = null;

    /**
     * Ensures the pathway is persisted before performing operations
     * @throws {FieldValidationError} If pathway is not persisted
     */
    function requirePersisted(): void {
      if (!isPersisted) {
        const collector = new FieldErrorCollector();
        pathwayErrors.cannotAddOptionsToNonPersisted(collector);
        collector.throwIfErrors();
      }
    }

    /**
     * Validates option exists and belongs to this pathway
     * @param optionId - The option ID to validate
     * @returns The validated option
     * @throws {FieldValidationError} If option not found or doesn't belong to pathway
     */
    async function validateOptionOwnership(
      optionId: number,
    ): Promise<PathwayOption> {
      const collector = new FieldErrorCollector();

      let option: PathwayOption;
      try {
        option = await pathwayOptionsRepository.findOne(optionId);
      } catch {
        pathwayErrors.optionNotFound(collector, optionId);
        collector.throwIfErrors();
        throw new Error('Option validation failed'); // TypeScript needs this
      }

      // Validate option belongs to this pathway
      if (option.pathwayId !== pathwayData.id) {
        pathwayErrors.optionBelongsToDifferentPathway(
          collector,
          optionId,
          pathwayData.id as number,
          option.pathwayId,
        );
        collector.throwIfErrors();
      }

      return option;
    }

    /**
     * Clears the options cache to force reload on next access
     */
    function clearOptionsCache(): void {
      optionsCache = null;
    }

    /**
     * Loads pathway options lazily (only when needed)
     * PRIVATE: Use `entity.options` getter instead
     * @returns The pathway options for this pathway
     */
    async function loadOptions(): Promise<PathwayOption[]> {
      if (optionsCache !== null) {
        return optionsCache;
      }

      if (!isPersisted) {
        optionsCache = [];
        return optionsCache;
      }

      optionsCache = await pathwayOptionsRepository.findByPathwayId(
        pathwayData.id as number,
      );
      return optionsCache;
    }

    async function save(): Promise<PathwayEntity> {
      if (isPersisted) {
        // Already persisted, return same instance
        return createInstance(pathwayData);
      }

      const payload = pathwayData as CreatePathwayPayload;

      // Validate business rules
      validatePathwayRules(payload);

      // Validate nodes exist and get city IDs
      const { originCityId, destinationCityId } =
        await validateNodesAndGetCities(
          payload.originNodeId,
          payload.destinationNodeId,
        );

      // Create enhanced payload with city IDs
      const enhancedPayload = {
        ...payload,
        originCityId,
        destinationCityId,
      };

      // Create in database
      const pathway = await pathwaysRepository.create(enhancedPayload);
      return createInstance(pathway);
    }

    async function update(
      payload: UpdatePathwayPayload,
    ): Promise<PathwayEntity> {
      if (!isPersisted) {
        const collector = new FieldErrorCollector();
        pathwayErrors.updateNotPersisted(collector, pathwayData.id);
        collector.throwIfErrors();
      }

      // Validate update payload business rules
      validatePathwayRules(payload);

      // If trying to activate, validate pathway has options
      if ('active' in payload && payload.active && pathwayData.id) {
        await validatePathwayActivation(pathwayData.id, payload.active);
      }

      if (!pathwayData.id) {
        throw new Error('Internal error: pathway ID should exist for updates');
      }

      // If nodes are being updated, validate and get city IDs
      let enhancedPayload = payload;
      if (payload.originNodeId || payload.destinationNodeId) {
        const originNodeId = payload.originNodeId ?? pathwayData.originNodeId;
        const destinationNodeId =
          payload.destinationNodeId ?? pathwayData.destinationNodeId;

        if (!originNodeId || !destinationNodeId) {
          throw new Error(
            'Internal error: origin and destination node IDs must be defined',
          );
        }

        // Validate nodes exist and get city IDs
        const { originCityId, destinationCityId } =
          await validateNodesAndGetCities(originNodeId, destinationNodeId);

        // Create enhanced payload with city IDs
        enhancedPayload = {
          ...payload,
          originCityId,
          destinationCityId,
        } as UpdatePathwayPayload & {
          originCityId: number;
          destinationCityId: number;
        };
      }

      const updatedPathway = await pathwaysRepository.update(
        pathwayData.id,
        enhancedPayload,
      );
      return createInstance(updatedPathway);
    }

    function toPathway(): Pathway {
      // Extract only the pathway data fields, excluding entity methods
      // Validate required fields exist
      if (
        pathwayData.id === undefined ||
        pathwayData.originNodeId === undefined ||
        pathwayData.destinationNodeId === undefined ||
        pathwayData.originCityId === undefined ||
        pathwayData.destinationCityId === undefined ||
        pathwayData.name === undefined ||
        pathwayData.code === undefined ||
        pathwayData.isSellable === undefined ||
        pathwayData.isEmptyTrip === undefined ||
        pathwayData.active === undefined
      ) {
        throw new Error('Cannot convert to Pathway: missing required fields');
      }

      return {
        id: pathwayData.id,
        originNodeId: pathwayData.originNodeId,
        destinationNodeId: pathwayData.destinationNodeId,
        originCityId: pathwayData.originCityId,
        destinationCityId: pathwayData.destinationCityId,
        name: pathwayData.name,
        code: pathwayData.code,
        description: pathwayData.description ?? null,
        isSellable: pathwayData.isSellable,
        isEmptyTrip: pathwayData.isEmptyTrip,
        active: pathwayData.active,
        createdAt: pathwayData.createdAt ?? null,
        updatedAt: pathwayData.updatedAt ?? null,
        deletedAt: pathwayData.deletedAt ?? null,
      };
    }

    async function addOption(
      optionData: AddPathwayOptionPayload,
    ): Promise<PathwayEntity> {
      requirePersisted();

      // Get existing options to determine default behavior
      const existingOptions = await loadOptions();

      // Determine isDefault value:
      // 1. If explicitly provided in optionData, use that value
      // 2. If not provided and this is the first option, make it default
      // 3. Otherwise, not default
      const shouldBeDefault =
        optionData.isDefault ?? existingOptions.length === 0;

      // Create option using pathway option entity (includes validation and avgSpeed calculation)
      const optionEntity = pathwayOptionEntityFactory.create({
        ...optionData,
        pathwayId: pathwayData.id as number,
        isDefault: shouldBeDefault,
      });

      // Save the option entity (includes all validations and calculations)
      await optionEntity.save();

      clearOptionsCache();
      return createInstance(pathwayData);
    }

    async function removeOption(optionId: number): Promise<PathwayEntity> {
      requirePersisted();

      // Validate option exists and belongs to this pathway
      const optionToRemove = await validateOptionOwnership(optionId);

      const collector = new FieldErrorCollector();

      // Get current options to check business rules
      const currentOptions = await loadOptions();

      // Business rule: Cannot remove default option
      if (optionToRemove.isDefault) {
        pathwayErrors.cannotRemoveDefaultOption(collector, optionId);
        collector.throwIfErrors();
      }

      // Business rule: Cannot remove last option from active pathway
      if (currentOptions.length === 1 && pathwayData.active) {
        pathwayErrors.cannotRemoveLastOption(collector);
        collector.throwIfErrors();
      }

      // Remove the option
      await pathwayOptionsRepository.delete(optionId);

      clearOptionsCache();
      return createInstance(pathwayData);
    }

    async function updateOption(
      optionId: number,
      optionData: UpdatePathwayOptionPayloadClean,
    ): Promise<PathwayEntity> {
      requirePersisted();

      // Validate option exists and belongs to this pathway
      await validateOptionOwnership(optionId);

      // Update using pathway option entity (includes validation and avgSpeed recalculation)
      const optionEntity = await pathwayOptionEntityFactory.findOne(optionId);
      await optionEntity.update(optionData);

      clearOptionsCache();
      return createInstance(pathwayData);
    }

    async function setDefaultOption(optionId: number): Promise<PathwayEntity> {
      requirePersisted();

      // Validate option exists and belongs to this pathway
      const optionToSetDefault = await validateOptionOwnership(optionId);

      // If already default, no-op
      if (optionToSetDefault.isDefault) {
        return createInstance(pathwayData);
      }

      // Use repository method that leverages base-repo
      await pathwayOptionsRepository.setDefaultOption(
        pathwayData.id as number,
        optionId,
      );

      clearOptionsCache();
      return createInstance(pathwayData);
    }

    async function syncOptionTolls(
      optionId: number,
      tolls: SyncTollsInput[],
    ): Promise<PathwayEntity> {
      requirePersisted();

      // Validate option exists and belongs to this pathway
      await validateOptionOwnership(optionId);

      // Get option entity and delegate toll sync
      const optionEntity = await pathwayOptionEntityFactory.findOne(optionId);
      await optionEntity.syncTolls(tolls);

      // Return fresh pathway instance
      return createInstance(pathwayData);
    }

    async function getOptionTolls(
      optionId: number,
    ): Promise<PathwayOptionToll[]> {
      requirePersisted();

      // Validate option exists and belongs to this pathway
      await validateOptionOwnership(optionId);

      // Get option entity and delegate toll retrieval
      const optionEntity = await pathwayOptionEntityFactory.findOne(optionId);
      return await optionEntity.getTolls();
    }

    // Use spread operator to provide direct access to all properties
    return {
      ...pathwayData,
      get options() {
        return loadOptions();
      },
      isPersisted,
      save,
      update,
      toPathway,
      addOption,
      removeOption,
      updateOption,
      setDefaultOption,
      syncOptionTolls,
      getOptionTolls,
    } as PathwayEntity;
  }

  /**
   * Creates a new pathway entity from payload data (not yet persisted)
   * @param payload - The pathway creation data
   * @returns A new PathwayEntity instance ready to be saved
   */
  function create(payload: CreatePathwayPayload): PathwayEntity {
    // Validate the payload business rules immediately when creating the instance
    validatePathwayRules(payload);

    // Use spread operator with defaults for optional fields
    const pathwayData = {
      ...payload,
      description: payload.description ?? null,
      isSellable: payload.isSellable ?? false,
      isEmptyTrip: payload.isEmptyTrip ?? false,
      active: false, // Always start as inactive
      // These will be set by the database, but we include them for completeness
      createdAt: null,
      updatedAt: null,
      deletedAt: null,
    };

    return createInstance(pathwayData);
  }

  /**
   * Creates a pathway entity from existing persisted data
   * The entity will automatically load its options when needed
   * @param pathway - The persisted pathway data from database
   * @returns A PathwayEntity instance representing the existing record
   */
  function fromData(pathway: Pathway): PathwayEntity {
    return createInstance(pathway);
  }

  /**
   * Finds a pathway entity by ID from the database
   * @param id - The pathway ID to find
   * @throws {NotFoundError} If the pathway is not found
   * @returns A PathwayEntity instance
   */
  async function findOne(id: number): Promise<PathwayEntity> {
    const pathway = await pathwaysRepository.findOne(id);
    return createInstance(pathway);
  }

  return {
    create,
    fromData,
    findOne,
  };
}
