import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { db } from '@/inventory/db-service';
import { createSlug } from '@/shared/utils';
import { installationPropertyRepository } from '@/inventory/locations/installation-properties/installation-properties.repository';
import { installationRepository } from '@/inventory/locations/installations/installations.repository';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
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
import type { Pathway } from '../pathways/pathways.types';
import type { BulkSyncOptionsPayload } from '../pathways/pathways.types';
import { pathwayOptionRepository } from './pathway-options.repository';
import { createPathwayOptionEntity } from './pathway-option.entity';
import { createPathwayOptionDomainService } from './pathway-options.domain-service';

/**
 * Test suite for PathwayOptionDomainService - Bulk Sync Operations
 *
 * This test suite validates the complex bulk sync functionality that allows:
 * - Creating multiple options in a single transaction
 * - Updating existing options
 * - Deleting options not present in payload
 * - Managing default option assignment
 * - Synchronizing tolls for each option
 */
describe('PathwayOptionDomainService - Bulk Sync Operations', () => {
  const testSuiteId = createTestSuiteId('pathway-option-domain-service');
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
    pathway: Pathway;
    pathwayCleanup: ReturnType<typeof createCleanupHelper>;
    pathwayOptionCleanup: ReturnType<typeof createCleanupHelper>;
    pathwayOptionTollCleanup: ReturnType<typeof createCleanupHelper>;
    nodeCleanup: ReturnType<typeof createCleanupHelper>;
    domainService: ReturnType<typeof createPathwayOptionDomainService>;
  };

  beforeAll(async () => {
    // Setup tollbooth infrastructure (type and schemas) - handles race conditions
    tollboothInfrastructure = await setupTollboothInfrastructure(
      db,
      testSuiteId,
    );
  });

  afterAll(async () => {
    // Global cleanup - installations created in beforeAll or tests
    await installationPropertyCleanup.cleanupAll();
    await installationCleanup.cleanupAll();
  });

  beforeEach(async () => {
    // Create cleanup helpers
    const pathwayOptionTollCleanup = createCleanupHelper(
      ({ id }) => pathwayOptionTollRepository.delete(id),
      'pathway option toll',
    );
    const pathwayOptionCleanup = createCleanupHelper(
      ({ id }) => pathwayOptionRepository.forceDelete(id),
      'pathway option',
    );
    const pathwayCleanup = createCleanupHelper(
      ({ id }) => pathwayRepository.forceDelete(id),
      'pathway',
    );
    const nodeCleanup = createCleanupHelper(
      ({ id }) => nodeRepository.forceDelete(id),
      'node',
    );

    // Create test dependencies
    const testPopulation = await populationFactory(factoryDb).create({
      code: createUniqueCode('TPOP', 3),
      description: 'Test population for domain service',
      active: true,
    });
    const populationId = testPopulation.id;

    const testCity = await cityFactory(factoryDb).create({
      name: createUniqueName('Test City Pathway Options', testSuiteId),
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
    nodeCleanup.track(originNode.id);

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
    nodeCleanup.track(destinationNode.id);

    // Create toll nodes as VALID TOLLBOOTHS using helper
    const toll1 = await createTollboothHelper(
      {
        cityId,
        populationId,
        testSuiteId,
        infrastructure: tollboothInfrastructure,
        tollPrice: '100.00',
        latitude: 19.5326,
        longitude: -99.2332,
      },
      installationPropertyCleanup,
    );
    nodeCleanup.track(toll1.nodeId);
    installationCleanup.track(toll1.installationId);

    const toll2 = await createTollboothHelper(
      {
        cityId,
        populationId,
        testSuiteId,
        infrastructure: tollboothInfrastructure,
        tollPrice: '150.00',
        latitude: 19.6326,
        longitude: -99.3332,
      },
      installationPropertyCleanup,
    );
    nodeCleanup.track(toll2.nodeId);
    installationCleanup.track(toll2.installationId);

    const nodeIds = [
      originNode.id,
      destinationNode.id,
      toll1.nodeId,
      toll2.nodeId,
    ];

    // Create test pathway
    const pathwayEntity = createPathwayEntity({
      pathwaysRepository: pathwayRepository,
      pathwayOptionsRepository: pathwayOptionRepository,
      nodesRepository: nodeRepository,
      pathwayOptionEntityFactory: createPathwayOptionEntity({
        pathwayOptionsRepository: pathwayOptionRepository,
        pathwayOptionTollsRepository: pathwayOptionTollRepository,
        nodesRepository: nodeRepository,
        tollboothRepository,
      }),
    });

    const pathway = pathwayEntity.create({
      originNodeId: nodeIds[0] as number,
      destinationNodeId: nodeIds[1] as number,
      name: createUniqueName('Test Pathway', testSuiteId),
      code: createUniqueCode('TPW', 6),
      description: 'Test pathway for domain service',
      isSellable: true,
      isEmptyTrip: false,
      active: false,
    });

    const savedPathway = await pathway.save();
    const pathwayData = savedPathway.toPathway();
    pathwayCleanup.track(pathwayData.id);

    // Create domain service instance
    const pathwayOptionEntityFactory = createPathwayOptionEntity({
      pathwayOptionsRepository: pathwayOptionRepository,
      pathwayOptionTollsRepository: pathwayOptionTollRepository,
      nodesRepository: nodeRepository,
      tollboothRepository,
    });

    const domainService = createPathwayOptionDomainService({
      pathwayOptionRepository: pathwayOptionRepository,
      nodeRepository: nodeRepository,
      pathwayOptionEntityFactory,
    });

    testData = {
      cityId,
      nodeIds,
      populationId,
      pathway: pathwayData,
      pathwayCleanup,
      pathwayOptionCleanup,
      pathwayOptionTollCleanup,
      nodeCleanup,
      domainService,
    };
  });

  afterEach(async () => {
    // Cleanup in reverse order of dependencies
    await testData.pathwayOptionTollCleanup?.cleanupAll();
    await testData.pathwayOptionCleanup?.cleanupAll();
    await testData.pathwayCleanup?.cleanupAll();
    await testData.nodeCleanup?.cleanupAll();
  });

  // ═══════════════════════════════════════════════════════════
  // TEST GROUP 1: Basic Bulk Sync Operations
  // ═══════════════════════════════════════════════════════════
  describe('Basic Bulk Sync Operations', () => {
    it('should create multiple options in a single bulk sync', async () => {
      // Arrange: Prepare payload with 3 new options
      const payload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Option A',
            description: 'First option',
            distanceKm: 100,
            typicalTimeMin: 60,
            isPassThrough: false,
            active: true,
            isDefault: true,
          },
          {
            name: 'Option B',
            description: 'Second option',
            distanceKm: 120,
            typicalTimeMin: 70,
            isPassThrough: false,
            active: true,
          },
          {
            name: 'Option C',
            description: 'Third option',
            distanceKm: 90,
            typicalTimeMin: 55,
            isPassThrough: false,
            active: true,
          },
        ],
      };

      // Act: Execute bulk sync
      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const result = await testData.domainService.bulkSyncOptions(
        pathwayEntity,
        testData.pathway.id,
        payload,
      );

      // Assert: Verify all options were created
      const options = await result.options;
      expect(options).toHaveLength(3);

      // Track for cleanup
      options.forEach((o) => testData.pathwayOptionCleanup.track(o.id));

      // Verify Option A is default
      const optionA = options.find((o) => o.name === 'Option A');
      expect(optionA).toBeDefined();
      expect(optionA?.isDefault).toBe(true);

      // Verify others are not default
      const optionB = options.find((o) => o.name === 'Option B');
      const optionC = options.find((o) => o.name === 'Option C');
      expect(optionB?.isDefault).toBe(false);
      expect(optionC?.isDefault).toBe(false);
    });

    it('should assign first option as default when no explicit default provided', async () => {
      // Arrange: Payload without explicit default
      const payload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Option A',
            description: 'First option',
            distanceKm: 100,
            typicalTimeMin: 60,
            isPassThrough: false,
            active: true,
          },
          {
            name: 'Option B',
            description: 'Second option',
            distanceKm: 120,
            typicalTimeMin: 70,
            isPassThrough: false,
            active: true,
          },
        ],
      };

      // Act
      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const result = await testData.domainService.bulkSyncOptions(
        pathwayEntity,
        testData.pathway.id,
        payload,
      );

      // Assert
      const options = await result.options;
      options.forEach((o) => testData.pathwayOptionCleanup.track(o.id));

      const optionA = options.find((o) => o.name === 'Option A');
      expect(optionA?.isDefault).toBe(true);

      const optionB = options.find((o) => o.name === 'Option B');
      expect(optionB?.isDefault).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TEST GROUP 2: Update Operations
  // ═══════════════════════════════════════════════════════════
  describe('Update Operations', () => {
    it('should update existing options when IDs are provided', async () => {
      // Arrange: Create initial options
      const initialPayload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Option A',
            description: 'First option',
            distanceKm: 100,
            typicalTimeMin: 60,
            isPassThrough: false,
            active: true,
            isDefault: true,
          },
          {
            name: 'Option B',
            description: 'Second option',
            distanceKm: 120,
            typicalTimeMin: 70,
            isPassThrough: false,
            active: true,
          },
        ],
      };

      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const initialResult = await testData.domainService.bulkSyncOptions(
        pathwayEntity,
        testData.pathway.id,
        initialPayload,
      );

      const initialOptions = await initialResult.options;
      initialOptions.forEach((o) => testData.pathwayOptionCleanup.track(o.id));

      const optionAId = initialOptions.find((o) => o.name === 'Option A')?.id;
      const optionBId = initialOptions.find((o) => o.name === 'Option B')?.id;

      // Act: Update options with new data
      const updatePayload: BulkSyncOptionsPayload = {
        options: [
          {
            id: optionAId,
            name: 'Option A Updated',
            description: 'Updated first option',
            distanceKm: 110,
            typicalTimeMin: 65,
            isPassThrough: false,
            active: true,
            isDefault: true,
          },
          {
            id: optionBId,
            name: 'Option B Updated',
            description: 'Updated second option',
            distanceKm: 130,
            typicalTimeMin: 75,
            isPassThrough: false,
            active: true,
          },
        ],
      };

      const pathwayEntity2 = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const updateResult = await testData.domainService.bulkSyncOptions(
        pathwayEntity2,
        testData.pathway.id,
        updatePayload,
      );

      // Assert: Verify updates
      const updatedOptions = await updateResult.options;
      expect(updatedOptions).toHaveLength(2);

      const updatedA = updatedOptions.find(
        (o) => o.name === 'Option A Updated',
      );
      expect(updatedA).toBeDefined();
      expect(updatedA?.id).toBe(optionAId);
      expect(updatedA?.distanceKm).toBe(110);
      expect(updatedA?.typicalTimeMin).toBe(65);
      expect(updatedA?.isDefault).toBe(true);

      const updatedB = updatedOptions.find(
        (o) => o.name === 'Option B Updated',
      );
      expect(updatedB).toBeDefined();
      expect(updatedB?.id).toBe(optionBId);
      expect(updatedB?.distanceKm).toBe(130);
      expect(updatedB?.typicalTimeMin).toBe(75);
      expect(updatedB?.isDefault).toBe(false);
    });

    it('should preserve default when updating non-default options', async () => {
      // Arrange: Create initial options with A as default
      const initialPayload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Option A',
            description: 'Default option',
            distanceKm: 100,
            typicalTimeMin: 60,
            isPassThrough: false,
            active: true,
            isDefault: true,
          },
          {
            name: 'Option B',
            description: 'Non-default option',
            distanceKm: 120,
            typicalTimeMin: 70,
            isPassThrough: false,
            active: true,
          },
        ],
      };

      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const initialResult = await testData.domainService.bulkSyncOptions(
        pathwayEntity,
        testData.pathway.id,
        initialPayload,
      );

      const initialOptions = await initialResult.options;
      initialOptions.forEach((o) => testData.pathwayOptionCleanup.track(o.id));

      const optionAId = initialOptions.find((o) => o.name === 'Option A')?.id;
      const optionBId = initialOptions.find((o) => o.name === 'Option B')?.id;

      // Act: Update only Option B (non-default)
      const updatePayload: BulkSyncOptionsPayload = {
        options: [
          {
            id: optionAId,
            name: 'Option A',
            description: 'Default option',
            distanceKm: 100,
            typicalTimeMin: 60,
            isPassThrough: false,
            active: true,
            isDefault: true,
          },
          {
            id: optionBId,
            name: 'Option B Updated',
            description: 'Updated non-default',
            distanceKm: 125,
            typicalTimeMin: 72,
            isPassThrough: false,
            active: true,
          },
        ],
      };

      const pathwayEntity2 = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const updateResult = await testData.domainService.bulkSyncOptions(
        pathwayEntity2,
        testData.pathway.id,
        updatePayload,
      );

      // Assert: Verify A is still default
      const updatedOptions = await updateResult.options;
      const updatedA = updatedOptions.find((o) => o.id === optionAId);
      const updatedB = updatedOptions.find((o) => o.id === optionBId);

      expect(updatedA?.isDefault).toBe(true);
      expect(updatedB?.isDefault).toBe(false);
      expect(updatedB?.name).toBe('Option B Updated');
    });

    it('should change default when explicitly requested', async () => {
      // Arrange: Create initial options with A as default
      const initialPayload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Option A',
            description: 'Initial default',
            distanceKm: 100,
            typicalTimeMin: 60,
            isPassThrough: false,
            active: true,
            isDefault: true,
          },
          {
            name: 'Option B',
            description: 'Will become default',
            distanceKm: 120,
            typicalTimeMin: 70,
            isPassThrough: false,
            active: true,
          },
        ],
      };

      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const initialResult = await testData.domainService.bulkSyncOptions(
        pathwayEntity,
        testData.pathway.id,
        initialPayload,
      );

      const initialOptions = await initialResult.options;
      initialOptions.forEach((o) => testData.pathwayOptionCleanup.track(o.id));

      const optionAId = initialOptions.find((o) => o.name === 'Option A')?.id;
      const optionBId = initialOptions.find((o) => o.name === 'Option B')?.id;

      // Act: Change default to Option B
      const updatePayload: BulkSyncOptionsPayload = {
        options: [
          {
            id: optionAId,
            name: 'Option A',
            description: 'No longer default',
            distanceKm: 100,
            typicalTimeMin: 60,
            isPassThrough: false,
            active: true,
          },
          {
            id: optionBId,
            name: 'Option B',
            description: 'Now default',
            distanceKm: 120,
            typicalTimeMin: 70,
            isPassThrough: false,
            active: true,
            isDefault: true,
          },
        ],
      };

      const pathwayEntity2 = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const updateResult = await testData.domainService.bulkSyncOptions(
        pathwayEntity2,
        testData.pathway.id,
        updatePayload,
      );

      // Assert: Verify B is now default
      const updatedOptions = await updateResult.options;
      const updatedA = updatedOptions.find((o) => o.id === optionAId);
      const updatedB = updatedOptions.find((o) => o.id === optionBId);

      expect(updatedA?.isDefault).toBe(false);
      expect(updatedB?.isDefault).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TEST GROUP 3: Delete Operations
  // ═══════════════════════════════════════════════════════════
  describe('Delete Operations', () => {
    it('should delete options not present in payload', async () => {
      // Arrange: Create 3 options
      const initialPayload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Option A',
            description: 'Will stay',
            distanceKm: 100,
            typicalTimeMin: 60,
            isPassThrough: false,
            active: true,
            isDefault: true,
          },
          {
            name: 'Option B',
            description: 'Will be deleted',
            distanceKm: 120,
            typicalTimeMin: 70,
            isPassThrough: false,
            active: true,
          },
          {
            name: 'Option C',
            description: 'Will be deleted too',
            distanceKm: 90,
            typicalTimeMin: 55,
            isPassThrough: false,
            active: true,
          },
        ],
      };

      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const initialResult = await testData.domainService.bulkSyncOptions(
        pathwayEntity,
        testData.pathway.id,
        initialPayload,
      );

      const initialOptions = await initialResult.options;
      initialOptions.forEach((o) => testData.pathwayOptionCleanup.track(o.id));

      const optionAId = initialOptions.find((o) => o.name === 'Option A')?.id;

      // Act: Sync with only Option A (B and C should be deleted)
      const deletePayload: BulkSyncOptionsPayload = {
        options: [
          {
            id: optionAId,
            name: 'Option A',
            description: 'Only survivor',
            distanceKm: 100,
            typicalTimeMin: 60,
            isPassThrough: false,
            active: true,
            isDefault: true,
          },
        ],
      };

      const pathwayEntity2 = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const deleteResult = await testData.domainService.bulkSyncOptions(
        pathwayEntity2,
        testData.pathway.id,
        deletePayload,
      );

      // Assert: Only Option A remains
      const finalOptions = await deleteResult.options;
      expect(finalOptions).toHaveLength(1);
      expect(finalOptions[0]?.name).toBe('Option A');
      expect(finalOptions[0]?.isDefault).toBe(true);
    });

    it('should prevent deletion of all options from active pathway', async () => {
      // Arrange: Create options and activate pathway
      const initialPayload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Option A',
            description: 'Only option',
            distanceKm: 100,
            typicalTimeMin: 60,
            isPassThrough: false,
            active: true,
            isDefault: true,
          },
        ],
      };

      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const initialResult = await testData.domainService.bulkSyncOptions(
        pathwayEntity,
        testData.pathway.id,
        initialPayload,
      );

      const initialOptions = await initialResult.options;
      initialOptions.forEach((o) => testData.pathwayOptionCleanup.track(o.id));

      // Activate the pathway
      await pathwayRepository.update(testData.pathway.id, { active: true });
      const activePathway = await pathwayRepository.findOne(
        testData.pathway.id,
      );

      // Act & Assert: Try to delete all options (should fail)
      const emptyPayload: BulkSyncOptionsPayload = {
        options: [],
      };

      const pathwayEntity2 = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(activePathway);

      await expect(
        testData.domainService.bulkSyncOptions(
          pathwayEntity2,
          testData.pathway.id,
          emptyPayload,
        ),
      ).rejects.toThrow();
    });

    it('should prevent deletion of default option without replacement', async () => {
      // Arrange: Create 2 options, A is default
      const initialPayload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Option A',
            description: 'Default option',
            distanceKm: 100,
            typicalTimeMin: 60,
            isPassThrough: false,
            active: true,
            isDefault: true,
          },
          {
            name: 'Option B',
            description: 'Non-default option',
            distanceKm: 120,
            typicalTimeMin: 70,
            isPassThrough: false,
            active: true,
          },
        ],
      };

      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const initialResult = await testData.domainService.bulkSyncOptions(
        pathwayEntity,
        testData.pathway.id,
        initialPayload,
      );

      const initialOptions = await initialResult.options;
      initialOptions.forEach((o) => testData.pathwayOptionCleanup.track(o.id));

      const optionBId = initialOptions.find((o) => o.name === 'Option B')?.id;

      // Act & Assert: Try to keep only B without marking it as default (should fail)
      const invalidPayload: BulkSyncOptionsPayload = {
        options: [
          {
            id: optionBId,
            name: 'Option B',
            description: 'Non-default option',
            distanceKm: 120,
            typicalTimeMin: 70,
            isPassThrough: false,
            active: true,
            // NOT marking as default - this should fail
          },
        ],
      };

      const pathwayEntity2 = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      await expect(
        testData.domainService.bulkSyncOptions(
          pathwayEntity2,
          testData.pathway.id,
          invalidPayload,
        ),
      ).rejects.toThrow();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TEST GROUP 4: Toll Synchronization
  // ═══════════════════════════════════════════════════════════
  describe('Toll Synchronization', () => {
    it('should synchronize tolls for new options', async () => {
      // Arrange: Create option with tolls
      const payload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Option with Tolls',
            description: 'Option with toll nodes',
            distanceKm: 150,
            typicalTimeMin: 90,
            isPassThrough: false,
            active: true,
            isDefault: true,
            tolls: [
              {
                nodeId: testData.nodeIds[2] as number, // Toll node 1
                distance: 50,
              },
              {
                nodeId: testData.nodeIds[3] as number, // Toll node 2
                distance: 75,
              },
            ],
          },
        ],
      };

      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      // Act: Create option with tolls
      const result = await testData.domainService.bulkSyncOptions(
        pathwayEntity,
        testData.pathway.id,
        payload,
      );

      // Assert: Verify option was created with tolls
      const options = await result.options;
      testData.pathwayOptionCleanup.track(options[0]?.id as number);

      const createdOption = options[0];
      expect(createdOption).toBeDefined();
      expect(createdOption?.name).toBe('Option with Tolls');

      // Verify tolls were created
      const tolls = await pathwayOptionTollRepository.findByOptionId(
        createdOption?.id as number,
      );
      expect(tolls).toHaveLength(2);

      // Verify toll details
      const toll1 = tolls.find((t) => t.sequence === 1);
      const toll2 = tolls.find((t) => t.sequence === 2);

      expect(toll1?.nodeId).toBe(testData.nodeIds[2]);
      // Option has avgSpeedKmh = 100 (150km / 90min * 60)
      // For distance 50: passTimeMin = round((50 * 60) / 100) = 30
      expect(toll1?.passTimeMin).toBe(30);
      expect(toll1?.distance).toBe(50);
      expect(toll2?.nodeId).toBe(testData.nodeIds[3]);
      // For distance 75: passTimeMin = round((75 * 60) / 100) = 45
      expect(toll2?.passTimeMin).toBe(45);
      expect(toll2?.distance).toBe(75);

      // Track tolls for cleanup
      tolls.forEach((t) => testData.pathwayOptionTollCleanup.track(t.id));
    });

    it('should update tolls for existing options', async () => {
      // Arrange: Create initial option with tolls
      const initialPayload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Option with Initial Tolls',
            description: 'Will update tolls',
            distanceKm: 150,
            typicalTimeMin: 90,
            isPassThrough: false,
            active: true,
            isDefault: true,
            tolls: [
              {
                nodeId: testData.nodeIds[2] as number,
                distance: 50,
              },
            ],
          },
        ],
      };

      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const initialResult = await testData.domainService.bulkSyncOptions(
        pathwayEntity,
        testData.pathway.id,
        initialPayload,
      );

      const initialOptions = await initialResult.options;
      const optionId = initialOptions[0]?.id as number;
      testData.pathwayOptionCleanup.track(optionId);

      const initialTolls =
        await pathwayOptionTollRepository.findByOptionId(optionId);
      initialTolls.forEach((t) =>
        testData.pathwayOptionTollCleanup.track(t.id),
      );

      // Act: Update tolls (replace with different tolls)
      const updatePayload: BulkSyncOptionsPayload = {
        options: [
          {
            id: optionId,
            name: 'Option with Updated Tolls',
            description: 'Updated tolls',
            distanceKm: 150,
            typicalTimeMin: 90,
            isPassThrough: false,
            active: true,
            isDefault: true,
            tolls: [
              {
                nodeId: testData.nodeIds[3] as number, // Different toll node
                distance: 100,
              },
            ],
          },
        ],
      };

      const pathwayEntity2 = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const updateResult = await testData.domainService.bulkSyncOptions(
        pathwayEntity2,
        testData.pathway.id,
        updatePayload,
      );

      // Assert: Verify tolls were replaced
      const updatedOptions = await updateResult.options;
      const updatedOption = updatedOptions[0];
      expect(updatedOption?.name).toBe('Option with Updated Tolls');

      const updatedTolls =
        await pathwayOptionTollRepository.findByOptionId(optionId);
      expect(updatedTolls).toHaveLength(1);

      const toll = updatedTolls[0];
      expect(toll?.nodeId).toBe(testData.nodeIds[3]);
      // Option has avgSpeedKmh = 100 (150km / 90min * 60)
      // For distance 100: passTimeMin = round((100 * 60) / 100) = 60
      expect(toll?.passTimeMin).toBe(60);
      expect(toll?.distance).toBe(100);

      // Track new toll for cleanup
      testData.pathwayOptionTollCleanup.track(toll?.id as number);
    });

    it('should validate toll node IDs exist', async () => {
      // Arrange: Payload with invalid toll node ID
      const invalidPayload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Option with Invalid Toll',
            description: 'Has invalid toll node',
            distanceKm: 150,
            typicalTimeMin: 90,
            isPassThrough: false,
            active: true,
            isDefault: true,
            tolls: [
              {
                nodeId: 999999, // Non-existent node ID
                distance: 50,
              },
            ],
          },
        ],
      };

      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      // Act & Assert: Should fail validation
      await expect(
        testData.domainService.bulkSyncOptions(
          pathwayEntity,
          testData.pathway.id,
          invalidPayload,
        ),
      ).rejects.toThrow();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TEST GROUP 5: Validation Errors
  // ═══════════════════════════════════════════════════════════
  describe('Validation Errors', () => {
    it('should reject payload with multiple explicit defaults', async () => {
      // Arrange: Payload with two options marked as default
      const invalidPayload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Option A',
            description: 'First default',
            distanceKm: 100,
            typicalTimeMin: 60,
            isPassThrough: false,
            active: true,
            isDefault: true, // Both marked as default
          },
          {
            name: 'Option B',
            description: 'Second default',
            distanceKm: 120,
            typicalTimeMin: 70,
            isPassThrough: false,
            active: true,
            isDefault: true, // Both marked as default
          },
        ],
      };

      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      // Act & Assert: Should fail validation
      await expect(
        testData.domainService.bulkSyncOptions(
          pathwayEntity,
          testData.pathway.id,
          invalidPayload,
        ),
      ).rejects.toThrow();
    });

    it('should reject payload with invalid node IDs in tolls', async () => {
      // Arrange: Payload with non-existent toll node
      const invalidPayload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Option with Invalid Toll',
            description: 'Has non-existent toll node',
            distanceKm: 150,
            typicalTimeMin: 90,
            isPassThrough: false,
            active: true,
            isDefault: true,
            tolls: [
              {
                nodeId: 999999, // Non-existent node ID
                distance: 50,
              },
            ],
          },
        ],
      };

      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      // Act & Assert: Should fail validation
      await expect(
        testData.domainService.bulkSyncOptions(
          pathwayEntity,
          testData.pathway.id,
          invalidPayload,
        ),
      ).rejects.toThrow();
    });

    it('should reject payload with duplicate toll nodes', async () => {
      // Arrange: Payload with duplicate toll node IDs in same option
      const invalidPayload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Option with Duplicate Tolls',
            description: 'Has duplicate toll nodes',
            distanceKm: 150,
            typicalTimeMin: 90,
            isPassThrough: false,
            active: true,
            isDefault: true,
            tolls: [
              {
                nodeId: testData.nodeIds[2] as number,
                distance: 50,
              },
              {
                nodeId: testData.nodeIds[2] as number, // Same node ID (duplicate)
                distance: 60,
              },
            ],
          },
        ],
      };

      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      // Act & Assert: Should fail validation
      await expect(
        testData.domainService.bulkSyncOptions(
          pathwayEntity,
          testData.pathway.id,
          invalidPayload,
        ),
      ).rejects.toThrow();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TEST GROUP 6: Transaction Atomicity
  // ═══════════════════════════════════════════════════════════
  describe('Transaction Atomicity', () => {
    it('should rollback all changes if validation fails', async () => {
      // Arrange: Create initial option
      const initialPayload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Initial Option',
            description: 'Will be preserved',
            distanceKm: 100,
            typicalTimeMin: 60,
            isPassThrough: false,
            active: true,
            isDefault: true,
          },
        ],
      };

      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const initialResult = await testData.domainService.bulkSyncOptions(
        pathwayEntity,
        testData.pathway.id,
        initialPayload,
      );

      const initialOptions = await initialResult.options;
      testData.pathwayOptionCleanup.track(initialOptions[0]?.id as number);

      // Act: Try to sync with invalid data (multiple defaults)
      const invalidPayload: BulkSyncOptionsPayload = {
        options: [
          {
            id: initialOptions[0]?.id,
            name: 'Updated Option',
            description: 'Should not be applied',
            distanceKm: 150,
            typicalTimeMin: 90,
            isPassThrough: false,
            active: true,
            isDefault: true,
          },
          {
            name: 'New Invalid Option',
            description: 'Also marked as default',
            distanceKm: 120,
            typicalTimeMin: 70,
            isPassThrough: false,
            active: true,
            isDefault: true, // Invalid: multiple defaults
          },
        ],
      };

      const pathwayEntity2 = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      // Assert: Operation fails
      await expect(
        testData.domainService.bulkSyncOptions(
          pathwayEntity2,
          testData.pathway.id,
          invalidPayload,
        ),
      ).rejects.toThrow();

      // Verify original data is preserved
      const preservedOptions = await pathwayOptionRepository.findByPathwayId(
        testData.pathway.id,
      );
      expect(preservedOptions).toHaveLength(1);
      expect(preservedOptions[0]?.name).toBe('Initial Option');
      expect(preservedOptions[0]?.distanceKm).toBe(100);
    });

    it('should rollback all changes if toll sync fails', async () => {
      // Arrange: Create initial option without tolls
      const initialPayload: BulkSyncOptionsPayload = {
        options: [
          {
            name: 'Initial Option',
            description: 'Without tolls',
            distanceKm: 100,
            typicalTimeMin: 60,
            isPassThrough: false,
            active: true,
            isDefault: true,
          },
        ],
      };

      const pathwayEntity = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      const initialResult = await testData.domainService.bulkSyncOptions(
        pathwayEntity,
        testData.pathway.id,
        initialPayload,
      );

      const initialOptions = await initialResult.options;
      const initialOptionId = initialOptions[0]?.id as number;
      testData.pathwayOptionCleanup.track(initialOptionId);

      // Act: Try to add tolls with invalid node ID
      const invalidTollPayload: BulkSyncOptionsPayload = {
        options: [
          {
            id: initialOptionId,
            name: 'Updated with Invalid Toll',
            description: 'Should fail',
            distanceKm: 150,
            typicalTimeMin: 90,
            isPassThrough: false,
            active: true,
            isDefault: true,
            tolls: [
              {
                nodeId: 999999, // Invalid node ID
                distance: 50,
              },
            ],
          },
        ],
      };

      const pathwayEntity2 = createPathwayEntity({
        pathwaysRepository: pathwayRepository,
        pathwayOptionsRepository: pathwayOptionRepository,
        nodesRepository: nodeRepository,
        pathwayOptionEntityFactory: createPathwayOptionEntity({
          pathwayOptionsRepository: pathwayOptionRepository,
          pathwayOptionTollsRepository: pathwayOptionTollRepository,
          nodesRepository: nodeRepository,
          tollboothRepository,
        }),
      }).fromData(testData.pathway);

      // Assert: Operation fails
      await expect(
        testData.domainService.bulkSyncOptions(
          pathwayEntity2,
          testData.pathway.id,
          invalidTollPayload,
        ),
      ).rejects.toThrow();

      // Verify original data is preserved
      const preservedOption =
        await pathwayOptionRepository.findOne(initialOptionId);
      expect(preservedOption.name).toBe('Initial Option');
      expect(preservedOption.distanceKm).toBe(100);

      // Verify no tolls were created
      const tolls =
        await pathwayOptionTollRepository.findByOptionId(initialOptionId);
      expect(tolls).toHaveLength(0);
    });
  });
});
