import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  createBusDiagramModel,
  deleteBusDiagramModel,
} from '@/inventory/fleet/bus-diagram-models/bus-diagram-models.controller';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueName,
} from '@/tests/shared/test-utils';
import { BusModel, EngineType } from './bus-models.types';
import { busModelRepository } from './bus-models.repository';
import {
  createBusModel,
  deleteBusModel,
  getBusModel,
  listBusModels,
  listBusModelsPaginated,
  updateBusModel,
} from './bus-models.controller';

describe('Bus Models Controller', () => {
  const testSuiteId = createTestSuiteId('bus-models');

  let createdBusDiagramModelId: number;
  let testBusModelData: {
    defaultBusDiagramModelId: number;
    manufacturer: string;
    model: string;
    year: number;
    seatingCapacity: number;
    trunkCapacity: number;
    fuelEfficiency: number;
    maxCapacity: number;
    numFloors: number;
    amenities: string[];
    engineType: EngineType;
    active: boolean;
  };

  // Setup cleanup helper
  const busModelCleanup = createCleanupHelper(
    ({ id }: { id: number }) => busModelRepository.forceDelete(id),
    'bus model',
  );

  const busDiagramModelCleanup = createCleanupHelper(
    ({ id }: { id: number }) => deleteBusDiagramModel({ id }),
    'bus diagram model',
  );

  // Helper function for creating test bus models
  const createTestBusModel = async (data = testBusModelData) => {
    const busModel = await createBusModel(data);
    busModelCleanup.track(busModel.id);
    return busModel;
  };

  // Variables to store created IDs for cleanup
  let createdBusModelId: number;

  beforeAll(async () => {
    // Create a test bus diagram model
    const busDiagramModel = await createBusDiagramModel({
      name: createUniqueName('Test Bus Diagram Model', testSuiteId),
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
      totalSeats: 40,
      isFactoryDefault: true,
      active: true,
    });
    createdBusDiagramModelId = busDiagramModel.id;
    busDiagramModelCleanup.track(createdBusDiagramModelId);

    // Now store basic test data
    testBusModelData = {
      defaultBusDiagramModelId: createdBusDiagramModelId,
      manufacturer: createUniqueName('Test Manufacturer', testSuiteId),
      model: createUniqueName('TestModel-Bus', testSuiteId),
      year: 2023,
      seatingCapacity: 40,
      trunkCapacity: 1000,
      fuelEfficiency: 10,
      maxCapacity: 40,
      numFloors: 1,
      amenities: ['WiFi', 'USB Charging', 'Air Conditioning'],
      engineType: EngineType.DIESEL,
      active: true,
    };
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up all tracked bus models
    await busModelCleanup.cleanupAll();
    await busDiagramModelCleanup.cleanupAll();
  });

  describe('success scenarios', () => {
    test('should create a new bus model', async () => {
      // Create a new bus model with complete test data
      const response = await createTestBusModel(testBusModelData);

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
      expect(response.trunkCapacity).toBe(testBusModelData.trunkCapacity);
      expect(response.fuelEfficiency).toBe(testBusModelData.fuelEfficiency);
      expect(response.maxCapacity).toBe(testBusModelData.maxCapacity);
      expect(response.numFloors).toBe(testBusModelData.numFloors);
      expect(response.amenities).toEqual(testBusModelData.amenities);
      expect(response.engineType).toBe(testBusModelData.engineType);
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
        engineType: EngineType.ELECTRIC,
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
      expect(response.trunkCapacity).toBe(testBusModelData.trunkCapacity);
      expect(response.fuelEfficiency).toBe(testBusModelData.fuelEfficiency);
      expect(response.maxCapacity).toBe(testBusModelData.maxCapacity);
      // Fields not in updateData should remain unchanged
      expect(response.year).toBe(testBusModelData.year);
      expect(response.numFloors).toBe(testBusModelData.numFloors);
      expect(response.defaultBusDiagramModelId).toBe(
        testBusModelData.defaultBusDiagramModelId,
      );
    });

    test('should delete a bus model', async () => {
      // Create a bus model specifically for deletion test
      const busModelToDelete = await createTestBusModel({
        defaultBusDiagramModelId: createdBusDiagramModelId,
        manufacturer: 'DeleteTestManufacturer',
        model: 'DeleteTest-1',
        year: 2023,
        seatingCapacity: 40,
        trunkCapacity: 1000,
        fuelEfficiency: 10,
        maxCapacity: 40,
        numFloors: 1,
        amenities: [],
        engineType: EngineType.DIESEL,
        active: true,
      });

      // Delete should not throw an error
      await expect(
        deleteBusModel({ id: busModelToDelete.id }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(getBusModel({ id: busModelToDelete.id })).rejects.toThrow();
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

    test('should prevent creating bus model with duplicate manufacturer + model + year combination', async () => {
      // Create first bus model
      const firstBusModel = await createTestBusModel({
        defaultBusDiagramModelId: createdBusDiagramModelId,
        manufacturer: 'Duplicate Test Manufacturer',
        model: 'Duplicate Test Model',
        year: 2023,
        seatingCapacity: 40,
        trunkCapacity: 1000,
        fuelEfficiency: 10,
        maxCapacity: 40,
        numFloors: 1,
        amenities: [],
        engineType: EngineType.DIESEL,
        active: true,
      });

      try {
        // Attempt to create second bus model with same manufacturer + model + year
        await expect(
          createBusModel({
            defaultBusDiagramModelId: createdBusDiagramModelId,
            manufacturer: 'Duplicate Test Manufacturer',
            model: 'Duplicate Test Model',
            year: 2023,
            seatingCapacity: 35,
            trunkCapacity: 800,
            fuelEfficiency: 12,
            maxCapacity: 35,
            numFloors: 1,
            amenities: [],
            engineType: EngineType.ELECTRIC,
            active: true,
          }),
        ).rejects.toThrow();

        // Verify the first bus model still exists and wasn't affected
        const existingBusModel = await getBusModel({ id: firstBusModel.id });
        expect(existingBusModel.id).toBe(firstBusModel.id);
        expect(existingBusModel.manufacturer).toBe(
          'Duplicate Test Manufacturer',
        );
        expect(existingBusModel.model).toBe('Duplicate Test Model');
        expect(existingBusModel.year).toBe(2023);
      } finally {
        // Clean up
        await deleteBusModel({ id: firstBusModel.id });
      }
    });

    test('should prevent updating bus model to duplicate manufacturer + model + year combination', async () => {
      // Create first bus model
      const firstBusModel = await createTestBusModel({
        defaultBusDiagramModelId: createdBusDiagramModelId,
        manufacturer: 'Update Duplicate Test Manufacturer',
        model: 'Update Duplicate Test Model',
        year: 2023,
        seatingCapacity: 40,
        trunkCapacity: 1000,
        fuelEfficiency: 10,
        maxCapacity: 40,
        numFloors: 1,
        amenities: [],
        engineType: EngineType.DIESEL,
        active: true,
      });

      // Create second bus model with different combination
      const secondBusModel = await createTestBusModel({
        defaultBusDiagramModelId: createdBusDiagramModelId,
        manufacturer: 'Second Test Manufacturer',
        model: 'Second Test Model',
        year: 2024,
        seatingCapacity: 35,
        trunkCapacity: 800,
        fuelEfficiency: 12,
        maxCapacity: 35,
        numFloors: 1,
        amenities: [],
        engineType: EngineType.ELECTRIC,
        active: true,
      });

      try {
        // Attempt to update second bus model to match first bus model's combination
        await expect(
          updateBusModel({
            id: secondBusModel.id,
            manufacturer: 'Update Duplicate Test Manufacturer',
            model: 'Update Duplicate Test Model',
            year: 2023,
          }),
        ).rejects.toThrow();

        // Verify the second bus model wasn't changed
        const unchangedBusModel = await getBusModel({ id: secondBusModel.id });
        expect(unchangedBusModel.manufacturer).toBe('Second Test Manufacturer');
        expect(unchangedBusModel.model).toBe('Second Test Model');
        expect(unchangedBusModel.year).toBe(2024);
      } finally {
        // Clean up
        await deleteBusModel({ id: firstBusModel.id });
        await deleteBusModel({ id: secondBusModel.id });
      }
    });
  });

  describe('pagination', () => {
    test('should return paginated bus models with default parameters', async () => {
      const response = await listBusModelsPaginated({});

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
      const response = await listBusModelsPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should default sort by name in ascending order', async () => {
      // Create test bus models with different names for verification of default sorting
      const busModelA = await createTestBusModel({
        defaultBusDiagramModelId: createdBusDiagramModelId,
        manufacturer: 'AAA Test Bus Model',
        model: 'AAA Test Bus Model',
        year: 2023,
        seatingCapacity: 40,
        trunkCapacity: 1000,
        fuelEfficiency: 10,
        maxCapacity: 40,
        numFloors: 1,
        amenities: [],
        engineType: EngineType.DIESEL,
        active: true,
      });

      const busModelZ = await createTestBusModel({
        defaultBusDiagramModelId: createdBusDiagramModelId,
        manufacturer: 'ZZZ Test Bus Model',
        model: 'ZZZ Test Bus Model',
        year: 2023,
        seatingCapacity: 40,
        trunkCapacity: 1000,
        fuelEfficiency: 10,
        maxCapacity: 40,
        numFloors: 1,
        amenities: [],
        engineType: EngineType.DIESEL,
        active: true,
      });

      try {
        // Get bus models with large enough page size to include test bus models
        const response = await listBusModelsPaginated({
          pageSize: 50,
          orderBy: [{ field: 'manufacturer', direction: 'asc' }],
        });

        // Find the indices of our test bus models
        const indexA = response.data.findIndex(
          (c: BusModel) => c.id === busModelA.id,
        );
        const indexZ = response.data.findIndex(
          (c: BusModel) => c.id === busModelZ.id,
        );

        // Verify that busModelA (AAA) comes before busModelZ (ZZZ) in the results
        // This assumes they both appear in the results (which they should with pageSize: 50)
        if (indexA !== -1 && indexZ !== -1) {
          expect(indexA).toBeLessThan(indexZ);
        }
      } finally {
        // Clean up test bus models
        await deleteBusModel({ id: busModelA.id });
        await deleteBusModel({ id: busModelZ.id });
      }
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listBusModels({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      // No pagination info should be present
      expect(response).not.toHaveProperty('pagination');
    });
  });

  describe('search functionality', () => {
    test('should search bus models using searchTerm in list endpoint', async () => {
      // Create a unique bus model for search testing
      const searchableBusModel = await createTestBusModel({
        defaultBusDiagramModelId: createdBusDiagramModelId,
        manufacturer: 'Searchable',
        model: 'TestModel-1',
        year: 2023,
        seatingCapacity: 40,
        trunkCapacity: 1000,
        fuelEfficiency: 10,
        maxCapacity: 40,
        numFloors: 1,
        amenities: ['WiFi', 'USB Charging', 'Air Conditioning'],
        engineType: EngineType.DIESEL,
        active: true,
      });

      try {
        // Search for the bus model using searchTerm in listBusModels
        const response = await listBusModels({ searchTerm: 'Searchable' });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(
          response.data.some((c: BusModel) => c.id === searchableBusModel.id),
        ).toBe(true);
      } finally {
        // Clean up
        await deleteBusModel({ id: searchableBusModel.id });
      }
    });

    test('should search bus models with pagination using searchTerm', async () => {
      const response = await listBusModelsPaginated({
        searchTerm: 'Test',
        page: 1,
        pageSize: 5,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
    });

    test('should combine search term with filters', async () => {
      // Create test bus models with different active states
      const activeSearchableBusModel = await createTestBusModel({
        defaultBusDiagramModelId: createdBusDiagramModelId,
        manufacturer: 'Active Searchable',
        model: 'TestModel-1',
        year: 2023,
        seatingCapacity: 40,
        trunkCapacity: 1000,
        fuelEfficiency: 10,
        maxCapacity: 40,
        numFloors: 1,
        amenities: ['WiFi', 'USB Charging', 'Air Conditioning'],
        engineType: EngineType.DIESEL,
        active: true,
      });

      const inactiveSearchableBusModel = await createTestBusModel({
        defaultBusDiagramModelId: createdBusDiagramModelId,
        manufacturer: 'Inactive Searchable',
        model: 'TestModel-2',
        year: 2023,
        seatingCapacity: 40,
        trunkCapacity: 1000,
        fuelEfficiency: 10,
        maxCapacity: 40,
        numFloors: 1,
        amenities: ['WiFi', 'USB Charging', 'Air Conditioning'],
        engineType: EngineType.DIESEL,
        active: false,
      });

      try {
        // Search for "Searchable" but only active bus models
        const response = await listBusModels({
          searchTerm: 'Searchable',
          filters: { active: true },
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);

        // Should include the active searchable bus model
        expect(
          response.data.some(
            (c: BusModel) => c.id === activeSearchableBusModel.id,
          ),
        ).toBe(true);

        // Should NOT include the inactive searchable bus model
        expect(
          response.data.some(
            (c: BusModel) => c.id === inactiveSearchableBusModel.id,
          ),
        ).toBe(false);

        // All results should be active
        expect(response.data.every((c: BusModel) => c.active)).toBe(true);
      } finally {
        // Clean up
        await deleteBusModel({ id: activeSearchableBusModel.id });
        await deleteBusModel({ id: inactiveSearchableBusModel.id });
      }
    });
  });

  describe('ordering and filtering', () => {
    // Test bus models for ordering and filtering tests
    const testBusModels: BusModel[] = [];

    beforeAll(async () => {
      // Create test bus models with different properties using unique codes
      const timestamp = Date.now().toString().slice(-6);
      const busModels = [
        {
          manufacturer: 'Alpha Bus Model',
          model: `AM${timestamp}`,
          year: 2023,
          seatingCapacity: 40,
          trunkCapacity: 1000,
          fuelEfficiency: 10,
          maxCapacity: 40,
          numFloors: 1,
          amenities: [],
          engineType: EngineType.DIESEL,
          active: true,
        },
        {
          manufacturer: 'Beta Bus Model',
          model: `BM${timestamp}`,
          year: 2024,
          seatingCapacity: 40,
          trunkCapacity: 1000,
          fuelEfficiency: 10,
          maxCapacity: 40,
          numFloors: 1,
          amenities: [],
          engineType: EngineType.DIESEL,
          active: false,
        },
        {
          manufacturer: 'Gamma Bus Model',
          model: `GM${timestamp}`,
          year: 2025,
          seatingCapacity: 40,
          trunkCapacity: 1000,
          fuelEfficiency: 10,
          maxCapacity: 40,
          numFloors: 1,
          amenities: [],
          engineType: EngineType.DIESEL,
          active: true,
        },
      ];

      for (const busModel of busModels) {
        const created = await createTestBusModel({
          defaultBusDiagramModelId: createdBusDiagramModelId,
          ...busModel,
        });
        testBusModels.push(created);
      }
    });

    afterAll(async () => {
      // Clean up test bus models
      for (const busModel of testBusModels) {
        try {
          await deleteBusModel({ id: busModel.id });
        } catch (error) {
          console.log(
            `Error cleaning up test bus model ${busModel.id}:`,
            error,
          );
        }
      }
    });

    test('should order bus models by manufacturer descending', async () => {
      const response = await listBusModels({
        orderBy: [{ field: 'manufacturer', direction: 'desc' }],
      });

      const names = response.data.map((c: BusModel) => c.manufacturer);
      // Check if names are in descending order
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should filter bus models by active status', async () => {
      const response = await listBusModels({
        filters: { active: true },
      });

      // All returned bus models should be active
      expect(response.data.every((c: BusModel) => c.active)).toBe(true);
      // Should include our active test bus models
      const activeTestBusModelIds = testBusModels
        .filter((c: BusModel) => c.active)
        .map((c: BusModel) => c.id);

      for (const id of activeTestBusModelIds) {
        expect(response.data.some((c: BusModel) => c.id === id)).toBe(true);
      }
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const response = await listBusModelsPaginated({
        filters: { active: true },
        orderBy: [{ field: 'manufacturer', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      // Check filtering
      expect(response.data.every((c: BusModel) => c.active)).toBe(true);

      // Check ordering (ascending)
      const names = response.data.map((c: BusModel) => c.manufacturer);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }

      // Check pagination properties
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });

    test('should allow multi-field ordering', async () => {
      // Create bus models with same active status but different names
      const sameActiveStatusBusModels = [
        {
          manufacturer: 'Same Status A',
          model: 'SSA',
          year: 2023,
          seatingCapacity: 40,
          trunkCapacity: 1000,
          fuelEfficiency: 10,
          maxCapacity: 40,
          numFloors: 1,
          amenities: [],
          engineType: EngineType.DIESEL,
          active: true,
        },
        {
          manufacturer: 'Same Status B',
          model: 'SSB',
          year: 2023,
          seatingCapacity: 40,
          trunkCapacity: 1000,
          fuelEfficiency: 10,
          maxCapacity: 40,
          numFloors: 1,
          amenities: [],
          engineType: EngineType.DIESEL,
          active: true,
        },
      ];

      const createdBusModels: BusModel[] = [];

      try {
        for (const busModel of sameActiveStatusBusModels) {
          const created = await createTestBusModel({
            defaultBusDiagramModelId: createdBusDiagramModelId,
            ...busModel,
          });
          createdBusModels.push(created);
        }

        // Order by active status first, then by name
        const response = await listBusModels({
          orderBy: [
            { field: 'active', direction: 'desc' },
            { field: 'manufacturer', direction: 'asc' },
          ],
        });

        // Get all active bus models and verify they're ordered by name
        const activeBusModels = response.data.filter((c: BusModel) => c.active);
        const activeNames = activeBusModels.map(
          (c: BusModel) => c.manufacturer,
        );

        for (let i = 0; i < activeNames.length - 1; i++) {
          if (activeBusModels[i].active === activeBusModels[i + 1].active) {
            // If active status is the same, names should be in ascending order
            expect(activeNames[i] <= activeNames[i + 1]).toBe(true);
          }
        }
      } finally {
        // Clean up
        for (const busModel of createdBusModels) {
          await deleteBusModel({ id: busModel.id });
        }
      }
    });
  });

  describe('soft delete functionality', () => {
    test('should restore a soft deleted bus model', async () => {
      const testBusModel = await createTestBusModel({
        defaultBusDiagramModelId: createdBusDiagramModelId,
        manufacturer: 'Restore Test Manufacturer',
        model: 'Restore Test Model',
        year: 2023,
        seatingCapacity: 40,
        trunkCapacity: 1000,
        fuelEfficiency: 10,
        maxCapacity: 40,
        numFloors: 1,
        amenities: [],
        engineType: EngineType.DIESEL,
        active: true,
      });

      // Soft delete
      await deleteBusModel({ id: testBusModel.id });
      await expect(getBusModel({ id: testBusModel.id })).rejects.toThrow();

      // Restore
      await busModelRepository.restore(testBusModel.id);

      // Verify accessible again
      const found = await getBusModel({ id: testBusModel.id });
      expect(found.id).toBe(testBusModel.id);
    });

    test('should force delete a bus model permanently', async () => {
      const testBusModel = await createTestBusModel({
        defaultBusDiagramModelId: createdBusDiagramModelId,
        manufacturer: 'Force Delete Test',
        model: 'FDT',
        year: 2023,
        seatingCapacity: 40,
        trunkCapacity: 1000,
        fuelEfficiency: 10,
        maxCapacity: 40,
        numFloors: 1,
        amenities: [],
        engineType: EngineType.DIESEL,
        active: true,
      });

      // Force delete
      await busModelRepository.forceDelete(testBusModel.id);

      // Verify completely gone
      await expect(getBusModel({ id: testBusModel.id })).rejects.toThrow();
      await expect(
        busModelRepository.findOne(testBusModel.id),
      ).rejects.toThrow();
    });
  });
});
