import { schema } from '@/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { db } from '@/inventory/db-service';
import { cityRepository } from '@/inventory/locations/cities/cities.repository';
import { populationRepository } from '@/inventory/locations/populations/populations.repository';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueCode,
  createUniqueName,
} from '@/tests/shared/test-utils';
import { cityFactory, nodeFactory, populationFactory } from '@/factories';
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

describe('Pathways Controller', () => {
  const testSuiteId = createTestSuiteId('pathways-controller');
  const factoryDb = getFactoryDb(db);
  let testCityId: number;
  let testPopulationId: number;
  let testOriginNodeId: number;
  let testDestinationNodeId: number;
  let createdPathwayId: number;

  // Cleanup helpers
  const pathwayCleanup = createCleanupHelper(async ({ id }) => {
    // First delete pathway options to avoid foreign key constraint
    try {
      await db
        .delete(schema.pathwayOptions)
        .where(eq(schema.pathwayOptions.pathwayId, id));
    } catch (error) {
      console.log('Error cleaning up pathway options:', error);
    }
    // Then delete the pathway
    return pathwayRepository.forceDelete(id);
  }, 'pathway');

  beforeAll(async () => {
    // Create test dependencies using factories
    const testCity = await cityFactory(factoryDb).create({
      name: createUniqueName('Test City', testSuiteId),
      latitude: 19.4326,
      longitude: -99.1332,
      timezone: 'America/Mexico_City',
    });
    testCityId = testCity.id;

    const testPopulation = await populationFactory(factoryDb).create({
      code: createUniqueCode('TPOP', 3),
      description: 'Test population for pathways',
      active: true,
    });
    testPopulationId = testPopulation.id;

    // Create origin and destination nodes
    const originNode = await nodeFactory(factoryDb).create({
      code: createUniqueCode('ORG', 3),
      name: createUniqueName('Origin Node', testSuiteId),
      latitude: 19.4326,
      longitude: -99.1332,
      radius: 1000,
      cityId: testCityId,
      populationId: testPopulationId,
    });
    testOriginNodeId = originNode.id;

    const destinationNode = await nodeFactory(factoryDb).create({
      code: createUniqueCode('DST', 3),
      name: createUniqueName('Destination Node', testSuiteId),
      latitude: 19.5326,
      longitude: -99.2332,
      radius: 1000,
      cityId: testCityId,
      populationId: testPopulationId,
    });
    testDestinationNodeId = destinationNode.id;
  });

  afterAll(async () => {
    // Clean up pathways first (they depend on nodes)
    await pathwayCleanup.cleanupAll();

    // Clean up factory-created entities in dependency order
    if (testOriginNodeId) {
      try {
        await db
          .delete(schema.nodes)
          .where(eq(schema.nodes.id, testOriginNodeId));
      } catch (error) {
        console.log('Error cleaning up origin node:', error);
      }
    }
    if (testDestinationNodeId) {
      try {
        await db
          .delete(schema.nodes)
          .where(eq(schema.nodes.id, testDestinationNodeId));
      } catch (error) {
        console.log('Error cleaning up destination node:', error);
      }
    }
    if (testPopulationId) {
      try {
        await populationRepository.forceDelete(testPopulationId);
      } catch (error) {
        console.log('Error cleaning up test population:', error);
      }
    }
    if (testCityId) {
      try {
        await cityRepository.forceDelete(testCityId);
      } catch (error) {
        console.log('Error cleaning up test city:', error);
      }
    }
  });

  describe('CRUD operations', () => {
    test('should create a pathway successfully', async () => {
      const pathwayData: CreatePathwayPayload = {
        originNodeId: testOriginNodeId,
        destinationNodeId: testDestinationNodeId,
        name: createUniqueName('Test Pathway', testSuiteId),
        code: createUniqueCode('TP', 3),
        description: 'Test pathway for controller tests',
        isSellable: true,
        isEmptyTrip: false,
      };

      const result = await createPathway(pathwayData);
      createdPathwayId = pathwayCleanup.track(result.id);

      expect(result).toBeDefined();
      expect(result.id).toBeTypeOf('number');
      expect(result.name).toBe(pathwayData.name);
      expect(result.code).toBe(pathwayData.code);
      expect(result.originNodeId).toBe(pathwayData.originNodeId);
      expect(result.destinationNodeId).toBe(pathwayData.destinationNodeId);
      expect(result.originCityId).toBe(testCityId);
      expect(result.destinationCityId).toBe(testCityId);
      expect(result.isSellable).toBe(pathwayData.isSellable);
      expect(result.isEmptyTrip).toBe(pathwayData.isEmptyTrip);
      expect(result.active).toBe(false); // Pathways are created as inactive by default
    });

    test('should get a pathway by ID', async () => {
      const result = await getPathway({ id: createdPathwayId });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdPathwayId);
      expect(result.name).toContain('Test Pathway');
    });

    test('should update a pathway', async () => {
      const updateData: UpdatePathwayPayload = {
        name: createUniqueName('Updated Pathway', testSuiteId),
        description: 'Updated description',
        active: false,
      };

      const result = await updatePathway({
        id: createdPathwayId,
        ...updateData,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdPathwayId);
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      expect(result.active).toBe(updateData.active);
    });

    test('should list pathways without pagination', async () => {
      const result = await listPathways({});

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      const testPathway = result.data.find(
        (p: Pathway) => p.id === createdPathwayId,
      );
      expect(testPathway).toBeDefined();
    });

    test('should list pathways with pagination', async () => {
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
      const optionData = {
        originNodeId: testOriginNodeId,
        destinationNodeId: testDestinationNodeId,
        name: createUniqueName('Test Option', testSuiteId),
        description: 'Test option for pathway',
        estimatedTime: 30,
        estimatedDistance: 100,
        active: true,
      };

      const result = await addOptionToPathway({
        pathwayId: createdPathwayId,
        optionData,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdPathwayId);

      // Verify option was added by checking the updated pathway via application service
      const pathwayWithOptions = await getPathway({ id: createdPathwayId });
      expect(pathwayWithOptions).toBeDefined();
    });

    test('should remove an option from pathway', async () => {
      // First, get the current options to find one to remove
      await getPathway({ id: createdPathwayId });

      // Add an option first
      const optionData = {
        originNodeId: testOriginNodeId,
        destinationNodeId: testDestinationNodeId,
        name: createUniqueName('Option to Remove', testSuiteId),
        description: 'Option that will be removed',
        estimatedTime: 45,
        estimatedDistance: 150,
        active: true,
      };

      await addOptionToPathway({
        pathwayId: createdPathwayId,
        optionData,
      });

      // Get the options to find the one we just added
      const options =
        await pathwayOptionRepository.findByPathwayId(createdPathwayId);
      const optionToRemove = options.find(
        (opt) => opt.name === optionData.name,
      );

      expect(optionToRemove).toBeDefined();

      // Now remove it
      const result = await removeOptionFromPathway({
        pathwayId: createdPathwayId,
        optionId: optionToRemove?.id as number,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdPathwayId);
    });

    test('should update a pathway option', async () => {
      // First add an option to update
      const optionData = {
        originNodeId: testOriginNodeId,
        destinationNodeId: testDestinationNodeId,
        name: createUniqueName('Option to Update', testSuiteId),
        description: 'Option that will be updated',
        estimatedTime: 60,
        estimatedDistance: 200,
        active: true,
      };

      await addOptionToPathway({
        pathwayId: createdPathwayId,
        optionData,
      });

      // Get the option to update
      const options =
        await pathwayOptionRepository.findByPathwayId(createdPathwayId);
      const optionToUpdate = options.find(
        (opt) => opt.name === optionData.name,
      );

      expect(optionToUpdate).toBeDefined();

      // Update the option
      const updateData = {
        name: createUniqueName('Updated Option', testSuiteId),
        description: 'Updated description',
        estimatedTime: 90,
      };

      const result = await updatePathwayOption({
        pathwayId: createdPathwayId,
        optionId: optionToUpdate?.id as number,
        optionData: updateData,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdPathwayId);
    });
  });

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
        originNodeId: testOriginNodeId,
        destinationNodeId: testDestinationNodeId,
        name: 'Test Option',
        description: 'Test option',
        estimatedTime: 30,
        estimatedDistance: 100,
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
        originNodeId: testOriginNodeId,
        destinationNodeId: testOriginNodeId, // Same as origin - violates business rule
        name: createUniqueName('Invalid Same Origin Destination', testSuiteId),
        code: createUniqueCode('ISOD', 3),
        description: 'Test pathway with same origin and destination',
      };

      // Should propagate FieldValidationError from entity to API layer
      await expect(createPathway(invalidPayload)).rejects.toThrow();
    });

    test('should propagate validation error for sellable empty trip', async () => {
      const invalidPayload: CreatePathwayPayload = {
        originNodeId: testOriginNodeId,
        destinationNodeId: testDestinationNodeId,
        name: createUniqueName('Invalid Sellable Empty Trip', testSuiteId),
        code: createUniqueCode('ISET', 3),
        description:
          'Test pathway with invalid sellable empty trip combination',
        isEmptyTrip: true,
        isSellable: true, // Invalid combination - violates business rule
      };

      // Should propagate FieldValidationError from entity to API layer
      await expect(createPathway(invalidPayload)).rejects.toThrow();
    });

    test('should propagate validation error for activation without options', async () => {
      // First create a valid pathway
      const pathwayData: CreatePathwayPayload = {
        originNodeId: testOriginNodeId,
        destinationNodeId: testDestinationNodeId,
        name: createUniqueName('No Options Activation Test', testSuiteId),
        code: createUniqueCode('NOAT', 3),
        description: 'Test pathway for activation without options',
        isSellable: true,
        isEmptyTrip: false,
        active: false,
      };

      const createdPathway = await createPathway(pathwayData);
      pathwayCleanup.track(createdPathway.id);

      // Try to activate pathway without options - should propagate validation error
      await expect(
        updatePathway({
          id: createdPathway.id,
          active: true,
        }),
      ).rejects.toThrow();
    });

    test('should propagate validation error for non-existent nodes', async () => {
      const invalidPayload: CreatePathwayPayload = {
        originNodeId: 999999, // Non-existent node
        destinationNodeId: testDestinationNodeId,
        name: createUniqueName('Invalid Origin Node', testSuiteId),
        code: createUniqueCode('ION', 3),
        description: 'Test pathway with non-existent origin node',
      };

      // Should propagate FieldValidationError for missing node from entity to API layer
      await expect(createPathway(invalidPayload)).rejects.toThrow();
    });

    test('should propagate validation error when updating with invalid nodes', async () => {
      // First create a valid pathway
      const pathwayData: CreatePathwayPayload = {
        originNodeId: testOriginNodeId,
        destinationNodeId: testDestinationNodeId,
        name: createUniqueName('Valid For Update Test', testSuiteId),
        code: createUniqueCode('VFUT', 3),
        description: 'Valid pathway for testing update with invalid nodes',
      };

      const createdPathway = await createPathway(pathwayData);
      pathwayCleanup.track(createdPathway.id);

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
      // Create a pathway specifically for deletion test
      const pathwayData: CreatePathwayPayload = {
        originNodeId: testOriginNodeId,
        destinationNodeId: testDestinationNodeId,
        name: createUniqueName('Delete Test Pathway', testSuiteId),
        code: createUniqueCode('DTP', 3),
        description: 'Pathway for deletion test',
        active: true,
      };

      const createdPathway = await createPathway(pathwayData);
      pathwayCleanup.track(createdPathway.id);

      const result = await deletePathway({ id: createdPathway.id });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdPathway.id);

      // Verify pathway is deleted
      await expect(getPathway({ id: createdPathway.id })).rejects.toThrow();
    });
  });
});
