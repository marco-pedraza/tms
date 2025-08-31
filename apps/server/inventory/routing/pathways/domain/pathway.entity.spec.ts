import { schema } from '@/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { cityRepository } from '@/inventory/locations/cities/cities.repository';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import { populationRepository } from '@/inventory/locations/populations/populations.repository';
import { cityFactory, nodeFactory, populationFactory } from '@/tests/factories';
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
  let testCityIds: number[];
  let testNodeIds: number[];
  let testPopulationId: number;
  let pathwayEntity: ReturnType<typeof createPathwayEntity>;

  // Cleanup helpers
  const pathwayCleanup = createCleanupHelper(
    ({ id }) => pathwayRepository.forceDelete(id),
    'pathway',
  );

  const pathwayOptionCleanup = createCleanupHelper(
    ({ id }) => pathwayOptionRepository.delete(id),
    'pathway option',
  );

  beforeAll(async () => {
    // Create test population first
    const testPopulation = await populationFactory(factoryDb).create({
      code: createUniqueCode('TPOP', 3),
      description: 'Test population for pathway entity',
      active: true,
    });
    testPopulationId = testPopulation.id;

    // Create test cities using factories
    const cities = await Promise.all([
      cityFactory(factoryDb).create({
        name: createUniqueName('Test City 1', testSuiteId),
        latitude: 19.4326,
        longitude: -99.1332,
        timezone: 'America/Mexico_City',
      }),
      cityFactory(factoryDb).create({
        name: createUniqueName('Test City 2', testSuiteId),
        latitude: 20.4326,
        longitude: -100.1332,
        timezone: 'America/Mexico_City',
      }),
    ]);
    testCityIds = cities.map((city) => city.id);

    // Create test nodes using factories (same pattern as pathways.controller.spec.ts)
    const originNode = await nodeFactory(factoryDb).create({
      code: createUniqueCode('TN1', 3),
      name: createUniqueName('Test Node 1', testSuiteId),
      cityId: testCityIds[0],
      latitude: 19.4326,
      longitude: -99.1332,
      radius: 1000,
      populationId: testPopulationId,
    });

    const destinationNode = await nodeFactory(factoryDb).create({
      code: createUniqueCode('TN2', 3),
      name: createUniqueName('Test Node 2', testSuiteId),
      cityId: testCityIds[1],
      latitude: 20.4326,
      longitude: -100.1332,
      radius: 1000,
      populationId: testPopulationId,
    });

    testNodeIds = [originNode.id, destinationNode.id];

    // Create pathway entity with repositories
    const pathwayOptionRepo = {
      ...pathwayOptionRepository,
      findByPathwayId: (pathwayId: number) =>
        pathwayOptionRepository.findAllBy(pathwayOptions.pathwayId, pathwayId),
    };

    pathwayEntity = createPathwayEntity({
      pathwaysRepository: pathwayRepository,
      pathwayOptionsRepository: pathwayOptionRepo,
      nodesRepository: nodeRepository,
    });
  });

  afterAll(async () => {
    // Clean up in dependency order (same pattern as pathways.controller.spec.ts)
    await pathwayOptionCleanup.cleanupAll();
    await pathwayCleanup.cleanupAll();

    // Clean up factory-created entities in dependency order
    for (const nodeId of testNodeIds) {
      try {
        await db.delete(schema.nodes).where(eq(schema.nodes.id, nodeId));
      } catch (error) {
        console.log('Error cleaning up test node:', error);
      }
    }

    if (testPopulationId) {
      try {
        await populationRepository.forceDelete(testPopulationId);
      } catch (error) {
        console.log('Error cleaning up test population:', error);
      }
    }

    for (const cityId of testCityIds) {
      try {
        await cityRepository.forceDelete(cityId);
      } catch (error) {
        console.log('Error cleaning up test city:', error);
      }
    }
  });

  describe('create', () => {
    it('should create a pathway entity with valid payload', () => {
      const validPayload = {
        originNodeId: testNodeIds[0],
        destinationNodeId: testNodeIds[1],
        name: 'Test Pathway',
        code: 'TEST-001',
        description: 'Test description',
        isSellable: true,
        isEmptyTrip: false,
        active: false,
      };

      const pathway = pathwayEntity.create(validPayload);

      expect(pathway.name).toBe('Test Pathway');
      expect(pathway.code).toBe('TEST-001');
      expect(pathway.active).toBe(false); // Always inactive
      expect(pathway.isPersisted).toBe(false);
    });

    it('should provide direct access to pathway properties', () => {
      const validPayload = {
        originNodeId: testNodeIds[0],
        destinationNodeId: testNodeIds[1],
        name: 'Test Pathway',
        code: 'TEST-001',
        description: 'Test description',
        isSellable: true,
        isEmptyTrip: false,
        active: false,
      };

      const pathway = pathwayEntity.create(validPayload);

      // Test direct property access (not pathway.data.name)
      expect(pathway.originNodeId).toBe(testNodeIds[0]);
      expect(pathway.destinationNodeId).toBe(testNodeIds[1]);
      expect(pathway.isSellable).toBe(true);
      expect(pathway.isEmptyTrip).toBe(false);
    });

    it('should throw validation error when origin equals destination', () => {
      const invalidPayload = {
        originNodeId: testNodeIds[0],
        destinationNodeId: testNodeIds[0], // Same as origin
        name: 'Test Pathway',
        code: 'TEST-001',
        description: 'Test description',
        isSellable: true,
        isEmptyTrip: false,
        active: false,
      };

      expect(() => pathwayEntity.create(invalidPayload)).toThrow(
        FieldValidationError,
      );
    });

    it('should throw validation error when empty trip is sellable', () => {
      const invalidPayload = {
        originNodeId: testNodeIds[0],
        destinationNodeId: testNodeIds[1],
        name: 'Test Pathway',
        code: 'TEST-001',
        description: 'Test description',
        isSellable: true, // Invalid combination
        isEmptyTrip: true,
        active: false,
      };

      expect(() => pathwayEntity.create(invalidPayload)).toThrow(
        FieldValidationError,
      );
    });

    it('should set default values correctly', () => {
      const minimalPayload = {
        originNodeId: testNodeIds[0],
        destinationNodeId: testNodeIds[1],
        name: 'Test Pathway',
        code: 'TEST-001',
      };

      const pathway = pathwayEntity.create(minimalPayload);

      expect(pathway.description).toBe(null);
      expect(pathway.isSellable).toBe(false);
      expect(pathway.isEmptyTrip).toBe(false);
      expect(pathway.active).toBe(false);
    });
  });

  describe('save', () => {
    it('should save pathway to database and mark as persisted', async () => {
      const pathway = pathwayEntity.create({
        originNodeId: testNodeIds[0],
        destinationNodeId: testNodeIds[1],
        name: createUniqueName('Test Pathway for Save', testSuiteId),
        code: createUniqueCode('TEST-SAVE', 3),
      });

      expect(pathway.isPersisted).toBe(false);
      expect(pathway.id).toBeUndefined();

      const savedPathway = await pathway.save();
      if (savedPathway.id) {
        pathwayCleanup.track(savedPathway.id);
      }

      expect(savedPathway.isPersisted).toBe(true);
      expect(savedPathway.id).toBeDefined();
      expect(savedPathway.name).toContain('Test Pathway for Save');
    });

    it('should correctly assign city IDs from nodes when saving', async () => {
      const pathway = pathwayEntity.create({
        originNodeId: testNodeIds[0],
        destinationNodeId: testNodeIds[1],
        name: createUniqueName('Test City Assignment', testSuiteId),
        code: createUniqueCode('TEST-CITIES', 3),
      });

      const savedPathway = await pathway.save();
      if (savedPathway.id) {
        pathwayCleanup.track(savedPathway.id);
      }
      const pathwayData = savedPathway.toPathway();

      // Verify that city IDs were correctly assigned from the nodes
      expect(pathwayData.originCityId).toBe(testCityIds[0]);
      expect(pathwayData.destinationCityId).toBe(testCityIds[1]);
      expect(pathwayData.originNodeId).toBe(testNodeIds[0]);
      expect(pathwayData.destinationNodeId).toBe(testNodeIds[1]);
    });

    it('should return same instance when saving already persisted pathway', async () => {
      const pathway = pathwayEntity.create({
        originNodeId: testNodeIds[0],
        destinationNodeId: testNodeIds[1],
        name: createUniqueName('Test Same Instance', testSuiteId),
        code: createUniqueCode('TEST-SAME', 3),
      });

      const savedPathway = await pathway.save();
      if (savedPathway.id) {
        pathwayCleanup.track(savedPathway.id);
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
        originNodeId: testNodeIds[0],
        destinationNodeId: testNodeIds[1],
        name: 'Test Pathway',
        code: 'TEST-001',
        isEmptyTrip: true,
        isSellable: true, // This should fail
      };

      expect(() => pathwayEntity.create(invalidPayload)).toThrow(
        FieldValidationError,
      );
    });

    it('should enforce origin and destination must be different rule', () => {
      const invalidPayload = {
        originNodeId: testNodeIds[0],
        destinationNodeId: testNodeIds[0], // Same as origin
        name: 'Test Pathway',
        code: 'TEST-001',
      };

      expect(() => pathwayEntity.create(invalidPayload)).toThrow(
        FieldValidationError,
      );
    });
  });

  describe('fromData', () => {
    it('should create entity from existing pathway data', async () => {
      // First create and save a pathway to get complete data
      const pathway = pathwayEntity.create({
        originNodeId: testNodeIds[0],
        destinationNodeId: testNodeIds[1],
        name: createUniqueName('Test From Data', testSuiteId),
        code: createUniqueCode('TEST-FROM', 3),
      });

      const savedPathway = await pathway.save();
      if (savedPathway.id) {
        pathwayCleanup.track(savedPathway.id);
      }
      const pathwayData = savedPathway.toPathway();

      // Now create entity from the data
      const entityFromData = pathwayEntity.fromData(pathwayData);

      expect(entityFromData.id).toBe(pathwayData.id);
      expect(entityFromData.name).toBe(pathwayData.name);
      expect(entityFromData.code).toBe(pathwayData.code);
      expect(entityFromData.isPersisted).toBe(true);
    });

    it('should create entity from minimal pathway data', () => {
      const minimalPathwayData = {
        id: 999,
        originNodeId: testNodeIds[0],
        destinationNodeId: testNodeIds[1],
        originCityId: testCityIds[0],
        destinationCityId: testCityIds[1],
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

      const entityFromData = pathwayEntity.fromData(minimalPathwayData);

      expect(entityFromData.id).toBe(999);
      expect(entityFromData.name).toBe('Minimal Pathway');
      expect(entityFromData.code).toBe('MIN-001');
      expect(entityFromData.isPersisted).toBe(true);
    });
  });
});
