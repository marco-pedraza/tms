import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { NotFoundError } from '@repo/base-repo';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueCode,
  createUniqueName,
} from '../../tests/shared/test-utils';
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
import type { CreateBusPayload } from './buses.types';
import { BusStatus } from './buses.types';
import { busRepository } from './buses.repository';
import {
  createBus,
  deleteBus,
  getBus,
  listBusValidNextStatuses,
  listBuses,
  listBusesPaginated,
  updateBus,
} from './buses.controller';

describe('Buses Controller', () => {
  const testSuiteId = createTestSuiteId('buses');

  // Test data and setup
  let busModelId: number;
  let alternativeBusModelId: number;
  let alternativeBusDiagramModelId: number;
  let createdBusId: number;

  // Setup cleanup helpers
  // Use forceDelete for buses since they use soft delete and cause foreign key issues
  const busCleanup = createCleanupHelper(
    ({ id }: { id: number }) => busRepository.forceDelete(id),
    'bus',
  );

  const seatDiagramCleanup = createCleanupHelper(
    ({ id }) => seatDiagramRepository.delete(id),
    'seat diagram',
  );

  const busModelCleanup = createCleanupHelper(
    ({ id }) => deleteBusModel({ id }),
    'bus model',
  );

  const busDiagramModelCleanup = createCleanupHelper(
    ({ id }) => deleteBusDiagramModel({ id }),
    'bus diagram model',
  );

  beforeAll(async () => {
    // Create test bus diagram model
    const busDiagramModel = await createBusDiagramModel({
      name: createUniqueName('Test Bus Diagram Model', testSuiteId),
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
      totalSeats: 40,
      isFactoryDefault: true,
      active: true,
    });

    busDiagramModelCleanup.track(busDiagramModel.id);

    // Create a zone for the bus diagram model
    await createBusDiagramModelZone({
      busDiagramModelId: busDiagramModel.id,
      name: 'Premium Zone',
      rowNumbers: [1, 2, 3],
      priceMultiplier: 1.5,
    });

    // Create test bus model
    const busModel = await createBusModel({
      defaultBusDiagramModelId: busDiagramModel.id,
      manufacturer: 'TestManufacturer',
      model: createUniqueName('TestModel-Bus', testSuiteId),
      year: 2023,
      seatingCapacity: 40,
      numFloors: 1,
      amenities: [],
      active: true,
    });

    busModelId = busModelCleanup.track(busModel.id);

    // Create alternative bus diagram model
    const alternativeBusDiagramModel = await createBusDiagramModel({
      name: createUniqueName('Alternative Bus Diagram Model', testSuiteId),
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
      totalSeats: 72,
      isFactoryDefault: true,
      active: true,
    });

    alternativeBusDiagramModelId = busDiagramModelCleanup.track(
      alternativeBusDiagramModel.id,
    );

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

    // Create alternative bus model
    const alternativeBusModel = await createBusModel({
      defaultBusDiagramModelId: alternativeBusDiagramModel.id,
      manufacturer: 'AlternativeManufacturer',
      model: createUniqueName('AlternativeModel-Bus', testSuiteId),
      year: 2024,
      seatingCapacity: 72,
      numFloors: 2,
      amenities: ['WiFi', 'USB'],
      active: true,
    });

    alternativeBusModelId = busModelCleanup.track(alternativeBusModel.id);
  });

  afterAll(async () => {
    // Clean up in proper dependency order to avoid orphaned entities
    //
    // Dependencies chain:
    // buses → seat_diagrams, bus_models
    // seat_diagrams → bus_diagram_models
    // bus_models → bus_diagram_models
    // bus_seats → seat_diagrams (CASCADE delete)
    // seat_diagram_zones → seat_diagrams (CASCADE delete)
    //
    // Cleanup order (using forceDelete for buses to handle soft delete):
    // 1. buses (free up references to seat_diagrams and bus_models)
    await busCleanup.cleanupAll();
    // 2. seat_diagrams (bus_seats and seat_diagram_zones deleted by CASCADE)
    await seatDiagramCleanup.cleanupAll();
    // 3. bus_models (free up references to bus_diagram_models)
    await busModelCleanup.cleanupAll();
    // 4. bus_diagram_models (root entities, no dependencies)
    await busDiagramModelCleanup.cleanupAll();
  });

  describe('success scenarios', () => {
    test('should create a new bus with seat diagram and zones', async () => {
      const testBus: CreateBusPayload = {
        registrationNumber: createUniqueCode('TEST', 3),
        modelId: busModelId,
        economicNumber: createUniqueCode('ECO', 3),
        licensePlateType: 'STANDARD',
        licensePlateNumber: createUniqueCode('PL', 5),
        circulationCard: createUniqueCode('CC', 5),
        availableForTurismOnly: false,
        status: BusStatus.ACTIVE,
        purchaseDate: new Date(),
        expirationDate: new Date(),
        sctPermit: createUniqueCode('SCT', 5),
        vehicleId: createUniqueCode('VEH', 5),
        engineNumber: createUniqueCode('ENG', 5),
        serialNumber: createUniqueCode('SER', 5),
        chassisNumber: createUniqueCode('CHS', 5),
        grossVehicleWeight: 15000,
        currentKilometer: 50000,
        gpsId: createUniqueCode('GPS', 5),
        seatDiagramId: 0, // This will be set by the controller
        active: true,
      };

      const response = await createBus(testBus);
      createdBusId = busCleanup.track(response.id);
      seatDiagramCleanup.track(response.seatDiagramId);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.registrationNumber).toBe(testBus.registrationNumber);
      expect(response.modelId).toBe(testBus.modelId);
      expect(response.seatDiagramId).toBeDefined();
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

    test('should retrieve a bus by ID and handle basic CRUD operations', async () => {
      const response = await getBus({ id: createdBusId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusId);
      expect(response.registrationNumber).toBeDefined();
      expect(response.modelId).toBe(busModelId);

      // Test update operations
      const updatedRegistrationNumber = createUniqueCode('UPD', 3);
      const updateResponse = await updateBus({
        id: createdBusId,
        registrationNumber: updatedRegistrationNumber,
        status: BusStatus.MAINTENANCE,
      });

      expect(updateResponse.registrationNumber).toBe(updatedRegistrationNumber);
      expect(updateResponse.status).toBe(BusStatus.MAINTENANCE);

      // Test status transitions
      const statusResponse = await listBusValidNextStatuses({
        id: createdBusId,
      });
      expect(statusResponse.data).toBeDefined();
      expect(Array.isArray(statusResponse.data)).toBe(true);
    });

    test('should list buses and include created bus', async () => {
      const response = await listBuses({});

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      // Find our test bus in the list
      const foundBus = response.data.find((bus) => bus.id === createdBusId);
      expect(foundBus).toBeDefined();
      expect(foundBus?.id).toBe(createdBusId);
    });

    test('should update bus seat diagram when model is changed', async () => {
      const originalBus = await getBus({ id: createdBusId });
      const originalSeatDiagramId = originalBus.seatDiagramId;

      // Update the bus with a new model
      const response = await updateBus({
        id: createdBusId,
        modelId: alternativeBusModelId,
      });

      expect(response.modelId).toBe(alternativeBusModelId);
      expect(response.seatDiagramId).not.toBe(originalSeatDiagramId);

      // Track new seat diagram for cleanup
      seatDiagramCleanup.track(response.seatDiagramId);

      // Verify the new seat diagram configuration
      const seatDiagram = await seatDiagramRepository.findOne(
        response.seatDiagramId,
      );
      expect(seatDiagram.busDiagramModelId).toBe(alternativeBusDiagramModelId);
      expect(seatDiagram.maxCapacity).toBe(72);
      expect(seatDiagram.numFloors).toBe(2);
      expect(seatDiagram.totalSeats).toBe(72);

      // Verify that new zones were properly created (2 zones for alternative layout)
      const diagramZones = await seatDiagramZoneRepository.findAll({
        filters: { seatDiagramId: response.seatDiagramId },
      });
      expect(diagramZones.length).toBe(2);

      // Verify original diagram was deleted
      await expect(
        seatDiagramRepository.findOne(originalSeatDiagramId),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors for all operations', async () => {
      const nonExistentId = 99999;

      await expect(getBus({ id: nonExistentId })).rejects.toThrow();
      await expect(
        updateBus({ id: nonExistentId, registrationNumber: 'TEST' }),
      ).rejects.toThrow();
      await expect(deleteBus({ id: nonExistentId })).rejects.toThrow();
    });

    test('should handle validation errors', async () => {
      // Test duplicate registration number
      const duplicateRegNumber = createUniqueCode('DUP', 3);
      const firstBus = await createBus({
        registrationNumber: duplicateRegNumber,
        modelId: busModelId,
        economicNumber: createUniqueCode('ECO', 3),
        licensePlateType: 'STANDARD',
        licensePlateNumber: createUniqueCode('PL', 5),
        circulationCard: createUniqueCode('CC', 5),
        availableForTurismOnly: false,
        status: BusStatus.ACTIVE,
        purchaseDate: new Date(),
        expirationDate: new Date(),
        sctPermit: createUniqueCode('SCT', 5),
        vehicleId: createUniqueCode('VEH', 5),
        engineNumber: createUniqueCode('ENG', 5),
        serialNumber: createUniqueCode('SER', 5),
        chassisNumber: createUniqueCode('CHS', 5),
        grossVehicleWeight: 15000,
        currentKilometer: 50000,
        gpsId: createUniqueCode('GPS', 5),
        seatDiagramId: 0, // This will be set by the controller
        active: true,
      });

      // Track the bus and its seat diagram for cleanup
      busCleanup.track(firstBus.id);
      seatDiagramCleanup.track(firstBus.seatDiagramId);

      // Should reject duplicate registration number
      await expect(
        createBus({
          registrationNumber: duplicateRegNumber,
          modelId: busModelId,
          economicNumber: createUniqueCode('ECO2', 3),
          licensePlateType: 'STANDARD',
          licensePlateNumber: createUniqueCode('PL2', 5),
          circulationCard: createUniqueCode('CC2', 5),
          availableForTurismOnly: false,
          status: BusStatus.ACTIVE,
          purchaseDate: new Date(),
          expirationDate: new Date(),
          sctPermit: createUniqueCode('SCT2', 5),
          vehicleId: createUniqueCode('VEH2', 5),
          engineNumber: createUniqueCode('ENG2', 5),
          serialNumber: createUniqueCode('SER2', 5),
          chassisNumber: createUniqueCode('CHS2', 5),
          grossVehicleWeight: 12000,
          currentKilometer: 30000,
          gpsId: createUniqueCode('GPS2', 5),
          seatDiagramId: 0, // This will be set by the controller
          active: true,
        }),
      ).rejects.toThrow();

      // Test invalid model ID
      await expect(
        createBus({
          registrationNumber: createUniqueCode('INV', 3),
          modelId: 99999,
          economicNumber: createUniqueCode('ECO3', 3),
          licensePlateType: 'STANDARD',
          licensePlateNumber: createUniqueCode('PL3', 5),
          circulationCard: createUniqueCode('CC3', 5),
          availableForTurismOnly: false,
          status: BusStatus.ACTIVE,
          purchaseDate: new Date(),
          expirationDate: new Date(),
          sctPermit: createUniqueCode('SCT3', 5),
          vehicleId: createUniqueCode('VEH3', 5),
          engineNumber: createUniqueCode('ENG3', 5),
          serialNumber: createUniqueCode('SER3', 5),
          chassisNumber: createUniqueCode('CHS3', 5),
          grossVehicleWeight: 15000,
          currentKilometer: 50000,
          gpsId: createUniqueCode('GPS3', 5),
          seatDiagramId: 0, // This will be set by the controller
          active: true,
        }),
      ).rejects.toThrow();
    });
  });

  describe('pagination and listing', () => {
    test('should handle both paginated and non-paginated responses', async () => {
      // Test paginated response
      const paginatedResponse = await listBusesPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(paginatedResponse.data).toBeDefined();
      expect(Array.isArray(paginatedResponse.data)).toBe(true);
      expect(paginatedResponse.pagination).toBeDefined();
      expect(paginatedResponse.pagination.currentPage).toBe(1);
      expect(paginatedResponse.pagination.pageSize).toBe(5);
      expect(paginatedResponse.data.length).toBeLessThanOrEqual(5);

      // Test non-paginated response (for dropdowns)
      const listResponse = await listBuses({});
      expect(listResponse.data).toBeDefined();
      expect(Array.isArray(listResponse.data)).toBe(true);
      expect(listResponse).not.toHaveProperty('pagination');
    });
  });

  describe('ordering and filtering', () => {
    // Use the main busCleanup instead of creating a separate one

    beforeAll(async () => {
      // Create test buses with different properties for ordering/filtering tests
      const buses = [
        {
          registrationNumber: createUniqueCode('ORDR1', 3),
          modelId: busModelId,
          economicNumber: createUniqueCode('ALPHA', 3),
          status: BusStatus.ACTIVE,
          active: true,
          licensePlateType: 'STANDARD',
          licensePlateNumber: createUniqueCode('PL1', 5),
          circulationCard: createUniqueCode('CC1', 5),
          availableForTurismOnly: false,
          purchaseDate: new Date(),
          expirationDate: new Date(),
        },
        {
          registrationNumber: createUniqueCode('ORDR2', 3),
          modelId: busModelId,
          economicNumber: createUniqueCode('BETA', 3),
          status: BusStatus.MAINTENANCE,
          active: false,
          licensePlateType: 'STANDARD',
          licensePlateNumber: createUniqueCode('PL2', 5),
          circulationCard: createUniqueCode('CC2', 5),
          availableForTurismOnly: false,
          purchaseDate: new Date(),
          expirationDate: new Date(),
        },
        {
          registrationNumber: createUniqueCode('ORDR3', 3),
          modelId: busModelId,
          economicNumber: createUniqueCode('GAMMA', 3),
          status: BusStatus.ACTIVE,
          active: true,
          licensePlateType: 'STANDARD',
          licensePlateNumber: createUniqueCode('PL3', 5),
          circulationCard: createUniqueCode('CC3', 5),
          availableForTurismOnly: false,
          purchaseDate: new Date(),
          expirationDate: new Date(),
        },
      ];

      for (const busData of buses) {
        const fullBusData = {
          ...busData,
          sctPermit: createUniqueCode('SCT', 5),
          vehicleId: createUniqueCode('VEH', 5),
          engineNumber: createUniqueCode('ENG', 5),
          serialNumber: createUniqueCode('SER', 5),
          chassisNumber: createUniqueCode('CHS', 5),
          grossVehicleWeight: 15000,
          currentKilometer: 50000,
          gpsId: createUniqueCode('GPS', 5),
          seatDiagramId: 0, // This will be set by the controller
        };

        const created = await createBus(fullBusData);
        busCleanup.track(created.id);
        seatDiagramCleanup.track(created.seatDiagramId);
      }
    });

    // No need for separate cleanup - main afterAll handles all buses

    test('should handle ordering, filtering, and pagination', async () => {
      // Test ordering by registration number descending
      const orderedResponse = await listBuses({
        orderBy: [{ field: 'registrationNumber', direction: 'desc' }],
      });
      const regNumbers = orderedResponse.data.map((b) => b.registrationNumber);
      for (let i = 0; i < regNumbers.length - 1; i++) {
        expect(regNumbers[i] >= regNumbers[i + 1]).toBe(true);
      }

      // Test filtering by active status
      const filteredResponse = await listBuses({
        filters: { active: true },
      });
      expect(filteredResponse.data.every((b) => b.active === true)).toBe(true);

      // Test combined ordering and filtering with pagination
      const combinedResponse = await listBusesPaginated({
        filters: { active: true },
        orderBy: [{ field: 'registrationNumber', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      // Verify filtering
      expect(combinedResponse.data.every((b) => b.active === true)).toBe(true);

      // Verify ordering (ascending)
      const combinedRegNumbers = combinedResponse.data.map(
        (b) => b.registrationNumber,
      );
      for (let i = 0; i < combinedRegNumbers.length - 1; i++) {
        expect(combinedRegNumbers[i] <= combinedRegNumbers[i + 1]).toBe(true);
      }

      // Verify pagination
      expect(combinedResponse.pagination.currentPage).toBe(1);
      expect(combinedResponse.pagination.pageSize).toBe(10);
    });
  });
});
