import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { PaginationParams } from '../../shared/types';
import {
  createPathwayService,
  deletePathwayService,
} from '../pathway-services/pathway-services.controller';
import { pathwayRepository } from './pathways.repository';
import {
  assignServicesToPathway,
  createPathway,
  deletePathway,
  getPathway,
  getPathwayWithServiceAssignments,
  listPathways,
  listPathwaysPaginated,
  unassignServiceFromPathway,
  updatePathway,
} from './pathways.controller';

describe('Pathways Controller', () => {
  // Test data and setup
  const testPathway = {
    name: 'Test Pathway',
    distance: 100.5,
    typicalTime: 120,
    meta: { type: 'highway', terrain: 'flat' },
    tollRoad: false,
    active: true,
  };

  const testPathwayService = {
    name: 'Test Service for Pathway',
    serviceType: 'maintenance',
    latitude: 25.123,
    longitude: -99.456,
    category: 'repair',
    provider: 'Test Provider',
    providerScheduleHours: {
      monday: [{ open: '08:00', close: '18:00' }],
    },
    duration: 30,
  };

  // Variables to store created IDs for cleanup
  let createdPathwayId: number;
  // Track all created pathway IDs for proper cleanup
  const createdPathwayIds: number[] = [];

  // Helper function to track created pathways for cleanup
  const trackPathway = (id: number) => {
    if (!createdPathwayIds.includes(id)) {
      createdPathwayIds.push(id);
    }
    return id;
  };

  // Helper function to clean up a pathway and remove it from tracking
  const cleanupPathway = async (id: number) => {
    try {
      await deletePathway({ id });
      // Remove from tracking
      const index = createdPathwayIds.indexOf(id);
      if (index > -1) {
        createdPathwayIds.splice(index, 1);
      }
    } catch (error) {
      // Don't log not found errors in test mode as they're expected during cleanup
      if (!(error instanceof Error && error.message.includes('not found'))) {
        console.log(`Error cleaning up pathway (ID: ${id}):`, error);
      }

      // Always remove from tracking even if delete failed
      const index = createdPathwayIds.indexOf(id);
      if (index > -1) {
        createdPathwayIds.splice(index, 1);
      }
    }
  };

  // Helper function to create a test pathway with a given name
  const createTestPathway = async (name: string, options = {}) => {
    const pathway = await createPathway({
      ...testPathway,
      name,
      ...options,
    });
    return trackPathway(pathway.id);
  };

  beforeAll(async () => {
    await pathwayRepository.deleteAll();
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up all created pathways
    for (const id of [...createdPathwayIds]) {
      await cleanupPathway(id);
    }

    // Clean up the main test pathway if it exists
    if (createdPathwayId && !createdPathwayIds.includes(createdPathwayId)) {
      await cleanupPathway(createdPathwayId);
    }
  });

  describe('success scenarios', () => {
    test('should create a new pathway', async () => {
      // Create a new pathway
      const response = await createPathway(testPathway);

      // Store the ID for later cleanup
      createdPathwayId = response.id;
      trackPathway(createdPathwayId);

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testPathway.name);
      expect(response.distance).toBe(testPathway.distance);
      expect(response.typicalTime).toBe(testPathway.typicalTime);
      expect(response.meta).toEqual(testPathway.meta);
      expect(response.tollRoad).toBe(testPathway.tollRoad);
      expect(response.active).toBe(testPathway.active);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a pathway by ID', async () => {
      const response = await getPathway({ id: createdPathwayId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdPathwayId);
      expect(response.name).toBe(testPathway.name);
      expect(response.distance).toBe(testPathway.distance);
      expect(response.typicalTime).toBe(testPathway.typicalTime);
      expect(response.meta).toEqual(testPathway.meta);
      expect(response.tollRoad).toBe(testPathway.tollRoad);
      expect(response.active).toBe(testPathway.active);
    });

    test('should retrieve all pathways', async () => {
      const secondPathwayPayload = {
        ...testPathway,
        name: 'Test Pathway 2',
      };
      const second = await createPathway(secondPathwayPayload);
      trackPathway(second.id);
      const result = await listPathways();

      expect(result).toBeDefined();
      expect(Array.isArray(result.pathways)).toBe(true);

      // We should at least find our test pathway
      expect(
        result.pathways.some((pathway) => pathway.id === createdPathwayId),
      ).toBe(true);
    });

    test('should retrieve paginated pathways', async () => {
      const result = await listPathwaysPaginated({ page: 1, pageSize: 10 });

      // Check the structure of the response
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(typeof result.pagination.currentPage).toBe('number');
      expect(typeof result.pagination.pageSize).toBe('number');
      expect(typeof result.pagination.totalCount).toBe('number');
      expect(typeof result.pagination.totalPages).toBe('number');
      expect(typeof result.pagination.hasNextPage).toBe('boolean');
      expect(typeof result.pagination.hasPreviousPage).toBe('boolean');

      // We should at least find our test pathway
      expect(
        result.data.some((pathway) => pathway.id === createdPathwayId),
      ).toBe(true);

      // Pagination values should make sense
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(1);
    });

    test('pagination should respect pageSize parameter', async () => {
      // Request with a small page size
      const result = await listPathwaysPaginated({ page: 1, pageSize: 1 });

      expect(result.data.length).toBeLessThanOrEqual(1);
      expect(result.pagination.pageSize).toBe(1);
    });

    test('should update a pathway name', async () => {
      const updatedName = 'Updated Test Pathway';
      const response = await updatePathway({
        id: createdPathwayId,
        name: updatedName,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdPathwayId);
      expect(response.name).toBe(updatedName);
      expect(response.distance).toBe(testPathway.distance);
      expect(response.typicalTime).toBe(testPathway.typicalTime);
    });

    test('should update pathway distance', async () => {
      const newDistance = 150;

      const response = await updatePathway({
        id: createdPathwayId,
        distance: newDistance,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdPathwayId);
      expect(response.distance).toBe(newDistance);
      // Other fields should remain unchanged
      expect(response.typicalTime).toBe(testPathway.typicalTime);
    });

    test('should update pathway typicalTime', async () => {
      const newTypicalTime = 180;

      const response = await updatePathway({
        id: createdPathwayId,
        typicalTime: newTypicalTime,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdPathwayId);
      expect(response.typicalTime).toBe(newTypicalTime);
    });

    test('should update pathway tollRoad status', async () => {
      const response = await updatePathway({
        id: createdPathwayId,
        tollRoad: true,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdPathwayId);
      expect(response.tollRoad).toBe(true);
    });

    test('should update pathway meta information', async () => {
      const newMeta = { type: 'highway', terrain: 'mountainous', lanes: 4 };

      const response = await updatePathway({
        id: createdPathwayId,
        meta: newMeta,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdPathwayId);
      expect(response.meta).toEqual(newMeta);
    });

    test('should delete a pathway', async () => {
      // Create a pathway specifically for deletion test
      const pathwayId = await createTestPathway('Pathway To Delete');

      // Delete should not throw an error
      await expect(deletePathway({ id: pathwayId })).resolves.not.toThrow();

      // Remove from tracking list since it's been deleted
      const index = createdPathwayIds.indexOf(pathwayId);
      if (index > -1) {
        createdPathwayIds.splice(index, 1);
      }

      // Attempt to get should throw a not found error
      await expect(getPathway({ id: pathwayId })).rejects.toThrow();
    });
  });

  describe('pathway service assignments', () => {
    test('should assign a service to a pathway', async () => {
      const pathway = await createPathway(testPathway);
      const service = await createPathwayService(testPathwayService);

      const assignmentData = {
        pathwayId: pathway.id,
        pathwayServiceId: service.id,
        distanceFromOrigin: 10.5,
        associatedCost: 50.75,
      };

      const response = await assignServicesToPathway(assignmentData);

      expect(response).toBeDefined();
      expect(response.id).toBe(pathway.id);
      expect(response.pathwayServiceAssignments).toBeDefined();
      expect(response.pathwayServiceAssignments).toHaveLength(1);

      const { pathwayService } = response.pathwayServiceAssignments[0];

      expect(pathwayService.id).toBe(service.id);
      expect(pathwayService.name).toBe('Test Service for Pathway');
      expect(pathwayService.serviceType).toBe('maintenance');
      expect(pathwayService.latitude).toBe(25.123);
      expect(pathwayService.longitude).toBe(-99.456);
      expect(response.pathwayServiceAssignments[0].sequence).toBe(1);
      await deletePathway({ id: pathway.id });
      await deletePathwayService({ id: service.id });
    });

    test('should assign multiple services to a pathway', async () => {
      const pathway = await createPathway(testPathway);
      const testService1 = {
        ...testPathwayService,
        name: 'Test Service 1',
      };
      const testService2 = {
        ...testPathwayService,
        name: 'Test Service 2',
      };
      const service1 = await createPathwayService(testService1);
      const service2 = await createPathwayService(testService2);

      const assignmentData1 = {
        pathwayId: pathway.id,
        pathwayServiceId: service1.id,
        distanceFromOrigin: 10.5,
        associatedCost: 50.75,
      };

      const assignmentData2 = {
        pathwayId: pathway.id,
        pathwayServiceId: service2.id,
        distanceFromOrigin: 20.5,
        associatedCost: 100.75,
      };

      await assignServicesToPathway(assignmentData1);
      await assignServicesToPathway(assignmentData2);

      const response = await getPathwayWithServiceAssignments({
        id: pathway.id,
      });

      expect(response).toBeDefined();
      expect(response.pathwayServiceAssignments).toBeDefined();
      expect(response.pathwayServiceAssignments).toHaveLength(2);

      const [assignment1, assignment2] = response.pathwayServiceAssignments;

      expect(assignment1.pathwayService.id).toBe(service1.id);
      expect(assignment1.pathwayService.name).toBe('Test Service 1');
      expect(assignment1.sequence).toBe(1);
      expect(assignment2.pathwayService.id).toBe(service2.id);
      expect(assignment2.pathwayService.name).toBe('Test Service 2');
      expect(assignment2.sequence).toBe(2);

      await deletePathway({ id: pathway.id });
      await deletePathwayService({ id: service1.id });
      await deletePathwayService({ id: service2.id });
    });

    test('should unassign a service from a pathway', async () => {
      const pathway = await createPathway(testPathway);
      const service = await createPathwayService(testPathwayService);

      const assignmentData = {
        pathwayId: pathway.id,
        pathwayServiceId: service.id,
        distanceFromOrigin: 10.5,
        associatedCost: 50.75,
      };

      const assignmentResponse = await assignServicesToPathway(assignmentData);
      const [assignment] = assignmentResponse.pathwayServiceAssignments;

      const response = await unassignServiceFromPathway({
        pathwayId: pathway.id,
        assignmentId: assignment.id,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(pathway.id);
      expect(response.pathwayServiceAssignments).toBeDefined();
      expect(response.pathwayServiceAssignments).toHaveLength(0);

      await deletePathway({ id: pathway.id });
      await deletePathwayService({ id: service.id });
    });

    test('should unassign a service from a pathway and update sequences', async () => {
      const pathway = await createPathway(testPathway);
      const service1 = await createPathwayService({
        ...testPathwayService,
        name: 'Service 1',
      });
      const service2 = await createPathwayService({
        ...testPathwayService,
        name: 'Service 2',
      });
      const service3 = await createPathwayService({
        ...testPathwayService,
        name: 'Service 3',
      });
      const service4 = await createPathwayService({
        ...testPathwayService,
        name: 'Service 4',
      });

      const assignmentData = {
        pathwayId: pathway.id,
        distanceFromOrigin: 10.5,
      };

      await assignServicesToPathway({
        ...assignmentData,
        pathwayServiceId: service1.id,
      });
      await assignServicesToPathway({
        ...assignmentData,
        pathwayServiceId: service2.id,
      });
      await assignServicesToPathway({
        ...assignmentData,
        pathwayServiceId: service3.id,
      });
      await assignServicesToPathway({
        ...assignmentData,
        pathwayServiceId: service4.id,
      });

      const response = await getPathwayWithServiceAssignments({
        id: pathway.id,
      });

      expect(response).toBeDefined();
      expect(response.pathwayServiceAssignments).toBeDefined();
      expect(response.pathwayServiceAssignments).toHaveLength(4);

      const { pathwayServiceAssignments } = response;
      let assignment1 = pathwayServiceAssignments[0];
      const assignment2 = pathwayServiceAssignments[1];
      let assignment3 = pathwayServiceAssignments[2];
      let assignment4 = pathwayServiceAssignments[3];

      expect(assignment1.sequence).toBe(1);
      expect(assignment2.sequence).toBe(2);
      expect(assignment3.sequence).toBe(3);
      expect(assignment4.sequence).toBe(4);

      const unassignmentResponse = await unassignServiceFromPathway({
        pathwayId: pathway.id,
        assignmentId: assignment2.id,
      });

      expect(unassignmentResponse).toBeDefined();
      expect(unassignmentResponse.id).toBe(pathway.id);
      expect(unassignmentResponse.pathwayServiceAssignments).toBeDefined();
      expect(unassignmentResponse.pathwayServiceAssignments).toHaveLength(3);

      [assignment1, assignment3, assignment4] =
        unassignmentResponse.pathwayServiceAssignments;

      expect(assignment1.sequence).toBe(1);
      expect(assignment3.sequence).toBe(2);
      expect(assignment4.sequence).toBe(3);

      // --- clean-up -------------------------------------------------------------
      await deletePathway({ id: pathway.id });
      await deletePathwayService({ id: service1.id });
      await deletePathwayService({ id: service2.id });
      await deletePathwayService({ id: service3.id });
      await deletePathwayService({ id: service4.id });
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getPathway({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate pathway names', async () => {
      // Create a pathway with a unique name first
      const uniqueName = 'Unique Test Pathway';
      const pathwayId = await createTestPathway(uniqueName);

      try {
        // Try to create another pathway with the same name
        await expect(
          createPathway({
            name: uniqueName, // Same name as the pathway we just created
            distance: 100,
            typicalTime: 120,
            meta: { type: 'test' },
            tollRoad: false,
            active: true,
          }),
        ).rejects.toThrow();
      } finally {
        await cleanupPathway(pathwayId);
      }
    });
  });

  describe('pagination', () => {
    test('should return paginated pathways with default parameters', async () => {
      const response = await listPathwaysPaginated({} as PaginationParams);

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBeDefined();
      expect(response.pagination.totalCount).toBeDefined();
      expect(response.pagination.totalPages).toBeDefined();
      expect(typeof response.pagination.hasNextPage).toBe('boolean');
      expect(typeof response.pagination.hasPreviousPage).toBe('boolean');
    });

    test('should honor page and pageSize parameters', async () => {
      const response = await listPathwaysPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should handle pagination for empty results', async () => {
      // Create a high page number that should have no results
      const highPageNumber = 999;
      const response = await listPathwaysPaginated({
        page: highPageNumber,
        pageSize: 10,
      });

      // Should return an empty data array but with valid pagination info
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0);
      expect(response.pagination.currentPage).toBe(highPageNumber);
      expect(response.pagination.hasPreviousPage).toBe(true);
      expect(response.pagination.hasNextPage).toBe(false);
    });
  });
});
