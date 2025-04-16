import { expect, describe, test, beforeAll, afterAll } from 'vitest';
import {
  createBus,
  getBus,
  listBuses,
  listBusesPaginated,
  updateBus,
  deleteBus,
  getBusesByModel,
  getAvailableBuses,
  getBusesByStatus,
  updateBusStatus,
  getAllowedBusStatusTransitions,
} from './buses.controller';
import { BusStatus } from './buses.types';
import {
  createBusModel,
  deleteBusModel,
} from '../bus-models/bus-models.controller';

describe('Buses Controller', () => {
  // Test data and setup
  let busModelId: number; // We need a valid bus model ID for bus tests

  const testBus = {
    registrationNumber: 'TEST001',
    modelId: 0, // This will be populated in beforeAll
    typeCode: 100,
    brandCode: 'TST',
    modelCode: 'MDL',
    maxCapacity: 50,
    economicNumber: 'ECO123',
    licensePlateType: 'STANDARD',
    circulationCard: 'CC12345',
    year: 2023,
    sctPermit: 'SCT12345',
    vehicleId: 'VEH12345',
    engineNumber: 'ENG12345',
    serialNumber: 'SER12345',
    chassisNumber: 'CHS12345',
    baseCode: 'BASE001',
    fuelEfficiency: 8.5,
    serviceType: 'EXECUTIVE',
    commercialTourism: false,
    available: true,
    tourism: false,
    status: BusStatus.ACTIVE,
    gpsId: 'GPS12345',
    active: true,
  };

  // Variable to store created IDs for cleanup
  let createdBusId: number;

  // Create a test bus model before running the bus tests
  beforeAll(async () => {
    // Create a temporary bus model to use for the bus tests
    const busModel = await createBusModel({
      manufacturer: 'TestManufacturer',
      model: 'TestModel-Bus',
      year: 2023,
      seatingCapacity: 40,
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
      amenities: [],
      active: true,
    });

    busModelId = busModel.id;
    testBus.modelId = busModelId; // Update the test bus with the real model ID
  });

  afterAll(async () => {
    // Clean up the created bus if any
    if (createdBusId) {
      try {
        await deleteBus({ id: createdBusId });
      } catch (error) {
        console.log('Error cleaning up test bus:', error);
      }
    }

    // Clean up the created bus model if any
    if (busModelId) {
      try {
        await deleteBusModel({ id: busModelId });
      } catch (error) {
        console.log('Error cleaning up test bus model:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new bus', async () => {
      // Create a new bus
      const response = await createBus(testBus);

      // Store the ID for later cleanup
      createdBusId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.registrationNumber).toBe(testBus.registrationNumber);
      expect(response.modelId).toBe(testBus.modelId);
      expect(response.typeCode).toBe(testBus.typeCode);
      expect(response.brandCode).toBe(testBus.brandCode);
      expect(response.modelCode).toBe(testBus.modelCode);
      expect(response.maxCapacity).toBe(testBus.maxCapacity);
      expect(response.status).toBe(testBus.status);
      expect(response.active).toBe(testBus.active);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a bus by ID', async () => {
      const response = await getBus({ id: createdBusId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusId);
      expect(response.registrationNumber).toBe(testBus.registrationNumber);
      expect(response.modelId).toBe(testBus.modelId);
    });

    test('should list all buses', async () => {
      const response = await listBuses();

      expect(response).toBeDefined();
      expect(response.buses).toBeDefined();
      expect(Array.isArray(response.buses)).toBe(true);
      expect(response.buses.length).toBeGreaterThan(0);

      // Find our test bus in the list
      const foundBus = response.buses.find((bus) => bus.id === createdBusId);
      expect(foundBus).toBeDefined();
      expect(foundBus?.registrationNumber).toBe(testBus.registrationNumber);
    });

    test('should update a bus', async () => {
      const updatedRegistrationNumber = 'UPDATED001';
      const response = await updateBus({
        id: createdBusId,
        registrationNumber: updatedRegistrationNumber,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusId);
      expect(response.registrationNumber).toBe(updatedRegistrationNumber);
    });

    test('should update a bus status', async () => {
      const newStatus = BusStatus.MAINTENANCE;
      const response = await updateBusStatus({
        id: createdBusId,
        status: newStatus,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusId);
      expect(response.status).toBe(newStatus);
    });

    test('should retrieve allowed status transitions for a bus', async () => {
      const response = await getAllowedBusStatusTransitions({
        id: createdBusId,
      });

      expect(response).toBeDefined();
      expect(response.allowedTransitions).toBeDefined();
      expect(Array.isArray(response.allowedTransitions)).toBe(true);
    });
  });

  describe('findAllPaginated', () => {
    test('should return paginated buses with default parameters', async () => {
      const response = await listBusesPaginated({});

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
      const response = await listBusesPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('filtering methods', () => {
    test('should retrieve buses by model ID', async () => {
      const response = await getBusesByModel({ modelId: testBus.modelId });

      expect(response).toBeDefined();
      expect(response.buses).toBeDefined();
      expect(Array.isArray(response.buses)).toBe(true);
    });

    test('should retrieve available buses', async () => {
      const response = await getAvailableBuses();

      expect(response).toBeDefined();
      expect(response.buses).toBeDefined();
      expect(Array.isArray(response.buses)).toBe(true);
    });

    test('should retrieve buses by status', async () => {
      const response = await getBusesByStatus({
        status: BusStatus.MAINTENANCE,
      });

      expect(response).toBeDefined();
      expect(response.buses).toBeDefined();
      expect(Array.isArray(response.buses)).toBe(true);
    });
  });
});
