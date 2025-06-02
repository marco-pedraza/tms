import { afterAll, describe, expect, test } from 'vitest';
import { FloorSeats } from './bus-diagram-models.types';
import {
  createBusDiagramModel,
  deleteBusDiagramModel,
  getBusDiagramModel,
  listBusDiagramModels,
  listBusDiagramModelsPaginated,
  updateBusDiagramModel,
} from './bus-diagram-models.controller';

describe('Bus Diagram Models Controller', () => {
  // Test data and setup
  const testFloorSeats: FloorSeats = {
    floorNumber: 1,
    numRows: 10,
    seatsLeft: 2,
    seatsRight: 2,
  };

  const testBusDiagramModel = {
    name: 'Test Bus Diagram Model',
    description: 'A test model',
    maxCapacity: 50,
    numFloors: 1,
    seatsPerFloor: [testFloorSeats],
    totalSeats: 40,
    isFactoryDefault: true,
  };

  const updatePayload = {
    name: 'Updated Bus Diagram Model',
    description: 'An updated model',
    maxCapacity: 70,
  };

  // Variables to store created IDs for cleanup
  let createdBusDiagramModelId: number;
  let additionalModelId: number | undefined;

  // Clean up after all tests
  afterAll(async () => {
    // Clean up the created bus diagram model if any
    if (createdBusDiagramModelId) {
      try {
        await deleteBusDiagramModel({ id: createdBusDiagramModelId });
      } catch (error) {
        console.log('Error cleaning up test bus diagram model:', error);
      }
    }

    // Clean up additional model created for deletion test
    if (additionalModelId) {
      try {
        await deleteBusDiagramModel({ id: additionalModelId });
      } catch (error) {
        console.log('Error cleaning up additional bus diagram model:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new bus diagram model', async () => {
      // Create a new bus diagram model
      const response = await createBusDiagramModel(testBusDiagramModel);

      // Store the ID for later cleanup
      createdBusDiagramModelId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testBusDiagramModel.name);
      expect(response.description).toBe(testBusDiagramModel.description);
      expect(response.maxCapacity).toBe(testBusDiagramModel.maxCapacity);
      expect(response.numFloors).toBe(testBusDiagramModel.numFloors);
      expect(response.seatsPerFloor).toEqual(testBusDiagramModel.seatsPerFloor);
      expect(response.totalSeats).toBe(testBusDiagramModel.totalSeats);
      expect(response.active).toBeDefined();
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();
    });

    test('should retrieve a bus diagram model by ID', async () => {
      const response = await getBusDiagramModel({
        id: createdBusDiagramModelId,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusDiagramModelId);
      expect(response.name).toBe(testBusDiagramModel.name);
      expect(response.description).toBe(testBusDiagramModel.description);
      expect(response.maxCapacity).toBe(testBusDiagramModel.maxCapacity);
    });

    test('should list all bus diagram models', async () => {
      const response = await listBusDiagramModels();

      expect(response).toBeDefined();
      expect(response.busDiagramModels).toBeDefined();
      expect(Array.isArray(response.busDiagramModels)).toBe(true);
      expect(response.busDiagramModels.length).toBeGreaterThan(0);

      // Find our test model in the list
      const foundModel = response.busDiagramModels.find(
        (model) => model.id === createdBusDiagramModelId,
      );
      expect(foundModel).toBeDefined();
      expect(foundModel?.name).toBe(testBusDiagramModel.name);
    });

    test('should update a bus diagram model', async () => {
      const response = await updateBusDiagramModel({
        id: createdBusDiagramModelId,
        ...updatePayload,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusDiagramModelId);
      expect(response.name).toBe(updatePayload.name);
      expect(response.description).toBe(updatePayload.description);
      expect(response.maxCapacity).toBe(updatePayload.maxCapacity);
      // Fields not in updatePayload should remain unchanged
      expect(response.numFloors).toBe(testBusDiagramModel.numFloors);
    });

    test('should delete a bus diagram model', async () => {
      // Create a model specifically for deletion test
      const modelToDelete = await createBusDiagramModel({
        name: 'Model To Delete',
        description: 'Temporary model for deletion test',
        maxCapacity: 40,
        numFloors: 1,
        seatsPerFloor: [
          {
            floorNumber: 1,
            numRows: 8,
            seatsLeft: 2,
            seatsRight: 2,
          },
        ],
        totalSeats: 32,
        isFactoryDefault: false,
      });

      additionalModelId = modelToDelete.id;

      // Delete should not throw an error
      await expect(
        deleteBusDiagramModel({ id: additionalModelId }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(
        getBusDiagramModel({ id: additionalModelId }),
      ).rejects.toThrow();

      // Reset the ID since we've deleted it
      additionalModelId = undefined;
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getBusDiagramModel({ id: 9999 })).rejects.toThrow();
    });

    // NOTE: We are not testing validation errors because they're handled by Encore's rust runtime
  });

  describe('pagination', () => {
    test('should return paginated bus diagram models with default parameters', async () => {
      const response = await listBusDiagramModelsPaginated({});

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
      const response = await listBusDiagramModelsPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listBusDiagramModels();

      expect(response.busDiagramModels).toBeDefined();
      expect(Array.isArray(response.busDiagramModels)).toBe(true);
      expect(response.busDiagramModels.length).toBeGreaterThan(0);
      // No pagination info should be present
      expect(response).not.toHaveProperty('pagination');
    });
  });
});
