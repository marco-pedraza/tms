import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { FieldErrorCollector, FieldValidationError } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { createSlug } from '@/shared/utils';
import { installationPropertyRepository } from '@/inventory/locations/installation-properties/installation-properties.repository';
import { installationRepository } from '@/inventory/locations/installations/installations.repository';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import { populationRepository } from '@/inventory/locations/populations/populations.repository';
import { tollboothRepository } from '@/inventory/locations/tollbooths/tollbooths.repository';
import {
  type TollboothInfrastructure,
  createTestTollbooth as createTollboothHelper,
  setupTollboothInfrastructure,
} from '@/inventory/locations/tollbooths/tollbooths.test-utils';
import { cityFactory, populationFactory } from '@/tests/factories';
import { getFactoryDb } from '@/tests/factories/factory-utils';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueCode,
  createUniqueName,
} from '@/tests/shared/test-utils';
import { pathwayOptionTollRepository } from '../pathway-options-tolls/pathway-options-tolls.repository';
import { createPathwayEntity } from '../pathways/pathway.entity';
import { pathwayRepository } from '../pathways/pathways.repository';
import type { PathwayOptionEntity } from './pathway-option.entity.types';
import { pathwayOptionRepository } from './pathway-options.repository';
import { createPathwayOptionEntity } from './pathway-option.entity';

describe('PathwayOptionEntity - Toll Management', () => {
  const testSuiteId = createTestSuiteId('pathway-option-entity-tolls');
  const factoryDb = getFactoryDb(db);

  /**
   * Creates a unique slug for test nodes
   */
  function createUniqueNodeSlug(baseName: string, testSuiteId: string): string {
    const uniqueToken = createUniqueCode('', 4);
    return createSlug(`${baseName} ${testSuiteId} ${uniqueToken}`, 'n');
  }

  // Global tollbooth infrastructure (created once for all tests)
  let tollboothInfrastructure: TollboothInfrastructure;

  const installationPropertyCleanup = createCleanupHelper(
    ({ id }) => installationPropertyRepository.forceDelete(id),
    'installation property',
  );

  const installationCleanup = createCleanupHelper(
    ({ id }) => installationRepository.forceDelete(id),
    'installation',
  );

  let testData: {
    cityId: number;
    nodeIds: number[];
    populationId: number;
    pathwayId: number;
    optionEntity: ReturnType<typeof createPathwayOptionEntity>;
    pathwayCleanup: ReturnType<typeof createCleanupHelper>;
    pathwayOptionCleanup: ReturnType<typeof createCleanupHelper>;
    pathwayOptionTollCleanup: ReturnType<typeof createCleanupHelper>;
  };

  beforeAll(async () => {
    // Setup tollbooth infrastructure (type and schemas) - handles race conditions
    tollboothInfrastructure = await setupTollboothInfrastructure(
      db,
      testSuiteId,
    );
  });

  beforeEach(async () => {
    // Create cleanup helpers
    const pathwayCleanup = createCleanupHelper(
      ({ id }) => pathwayRepository.forceDelete(id),
      'pathway',
    );
    const pathwayOptionCleanup = createCleanupHelper(
      ({ id }) => pathwayOptionRepository.delete(id),
      'pathway option',
    );
    const pathwayOptionTollCleanup = createCleanupHelper(
      ({ id }) => pathwayOptionTollRepository.delete(id),
      'pathway option toll',
    );

    // Create test dependencies
    const testPopulation = await populationFactory(factoryDb).create({
      code: createUniqueCode('TPOP', 3),
      description: 'Test population for option entity tolls',
      active: true,
    });
    const populationId = testPopulation.id;

    const testCity = await cityFactory(factoryDb).create({
      name: createUniqueName('Test City', testSuiteId),
    });
    const cityId = testCity.id;

    // Create test nodes (origin and destination)
    const originNode = await nodeRepository.create({
      code: createUniqueCode('TN1', 3),
      name: createUniqueName('Origin Node', testSuiteId),
      cityId,
      latitude: 19.4326,
      longitude: -99.1332,
      radius: 1000,
      slug: createUniqueNodeSlug('Origin Node', testSuiteId),
      populationId,
      allowsBoarding: true,
      allowsAlighting: true,
      active: true,
    });

    const destinationNode = await nodeRepository.create({
      code: createUniqueCode('TN2', 3),
      name: createUniqueName('Destination Node', testSuiteId),
      cityId,
      latitude: 20.4326,
      longitude: -100.1332,
      radius: 1000,
      slug: createUniqueNodeSlug('Destination Node', testSuiteId),
      populationId,
      allowsBoarding: true,
      allowsAlighting: true,
      active: true,
    });

    // Create toll nodes as VALID TOLLBOOTHS using helper
    const toll1 = await createTollboothHelper(
      {
        cityId,
        populationId,
        testSuiteId,
        infrastructure: tollboothInfrastructure,
        tollPrice: '100.00',
        latitude: 19.5,
        longitude: -99.5,
      },
      installationPropertyCleanup,
    );
    installationCleanup.track(toll1.installationId);

    const toll2 = await createTollboothHelper(
      {
        cityId,
        populationId,
        testSuiteId,
        infrastructure: tollboothInfrastructure,
        tollPrice: '150.00',
        latitude: 19.7,
        longitude: -99.7,
      },
      installationPropertyCleanup,
    );
    installationCleanup.track(toll2.installationId);

    const nodeIds = [
      originNode.id,
      destinationNode.id,
      toll1.nodeId,
      toll2.nodeId,
    ];

    // Create test pathway with fully unique identifiers
    // Note: We use entity creation which automatically retrieves city IDs from nodes
    const pathwayOptionFactory = createPathwayOptionEntity({
      pathwayOptionsRepository: pathwayOptionRepository,
      pathwayOptionTollsRepository: pathwayOptionTollRepository,
      nodesRepository: nodeRepository,
      tollboothRepository,
    });

    const pathwayEntity = createPathwayEntity({
      pathwaysRepository: pathwayRepository,
      pathwayOptionsRepository: pathwayOptionRepository,
      nodesRepository: nodeRepository,
      pathwayOptionEntityFactory: pathwayOptionFactory,
    });

    const newPathway = pathwayEntity.create({
      originNodeId: nodeIds[0],
      destinationNodeId: nodeIds[1],
      name: createUniqueName('Test Pathway', `${testSuiteId}-${Date.now()}`),
      code: createUniqueCode('TP', 6),
      description: 'Test pathway for toll operations',
      isSellable: true,
      isEmptyTrip: false,
      active: false,
    });

    const savedPathway = await newPathway.save();
    const pathway = savedPathway.toPathway();
    pathwayCleanup.track(pathway.id);

    // Create option entity factory with tollboothRepository
    const optionEntity = createPathwayOptionEntity({
      pathwayOptionsRepository: pathwayOptionRepository,
      pathwayOptionTollsRepository: pathwayOptionTollRepository,
      nodesRepository: nodeRepository,
      tollboothRepository,
    });

    testData = {
      cityId,
      nodeIds,
      populationId,
      pathwayId: pathway.id,
      optionEntity,
      pathwayCleanup,
      pathwayOptionCleanup,
      pathwayOptionTollCleanup,
    };
  });

  afterEach(async () => {
    if (testData) {
      // Cleanup in dependency order (deepest first)
      // 1. Clean up pathway option tolls first
      await testData.pathwayOptionTollCleanup.cleanupAll();

      // 2. Clean up pathway options (all options for this pathway)
      try {
        // Get all options for this pathway and delete them
        const options = await pathwayOptionRepository.findByPathwayId(
          testData.pathwayId,
        );

        for (const option of options) {
          try {
            await pathwayOptionRepository.forceDelete(option.id);
          } catch {
            // Ignore if already deleted
          }
        }
      } catch {
        // Ignore if pathway doesn't exist
      }

      // 3. Clean up pathway (now that all options are deleted)
      try {
        await pathwayRepository.forceDelete(testData.pathwayId);
      } catch {
        // Ignore errors
      }

      // 4. Clean up nodes (now that pathway and tolls are deleted)
      for (const nodeId of testData.nodeIds) {
        try {
          await nodeRepository.forceDelete(nodeId);
        } catch {
          // Ignore errors
        }
      }

      // 5. Clean up installation properties first (now that nodes are deleted)
      await installationPropertyCleanup.cleanupAll();

      // 6. Clean up installations (now that installation properties are deleted)
      await installationCleanup.cleanupAll();

      // 7. Clean up population (now that nodes are deleted)
      try {
        await populationRepository.forceDelete(testData.populationId);
      } catch {
        // Ignore errors
      }

      // Cities cleaned up by factories
    }
  });

  afterAll(async () => {
    // Global cleanup - no longer needed since cleanup is handled in afterEach
  });

  describe('syncTolls', () => {
    // Helper to create a unique option for each test
    async function createTestOption(): Promise<PathwayOptionEntity> {
      const option = testData.optionEntity.create({
        pathwayId: testData.pathwayId,
        name: createUniqueName(
          'Test Option Sync',
          `${testSuiteId}-${Date.now()}-${Math.random()}`,
        ),
        description: 'Option for toll sync tests',
        distanceKm: 150,
        typicalTimeMin: 120,
        isPassThrough: false,
        active: true,
      });

      const saved = await option.save();
      testData.pathwayOptionCleanup.track(saved.id as number);
      return saved;
    }

    it('should sync tolls successfully with valid data', async () => {
      const savedOption = await createTestOption();
      const tollsInput = [
        {
          nodeId: testData.nodeIds[2], // Toll Node 1
          passTimeMin: 5,
          distance: 10,
        },
        {
          nodeId: testData.nodeIds[3], // Toll Node 2
          passTimeMin: 7,
          distance: 15,
        },
      ];

      const updatedOption = await savedOption.syncTolls(tollsInput);
      const tolls = await updatedOption.getTolls();

      expect(tolls).toHaveLength(2);
      expect(tolls[0]?.nodeId).toBe(testData.nodeIds[2]);
      expect(tolls[0]?.sequence).toBe(1);
      expect(tolls[0]?.passTimeMin).toBe(5);
      expect(tolls[0]?.distance).toBe(10);
      expect(tolls[1]?.nodeId).toBe(testData.nodeIds[3]);
      expect(tolls[1]?.sequence).toBe(2);
      expect(tolls[1]?.passTimeMin).toBe(7);
      expect(tolls[1]?.distance).toBe(15);

      // Track tolls for cleanup
      tolls.forEach((toll) => testData.pathwayOptionTollCleanup.track(toll.id));
    });

    it('should sync with empty array to remove all tolls', async () => {
      const savedOption = await createTestOption();
      // First add some tolls
      const tollsInput = [
        { nodeId: testData.nodeIds[2], passTimeMin: 5, distance: 10 },
      ];
      let updatedOption = await savedOption.syncTolls(tollsInput);
      let tolls = await updatedOption.getTolls();
      expect(tolls).toHaveLength(1);
      tolls.forEach((toll) => testData.pathwayOptionTollCleanup.track(toll.id));

      // Now sync with empty array
      updatedOption = await updatedOption.syncTolls([]);
      tolls = await updatedOption.getTolls();
      expect(tolls).toHaveLength(0);
    });

    it('should replace existing tolls (destructive sync)', async () => {
      const savedOption = await createTestOption();
      // First sync
      const initialTolls = [
        { nodeId: testData.nodeIds[2], passTimeMin: 5, distance: 10 },
      ];
      let updatedOption = await savedOption.syncTolls(initialTolls);
      let tolls = await updatedOption.getTolls();
      expect(tolls).toHaveLength(1);
      tolls.forEach((toll) => testData.pathwayOptionTollCleanup.track(toll.id));
      const firstTollId = tolls[0]?.id;

      // Second sync (should replace)
      const newTolls = [
        { nodeId: testData.nodeIds[3], passTimeMin: 7, distance: 15 },
      ];
      updatedOption = await updatedOption.syncTolls(newTolls);
      tolls = await updatedOption.getTolls();

      expect(tolls).toHaveLength(1);
      expect(tolls[0]?.id).not.toBe(firstTollId); // New ID
      expect(tolls[0]?.nodeId).toBe(testData.nodeIds[3]);
      tolls.forEach((toll) => testData.pathwayOptionTollCleanup.track(toll.id));
    });

    it('should assign sequence automatically based on array order', async () => {
      const savedOption = await createTestOption();
      const tollsInput = [
        { nodeId: testData.nodeIds[2], passTimeMin: 5 },
        { nodeId: testData.nodeIds[3], passTimeMin: 7 },
      ];

      const updatedOption = await savedOption.syncTolls(tollsInput);
      const tolls = await updatedOption.getTolls();

      // Verify sequence is 1-indexed and ordered
      expect(tolls[0]?.sequence).toBe(1);
      expect(tolls[1]?.sequence).toBe(2);

      tolls.forEach((toll) => testData.pathwayOptionTollCleanup.track(toll.id));
    });

    it('should throw error when syncing tolls on non-persisted option', async () => {
      const newOption = testData.optionEntity.create({
        pathwayId: testData.pathwayId,
        name: 'Non-persisted Option',
        distanceKm: 100,
        typicalTimeMin: 60,
        isPassThrough: false,
        active: true,
      });

      const tollsInput = [{ nodeId: testData.nodeIds[2], passTimeMin: 5 }];

      await expect(newOption.syncTolls(tollsInput)).rejects.toThrow(
        FieldValidationError,
      );
    });

    it('should validate no duplicate toll nodes', async () => {
      const savedOption = await createTestOption();
      const tollsInput = [
        { nodeId: testData.nodeIds[2], passTimeMin: 5 },
        { nodeId: testData.nodeIds[2], passTimeMin: 7 }, // Duplicate
      ];

      await expect(savedOption.syncTolls(tollsInput)).rejects.toThrow(
        FieldValidationError,
      );
    });

    it('should validate no consecutive duplicate toll nodes', async () => {
      const savedOption = await createTestOption();
      const tollsInput = [
        { nodeId: testData.nodeIds[2], passTimeMin: 5 },
        { nodeId: testData.nodeIds[3], passTimeMin: 7 },
        { nodeId: testData.nodeIds[3], passTimeMin: 10 }, // Consecutive duplicate
      ];

      await expect(savedOption.syncTolls(tollsInput)).rejects.toThrow(
        FieldValidationError,
      );
    });

    it('should validate toll nodes exist', async () => {
      const savedOption = await createTestOption();
      const tollsInput = [
        { nodeId: 99999, passTimeMin: 5 }, // Non-existent node
      ];

      await expect(savedOption.syncTolls(tollsInput)).rejects.toThrow();
    });

    it('should validate multiple errors at once', async () => {
      const savedOption = await createTestOption();
      const tollsInput = [
        { nodeId: testData.nodeIds[2], passTimeMin: 5 },
        { nodeId: testData.nodeIds[2], passTimeMin: 7 }, // Error 1: Duplicate
        { nodeId: testData.nodeIds[2], passTimeMin: 10 }, // Error 2: Consecutive duplicate
      ];

      try {
        await savedOption.syncTolls(tollsInput);
        expect.fail('Should have thrown FieldValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(FieldValidationError);
        const fieldError = error as FieldValidationError;
        expect(fieldError.fieldErrors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('validateTollNodesAreTollbooths', () => {
    /**
     * Helper function to create a valid tollbooth for testing
     * Uses unique codes for parallel test safety
     */
    async function createTestTollbooth(overrides?: {
      tollPrice?: string;
      iaveEnabled?: string;
    }) {
      const tollbooth = await createTollboothHelper(
        {
          cityId: testData.cityId,
          populationId: testData.populationId,
          testSuiteId,
          infrastructure: tollboothInfrastructure,
          tollPrice: overrides?.tollPrice ?? '150.00',
          iaveEnabled: overrides?.iaveEnabled === 'false' ? false : true,
          latitude: 19.7431,
          longitude: -99.2237,
        },
        installationPropertyCleanup,
      );

      testData.nodeIds.push(tollbooth.nodeId);
      installationCleanup.track(tollbooth.installationId);

      return tollbooth.nodeId;
    }

    it('should pass when all nodes are valid tollbooths', async () => {
      // Arrange: Create a valid tollbooth
      const tollboothNodeId = await createTestTollbooth({
        tollPrice: '100.00',
        iaveEnabled: 'true',
      });

      const tolls = [{ nodeId: tollboothNodeId, sequence: 1, passTimeMin: 5 }];
      const collector = new FieldErrorCollector();

      // Act
      await testData.optionEntity.validators.validateTollNodesAreTollbooths(
        tolls,
        collector,
      );

      // Assert: Should not have errors
      expect(collector.hasErrors()).toBe(false);
    });

    it('should fail when node is not a tollbooth', async () => {
      // Arrange: Create a regular node (not a tollbooth)
      const regularNodeCode = createUniqueCode('NODE', 5);
      const regularNode = await nodeRepository.create({
        code: regularNodeCode,
        name: createUniqueName(
          'Regular Node',
          `${testSuiteId}-${regularNodeCode}`,
        ),
        slug: regularNodeCode.toLowerCase(),
        latitude: 19.5,
        longitude: -99.2,
        radius: 100,
        cityId: testData.cityId,
        active: true,
      });
      testData.nodeIds.push(regularNode.id);

      const tolls = [{ nodeId: regularNode.id, sequence: 1, passTimeMin: 5 }];
      const collector = new FieldErrorCollector();

      // Act
      await testData.optionEntity.validators.validateTollNodesAreTollbooths(
        tolls,
        collector,
      );

      // Assert: Should have error with code 'NOT_TOLLBOOTH'
      expect(collector.hasErrors()).toBe(true);
      expect(collector.getErrors()[0]?.code).toBe('NOT_TOLLBOOTH');
    });

    it('should fail when tollbooth has invalid data (negative price)', async () => {
      // Arrange: Create a tollbooth with negative price
      const tollboothNodeId = await createTestTollbooth({
        tollPrice: '-50.00', // ❌ Invalid: negative price
        iaveEnabled: 'true',
      });

      const tolls = [{ nodeId: tollboothNodeId, sequence: 1, passTimeMin: 5 }];
      const collector = new FieldErrorCollector();

      // Act
      await testData.optionEntity.validators.validateTollNodesAreTollbooths(
        tolls,
        collector,
      );

      // Assert: Should have error with code 'INVALID_TOLLBOOTH_DATA'
      expect(collector.hasErrors()).toBe(true);
      expect(collector.getErrors()[0]?.code).toBe('INVALID_TOLLBOOTH_DATA');
    });

    it('should fail when tollbooth is missing iave_enabled', async () => {
      // Arrange: Create a tollbooth with iave_enabled
      const tollbooth = await createTollboothHelper(
        {
          cityId: testData.cityId,
          populationId: testData.populationId,
          testSuiteId,
          infrastructure: tollboothInfrastructure,
          tollPrice: '100.00',
          iaveEnabled: true,
          latitude: 19.7431,
          longitude: -99.2237,
        },
        installationPropertyCleanup,
      );

      testData.nodeIds.push(tollbooth.nodeId);
      installationCleanup.track(tollbooth.installationId);

      // Remove the iave_enabled property from installation
      const properties =
        await installationPropertyRepository.findByInstallationWithSchema(
          tollbooth.installationId,
        );
      const iaveProperty = properties.find(
        (p) =>
          p.installationSchemaId ===
          tollboothInfrastructure.iaveEnabledSchemaId,
      );
      if (iaveProperty) {
        await installationPropertyRepository.forceDelete(iaveProperty.id);
      }

      const tolls = [{ nodeId: tollbooth.nodeId, sequence: 1, passTimeMin: 5 }];
      const collector = new FieldErrorCollector();

      // Act
      await testData.optionEntity.validators.validateTollNodesAreTollbooths(
        tolls,
        collector,
      );

      // Assert: Should have error with code 'INVALID_TOLLBOOTH_DATA'
      expect(collector.hasErrors()).toBe(true);
      expect(collector.getErrors()[0]?.code).toBe('INVALID_TOLLBOOTH_DATA');
      // The error value contains the detailed message from the guard
      expect(collector.getErrors()[0]?.value).toContain('iave_enabled');
    });

    it('should collect all errors when multiple tolls are invalid', async () => {
      // Arrange: Create a regular node and an invalid tollbooth
      const regularNodeCode = createUniqueCode('NODE', 5);
      const regularNode = await nodeRepository.create({
        code: regularNodeCode,
        name: createUniqueName(
          'Regular Node',
          `${testSuiteId}-${regularNodeCode}`,
        ),
        slug: regularNodeCode.toLowerCase(),
        latitude: 19.5,
        longitude: -99.2,
        radius: 100,
        cityId: testData.cityId,
        active: true,
      });
      testData.nodeIds.push(regularNode.id);

      const invalidTollboothId = await createTestTollbooth({
        tollPrice: '-100.00', // ❌ Invalid: negative price
        iaveEnabled: 'true',
      });

      const tolls = [
        { nodeId: regularNode.id, sequence: 1, passTimeMin: 5 },
        { nodeId: invalidTollboothId, sequence: 2, passTimeMin: 10 },
      ];
      const collector = new FieldErrorCollector();

      // Act
      await testData.optionEntity.validators.validateTollNodesAreTollbooths(
        tolls,
        collector,
      );

      // Assert: Should have at least 2 errors
      expect(collector.hasErrors()).toBe(true);
      expect(collector.getErrors().length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('syncTolls - tollbooth validation', () => {
    /**
     * Helper to create a tollbooth for syncTolls tests
     */
    async function createTestTollbooth() {
      const tollbooth = await createTollboothHelper(
        {
          cityId: testData.cityId,
          populationId: testData.populationId,
          testSuiteId,
          infrastructure: tollboothInfrastructure,
          tollPrice: '150.00',
          latitude: 19.7431,
          longitude: -99.2237,
        },
        installationPropertyCleanup,
      );

      testData.nodeIds.push(tollbooth.nodeId);
      installationCleanup.track(tollbooth.installationId);

      return tollbooth.nodeId;
    }

    it('should fail to sync tolls when node is not a tollbooth', async () => {
      // Arrange: Create pathway option
      const option = testData.optionEntity.create({
        pathwayId: testData.pathwayId,
        name: createUniqueName(
          'Test Option Sync',
          `${testSuiteId}-${Date.now()}-${Math.random()}`,
        ),
        description: 'Option for toll sync validation',
        distanceKm: 100,
        typicalTimeMin: 120,
        isPassThrough: false,
        active: true,
      });

      const savedOption = await option.save();
      testData.pathwayOptionCleanup.track(savedOption.id as number);

      // Create a regular node (not a tollbooth)
      const regularNodeCode = createUniqueCode('NODE', 5);
      const regularNode = await nodeRepository.create({
        code: regularNodeCode,
        name: createUniqueName(
          'Regular Node',
          `${testSuiteId}-${regularNodeCode}`,
        ),
        slug: regularNodeCode.toLowerCase(),
        latitude: 19.5,
        longitude: -99.2,
        radius: 100,
        cityId: testData.cityId,
        active: true,
      });
      testData.nodeIds.push(regularNode.id);

      const tolls = [
        { nodeId: regularNode.id, sequence: 1, passTimeMin: 5, distance: 10 },
      ];

      // Act & Assert
      await expect(savedOption.syncTolls(tolls)).rejects.toThrow(
        FieldValidationError,
      );
    });

    it('should successfully sync tolls when nodes are valid tollbooths', async () => {
      // Arrange: Create pathway option
      const option = testData.optionEntity.create({
        pathwayId: testData.pathwayId,
        name: createUniqueName(
          'Test Option Sync',
          `${testSuiteId}-${Date.now()}-${Math.random()}`,
        ),
        description: 'Option for toll sync success',
        distanceKm: 100,
        typicalTimeMin: 120,
        isPassThrough: false,
        active: true,
      });

      const savedOption = await option.save();
      testData.pathwayOptionCleanup.track(savedOption.id as number);

      // Create valid tollbooth
      const tollboothNodeId = await createTestTollbooth();

      const tolls = [{ nodeId: tollboothNodeId, passTimeMin: 5, distance: 10 }];

      // Act
      const updatedOption = await savedOption.syncTolls(tolls);
      const synced = await updatedOption.getTolls();

      // Assert
      expect(synced).toHaveLength(1);
      expect(synced[0]?.nodeId).toBe(tollboothNodeId);
      synced.forEach((toll) =>
        testData.pathwayOptionTollCleanup.track(toll.id),
      );
    });
  });

  describe('getTolls', () => {
    // Helper to create a unique option for each test
    async function createTestOption(): Promise<PathwayOptionEntity> {
      const option = testData.optionEntity.create({
        pathwayId: testData.pathwayId,
        name: createUniqueName(
          'Test Option Get',
          `${testSuiteId}-${Date.now()}-${Math.random()}`,
        ),
        description: 'Option for toll get tests',
        distanceKm: 150,
        typicalTimeMin: 120,
        isPassThrough: false,
        active: true,
      });

      const saved = await option.save();
      testData.pathwayOptionCleanup.track(saved.id as number);
      return saved;
    }

    it('should get tolls ordered by sequence', async () => {
      const savedOption = await createTestOption();
      const tollsInput = [
        { nodeId: testData.nodeIds[2], passTimeMin: 5 },
        { nodeId: testData.nodeIds[3], passTimeMin: 7 },
      ];

      const updatedOption = await savedOption.syncTolls(tollsInput);
      const tolls = await updatedOption.getTolls();

      expect(tolls).toHaveLength(2);
      expect(tolls[0]?.sequence).toBe(1);
      expect(tolls[1]?.sequence).toBe(2);

      tolls.forEach((toll) => testData.pathwayOptionTollCleanup.track(toll.id));
    });

    it('should return empty array when no tolls exist', async () => {
      const savedOption = await createTestOption();
      const tolls = await savedOption.getTolls();
      expect(tolls).toHaveLength(0);
    });

    it('should throw error when getting tolls from non-persisted option', async () => {
      const newOption = testData.optionEntity.create({
        pathwayId: testData.pathwayId,
        name: 'Non-persisted Option',
        distanceKm: 100,
        typicalTimeMin: 60,
        isPassThrough: false,
        active: true,
      });

      await expect(newOption.getTolls()).rejects.toThrow(FieldValidationError);
    });

    it('should reflect changes after sync', async () => {
      const savedOption = await createTestOption();
      // Initial sync
      let updatedOption = await savedOption.syncTolls([
        { nodeId: testData.nodeIds[2], passTimeMin: 5 },
      ]);
      let tolls = await updatedOption.getTolls();
      expect(tolls).toHaveLength(1);
      tolls.forEach((toll) => testData.pathwayOptionTollCleanup.track(toll.id));

      // Sync with more tolls
      updatedOption = await updatedOption.syncTolls([
        { nodeId: testData.nodeIds[2], passTimeMin: 5 },
        { nodeId: testData.nodeIds[3], passTimeMin: 7 },
      ]);
      tolls = await updatedOption.getTolls();
      expect(tolls).toHaveLength(2);
      tolls.forEach((toll) => testData.pathwayOptionTollCleanup.track(toll.id));
    });
  });

  describe('Pass-through field cleanup on update', () => {
    /**
     * Helper to create and save a test option
     */
    async function createTestOption(
      overrides?: Partial<{
        isPassThrough: boolean;
        passThroughTimeMin: number | null;
      }>,
    ): Promise<PathwayOptionEntity> {
      const option = testData.optionEntity.create({
        pathwayId: testData.pathwayId,
        name: createUniqueName('Test Option', testSuiteId),
        distanceKm: 100,
        typicalTimeMin: 60,
        isPassThrough: overrides?.isPassThrough ?? false,
        passThroughTimeMin: overrides?.passThroughTimeMin ?? null,
        active: true,
      });

      const savedOption = await option.save();
      testData.pathwayOptionCleanup.track(savedOption.id as number);
      return savedOption;
    }

    it('should clear passThroughTimeMin when isPassThrough is set to false', async () => {
      // Create option with pass-through enabled and time set
      const option = await createTestOption({
        isPassThrough: true,
        passThroughTimeMin: 15,
      });

      // Verify initial state
      expect(option.isPassThrough).toBe(true);
      expect(option.passThroughTimeMin).toBe(15);

      // Update to disable pass-through
      const updatedOption = await option.update({
        isPassThrough: false,
      });

      // Verify passThroughTimeMin was cleared
      expect(updatedOption.isPassThrough).toBe(false);
      expect(updatedOption.passThroughTimeMin).toBe(null);
    });

    it('should persist the cleared passThroughTimeMin in database', async () => {
      // Create option with pass-through enabled
      const option = await createTestOption({
        isPassThrough: true,
        passThroughTimeMin: 20,
      });

      const optionId = option.id as number;

      // Update to disable pass-through
      await option.update({
        isPassThrough: false,
      });

      // Re-fetch from database to verify persistence
      const refetchedOption = await testData.optionEntity.findOne(optionId);

      expect(refetchedOption.isPassThrough).toBe(false);
      expect(refetchedOption.passThroughTimeMin).toBe(null);
    });

    it('should not affect passThroughTimeMin when isPassThrough remains true', async () => {
      // Create option with pass-through enabled
      const option = await createTestOption({
        isPassThrough: true,
        passThroughTimeMin: 25,
      });

      // Update other fields but keep isPassThrough as true
      const updatedOption = await option.update({
        name: 'Updated Name',
      });

      // Verify passThroughTimeMin is preserved
      expect(updatedOption.isPassThrough).toBe(true);
      expect(updatedOption.passThroughTimeMin).toBe(25);
    });

    it('should not set passThroughTimeMin when isPassThrough is not in payload', async () => {
      // Create option with pass-through disabled and null time
      const option = await createTestOption({
        isPassThrough: false,
        passThroughTimeMin: null,
      });

      // Update other fields without touching isPassThrough
      const updatedOption = await option.update({
        distanceKm: 150,
      });

      // Verify isPassThrough and passThroughTimeMin remain unchanged
      expect(updatedOption.isPassThrough).toBe(false);
      expect(updatedOption.passThroughTimeMin).toBe(null);
    });

    it('should allow updating passThroughTimeMin when isPassThrough is true', async () => {
      // Create option with pass-through enabled
      const option = await createTestOption({
        isPassThrough: true,
        passThroughTimeMin: 10,
      });

      // Update the pass-through time
      const updatedOption = await option.update({
        passThroughTimeMin: 30,
      });

      // Verify new time is set
      expect(updatedOption.isPassThrough).toBe(true);
      expect(updatedOption.passThroughTimeMin).toBe(30);
    });

    it('should clear passThroughTimeMin even when explicitly provided in payload', async () => {
      // Create option with pass-through enabled
      const option = await createTestOption({
        isPassThrough: true,
        passThroughTimeMin: 15,
      });

      // Try to update with isPassThrough false and a time value
      // The cleanup logic should override the provided value
      const updatedOption = await option.update({
        isPassThrough: false,
        passThroughTimeMin: 20, // This should be ignored and set to null
      });

      // Verify passThroughTimeMin was cleared (not set to 20)
      expect(updatedOption.isPassThrough).toBe(false);
      expect(updatedOption.passThroughTimeMin).toBe(null);
    });
  });
});
