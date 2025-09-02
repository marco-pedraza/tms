import { schema } from '@/db';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { db } from '@/inventory/db-service';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import { populationRepository } from '@/inventory/locations/populations/populations.repository';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueEntity,
} from '@/tests/shared/test-utils';
import { cityFactory, populationFactory } from '@/factories';
import { getFactoryDb } from '@/factories/factory-utils';
import { pathwayOptionRepository } from '../pathway-options/pathway-options.repository';
import type {
  CreatePathwayPayload,
  Pathway,
  UpdatePathwayPayload,
} from './pathways.types';
import { pathwayRepository } from './pathways.repository';
import {
  addOptionToPathway,
  createPathway,
  deletePathway,
  getPathway,
  listPathways,
  listPathwaysPaginated,
  removeOptionFromPathway,
  updatePathway,
  updatePathwayOption,
} from './pathways.controller';

/**
 * Test data interface for consistent test setup
 */
interface TestData {
  suiteId: string;
  factoryDb: ReturnType<typeof getFactoryDb>;
  cityId: number;
  populationId: number;
  originNodeId: number;
  destinationNodeId: number;
  pathwayCleanup: ReturnType<typeof createCleanupHelper>;
  populationCleanup: ReturnType<typeof createCleanupHelper>;
  nodeCleanup: ReturnType<typeof createCleanupHelper>;
  createdPathwayIds: number[];
}

describe('Pathways Controller', () => {
  // Tests that don't need test data - no beforeEach/afterEach
  describe('error scenarios', () => {
    test('should handle pathway not found', async () => {
      await expect(getPathway({ id: 999999 })).rejects.toThrow();
    });

    test('should handle pathway not found on update', async () => {
      const updateData: UpdatePathwayPayload = {
        name: 'Non-existent Pathway',
      };

      await expect(
        updatePathway({ id: 999999, ...updateData }),
      ).rejects.toThrow();
    });

    test('should handle pathway not found for option operations', async () => {
      const optionData = {
        name: 'Test Option',
        description: 'Test option',
        typicalTimeMin: 30,
        distanceKm: 100,
        active: true,
      };

      await expect(
        addOptionToPathway({
          pathwayId: 999999,
          optionData,
        }),
      ).rejects.toThrow();
    });
  });

  describe('business rule error propagation', () => {
    test('should propagate validation error for same origin and destination', async () => {
      const invalidPayload: CreatePathwayPayload = {
        name: 'Invalid Pathway',
        code: 'INV001',
        description: 'Same origin and destination',
        originNodeId: 1,
        destinationNodeId: 1, // Same as origin
        active: false,
        isSellable: false,
        isEmptyTrip: false,
      };

      await expect(createPathway(invalidPayload)).rejects.toThrow();
    });

    test('should propagate validation error for sellable empty trip', async () => {
      const invalidPayload: CreatePathwayPayload = {
        name: 'Invalid Pathway',
        code: 'INV002',
        description: 'Empty trip pathway marked as sellable',
        originNodeId: 1,
        destinationNodeId: 2,
        active: false,
        isSellable: true, // Invalid: empty trip cannot be sellable
        isEmptyTrip: true,
      };

      await expect(createPathway(invalidPayload)).rejects.toThrow();
    });

    test('should propagate validation error for activation without options', async () => {
      const invalidPayload: CreatePathwayPayload = {
        name: 'Invalid Pathway',
        code: 'INV003',
        description: 'Active without options',
        originNodeId: 1,
        destinationNodeId: 2,
        active: true, // Invalid: active but no options
        isSellable: false,
        isEmptyTrip: false,
      };

      await expect(createPathway(invalidPayload)).rejects.toThrow();
    });

    test('should propagate validation error for non-existent nodes', async () => {
      const invalidPayload: CreatePathwayPayload = {
        name: 'Invalid Pathway',
        code: 'INV004',
        description: 'Non-existent nodes',
        originNodeId: 999999, // Non-existent
        destinationNodeId: 999998, // Non-existent
        active: false,
        isSellable: false,
        isEmptyTrip: false,
      };

      await expect(createPathway(invalidPayload)).rejects.toThrow();
    });

    test('should propagate validation error when updating with invalid nodes', async () => {
      const invalidUpdateData: UpdatePathwayPayload = {
        originNodeId: 999999, // Non-existent
        destinationNodeId: 999998, // Non-existent
      };

      await expect(
        updatePathway({ id: 1, ...invalidUpdateData }),
      ).rejects.toThrow();
    });
  });

  // Tests that need test data - with beforeEach/afterEach
  describe('operations requiring test data', () => {
    let testData: TestData;

    /**
     * Creates fresh test data for each test to ensure isolation
     */
    async function createTestData(): Promise<TestData> {
      const suiteId = createTestSuiteId('pathways-controller');
      const factoryDb = getFactoryDb(db);

      // Create cleanup helpers
      const pathwayCleanup = createCleanupHelper(async ({ id }) => {
        // First delete pathway options to avoid foreign key constraint
        try {
          await db
            .delete(schema.pathwayOptions)
            .where(eq(schema.pathwayOptions.pathwayId, id));
        } catch {
          // Ignore cleanup errors for pathway options
        }
        // Then delete the pathway
        return pathwayRepository.forceDelete(id);
      }, 'pathway');

      const populationCleanup = createCleanupHelper(
        ({ id }) => populationRepository.forceDelete(id),
        'population',
      );

      const nodeCleanup = createCleanupHelper(({ id }) => {
        return db.delete(schema.nodes).where(eq(schema.nodes.id, id));
      }, 'node');

      // Create test dependencies using hybrid strategy:
      // - Factories for cities/states/countries (now with improved randomness)
      // - Repository direct for nodes (to ensure transaction visibility)
      const testCity = await cityFactory(factoryDb).create({
        name: createUniqueEntity({ baseName: 'Test City', suiteId }).name,
      });
      const cityId = testCity.id;

      const populationEntity = createUniqueEntity({
        baseName: 'Test Population',
        baseCode: 'TPOP',
        suiteId,
      });

      const testPopulation = await populationFactory(factoryDb).create({
        code: populationEntity.code || 'TPOP001',
        description: 'Test population for pathways',
        active: true,
      });
      const populationId = populationCleanup.track(testPopulation.id);

      // Create origin and destination nodes using repository directly (hybrid strategy for transaction visibility)
      const originNodeEntity = createUniqueEntity({
        baseName: 'Origin Node',
        baseCode: 'ORG',
        suiteId,
      });

      const originNode = await nodeRepository.create({
        code: originNodeEntity.code || 'ORG001',
        name: originNodeEntity.name,
        latitude: 19.4326,
        longitude: -99.1332,
        radius: 1000,
        slug: `${originNodeEntity.name.toLowerCase().replace(/\s+/g, '-')}-${suiteId}`,
        cityId,
        populationId,
        allowsBoarding: true,
        allowsAlighting: true,
        active: true,
      });
      const originNodeId = nodeCleanup.track(originNode.id);

      const destinationNodeEntity = createUniqueEntity({
        baseName: 'Destination Node',
        baseCode: 'DST',
        suiteId,
      });

      const destinationNode = await nodeRepository.create({
        code: destinationNodeEntity.code || 'DST001',
        name: destinationNodeEntity.name,
        latitude: 19.5326,
        longitude: -99.2332,
        radius: 1000,
        slug: `${destinationNodeEntity.name.toLowerCase().replace(/\s+/g, '-')}-${suiteId}`,
        cityId,
        populationId,
        allowsBoarding: true,
        allowsAlighting: true,
        active: true,
      });
      const destinationNodeId = nodeCleanup.track(destinationNode.id);

      return {
        suiteId,
        factoryDb,
        cityId,
        populationId,
        originNodeId,
        destinationNodeId,
        pathwayCleanup,
        populationCleanup,
        nodeCleanup,
        createdPathwayIds: [],
      };
    }

    /**
     * Cleans up test data after each test
     */
    async function cleanupTestData(data: TestData): Promise<void> {
      // First, clean up pathway options by removing them from pathways
      for (const pathwayId of data.createdPathwayIds) {
        try {
          await db
            .delete(schema.pathwayOptions)
            .where(eq(schema.pathwayOptions.pathwayId, pathwayId));
        } catch {
          // Ignore cleanup errors
        }
      }

      // Clean up in dependency order (reverse of creation)
      await data.pathwayCleanup.cleanupAll();
      await data.nodeCleanup.cleanupAll();
      await data.populationCleanup.cleanupAll();
      // Cities are cleaned up automatically by factories
    }

    /**
     * Creates a test pathway with unique data
     */
    async function createTestPathway(
      data: TestData,
      overrides: Partial<CreatePathwayPayload> = {},
    ): Promise<Pathway> {
      const pathwayEntity = createUniqueEntity({
        baseName: 'Test Pathway',
        baseCode: 'TP',
        suiteId: data.suiteId,
      });

      const pathwayData: CreatePathwayPayload = {
        originNodeId: data.originNodeId,
        destinationNodeId: data.destinationNodeId,
        name: pathwayEntity.name,
        code: pathwayEntity.code || 'TP001',
        description: 'Test pathway for controller tests',
        isSellable: true,
        isEmptyTrip: false,
        ...overrides,
      };

      const result = await createPathway(pathwayData);

      // Track for cleanup
      data.pathwayCleanup.track(result.id);
      data.createdPathwayIds.push(result.id);

      return result;
    }

    beforeEach(async () => {
      testData = await createTestData();
    });

    afterEach(async () => {
      await cleanupTestData(testData);
    });

    describe('CRUD operations', () => {
      test('should create a pathway successfully', async () => {
        const result = await createTestPathway(testData);

        expect(result).toBeDefined();
        expect(result.id).toBeTypeOf('number');
        expect(result.name).toContain('Test Pathway');
        expect(result.code).toContain('TP');
        expect(result.originNodeId).toBe(testData.originNodeId);
        expect(result.destinationNodeId).toBe(testData.destinationNodeId);
        expect(result.originCityId).toBe(testData.cityId);
        expect(result.destinationCityId).toBe(testData.cityId);
        expect(result.isSellable).toBe(true);
        expect(result.isEmptyTrip).toBe(false);
        expect(result.active).toBe(false); // Pathways are created as inactive by default
      });

      test('should get a pathway by ID', async () => {
        const createdPathway = await createTestPathway(testData);

        const result = await getPathway({ id: createdPathway.id });

        expect(result).toBeDefined();
        expect(result.id).toBe(createdPathway.id);
        expect(result.name).toBe(createdPathway.name);
      });

      test('should update a pathway', async () => {
        const createdPathway = await createTestPathway(testData);

        const updateEntity = createUniqueEntity({
          baseName: 'Updated Pathway',
          suiteId: testData.suiteId,
        });

        const updateData: UpdatePathwayPayload = {
          name: updateEntity.name,
          description: 'Updated description',
          active: false,
        };

        const result = await updatePathway({
          id: createdPathway.id,
          ...updateData,
        });

        expect(result).toBeDefined();
        expect(result.id).toBe(createdPathway.id);
        expect(result.name).toBe(updateData.name);
        expect(result.description).toBe(updateData.description);
        expect(result.active).toBe(updateData.active);
      });

      test('should list pathways without pagination', async () => {
        const createdPathway = await createTestPathway(testData);

        const result = await listPathways({});

        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);

        const foundPathway = result.data.find(
          (p: Pathway) => p.id === createdPathway.id,
        );
        expect(foundPathway).toBeDefined();
      });

      test('should list pathways with pagination', async () => {
        await createTestPathway(testData);

        const result = await listPathwaysPaginated({
          page: 1,
          pageSize: 10,
        });

        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.pagination).toBeDefined();
        expect(result.pagination.currentPage).toBe(1);
        expect(result.pagination.pageSize).toBe(10);
      });
    });

    describe('pathway options operations', () => {
      test('should add an option to pathway', async () => {
        const createdPathway = await createTestPathway(testData);

        const optionEntity = createUniqueEntity({
          baseName: 'Test Option',
          suiteId: testData.suiteId,
        });

        const optionData = {
          name: optionEntity.name,
          description: 'Test option for pathway',
          typicalTimeMin: 30,
          distanceKm: 100,
          active: true,
        };

        const result = await addOptionToPathway({
          pathwayId: createdPathway.id,
          optionData,
        });

        expect(result).toBeDefined();
        expect(result.id).toBe(createdPathway.id);

        // Verify option was added by querying the options repository directly
        const createdOptions = await pathwayOptionRepository.findByPathwayId(
          createdPathway.id,
        );
        expect(createdOptions).toBeDefined();
        expect(createdOptions.length).toBe(1);

        const createdOption = createdOptions[0];
        expect(createdOption).toBeDefined();
        expect(createdOption.name).toBe(optionData.name);
        expect(createdOption.description).toBe(optionData.description);
        expect(createdOption.typicalTimeMin).toBe(optionData.typicalTimeMin);
        expect(createdOption.distanceKm).toBe(optionData.distanceKm);
        expect(createdOption.active).toBe(optionData.active);
        expect(createdOption.pathwayId).toBe(createdPathway.id);
      });

      test('should remove an option from pathway', async () => {
        const createdPathway = await createTestPathway(testData);

        const firstOptionEntity = createUniqueEntity({
          baseName: 'First Option',
          suiteId: testData.suiteId,
        });

        const secondOptionEntity = createUniqueEntity({
          baseName: 'Option to Remove',
          suiteId: testData.suiteId,
        });

        // Add first option (will become default)
        await addOptionToPathway({
          pathwayId: createdPathway.id,
          optionData: {
            name: firstOptionEntity.name,
            description: 'First option (will be default)',
            typicalTimeMin: 30,
            distanceKm: 100,
            active: true,
          },
        });

        // Add second option (will not be default)
        await addOptionToPathway({
          pathwayId: createdPathway.id,
          optionData: {
            name: secondOptionEntity.name,
            description: 'Option that will be removed',
            typicalTimeMin: 45,
            distanceKm: 150,
            active: true,
          },
        });

        // Get the options to find the second one (non-default)
        const options = await pathwayOptionRepository.findByPathwayId(
          createdPathway.id,
        );
        const optionToRemove = options.find(
          (opt) => opt.name === secondOptionEntity.name,
        );

        expect(optionToRemove).toBeDefined();
        expect(optionToRemove?.isDefault).toBe(false); // Should not be default

        // Now remove the non-default option
        const result = await removeOptionFromPathway({
          pathwayId: createdPathway.id,
          optionId: optionToRemove?.id as number,
        });

        expect(result).toBeDefined();
        expect(result.id).toBe(createdPathway.id);
      });

      test('should update a pathway option', async () => {
        const createdPathway = await createTestPathway(testData);

        const optionEntity = createUniqueEntity({
          baseName: 'Option to Update',
          suiteId: testData.suiteId,
        });

        // First add an option to update
        const optionData = {
          name: optionEntity.name,
          description: 'Option that will be updated',
          typicalTimeMin: 60,
          distanceKm: 200,
          active: true,
        };

        await addOptionToPathway({
          pathwayId: createdPathway.id,
          optionData,
        });

        // Get the option to update
        const options = await pathwayOptionRepository.findByPathwayId(
          createdPathway.id,
        );
        const optionToUpdate = options.find(
          (opt) => opt.name === optionData.name,
        );

        expect(optionToUpdate).toBeDefined();

        // Update the option
        const updateEntity = createUniqueEntity({
          baseName: 'Updated Option',
          suiteId: testData.suiteId,
        });

        const updateData = {
          name: updateEntity.name,
          description: 'Updated description',
          typicalTimeMin: 90,
        };

        const result = await updatePathwayOption({
          pathwayId: createdPathway.id,
          optionId: optionToUpdate?.id as number,
          optionData: updateData,
        });

        expect(result).toBeDefined();
        expect(result.id).toBe(createdPathway.id);
      });
    });

    describe('business rule error propagation', () => {
      test('should propagate validation error for same origin and destination', async () => {
        const invalidEntity = createUniqueEntity({
          baseName: 'Invalid Same Origin Destination',
          baseCode: 'ISOD',
          suiteId: testData.suiteId,
        });

        const invalidPayload: CreatePathwayPayload = {
          originNodeId: testData.originNodeId,
          destinationNodeId: testData.originNodeId, // Same as origin - violates business rule
          name: invalidEntity.name,
          code: invalidEntity.code || 'ISOD001',
          description: 'Test pathway with same origin and destination',
        };

        // Should propagate FieldValidationError from entity to API layer
        await expect(createPathway(invalidPayload)).rejects.toThrow();
      });

      test('should propagate validation error for sellable empty trip', async () => {
        const invalidEntity = createUniqueEntity({
          baseName: 'Invalid Sellable Empty Trip',
          baseCode: 'ISET',
          suiteId: testData.suiteId,
        });

        const invalidPayload: CreatePathwayPayload = {
          originNodeId: testData.originNodeId,
          destinationNodeId: testData.destinationNodeId,
          name: invalidEntity.name,
          code: invalidEntity.code || 'ISET001',
          description:
            'Test pathway with invalid sellable empty trip combination',
          isEmptyTrip: true,
          isSellable: true, // Invalid combination - violates business rule
        };

        // Should propagate FieldValidationError from entity to API layer
        await expect(createPathway(invalidPayload)).rejects.toThrow();
      });

      test('should propagate validation error for activation without options', async () => {
        // Create a pathway without options for activation test
        const createdPathway = await createTestPathway(testData, {
          active: false,
        });

        // Try to activate pathway without options - should propagate validation error
        await expect(
          updatePathway({
            id: createdPathway.id,
            active: true,
          }),
        ).rejects.toThrow();
      });

      test('should propagate validation error for non-existent nodes', async () => {
        const invalidEntity = createUniqueEntity({
          baseName: 'Invalid Origin Node',
          baseCode: 'ION',
          suiteId: testData.suiteId,
        });

        const invalidPayload: CreatePathwayPayload = {
          originNodeId: 999999, // Non-existent node
          destinationNodeId: testData.destinationNodeId,
          name: invalidEntity.name,
          code: invalidEntity.code || 'ION001',
          description: 'Test pathway with non-existent origin node',
        };

        // Should propagate FieldValidationError for missing node from entity to API layer
        await expect(createPathway(invalidPayload)).rejects.toThrow();
      });

      test('should propagate validation error when updating with invalid nodes', async () => {
        // Create a valid pathway for update test
        const createdPathway = await createTestPathway(testData);

        // Try to update with non-existent destination node
        await expect(
          updatePathway({
            id: createdPathway.id,
            destinationNodeId: 999999, // Non-existent node
          }),
        ).rejects.toThrow();
      });
    });

    describe('cleanup test', () => {
      test('should delete a pathway successfully', async () => {
        // Create a pathway specifically for deletion test (inactive, following business rules)
        const pathwayToDelete = await createTestPathway(testData);

        const result = await deletePathway({ id: pathwayToDelete.id });

        expect(result).toBeDefined();
        expect(result.id).toBe(pathwayToDelete.id);

        // Verify pathway is deleted
        await expect(getPathway({ id: pathwayToDelete.id })).rejects.toThrow();
      });
    });
  });
});
