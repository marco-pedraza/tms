import { afterAll, describe, expect, test } from 'vitest';
import { BathroomLocation, FloorSeats } from './seat-layout-models.types';
import {
  createSeatLayoutModel,
  deleteSeatLayoutModel,
  getSeatLayoutModel,
  listSeatLayoutModels,
  listSeatLayoutModelsPaginated,
  updateSeatLayoutModel,
} from './seat-layout-models.controller';

describe('Seat Layout Models Controller', () => {
  // Test data and setup
  const testFloorSeats: FloorSeats = {
    floorNumber: 1,
    numRows: 10,
    seatsLeft: 2,
    seatsRight: 2,
  };

  const testBathroomLocation: BathroomLocation = {
    floorNumber: 1,
    rowNumber: 5,
  };

  const testSeatLayoutModel = {
    name: 'Test Layout Model',
    description: 'A test model',
    maxCapacity: 50,
    numFloors: 1,
    seatsPerFloor: [testFloorSeats],
    bathroomRows: [testBathroomLocation],
    totalSeats: 40,
    isFactoryDefault: true,
  };

  const updatePayload = {
    name: 'Updated Layout Model',
    description: 'An updated model',
    maxCapacity: 70,
  };

  // Variables to store created IDs for cleanup
  let createdSeatLayoutModelId: number;
  let additionalModelId: number | undefined;

  // Clean up after all tests
  afterAll(async () => {
    // Clean up the created seat layout model if any
    if (createdSeatLayoutModelId) {
      try {
        await deleteSeatLayoutModel({ id: createdSeatLayoutModelId });
      } catch (error) {
        console.log('Error cleaning up test seat layout model:', error);
      }
    }

    // Clean up additional model created for deletion test
    if (additionalModelId) {
      try {
        await deleteSeatLayoutModel({ id: additionalModelId });
      } catch (error) {
        console.log('Error cleaning up additional seat layout model:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new seat layout model', async () => {
      // Create a new seat layout model
      const response = await createSeatLayoutModel(testSeatLayoutModel);

      // Store the ID for later cleanup
      createdSeatLayoutModelId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testSeatLayoutModel.name);
      expect(response.description).toBe(testSeatLayoutModel.description);
      expect(response.maxCapacity).toBe(testSeatLayoutModel.maxCapacity);
      expect(response.numFloors).toBe(testSeatLayoutModel.numFloors);
      expect(response.seatsPerFloor).toEqual(testSeatLayoutModel.seatsPerFloor);
      expect(response.bathroomRows).toEqual(testSeatLayoutModel.bathroomRows);
      expect(response.totalSeats).toBe(testSeatLayoutModel.totalSeats);
      expect(response.active).toBeDefined();
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();
    });

    test('should retrieve a seat layout model by ID', async () => {
      const response = await getSeatLayoutModel({
        id: createdSeatLayoutModelId,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdSeatLayoutModelId);
      expect(response.name).toBe(testSeatLayoutModel.name);
      expect(response.description).toBe(testSeatLayoutModel.description);
      expect(response.maxCapacity).toBe(testSeatLayoutModel.maxCapacity);
    });

    test('should list all seat layout models', async () => {
      const response = await listSeatLayoutModels();

      expect(response).toBeDefined();
      expect(response.seatLayoutModels).toBeDefined();
      expect(Array.isArray(response.seatLayoutModels)).toBe(true);
      expect(response.seatLayoutModels.length).toBeGreaterThan(0);

      // Find our test model in the list
      const foundModel = response.seatLayoutModels.find(
        (model) => model.id === createdSeatLayoutModelId,
      );
      expect(foundModel).toBeDefined();
      expect(foundModel?.name).toBe(testSeatLayoutModel.name);
    });

    test('should update a seat layout model', async () => {
      const response = await updateSeatLayoutModel({
        id: createdSeatLayoutModelId,
        ...updatePayload,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdSeatLayoutModelId);
      expect(response.name).toBe(updatePayload.name);
      expect(response.description).toBe(updatePayload.description);
      expect(response.maxCapacity).toBe(updatePayload.maxCapacity);
      // Fields not in updatePayload should remain unchanged
      expect(response.numFloors).toBe(testSeatLayoutModel.numFloors);
    });

    test('should delete a seat layout model', async () => {
      // Create a model specifically for deletion test
      const modelToDelete = await createSeatLayoutModel({
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
        bathroomRows: [],
        totalSeats: 32,
        isFactoryDefault: false,
      });

      additionalModelId = modelToDelete.id;

      // Delete should not throw an error
      await expect(
        deleteSeatLayoutModel({ id: additionalModelId }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(
        getSeatLayoutModel({ id: additionalModelId }),
      ).rejects.toThrow();

      // Reset the ID since we've deleted it
      additionalModelId = undefined;
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getSeatLayoutModel({ id: 9999 })).rejects.toThrow();
    });

    // NOTE: We are not testing validation errors because they're handled by Encore's rust runtime
  });

  describe('pagination', () => {
    test('should return paginated seat layout models with default parameters', async () => {
      const response = await listSeatLayoutModelsPaginated({});

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
      const response = await listSeatLayoutModelsPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });
  });
});
