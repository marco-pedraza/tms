import { afterAll, describe, expect, test } from 'vitest';
import { vi } from 'vitest';
import { FloorSeats } from '../../shared/types';
import { busSeatModelRepository } from '../bus-seat-models/bus-seat-models.repository';
import { busSeatModels } from '../bus-seat-models/bus-seat-models.schema';
import { busSeatModelUseCases } from '../bus-seat-models/bus-seat-models.use-cases';
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
    test('should create a new bus diagram model and automatically generate seat models', async () => {
      // Create a new bus diagram model
      const response = await createBusDiagramModel(testBusDiagramModel);

      // Store the ID for later cleanup
      createdBusDiagramModelId = response.id;

      // Assertions for diagram model
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

      // Verify that seat models were created automatically (atomicity test)
      const seatModelsResult = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        createdBusDiagramModelId,
        {
          orderBy: [{ field: 'seatNumber', direction: 'asc' }],
        },
      );

      // Expected seats calculation: Floor 1: 10 rows × (2 left + 2 right) = 40 seats
      expect(seatModelsResult).toHaveLength(40);

      // Verify seat model properties
      const firstSeat = seatModelsResult[0];
      expect(firstSeat.busDiagramModelId).toBe(createdBusDiagramModelId);
      expect(firstSeat.floorNumber).toBe(1);
      expect(firstSeat.seatNumber).toBeDefined();
      expect(firstSeat.position).toBeDefined();
      expect(firstSeat.position.x).toBeGreaterThanOrEqual(0);
      expect(firstSeat.position.y).toBeGreaterThanOrEqual(1);
      expect(firstSeat.active).toBe(true);

      // Verify all seats have sequential numbers
      const seatNumbers = seatModelsResult
        .map((s) => parseInt(s.seatNumber))
        .sort((a: number, b: number) => a - b);

      expect(seatNumbers[0]).toBe(1);
      expect(seatNumbers[seatNumbers.length - 1]).toBe(40);
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

    test('should rollback diagram model creation if seat models creation fails', async () => {
      // Get initial count of diagram models
      const initialDiagramModels = await listBusDiagramModels();
      const initialCount = initialDiagramModels.busDiagramModels.length;

      // Mock the seat model use case to fail
      const originalCreateSeatModels =
        busSeatModelUseCases.createSeatModelsFromDiagramModel;

      // Replace the method with a mock that throws an error
      busSeatModelUseCases.createSeatModelsFromDiagramModel = vi
        .fn()
        .mockRejectedValue(new Error('Seat models creation failed'));

      try {
        // Attempt to create a diagram model - this should fail and rollback
        await createBusDiagramModel(testBusDiagramModel);

        // If we reach here, the test should fail
        expect('Transaction should have failed').toBe(false);
      } catch (error) {
        // Expected error
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Seat models creation failed');
      } finally {
        // Restore the original method
        busSeatModelUseCases.createSeatModelsFromDiagramModel =
          originalCreateSeatModels;
      }

      // Verify that no new diagram model was created (transaction was rolled back)
      const finalDiagramModels = await listBusDiagramModels();
      expect(finalDiagramModels.busDiagramModels).toHaveLength(initialCount);
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
