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
import { pathwayOptionRepository } from '../../pathway-options/pathway-options.repository';
import { pathwayOptions } from '../../pathway-options/pathway-options.schema';
import { pathwayRepository } from '../pathways.repository';
import { createPathwayEntity } from './pathway.entity';

describe('PathwayEntity', () => {
  const testSuiteId = createTestSuiteId('pathway-entity');
  const factoryDb = getFactoryDb(db);

  /**
   * Creates a unique slug for test nodes
   * @param baseName - Base name for the node (e.g., 'Test Node 1')
   * @param testSuiteId - Test suite identifier
   * @returns Unique slug with format: n-{normalized-name}-{suite-id}-{unique-token}
   */
  function createUniqueNodeSlug(baseName: string, testSuiteId: string): string {
    const uniqueToken = createUniqueCode('', 4);
    return createSlug(`${baseName} ${testSuiteId} ${uniqueToken}`, 'n');
  }

  let testData: {
    cityIds: number[];
    nodeIds: number[];
    populationId: number;
    pathwayEntity: ReturnType<typeof createPathwayEntity>;
    pathwayCleanup: ReturnType<typeof createCleanupHelper>;
    pathwayOptionCleanup: ReturnType<typeof createCleanupHelper>;
  };

  beforeEach(async () => {
    // Create cleanup helpers for each test
    const pathwayCleanup = createCleanupHelper(
      ({ id }) => pathwayRepository.forceDelete(id),
      'pathway',
    );

    const pathwayOptionCleanup = createCleanupHelper(
      ({ id }) => pathwayOptionRepository.delete(id),
      'pathway option',
    );
    // Create test dependencies using factories (now with improved randomness)
    const testPopulation = await populationFactory(factoryDb).create({
      code: createUniqueCode('TPOP', 3),
      description: 'Test population for pathway entity',
      active: true,
    });
    const populationId = testPopulation.id;

    // Create test cities using factories
    const cities = await Promise.all([
      cityFactory(factoryDb).create({
        name: createUniqueName('Test City 1', testSuiteId),
      }),
      cityFactory(factoryDb).create({
        name: createUniqueName('Test City 2', testSuiteId),
      }),
    ]);
    const cityIds = cities.map((city) => city.id);

    // Create test nodes using repository directly (hybrid strategy for transaction visibility)
    const originNode = await nodeRepository.create({
      code: createUniqueCode('TN1', 3),
      name: createUniqueName('Test Node 1', testSuiteId),
      cityId: cityIds[0],
      latitude: 19.4326,
      longitude: -99.1332,
      radius: 1000,
      slug: createUniqueNodeSlug('Test Node 1', testSuiteId),
      populationId: populationId,
      allowsBoarding: true,
      allowsAlighting: true,
      active: true,
    });

    const destinationNode = await nodeRepository.create({
      code: createUniqueCode('TN2', 3),
      name: createUniqueName('Test Node 2', testSuiteId),
      cityId: cityIds[1],
      latitude: 20.4326,
      longitude: -100.1332,
      radius: 1000,
      slug: createUniqueNodeSlug('Test Node 2', testSuiteId),
      populationId: populationId,
      allowsBoarding: true,
      allowsAlighting: true,
      active: true,
    });

    const nodeIds = [originNode.id, destinationNode.id];

    // Create pathway entity with repositories
    const pathwayOptionRepo = {
      ...pathwayOptionRepository,
      findByPathwayId: (pathwayId: number) =>
        pathwayOptionRepository.findAllBy(pathwayOptions.pathwayId, pathwayId),
    };

    const pathwayEntity = createPathwayEntity({
      pathwaysRepository: pathwayRepository,
      pathwayOptionsRepository: pathwayOptionRepo,
      nodesRepository: nodeRepository,
    });

    testData = {
      cityIds,
      nodeIds,
      populationId,
      pathwayEntity,
      pathwayCleanup,
      pathwayOptionCleanup,
    };
  });

  afterEach(async () => {
    if (testData) {
      // Clean up in dependency order
      await testData.pathwayOptionCleanup.cleanupAll();
      await testData.pathwayCleanup.cleanupAll();

      // Clean up nodes (created by repository)
      for (const nodeId of testData.nodeIds) {
        try {
          await nodeRepository.forceDelete(nodeId);
        } catch (error) {
          console.log('Error cleaning up test node:', error);
        }
      }

      // Clean up entities in dependency order (reverse of creation)
      try {
        await populationRepository.forceDelete(testData.populationId);
      } catch (error) {
        console.log('Error cleaning up test population:', error);
      }

      // Cities are cleaned up automatically by factories
    }
  });

  describe('create', () => {
    it('should create a pathway entity with valid payload', () => {
      const validPayload = {
        originNodeId: testData.nodeIds[0],
        destinationNodeId: testData.nodeIds[1],
        name: 'Test Pathway',
        code: 'TEST-001',
        description: 'Test description',
        isSellable: true,
        isEmptyTrip: false,
        active: false,
      };

      const pathway = testData.pathwayEntity.create(validPayload);

      expect(pathway.name).toBe('Test Pathway');
      expect(pathway.code).toBe('TEST-001');
      expect(pathway.active).toBe(false); // Always inactive
      expect(pathway.isPersisted).toBe(false);
    });

    it('should provide direct access to pathway properties', () => {
      const validPayload = {
        originNodeId: testData.nodeIds[0],
        destinationNodeId: testData.nodeIds[1],
        name: 'Test Pathway',
        code: 'TEST-001',
        description: 'Test description',
        isSellable: true,
        isEmptyTrip: false,
        active: false,
      };

      const pathway = testData.pathwayEntity.create(validPayload);

      // Test direct property access (not pathway.data.name)
      expect(pathway.originNodeId).toBe(testData.nodeIds[0]);
      expect(pathway.destinationNodeId).toBe(testData.nodeIds[1]);
      expect(pathway.isSellable).toBe(true);
      expect(pathway.isEmptyTrip).toBe(false);
    });

    it('should throw validation error when origin equals destination', () => {
      const invalidPayload = {
        originNodeId: testData.nodeIds[0],
        destinationNodeId: testData.nodeIds[0], // Same as origin
        name: 'Test Pathway',
        code: 'TEST-001',
        description: 'Test description',
        isSellable: true,
        isEmptyTrip: false,
        active: false,
      };

      expect(() => testData.pathwayEntity.create(invalidPayload)).toThrow(
        FieldValidationError,
      );
    });

    it('should throw validation error when empty trip is sellable', () => {
      const invalidPayload = {
        originNodeId: testData.nodeIds[0],
        destinationNodeId: testData.nodeIds[1],
        name: 'Test Pathway',
        code: 'TEST-001',
        description: 'Test description',
        isSellable: true, // Invalid combination
        isEmptyTrip: true,
        active: false,
      };

      expect(() => testData.pathwayEntity.create(invalidPayload)).toThrow(
        FieldValidationError,
      );
    });

    it('should set default values correctly', () => {
      const minimalPayload = {
        originNodeId: testData.nodeIds[0],
        destinationNodeId: testData.nodeIds[1],
        name: 'Test Pathway',
        code: 'TEST-001',
      };

      const pathway = testData.pathwayEntity.create(minimalPayload);

      expect(pathway.description).toBe(null);
      expect(pathway.isSellable).toBe(false);
      expect(pathway.isEmptyTrip).toBe(false);
      expect(pathway.active).toBe(false);
    });
  });

  describe('save', () => {
    it('should save pathway to database and mark as persisted', async () => {
      const pathway = testData.pathwayEntity.create({
        originNodeId: testData.nodeIds[0],
        destinationNodeId: testData.nodeIds[1],
        name: createUniqueName('Test Pathway for Save', testSuiteId),
        code: createUniqueCode('TEST-SAVE', 3),
      });

      expect(pathway.isPersisted).toBe(false);
      expect(pathway.id).toBeUndefined();

      const savedPathway = await pathway.save();
      if (savedPathway.id) {
        testData.pathwayCleanup.track(savedPathway.id);
      }

      expect(savedPathway.isPersisted).toBe(true);
      expect(savedPathway.id).toBeDefined();
      expect(savedPathway.name).toContain('Test Pathway for Save');
    });

    it('should correctly assign city IDs from nodes when saving', async () => {
      const pathway = testData.pathwayEntity.create({
        originNodeId: testData.nodeIds[0],
        destinationNodeId: testData.nodeIds[1],
        name: createUniqueName('Test City Assignment', testSuiteId),
        code: createUniqueCode('TEST-CITIES', 3),
      });

      const savedPathway = await pathway.save();
      if (savedPathway.id) {
        testData.pathwayCleanup.track(savedPathway.id);
      }
      const pathwayData = savedPathway.toPathway();

      // Verify that city IDs were correctly assigned from the nodes
      expect(pathwayData.originCityId).toBe(testData.cityIds[0]);
      expect(pathwayData.destinationCityId).toBe(testData.cityIds[1]);
      expect(pathwayData.originNodeId).toBe(testData.nodeIds[0]);
      expect(pathwayData.destinationNodeId).toBe(testData.nodeIds[1]);
    });

    it('should return same instance when saving already persisted pathway', async () => {
      const pathway = testData.pathwayEntity.create({
        originNodeId: testData.nodeIds[0],
        destinationNodeId: testData.nodeIds[1],
        name: createUniqueName('Test Same Instance', testSuiteId),
        code: createUniqueCode('TEST-SAME', 3),
      });

      const savedPathway = await pathway.save();
      if (savedPathway.id) {
        testData.pathwayCleanup.track(savedPathway.id);
      }

      // Save again - should return same data (not necessarily same instance)
      const savedAgain = await savedPathway.save();

      expect(savedAgain.id).toBe(savedPathway.id);
      expect(savedAgain.name).toBe(savedPathway.name);
      expect(savedAgain.code).toBe(savedPathway.code);
    });
  });

  describe('business rules validation', () => {
    it('should enforce empty trip cannot be sellable rule', () => {
      const invalidPayload = {
        originNodeId: testData.nodeIds[0],
        destinationNodeId: testData.nodeIds[1],
        name: 'Test Pathway',
        code: 'TEST-001',
        isEmptyTrip: true,
        isSellable: true, // This should fail
      };

      expect(() => testData.pathwayEntity.create(invalidPayload)).toThrow(
        FieldValidationError,
      );
    });

    it('should enforce origin and destination must be different rule', () => {
      const invalidPayload = {
        originNodeId: testData.nodeIds[0],
        destinationNodeId: testData.nodeIds[0], // Same as origin
        name: 'Test Pathway',
        code: 'TEST-001',
      };

      expect(() => testData.pathwayEntity.create(invalidPayload)).toThrow(
        FieldValidationError,
      );
    });
  });

  describe('fromData', () => {
    it('should create entity from existing pathway data', async () => {
      // First create and save a pathway to get complete data
      const pathway = testData.pathwayEntity.create({
        originNodeId: testData.nodeIds[0],
        destinationNodeId: testData.nodeIds[1],
        name: createUniqueName('Test From Data', testSuiteId),
        code: createUniqueCode('TEST-FROM', 3),
      });

      const savedPathway = await pathway.save();
      if (savedPathway.id) {
        testData.pathwayCleanup.track(savedPathway.id);
      }
      const pathwayData = savedPathway.toPathway();

      // Now create entity from the data
      const entityFromData = testData.pathwayEntity.fromData(pathwayData);

      expect(entityFromData.id).toBe(pathwayData.id);
      expect(entityFromData.name).toBe(pathwayData.name);
      expect(entityFromData.code).toBe(pathwayData.code);
      expect(entityFromData.isPersisted).toBe(true);
    });

    it('should create entity from minimal pathway data', () => {
      const minimalPathwayData = {
        id: 999,
        originNodeId: testData.nodeIds[0],
        destinationNodeId: testData.nodeIds[1],
        originCityId: testData.cityIds[0],
        destinationCityId: testData.cityIds[1],
        name: 'Minimal Pathway',
        code: 'MIN-001',
        description: null,
        isSellable: false,
        isEmptyTrip: false,
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const entityFromData =
        testData.pathwayEntity.fromData(minimalPathwayData);

      expect(entityFromData.id).toBe(999);
      expect(entityFromData.name).toBe('Minimal Pathway');
      expect(entityFromData.code).toBe('MIN-001');
      expect(entityFromData.isPersisted).toBe(true);
    });
  });
});
