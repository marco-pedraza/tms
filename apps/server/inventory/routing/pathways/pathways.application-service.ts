import type { TransactionalDB } from '@repo/base-repo';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import { tollboothRepository } from '@/inventory/locations/tollbooths/tollbooths.repository';
import { pathwayOptionTollRepository } from '../pathway-options-tolls/pathway-options-tolls.repository';
import type {
  CreatePathwayOptionTollPayload,
  PathwayOptionToll,
  SyncTollsInput,
} from '../pathway-options-tolls/pathway-options-tolls.types';
import { createPathwayOptionEntity } from '../pathway-options/pathway-option.entity';
import { createPathwayOptionDomainService } from '../pathway-options/pathway-options.domain-service';
import { pathwayOptionRepository } from '../pathway-options/pathway-options.repository';
import type { PathwayOption } from '../pathway-options/pathway-options.types';
import type {
  AddPathwayOptionPayload,
  BulkSyncOptionsPayload,
  CreatePathwayPayload,
  Pathway,
  PathwayEntity,
  UpdatePathwayOptionPayloadClean,
  UpdatePathwayPayload,
} from './pathways.types';
import { pathwayRepository } from './pathways.repository';
import { createPathwayEntity } from './pathway.entity';

/**
 * Application service for pathway operations
 * Handles dependency injection and exposes domain operations to controllers
 */
export function createPathwayApplicationService() {
  // Create pathway option entity factory
  const pathwayOptionEntityFactory = createPathwayOptionEntity({
    pathwayOptionsRepository: pathwayOptionRepository,
    pathwayOptionTollsRepository: pathwayOptionTollRepository,
    nodesRepository: nodeRepository,
    tollboothRepository,
  });

  // Note: pathwayOptionDomainService is not initialized here
  // It's created with transaction-wrapped repositories in createTransactionRepositories()

  // Initialize the pathway entity with injected repositories and factories
  const pathwayEntity = createPathwayEntity({
    pathwaysRepository: pathwayRepository,
    pathwayOptionsRepository: pathwayOptionRepository,
    nodesRepository: nodeRepository,
    pathwayOptionEntityFactory,
  });

  /**
   * Creates transaction-aware repositories and factories with proper interfaces
   * @param tx - The transaction instance
   * @returns Object with transaction-aware repositories and factories
   */
  function createTransactionRepositories(tx: TransactionalDB) {
    const txPathwayOptionRepo = {
      ...pathwayOptionRepository.withTransaction(tx),
      findByPathwayId: (id: number) =>
        pathwayOptionRepository.findByPathwayId(id, tx),
      findByIds: (ids: number[]) => pathwayOptionRepository.findByIds(ids, tx),
      delete: async (id: number): Promise<PathwayOption> => {
        return await pathwayOptionRepository.withTransaction(tx).delete(id);
      },
      setDefaultOption: (pathwayId: number, optionId: number) =>
        pathwayOptionRepository.setDefaultOption(pathwayId, optionId, tx),
    };
    const baseNodeRepoWithTx = nodeRepository.withTransaction(tx);
    const txNodeRepo = {
      ...baseNodeRepoWithTx,
      findByIds: (ids: number[]) => nodeRepository.findByIds(ids, tx),
    };
    const txPathwayOptionTollRepo = {
      ...pathwayOptionTollRepository.withTransaction(tx),
      findByOptionId: (optionId: number) =>
        pathwayOptionTollRepository.findByOptionId(optionId, tx),
      deleteByOptionId: (optionId: number) =>
        pathwayOptionTollRepository.deleteByOptionId(optionId, tx),
      createMany: (tolls: CreatePathwayOptionTollPayload[]) =>
        pathwayOptionTollRepository.createMany(tolls, tx),
    };

    // Create transaction-aware pathway option entity factory
    const txPathwayOptionEntityFactory = createPathwayOptionEntity({
      pathwayOptionsRepository: txPathwayOptionRepo,
      pathwayOptionTollsRepository: txPathwayOptionTollRepo,
      nodesRepository: txNodeRepo,
      tollboothRepository,
    });

    // Create transaction-aware domain service
    const txPathwayOptionDomainService = createPathwayOptionDomainService({
      pathwayOptionRepository: txPathwayOptionRepo,
      nodeRepository: txNodeRepo,
      pathwayOptionEntityFactory: txPathwayOptionEntityFactory,
    });

    return {
      txPathwayOptionRepo,
      txNodeRepo,
      txPathwayOptionEntityFactory,
      txPathwayOptionDomainService,
    };
  }

  /**
   * Executes a pathway operation within a transaction
   * @param pathwayId - The ID of the pathway to operate on
   * @param operation - The operation to execute with the pathway entity
   * @returns The result of the operation
   */
  function executeInTransaction<T>(
    pathwayId: number,
    operation: (pathwayEntityInstance: PathwayEntity) => Promise<T>,
  ): Promise<T> {
    return pathwayRepository.transaction(async (txPathwayRepo, tx) => {
      const { txPathwayOptionRepo, txNodeRepo, txPathwayOptionEntityFactory } =
        createTransactionRepositories(tx);

      // Create entity with transaction repositories and factories
      const txPathwayEntity = createPathwayEntity({
        pathwaysRepository: txPathwayRepo,
        pathwayOptionsRepository: txPathwayOptionRepo,
        nodesRepository: txNodeRepo,
        pathwayOptionEntityFactory: txPathwayOptionEntityFactory,
      });

      // Find pathway (options will be loaded lazily by entity)
      const pathway = await txPathwayRepo.findOne(pathwayId);
      const pathwayEntityInstance = txPathwayEntity.fromData(pathway);

      // Execute the operation
      return await operation(pathwayEntityInstance);
    });
  }

  /**
   * Creates a new pathway with validation
   * Pathways are created as inactive by default (cannot be active without options)
   * @param payload - The pathway creation data
   * @returns The created pathway
   * @throws {FieldValidationError} If validation fails
   */
  async function createPathway(
    payload: CreatePathwayPayload,
  ): Promise<Pathway> {
    const pathway = pathwayEntity.create(payload);
    const savedPathway = await pathway.save();
    return savedPathway.toPathway();
  }

  /**
   * Updates an existing pathway with validation
   * @param id - The pathway ID to update
   * @param payload - The pathway update data
   * @returns The updated pathway
   * @throws {FieldValidationError} If validation fails
   * @throws {NotFoundError} If pathway is not found
   */
  async function updatePathway(
    id: number,
    payload: UpdatePathwayPayload,
  ): Promise<Pathway> {
    const pathway = await pathwayEntity.findOne(id);
    const updated = await pathway.update(payload);
    return updated.toPathway();
  }

  /**
   * Finds a pathway by ID
   * @param id - The pathway ID to find
   * @returns The pathway entity
   * @throws {NotFoundError} If pathway is not found
   */
  async function findPathway(id: number): Promise<Pathway> {
    const pathway = await pathwayEntity.findOne(id);
    return pathway.toPathway();
  }

  /**
   * Creates a pathway entity from existing pathway data
   * Useful for working with pathway data that comes from other sources
   * @param pathway - The pathway data
   * @returns A pathway entity with domain behavior
   */
  function createPathwayFromData(pathway: Pathway) {
    return pathwayEntity.fromData(pathway);
  }

  /**
   * Adds an option to a pathway within a transaction
   * @param pathwayId - The ID of the pathway to add option to
   * @param optionData - The option data (pathwayId and isDefault set automatically)
   * @returns The updated pathway with the new option
   * @throws {FieldValidationError} If validation fails
   * @throws {NotFoundError} If pathway is not found
   */
  function addOptionToPathway(
    pathwayId: number,
    optionData: AddPathwayOptionPayload,
  ): Promise<Pathway> {
    return executeInTransaction(pathwayId, async (pathwayEntityInstance) => {
      const updatedEntity = await pathwayEntityInstance.addOption(optionData);
      return updatedEntity.toPathway();
    });
  }

  /**
   * Removes an option from a pathway within a transaction
   * @param pathwayId - The ID of the pathway to remove option from
   * @param optionId - The ID of the option to remove
   * @returns The updated pathway without the removed option
   * @throws {FieldValidationError} If validation fails (e.g., removing default option)
   * @throws {NotFoundError} If pathway or option is not found
   */
  function removeOptionFromPathway(
    pathwayId: number,
    optionId: number,
  ): Promise<Pathway> {
    return executeInTransaction(pathwayId, async (pathwayEntityInstance) => {
      const updatedEntity = await pathwayEntityInstance.removeOption(optionId);
      return updatedEntity.toPathway();
    });
  }

  /**
   * Updates an option within a pathway within a transaction
   * @param pathwayId - The ID of the pathway containing the option
   * @param optionId - The ID of the option to update
   * @param optionData - The option update data (isDefault and pathwayId managed separately)
   * @returns The updated pathway with the modified option
   * @throws {FieldValidationError} If validation fails
   * @throws {NotFoundError} If pathway or option is not found
   */
  function updatePathwayOption(
    pathwayId: number,
    optionId: number,
    optionData: UpdatePathwayOptionPayloadClean,
  ): Promise<Pathway> {
    return executeInTransaction(pathwayId, async (pathwayEntityInstance) => {
      const updatedEntity = await pathwayEntityInstance.updateOption(
        optionId,
        optionData,
      );
      return updatedEntity.toPathway();
    });
  }

  /**
   * Sets a specific option as the default option for a pathway
   * @param pathwayId - The ID of the pathway containing the option
   * @param optionId - The ID of the option to set as default
   * @returns The updated pathway with the new default option
   * @throws {FieldValidationError} If validation fails
   * @throws {NotFoundError} If pathway or option is not found
   */
  function setDefaultOption(
    pathwayId: number,
    optionId: number,
  ): Promise<Pathway> {
    return executeInTransaction(pathwayId, async (pathwayEntityInstance) => {
      const updatedEntity =
        await pathwayEntityInstance.setDefaultOption(optionId);
      return updatedEntity.toPathway();
    });
  }

  /**
   * Synchronizes tolls for a pathway option (destructive operation)
   * @param pathwayId - The ID of the pathway containing the option
   * @param optionId - The ID of the option to sync tolls for
   * @param tolls - Array of toll inputs (sequence assigned automatically 1..N)
   * @returns The updated pathway
   * @throws {FieldValidationError} If validation fails
   * @throws {NotFoundError} If pathway or option is not found
   */
  function syncOptionTolls(
    pathwayId: number,
    optionId: number,
    tolls: SyncTollsInput[],
  ): Promise<Pathway> {
    return executeInTransaction(pathwayId, async (pathwayEntityInstance) => {
      const updatedEntity = await pathwayEntityInstance.syncOptionTolls(
        optionId,
        tolls,
      );
      return updatedEntity.toPathway();
    });
  }

  /**
   * Gets all tolls for a pathway option
   * @param pathwayId - The ID of the pathway containing the option
   * @param optionId - The ID of the option to get tolls from
   * @returns Array of pathway option tolls ordered by sequence
   * @throws {NotFoundError} If pathway or option is not found
   */
  async function getOptionTolls(
    pathwayId: number,
    optionId: number,
  ): Promise<PathwayOptionToll[]> {
    const pathway = await pathwayEntity.findOne(pathwayId);
    return await pathway.getOptionTolls(optionId);
  }

  // =============================================================================
  // BULK SYNC OPERATIONS - Application service orchestration
  // =============================================================================

  /**
   * Synchronizes pathway options with create/update/delete operations
   * Application service only handles transaction orchestration
   * All business logic is delegated to the domain service
   *
   * @param pathwayId - The ID of the pathway
   * @param payload - Sync payload with options array
   * @returns The updated pathway with all synchronized options
   * @throws {FieldValidationError} If validation fails
   * @throws {NotFoundError} If pathway is not found
   */
  function syncPathwayOptions(
    pathwayId: number,
    payload: BulkSyncOptionsPayload,
  ): Promise<Pathway> {
    return pathwayRepository.transaction(async (txPathwayRepo, tx) => {
      // ═══════════════════════════════════════════════════════════
      // 1. Create transaction-aware dependencies
      // ═══════════════════════════════════════════════════════════
      const {
        txPathwayOptionRepo,
        txNodeRepo,
        txPathwayOptionEntityFactory,
        txPathwayOptionDomainService,
      } = createTransactionRepositories(tx);

      // ═══════════════════════════════════════════════════════════
      // 2. Create entity with transaction repositories
      // ═══════════════════════════════════════════════════════════
      const txPathwayEntity = createPathwayEntity({
        pathwaysRepository: txPathwayRepo,
        pathwayOptionsRepository: txPathwayOptionRepo,
        nodesRepository: txNodeRepo,
        pathwayOptionEntityFactory: txPathwayOptionEntityFactory,
      });

      // ═══════════════════════════════════════════════════════════
      // 3. Load pathway and create entity instance
      // ═══════════════════════════════════════════════════════════
      const pathway = await txPathwayRepo.findOne(pathwayId);
      const pathwayEntityInstance = txPathwayEntity.fromData(pathway);

      // ═══════════════════════════════════════════════════════════
      // 4. Delegate to domain service (executes complete bulk sync)
      // ═══════════════════════════════════════════════════════════
      const updatedEntity = await txPathwayOptionDomainService.bulkSyncOptions(
        pathwayEntityInstance,
        pathwayId,
        payload,
      );

      // ═══════════════════════════════════════════════════════════
      // 5. Return updated pathway
      // ═══════════════════════════════════════════════════════════
      return updatedEntity.toPathway();
    });
  }

  return {
    createPathway,
    updatePathway,
    findPathway,
    createPathwayFromData,
    addOptionToPathway,
    removeOptionFromPathway,
    updatePathwayOption,
    setDefaultOption,
    syncOptionTolls,
    getOptionTolls,
    syncPathwayOptions,
  };
}

// Export the application service instance
export const pathwayApplicationService = createPathwayApplicationService();
