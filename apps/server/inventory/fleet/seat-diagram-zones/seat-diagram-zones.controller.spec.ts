import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { busDiagramModelRepository } from '@/inventory/fleet/bus-diagram-models/bus-diagram-models.repository';
import { seatDiagramRepository } from '@/inventory/fleet/seat-diagrams/seat-diagrams.repository';
import {
  createSeatDiagramZone,
  deleteSeatDiagramZone,
  getSeatDiagramZone,
  listZonesByDiagram,
  listZonesByDiagramPaginated,
  updateSeatDiagramZone,
} from './seat-diagram-zones.controller';

describe('Seat Diagram Zones Controller', () => {
  // Test data and setup
  const testZone: {
    name: string;
    rowNumbers: number[];
    priceMultiplier: number;
  } = {
    name: 'Test Premium Zone',
    rowNumbers: [1, 2, 3],
    priceMultiplier: 1.5,
  };

  let seatDiagramId: number;
  let createdZoneId: number;
  let createdDiagramModelId: number;

  // Create a test diagram for zones to reference
  beforeAll(async () => {
    // First create a bus diagram model
    const diagramModel = await busDiagramModelRepository.create({
      name: 'Test Bus Diagram Model for Diagram Zones',
      description: 'Test diagram model for diagram zone testing',
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

    createdDiagramModelId = diagramModel.id;

    // Then create a diagram based on this model
    const diagram = await seatDiagramRepository.create({
      busDiagramModelId: diagramModel.id,
      name: 'Test Diagram for Zones',
      maxCapacity: 40,
      numFloors: 1,
      seatsPerFloor: diagramModel.seatsPerFloor,
      totalSeats: 40,
      isFactoryDefault: true,
      active: true,
    });

    seatDiagramId = diagram.id;
  });

  // Cleanup after tests
  afterAll(async () => {
    if (createdZoneId) {
      try {
        await deleteSeatDiagramZone({
          id: createdZoneId,
          seatDiagramId,
        });
      } catch {
        // Silent error handling for cleanup
      }
    }

    if (seatDiagramId) {
      try {
        await seatDiagramRepository.delete(seatDiagramId);
      } catch {
        // Silent error handling for cleanup
      }
    }

    if (createdDiagramModelId) {
      try {
        await busDiagramModelRepository.delete(createdDiagramModelId);
      } catch {
        // Silent error handling for cleanup
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new seat diagram zone', async () => {
      const response = await createSeatDiagramZone({
        ...testZone,
        seatDiagramId,
      });

      // Store the ID for later cleanup
      createdZoneId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testZone.name);
      expect(response.rowNumbers).toEqual(testZone.rowNumbers);
      expect(Number(response.priceMultiplier)).toBe(testZone.priceMultiplier);
      expect(response.seatDiagramId).toBe(seatDiagramId);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a seat diagram zone by ID', async () => {
      const response = await getSeatDiagramZone({
        id: createdZoneId,
        seatDiagramId,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdZoneId);
      expect(response.name).toBe(testZone.name);
      expect(response.seatDiagramId).toBe(seatDiagramId);
    });

    test('should retrieve all zones for a seat diagram', async () => {
      const response = await listZonesByDiagram({
        seatDiagramId,
      });

      expect(response).toBeDefined();
      expect(response.seatDiagramZones).toBeDefined();
      expect(Array.isArray(response.seatDiagramZones)).toBe(true);
      expect(response.seatDiagramZones.length).toBeGreaterThan(0);
      expect(
        response.seatDiagramZones.some((zone) => zone.id === createdZoneId),
      ).toBe(true);
    });

    test('should update a seat diagram zone', async () => {
      const updatedName = 'Updated Premium Zone';
      const updatedRowNumbers = [1, 2, 3, 4];
      const response = await updateSeatDiagramZone({
        id: createdZoneId,
        seatDiagramId,
        name: updatedName,
        rowNumbers: updatedRowNumbers,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdZoneId);
      expect(response.name).toBe(updatedName);
      expect(response.rowNumbers).toEqual(updatedRowNumbers);
    });

    test('should delete a seat diagram zone', async () => {
      // Create a zone specifically for deletion test
      const zoneToDelete = await createSeatDiagramZone({
        seatDiagramId,
        name: 'Zone To Delete',
        rowNumbers: [5, 6],
        priceMultiplier: 1.2,
      });

      // Delete should not throw an error
      await expect(
        deleteSeatDiagramZone({
          id: zoneToDelete.id,
          seatDiagramId,
        }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(
        getSeatDiagramZone({ id: zoneToDelete.id, seatDiagramId }),
      ).rejects.toThrow();
    });

    test('should return paginated seat diagram zones', async () => {
      const response = await listZonesByDiagramPaginated({
        seatDiagramId,
        page: 1,
        pageSize: 10,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(
        getSeatDiagramZone({ id: 9999, seatDiagramId }),
      ).rejects.toThrow();
    });

    test('should handle incorrect parent resource relationship', async () => {
      // We expect an error when the seatDiagramId doesn't match the zone's diagram
      await expect(
        getSeatDiagramZone({ id: createdZoneId, seatDiagramId: 9999 }),
      ).rejects.toThrow();
    });
  });
});
