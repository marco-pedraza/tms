import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  createBusDiagramModel,
  deleteBusDiagramModel,
} from '../bus-diagram-models/bus-diagram-models.controller';
import {
  createBusModel,
  deleteBusModel,
  getBusModel,
  listBusModels,
  listBusModelsPaginated,
  updateBusModel,
} from './bus-models.controller';

describe('Bus Models Controller', () => {
  let createdBusDiagramModelId: number;
  let testBusModelData: {
    defaultBusDiagramModelId: number;
    manufacturer: string;
    model: string;
    year: number;
    seatingCapacity: number;
    numFloors: number;
    amenities: string[];
    engineType: string;
    distributionType: string;
    active: boolean;
  };

  // Variables to store created IDs for cleanup
  let createdBusModelId: number;
  let additionalModelId: number;

  beforeAll(async () => {
    // Create a test bus diagram model
    const busDiagramModel = await createBusDiagramModel({
      name: 'Test Bus Diagram Model',
      description: 'A test model',
      maxCapacity: 40,
      numFloors: 1,
      seatsPerFloor: [
        {
          floorNumber: 1,
          numRows: 10,
          seatsLeft: 2,
          seatsRight: 2,
        },
      ],
      bathroomRows: [],
      totalSeats: 40,
      isFactoryDefault: true,
      active: true,
    });
    createdBusDiagramModelId = busDiagramModel.id;

    // Now store basic test data
    testBusModelData = {
      defaultBusDiagramModelId: createdBusDiagramModelId,
      manufacturer: 'TestManufacturer',
      model: 'TestModel-1',
      year: 2023,
      seatingCapacity: 40,
      numFloors: 1,
      amenities: ['WiFi', 'USB Charging', 'Air Conditioning'],
      engineType: 'Diesel',
      distributionType: 'Intercity',
      active: true,
    };
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up the created bus model if any
    if (createdBusModelId) {
      try {
        await deleteBusModel({ id: createdBusModelId });
      } catch (error) {
        console.log('Error cleaning up test bus model:', error);
      }
    }

    // Clean up additional model created for deletion test
    if (additionalModelId) {
      try {
        await deleteBusModel({ id: additionalModelId });
      } catch (error) {
        console.log('Error cleaning up additional bus model:', error);
      }
    }

    // Clean up the created bus diagram model if any
    if (createdBusDiagramModelId) {
      try {
        await deleteBusDiagramModel({ id: createdBusDiagramModelId });
      } catch (error) {
        console.log('Error cleaning up test bus diagram model:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new bus model', async () => {
      // Create a new bus model with complete test data
      const response = await createBusModel(testBusModelData);

      // Store the ID for later cleanup
      createdBusModelId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.defaultBusDiagramModelId).toBe(
        testBusModelData.defaultBusDiagramModelId,
      );
      expect(response.manufacturer).toBe(testBusModelData.manufacturer);
      expect(response.model).toBe(testBusModelData.model);
      expect(response.year).toBe(testBusModelData.year);
      expect(response.seatingCapacity).toBe(testBusModelData.seatingCapacity);
      expect(response.numFloors).toBe(testBusModelData.numFloors);
      expect(response.amenities).toEqual(testBusModelData.amenities);
      expect(response.engineType).toBe(testBusModelData.engineType);
      expect(response.distributionType).toBe(testBusModelData.distributionType);
      expect(response.active).toBe(testBusModelData.active);
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();
    });

    test('should retrieve a bus model by ID', async () => {
      const response = await getBusModel({ id: createdBusModelId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusModelId);
      expect(response.defaultBusDiagramModelId).toBe(createdBusDiagramModelId);
      expect(response.manufacturer).toBe(testBusModelData.manufacturer);
      expect(response.model).toBe(testBusModelData.model);
      expect(response.year).toBe(testBusModelData.year);
    });

    test('should list all bus models', async () => {
      const response = await listBusModels();

      expect(response).toBeDefined();
      expect(response.busModels).toBeDefined();
      expect(Array.isArray(response.busModels)).toBe(true);
      expect(response.busModels.length).toBeGreaterThan(0);

      // Find our test model in the list
      const foundModel = response.busModels.find(
        (model) => model.id === createdBusModelId,
      );
      expect(foundModel).toBeDefined();
      expect(foundModel?.manufacturer).toBe(testBusModelData.manufacturer);
    });

    test('should update a bus model', async () => {
      const updateData = {
        manufacturer: 'UpdatedManufacturer',
        model: 'UpdatedModel',
        seatingCapacity: 45,
        amenities: [
          'WiFi',
          'USB Charging',
          'Air Conditioning',
          'Entertainment System',
        ],
        engineType: 'Electric',
      };

      const response = await updateBusModel({
        id: createdBusModelId,
        ...updateData,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusModelId);
      expect(response.manufacturer).toBe(updateData.manufacturer);
      expect(response.model).toBe(updateData.model);
      expect(response.seatingCapacity).toBe(updateData.seatingCapacity);
      expect(response.amenities).toEqual(updateData.amenities);
      expect(response.engineType).toBe(updateData.engineType);
      // Fields not in updateData should remain unchanged
      expect(response.year).toBe(testBusModelData.year);
      expect(response.numFloors).toBe(testBusModelData.numFloors);
      expect(response.defaultBusDiagramModelId).toBe(
        testBusModelData.defaultBusDiagramModelId,
      );
    });

    test('should list bus models with pagination', async () => {
      const pageSize = 10;
      const page = 1;

      const response = await listBusModelsPaginated({
        page,
        pageSize,
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(page);
      expect(response.pagination.pageSize).toBe(pageSize);
      expect(response.pagination.totalCount).toBeGreaterThan(0);
      expect(response.pagination.totalPages).toBeGreaterThan(0);
    });

    test('should delete a bus model', async () => {
      // Create a new bus model specifically for deletion test
      const modelToDelete = {
        defaultBusDiagramModelId: createdBusDiagramModelId,
        manufacturer: 'DeleteTestManufacturer',
        model: 'DeleteTest-1',
        year: 2023,
        seatingCapacity: 40,
        numFloors: 1,
        active: true,
      };

      const createResponse = await createBusModel(modelToDelete);
      additionalModelId = createResponse.id;

      // Verify it was created
      expect(createResponse).toBeDefined();
      expect(createResponse.id).toBeDefined();

      // Delete it
      const deleteResponse = await deleteBusModel({ id: additionalModelId });

      // Verify deletion
      expect(deleteResponse).toBeDefined();
      expect(deleteResponse.id).toBe(additionalModelId);

      // Store the deleted ID to use in the test, but set to 0 for the cleanup handler
      const deletedId = additionalModelId;
      additionalModelId = 0;

      // Verify it's gone (should throw)
      await expect(getBusModel({ id: deletedId })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors when getting non-existent model', async () => {
      await expect(getBusModel({ id: 99999 })).rejects.toThrow();
    });

    test('should handle not found errors when updating non-existent model', async () => {
      await expect(
        updateBusModel({
          id: 99999,
          manufacturer: 'NotFound',
        }),
      ).rejects.toThrow();
    });

    test('should handle not found errors when deleting non-existent model', async () => {
      await expect(deleteBusModel({ id: 99999 })).rejects.toThrow();
    });
  });
});
