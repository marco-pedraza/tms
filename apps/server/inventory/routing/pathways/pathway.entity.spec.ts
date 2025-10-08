import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { createSlug } from '@/shared/utils';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import { populationRepository } from '@/inventory/locations/populations/populations.repository';
import { tollboothRepository } from '@/inventory/locations/tollbooths/tollbooths.repository';
import { cityFactory, populationFactory } from '@/tests/factories';
import { getFactoryDb } from '@/tests/factories/factory-utils';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueCode,
  createUniqueName,
} from '@/tests/shared/test-utils';
import { pathwayOptionTollRepository } from '../pathway-options-tolls/pathway-options-tolls.repository';
import { createPathwayOptionEntity } from '../pathway-options/pathway-option.entity';
import { pathwayOptionRepository } from '../pathway-options/pathway-options.repository';
import { pathwayOptions } from '../pathway-options/pathway-options.schema';
import type { PathwayEntity } from './pathways.types';
import { pathwayRepository } from './pathways.repository';
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

    // Create pathway entity with repositories and factories
    const pathwayOptionRepo = {
      ...pathwayOptionRepository,
      findByPathwayId: (pathwayId: number) =>
        pathwayOptionRepository.findAllBy(pathwayOptions.pathwayId, pathwayId),
    };

    // Create pathway option entity factory
    const pathwayOptionEntityFactory = createPathwayOptionEntity({
      pathwayOptionsRepository: pathwayOptionRepo,
      pathwayOptionTollsRepository: pathwayOptionTollRepository,
      nodesRepository: nodeRepository,
      tollboothRepository,
    });

    const pathwayEntity = createPathwayEntity({
      pathwaysRepository: pathwayRepository,
      pathwayOptionsRepository: pathwayOptionRepo,
      nodesRepository: nodeRepository,
      pathwayOptionEntityFactory,
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
      // Clean up pathway options first (to avoid foreign key constraints)
      await testData.pathwayOptionCleanup.cleanupAll();

      // Clean up any remaining pathway options by pathway ID
      for (const pathwayId of testData.pathwayCleanup.getTrackedIds()) {
        try {
          const options = await pathwayOptionRepository.findAllBy(
            pathwayOptions.pathwayId,
            pathwayId,
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
      }

      // Clean up pathways
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

  describe('pathway options integration', () => {
    let savedPathway: PathwayEntity;

    beforeEach(async () => {
      // Create and save a pathway for option tests
      const pathway = testData.pathwayEntity.create({
        originNodeId: testData.nodeIds[0],
        destinationNodeId: testData.nodeIds[1],
        name: createUniqueName(
          'Test Pathway for Options',
          `${testSuiteId}-${Date.now()}`,
        ),
        code: createUniqueCode('TPO', 6),
        description: 'Test pathway for option operations',
        isSellable: true,
        isEmptyTrip: false,
        active: false,
      });

      savedPathway = await pathway.save();
      testData.pathwayCleanup.track(savedPathway.id as number);
    });

    describe('addOption', () => {
      it('should add option with automatic avgSpeed calculation', async () => {
        const optionData = {
          name: 'Test Option',
          description: 'Test option with metrics',
          distanceKm: 150,
          typicalTimeMin: 120,
          // avgSpeedKmh will be calculated automatically
          isPassThrough: false,
          active: true,
        };

        const updatedPathway = await savedPathway.addOption(optionData);
        const options = await updatedPathway.options;

        expect(options).toHaveLength(1);
        expect(options[0]?.name).toBe('Test Option');
        expect(options[0]?.distanceKm).toBe(150);
        expect(options[0]?.typicalTimeMin).toBe(120);
        expect(options[0]?.avgSpeedKmh).toBe(75); // (150 * 60) / 120 = 75
        expect(options[0]?.isDefault).toBe(true); // First option becomes default
        expect(options[0]?.active).toBe(true);

        // Cleanup
        if (options[0]) {
          testData.pathwayOptionCleanup.track(options[0].id);
        }
      });

      it('should validate required metrics when adding option', async () => {
        const optionData = {
          name: 'Invalid Option',
          distanceKm: undefined, // Missing required field
          typicalTimeMin: 120,
          isPassThrough: false,
          active: true,
        };

        await expect(savedPathway.addOption(optionData)).rejects.toThrow(
          FieldValidationError,
        );
      });

      it('should validate pass-through business rules when adding option', async () => {
        const optionData = {
          name: 'Pass-through Option',
          distanceKm: 150,
          typicalTimeMin: 120,
          isPassThrough: true,
          passThroughTimeMin: undefined, // Invalid: pass-through requires time
          active: true,
        };

        await expect(savedPathway.addOption(optionData)).rejects.toThrow(
          FieldValidationError,
        );
      });

      it('should validate default-active business rules when adding option', async () => {
        const optionData = {
          name: 'Default Inactive Option',
          distanceKm: 150,
          typicalTimeMin: 120,
          isDefault: true, // This will be set by business logic
          active: false, // Invalid: default options must be active
        };

        await expect(savedPathway.addOption(optionData)).rejects.toThrow(
          FieldValidationError,
        );
      });
    });

    describe('updateOption', () => {
      let optionId: number;

      beforeEach(async () => {
        // Add an option to update
        const updatedPathway = await savedPathway.addOption({
          name: 'Original Option',
          distanceKm: 100,
          typicalTimeMin: 60,
          isPassThrough: false,
          active: true,
        });

        const options = await updatedPathway.options;
        optionId = options[0]?.id as number;

        if (options[0]) {
          testData.pathwayOptionCleanup.track(options[0].id);
        }
      });

      it('should update option with automatic avgSpeed recalculation', async () => {
        const updateData = {
          name: 'Updated Option',
          distanceKm: 200,
          typicalTimeMin: 100,
        };

        const updatedPathway = await savedPathway.updateOption(
          optionId,
          updateData,
        );
        const options = await updatedPathway.options;

        expect(options).toHaveLength(1);
        expect(options[0]?.name).toBe('Updated Option');
        expect(options[0]?.distanceKm).toBe(200);
        expect(options[0]?.typicalTimeMin).toBe(100);
        expect(options[0]?.avgSpeedKmh).toBe(120); // (200 * 60) / 100 = 120
      });

      it('should validate metrics when updating option', async () => {
        const updateData = {
          distanceKm: 0, // Invalid: must be > 0
          typicalTimeMin: 100,
        };

        await expect(
          savedPathway.updateOption(optionId, updateData),
        ).rejects.toThrow(FieldValidationError);
      });

      it('should validate business rules when updating option', async () => {
        const updateData = {
          isPassThrough: true,
          passThroughTimeMin: undefined, // Invalid: pass-through requires time
        };

        await expect(
          savedPathway.updateOption(optionId, updateData),
        ).rejects.toThrow(FieldValidationError);
      });
    });

    describe('option validation integration', () => {
      it('should collect multiple validation errors at once', async () => {
        const optionData = {
          name: 'Invalid Option',
          distanceKm: undefined, // Error 1: missing distance
          typicalTimeMin: undefined, // Error 2: missing time
          isPassThrough: false,
          active: true,
        };

        try {
          await savedPathway.addOption(optionData);
          expect.fail('Should have thrown FieldValidationError');
        } catch (error) {
          expect(error).toBeInstanceOf(FieldValidationError);
          const fieldError = error as FieldValidationError;

          // Should have multiple field errors (distanceKm and typicalTimeMin)
          expect(fieldError.fieldErrors.length).toBe(2);

          // Check for specific field errors
          const fieldNames = fieldError.fieldErrors.map((e) => e.field);
          expect(fieldNames).toContain('distanceKm');
          expect(fieldNames).toContain('typicalTimeMin');
        }
      });

      it('should preserve avgSpeedKmh when provided explicitly', async () => {
        const optionData = {
          name: 'Custom Speed Option',
          distanceKm: 150,
          typicalTimeMin: 120,
          avgSpeedKmh: 80, // Explicit speed (different from calculated 75)
          isPassThrough: false,
          active: true,
        };

        const updatedPathway = await savedPathway.addOption(optionData);
        const options = await updatedPathway.options;

        expect(options[0]?.avgSpeedKmh).toBe(80); // Should preserve explicit value

        // Cleanup
        if (options[0]) {
          testData.pathwayOptionCleanup.track(options[0].id);
        }
      });
    });

    describe('pathway activation on first option', () => {
      it('should automatically activate pathway when adding first option', async () => {
        // Verify pathway starts as inactive
        expect(savedPathway.active).toBe(false);

        const optionData = {
          name: 'First Option',
          distanceKm: 150,
          typicalTimeMin: 120,
          isPassThrough: false,
          active: true,
        };

        const updatedPathway = await savedPathway.addOption(optionData);
        const options = await updatedPathway.options;

        // Verify pathway is now active
        expect(updatedPathway.active).toBe(true);
        expect(options).toHaveLength(1);
        expect(options[0]?.name).toBe('First Option');
        expect(options[0]?.isDefault).toBe(true);

        // Cleanup
        if (options[0]) {
          testData.pathwayOptionCleanup.track(options[0].id);
        }
      });

      it('should NOT change pathway status when adding second option', async () => {
        // Add first option (this will activate the pathway)
        const firstOptionData = {
          name: 'First Option',
          distanceKm: 150,
          typicalTimeMin: 120,
          isPassThrough: false,
          active: true,
        };

        let updatedPathway = await savedPathway.addOption(firstOptionData);
        let options = await updatedPathway.options;

        // Verify pathway is active after first option
        expect(updatedPathway.active).toBe(true);
        expect(options).toHaveLength(1);

        // Track first option for cleanup
        if (options[0]) {
          testData.pathwayOptionCleanup.track(options[0].id);
        }

        // Manually deactivate pathway to test that second option doesn't reactivate
        updatedPathway = await updatedPathway.update({ active: false });
        expect(updatedPathway.active).toBe(false);

        // Add second option
        const secondOptionData = {
          name: 'Second Option',
          distanceKm: 200,
          typicalTimeMin: 150,
          isPassThrough: false,
          active: true,
        };

        const finalPathway = await updatedPathway.addOption(secondOptionData);
        options = await finalPathway.options;

        // Verify pathway remains inactive (second option doesn't change status)
        expect(finalPathway.active).toBe(false);
        expect(options).toHaveLength(2);
        expect(options[1]?.name).toBe('Second Option');
        expect(options[1]?.isDefault).toBe(false);

        // Track second option for cleanup
        if (options[1]) {
          testData.pathwayOptionCleanup.track(options[1].id);
        }
      });

      it('should NOT change pathway status when adding third option', async () => {
        // Add first option
        let updatedPathway = await savedPathway.addOption({
          name: 'First Option',
          distanceKm: 150,
          typicalTimeMin: 120,
          isPassThrough: false,
          active: true,
        });

        let options = await updatedPathway.options;
        if (options[0]) {
          testData.pathwayOptionCleanup.track(options[0].id);
        }

        // Add second option
        updatedPathway = await updatedPathway.addOption({
          name: 'Second Option',
          distanceKm: 200,
          typicalTimeMin: 150,
          isPassThrough: false,
          active: true,
        });

        options = await updatedPathway.options;
        if (options[1]) {
          testData.pathwayOptionCleanup.track(options[1].id);
        }

        // Manually deactivate pathway
        updatedPathway = await updatedPathway.update({ active: false });
        expect(updatedPathway.active).toBe(false);

        // Add third option
        const finalPathway = await updatedPathway.addOption({
          name: 'Third Option',
          distanceKm: 250,
          typicalTimeMin: 180,
          isPassThrough: false,
          active: true,
        });

        options = await finalPathway.options;

        // Verify pathway remains inactive (third option doesn't change status)
        expect(finalPathway.active).toBe(false);
        expect(options).toHaveLength(3);

        // Track third option for cleanup
        if (options[2]) {
          testData.pathwayOptionCleanup.track(options[2].id);
        }
      });

      it('should persist activation status in database', async () => {
        // Add first option to activate pathway
        const updatedPathway = await savedPathway.addOption({
          name: 'First Option',
          distanceKm: 150,
          typicalTimeMin: 120,
          isPassThrough: false,
          active: true,
        });

        const options = await updatedPathway.options;
        if (options[0]) {
          testData.pathwayOptionCleanup.track(options[0].id);
        }

        // Verify in-memory state
        expect(updatedPathway.active).toBe(true);

        // Re-fetch from database to verify persistence
        const refetchedPathway = await testData.pathwayEntity.findOne(
          savedPathway.id as number,
        );

        expect(refetchedPathway.active).toBe(true);
        expect(refetchedPathway.id).toBe(savedPathway.id);
      });
    });
  });
});
