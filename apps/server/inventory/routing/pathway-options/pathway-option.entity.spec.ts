import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { createSlug } from '@/shared/utils';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import { populationRepository } from '@/inventory/locations/populations/populations.repository';
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

    // Create test nodes (including toll nodes)
    const nodes = await Promise.all([
      nodeRepository.create({
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
      }),
      nodeRepository.create({
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
      }),
      nodeRepository.create({
        code: createUniqueCode('TN3', 3),
        name: createUniqueName('Toll Node 1', testSuiteId),
        cityId,
        latitude: 19.5,
        longitude: -99.5,
        radius: 1000,
        slug: createUniqueNodeSlug('Toll Node 1', testSuiteId),
        populationId,
        allowsBoarding: false,
        allowsAlighting: false,
        active: true,
      }),
      nodeRepository.create({
        code: createUniqueCode('TN4', 3),
        name: createUniqueName('Toll Node 2', testSuiteId),
        cityId,
        latitude: 19.7,
        longitude: -99.7,
        radius: 1000,
        slug: createUniqueNodeSlug('Toll Node 2', testSuiteId),
        populationId,
        allowsBoarding: false,
        allowsAlighting: false,
        active: true,
      }),
    ]);
    const nodeIds = nodes.map((n) => n.id);

    // Create test pathway with fully unique identifiers
    // Note: We use entity creation which automatically retrieves city IDs from nodes
    const pathwayOptionFactory = createPathwayOptionEntity({
      pathwayOptionsRepository: pathwayOptionRepository,
      pathwayOptionTollsRepository: pathwayOptionTollRepository,
      nodesRepository: nodeRepository,
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

    // Create option entity factory
    const optionEntity = createPathwayOptionEntity({
      pathwayOptionsRepository: pathwayOptionRepository,
      pathwayOptionTollsRepository: pathwayOptionTollRepository,
      nodesRepository: nodeRepository,
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

      // 5. Clean up population (now that nodes are deleted)
      try {
        await populationRepository.forceDelete(testData.populationId);
      } catch {
        // Ignore errors
      }

      // Cities cleaned up by factories
    }
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
});
