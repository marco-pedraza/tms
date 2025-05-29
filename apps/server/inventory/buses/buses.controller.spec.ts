import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { NotFoundError } from '@repo/base-repo';
import { createBusDiagramModelZone } from '../bus-diagram-model-zones/bus-diagram-model-zones.controller';
import {
  createBusDiagramModel,
  deleteBusDiagramModel,
} from '../bus-diagram-models/bus-diagram-models.controller';
import {
  createBusModel,
  deleteBusModel,
} from '../bus-models/bus-models.controller';
import { seatDiagramZoneRepository } from '../seat-diagram-zones/seat-diagram-zones.repository';
import { seatDiagramRepository } from '../seat-diagrams/seat-diagrams.repository';
import { Bus, BusStatus, CreateBusPayload } from './buses.types';
import {
  createBus,
  deleteBus,
  getAllowedBusStatusTransitions,
  getAvailableBuses,
  getBus,
  getBusesByModel,
  getBusesByStatus,
  listBuses,
  listBusesPaginated,
  searchBuses,
  searchBusesPaginated,
  updateBus,
  updateBusStatus,
} from './buses.controller';

describe('Buses Controller', () => {
  // Test data and setup
  let busModelId: number; // We need a valid bus model ID for bus tests
  let defaultBusDiagramModelId: number; // We need a valid default bus diagram model ID for bus tests
  let alternativeBusModelId: number; // Alternative bus model for testing model change
  let alternativeBusDiagramModelId: number; // Alternative bus diagram model

  const testBus: CreateBusPayload = {
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

  // Variables to store created IDs for cleanup
  let createdBusId: number;
  let createdSeatDiagramId: number;
  let updatedSeatDiagramId: number; // To track new seat diagram ID after model update

  // Create test dependencies before running the bus tests
  beforeAll(async () => {
    // Create a temporary bus diagram model to use for the bus tests
    const busDiagramModel = await createBusDiagramModel({
      name: 'Test Bus Diagram Model',
      description: 'Test Bus Diagram Model Description',
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

    defaultBusDiagramModelId = busDiagramModel.id;

    // Create a zone for the bus diagram model
    await createBusDiagramModelZone({
      busDiagramModelId: busDiagramModel.id,
      name: 'Premium Zone',
      rowNumbers: [1, 2, 3],
      priceMultiplier: 1.5,
    });

    // Create a temporary bus model to use for the bus tests
    const busModel = await createBusModel({
      defaultBusDiagramModelId: busDiagramModel.id,
      manufacturer: 'TestManufacturer',
      model: 'TestModel-Bus',
      year: 2023,
      seatingCapacity: 40,
      numFloors: 1,
      amenities: [],
      active: true,
    });

    busModelId = busModel.id;

    // Create an alternative bus diagram model with different configuration
    const alternativeBusDiagramModel = await createBusDiagramModel({
      name: 'Alternative Bus Diagram Model',
      description: 'Alternative Bus Diagram Model Description',
      maxCapacity: 72,
      numFloors: 2,
      seatsPerFloor: [
        {
          floorNumber: 1,
          numRows: 8,
          seatsLeft: 2,
          seatsRight: 2,
        },
        {
          floorNumber: 2,
          numRows: 10,
          seatsLeft: 1,
          seatsRight: 3,
        },
      ],
      bathroomRows: [
        {
          floorNumber: 1,
          rowNumber: 9,
        },
      ],
      totalSeats: 72,
      isFactoryDefault: true,
      active: true,
    });

    alternativeBusDiagramModelId = alternativeBusDiagramModel.id;

    // Create different zones for the alternative bus diagram model
    await createBusDiagramModelZone({
      busDiagramModelId: alternativeBusDiagramModel.id,
      name: 'VIP Zone',
      rowNumbers: [1, 2],
      priceMultiplier: 2.0,
    });

    await createBusDiagramModelZone({
      busDiagramModelId: alternativeBusDiagramModel.id,
      name: 'Standard Zone',
      rowNumbers: [3, 4, 5, 6, 7, 8],
      priceMultiplier: 1.0,
    });

    // Create an alternative bus model
    const alternativeBusModel = await createBusModel({
      defaultBusDiagramModelId: alternativeBusDiagramModel.id,
      manufacturer: 'AlternativeManufacturer',
      model: 'AlternativeModel-Bus',
      year: 2024,
      seatingCapacity: 72,
      numFloors: 2,
      amenities: ['WiFi', 'USB'],
      active: true,
    });

    alternativeBusModelId = alternativeBusModel.id;

    // Update the test bus with the real IDs
    testBus.modelId = busModelId;
  });

  afterAll(async () => {
    // Clean up the created bus and seat diagram if any
    if (createdBusId) {
      try {
        await deleteBus({ id: createdBusId });
      } catch {
        // Silent error handling for cleanup
      }
    }

    // Clean up the updated seat diagram if any
    if (updatedSeatDiagramId) {
      try {
        await seatDiagramRepository.delete(updatedSeatDiagramId);
      } catch {
        // Silent error handling for cleanup
      }
    }

    // Clean up the created seat diagram
    if (createdSeatDiagramId) {
      try {
        await seatDiagramRepository.delete(createdSeatDiagramId);
      } catch {
        // Silent error handling for cleanup
      }
    }

    // Clean up the created bus model if any
    if (busModelId) {
      try {
        await deleteBusModel({ id: busModelId });
      } catch {
        // Silent error handling for cleanup
      }
    }

    // Clean up the created bus diagram model if any
    if (defaultBusDiagramModelId) {
      try {
        await deleteBusDiagramModel({ id: defaultBusDiagramModelId });
      } catch {
        // Silent error handling for cleanup
      }
    }

    // Clean up the alternative bus model
    if (alternativeBusModelId) {
      try {
        await deleteBusModel({ id: alternativeBusModelId });
      } catch {
        // Silent error handling for cleanup
      }
    }

    // Clean up the alternative bus diagram model
    if (alternativeBusDiagramModelId) {
      try {
        await deleteBusDiagramModel({ id: alternativeBusDiagramModelId });
      } catch {
        // Silent error handling for cleanup
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new bus with seat diagram and zones', async () => {
      // Create a new bus
      const response = await createBus(testBus);

      // Store the IDs for later cleanup
      createdBusId = response.id;
      createdSeatDiagramId = response.seatDiagramId;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.registrationNumber).toBe(testBus.registrationNumber);
      expect(response.modelId).toBe(testBus.modelId);
      expect(response.seatDiagramId).toBeDefined();
      expect(response.typeCode).toBe(testBus.typeCode);
      expect(response.brandCode).toBe(testBus.brandCode);
      expect(response.modelCode).toBe(testBus.modelCode);
      expect(response.maxCapacity).toBe(testBus.maxCapacity);
      expect(response.status).toBe(testBus.status);
      expect(response.active).toBe(testBus.active);
      expect(response.createdAt).toBeDefined();

      // Verify the seat diagram was created correctly
      const seatDiagram = await seatDiagramRepository.findOne(
        response.seatDiagramId,
      );
      expect(seatDiagram).toBeDefined();
      expect(seatDiagram.name).toContain(testBus.registrationNumber);
      expect(seatDiagram.maxCapacity).toBe(40); // From the bus model's seating capacity
      expect(seatDiagram.numFloors).toBe(1);
      expect(seatDiagram.totalSeats).toBe(40);
      expect(seatDiagram.active).toBe(true);

      // Verify that zones were properly cloned to the seat diagram
      const diagramZones = await seatDiagramZoneRepository.findAll({
        filters: {
          seatDiagramId: response.seatDiagramId,
        },
      });

      expect(diagramZones).toBeDefined();
      expect(diagramZones.length).toBe(1); // We created one zone for the layout model

      const diagramZone = diagramZones[0];
      expect(diagramZone.name).toBe('Premium Zone');
      expect(diagramZone.rowNumbers).toEqual([1, 2, 3]);
      expect(Number(diagramZone.priceMultiplier)).toBe(1.5);
    });

    test('should retrieve a bus by ID', async () => {
      const response = await getBus({ id: createdBusId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusId);
      expect(response.registrationNumber).toBe(testBus.registrationNumber);
      expect(response.modelId).toBe(testBus.modelId);
    });

    test('should list all buses', async () => {
      const response = await listBuses({});

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

    test('should update bus seat diagram when model is changed', async () => {
      // Store the original seat diagram ID for comparison
      const originalSeatDiagramId = createdSeatDiagramId;

      // Verify that the original diagram zones exist before the change
      const originalZones = await seatDiagramZoneRepository.findAll({
        filters: {
          seatDiagramId: originalSeatDiagramId,
        },
      });
      expect(originalZones.length).toBeGreaterThan(0); // Ensure there were zones

      // Update the bus with a new model
      const response = await updateBus({
        id: createdBusId,
        modelId: alternativeBusModelId,
      });

      // Verify bus is updated with the new model
      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusId);
      expect(response.modelId).toBe(alternativeBusModelId);

      // Verify seat diagram ID has changed
      expect(response.seatDiagramId).toBeDefined();
      expect(response.seatDiagramId).not.toBe(originalSeatDiagramId);

      // Store the new seat diagram ID for cleanup
      updatedSeatDiagramId = response.seatDiagramId;

      // Verify the new seat diagram was created correctly
      const seatDiagram =
        await seatDiagramRepository.findOne(updatedSeatDiagramId);
      expect(seatDiagram).toBeDefined();
      expect(seatDiagram.busDiagramModelId).toBe(alternativeBusDiagramModelId);
      expect(seatDiagram.maxCapacity).toBe(72); // Alternative model has 72 seats
      expect(seatDiagram.numFloors).toBe(2); // Alternative model has 2 floors
      expect(seatDiagram.totalSeats).toBe(72);

      // Verify that new zones were properly created for the seat diagram
      const diagramZones = await seatDiagramZoneRepository.findAll({
        filters: {
          seatDiagramId: updatedSeatDiagramId,
        },
      });

      expect(diagramZones).toBeDefined();
      expect(diagramZones.length).toBe(2); // We created two zones for the alternative layout

      // Find and verify the VIP zone using repository's findAll with specific filters
      const vipZones = await seatDiagramZoneRepository.findAll({
        filters: {
          seatDiagramId: updatedSeatDiagramId,
          name: 'VIP Zone',
        },
      });
      const vipZone = vipZones.length > 0 ? vipZones[0] : null;
      expect(vipZone).toBeDefined();
      expect(vipZone?.rowNumbers).toEqual([1, 2]);
      expect(Number(vipZone?.priceMultiplier)).toBe(2.0);

      // Find and verify the Standard zone using repository's findAll with specific filters
      const standardZones = await seatDiagramZoneRepository.findAll({
        filters: {
          seatDiagramId: updatedSeatDiagramId,
          name: 'Standard Zone',
        },
      });
      const standardZone = standardZones.length > 0 ? standardZones[0] : null;
      expect(standardZone).toBeDefined();
      expect(standardZone?.rowNumbers).toEqual([3, 4, 5, 6, 7, 8]);
      expect(Number(standardZone?.priceMultiplier)).toBe(1.0);

      // Verify that the original diagram zones were deleted
      const deletedDiagramZones = await seatDiagramZoneRepository.findAll({
        filters: {
          seatDiagramId: originalSeatDiagramId,
        },
      });
      expect(deletedDiagramZones.length).toBe(0); // No zones from the previous diagram should remain

      // Verify that the original diagram was deleted
      await expect(
        seatDiagramRepository.findOne(originalSeatDiagramId),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('pagination', () => {
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

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listBuses({});

      expect(response.buses).toBeDefined();
      expect(Array.isArray(response.buses)).toBe(true);
      expect(response.buses.length).toBeGreaterThan(0);
      // No pagination info should be present
      expect(response).not.toHaveProperty('pagination');
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

  describe('search functionality', () => {
    test('should search buses', async () => {
      // Create a unique bus for search testing
      const searchableBus = await createBus({
        registrationNumber: 'SEARCH123',
        modelId: testBus.modelId,
        economicNumber: 'SEARCHABLE',
      });

      try {
        // Search for the bus by term
        const response = await searchBuses({ term: 'SEARCH' });

        expect(response.buses).toBeDefined();
        expect(Array.isArray(response.buses)).toBe(true);
        expect(response.buses.some((b) => b.id === searchableBus.id)).toBe(
          true,
        );
      } finally {
        // Clean up
        await deleteBus({ id: searchableBus.id });
      }
    });

    test('should search buses with pagination', async () => {
      const response = await searchBusesPaginated({
        term: 'TEST',
        page: 1,
        pageSize: 5,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
    });
  });

  describe('ordering and filtering', () => {
    // Test buses for ordering and filtering tests
    const testBuses: Bus[] = [];

    beforeAll(async () => {
      // Create test buses with different properties
      const buses = [
        {
          registrationNumber: 'ORDR001',
          modelId: testBus.modelId,
          economicNumber: 'ALPHA',
          status: BusStatus.ACTIVE,
          active: true,
        },
        {
          registrationNumber: 'ORDR002',
          modelId: testBus.modelId,
          economicNumber: 'BETA',
          status: BusStatus.MAINTENANCE,
          active: false,
        },
        {
          registrationNumber: 'ORDR003',
          modelId: testBus.modelId,
          economicNumber: 'GAMMA',
          status: BusStatus.ACTIVE,
          active: true,
        },
      ];

      for (const bus of buses) {
        const created = await createBus(bus);
        testBuses.push(created);
      }
    });

    afterAll(async () => {
      // Clean up test buses
      for (const bus of testBuses) {
        try {
          await deleteBus({ id: bus.id });
        } catch {
          // Silent error handling for cleanup
        }
      }
    });

    test('should order buses by registration number descending', async () => {
      const response = await listBuses({
        orderBy: [{ field: 'registrationNumber', direction: 'desc' }],
      });

      const regNumbers = response.buses.map((b) => b.registrationNumber);
      // Check if registration numbers are in descending order
      for (let i = 0; i < regNumbers.length - 1; i++) {
        expect(regNumbers[i] >= regNumbers[i + 1]).toBe(true);
      }
    });

    test('should filter buses by active status', async () => {
      const response = await listBuses({
        filters: { active: true },
      });

      // All returned buses should be active
      expect(response.buses.every((b) => b.active === true)).toBe(true);
      // Should include our active test buses
      const activeTestBusIds = testBuses
        .filter((b) => b.active)
        .map((b) => b.id);

      for (const id of activeTestBusIds) {
        expect(response.buses.some((b) => b.id === id)).toBe(true);
      }
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const response = await listBusesPaginated({
        filters: { active: true },
        orderBy: [{ field: 'registrationNumber', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      // Check filtering
      expect(response.data.every((b) => b.active === true)).toBe(true);

      // Check ordering (ascending)
      const regNumbers = response.data.map((b) => b.registrationNumber);
      for (let i = 0; i < regNumbers.length - 1; i++) {
        expect(regNumbers[i] <= regNumbers[i + 1]).toBe(true);
      }

      // Check pagination properties
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });

    test('should allow multi-field ordering', async () => {
      // Create buses with same active status but different registration numbers
      const sameActiveStatusBuses = [
        {
          registrationNumber: 'MULTI1',
          modelId: testBus.modelId,
          economicNumber: 'MULTI-A',
          status: BusStatus.ACTIVE,
          active: true,
        },
        {
          registrationNumber: 'MULTI2',
          modelId: testBus.modelId,
          economicNumber: 'MULTI-B',
          status: BusStatus.ACTIVE,
          active: true,
        },
      ];

      const createdBuses: Bus[] = [];

      try {
        for (const bus of sameActiveStatusBuses) {
          const created = await createBus(bus);
          createdBuses.push(created);
        }

        // Order by active status first, then by registration number
        const response = await listBuses({
          orderBy: [
            { field: 'active', direction: 'desc' },
            { field: 'registrationNumber', direction: 'asc' },
          ],
        });

        // Get all active buses and verify they're ordered by registration number
        const activeBuses = response.buses.filter((b) => b.active === true);
        const activeRegNumbers = activeBuses.map((b) => b.registrationNumber);

        for (let i = 0; i < activeRegNumbers.length - 1; i++) {
          if (activeBuses[i].active === activeBuses[i + 1].active) {
            // If active status is the same, registration numbers should be in ascending order
            expect(activeRegNumbers[i] <= activeRegNumbers[i + 1]).toBe(true);
          }
        }
      } finally {
        // Clean up
        for (const bus of createdBuses) {
          await deleteBus({ id: bus.id });
        }
      }
    });
  });
});
