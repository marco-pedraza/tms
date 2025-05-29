import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { busDiagramModelRepository } from '../bus-diagram-models/bus-diagram-models.repository';
import {
  createBusDiagramModelZone,
  deleteBusDiagramModelZone,
  getBusDiagramModelZone,
  listZonesByDiagramModel,
  listZonesByDiagramModelPaginated,
  updateBusDiagramModelZone,
} from './bus-diagram-model-zones.controller';

describe('Bus Diagram Model Zones Controller', () => {
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

  let busDiagramModelId: number;
  let createdZoneId: number;

  // Create a test diagram model for zones to reference
  beforeAll(async () => {
    // Create a diagram model
    const diagramModel = await busDiagramModelRepository.create({
      name: 'Test Bus Diagram Model for Zones',
      description: 'Test diagram model for zone testing',
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

    busDiagramModelId = diagramModel.id;
  });

  // Cleanup after tests
  afterAll(async () => {
    if (createdZoneId) {
      try {
        await deleteBusDiagramModelZone({
          id: createdZoneId,
          busDiagramModelId,
        });
      } catch {
        // Silent error handling for cleanup
      }
    }

    if (busDiagramModelId) {
      try {
        await busDiagramModelRepository.delete(busDiagramModelId);
      } catch {
        // Silent error handling for cleanup
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new bus diagram model zone', async () => {
      const response = await createBusDiagramModelZone({
        ...testZone,
        busDiagramModelId,
      });

      // Store the ID for later cleanup
      createdZoneId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testZone.name);
      expect(response.rowNumbers).toEqual(testZone.rowNumbers);
      expect(Number(response.priceMultiplier)).toBe(testZone.priceMultiplier);
      expect(response.busDiagramModelId).toBe(busDiagramModelId);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a bus diagram model zone by ID', async () => {
      const response = await getBusDiagramModelZone({
        id: createdZoneId,
        busDiagramModelId,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdZoneId);
      expect(response.name).toBe(testZone.name);
      expect(response.busDiagramModelId).toBe(busDiagramModelId);
    });

    test('should retrieve all zones for a bus diagram model', async () => {
      const response = await listZonesByDiagramModel({
        busDiagramModelId,
      });

      expect(response).toBeDefined();
      expect(response.busDiagramModelZones).toBeDefined();
      expect(Array.isArray(response.busDiagramModelZones)).toBe(true);
      expect(response.busDiagramModelZones.length).toBeGreaterThan(0);
      expect(
        response.busDiagramModelZones.some((zone) => zone.id === createdZoneId),
      ).toBe(true);
    });

    test('should update a bus diagram model zone', async () => {
      const updatedName = 'Updated Premium Zone';
      const updatedRowNumbers = [1, 2, 3, 4];
      const response = await updateBusDiagramModelZone({
        id: createdZoneId,
        busDiagramModelId,
        name: updatedName,
        rowNumbers: updatedRowNumbers,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdZoneId);
      expect(response.name).toBe(updatedName);
      expect(response.rowNumbers).toEqual(updatedRowNumbers);
    });

    test('should delete a bus diagram model zone', async () => {
      // Create a zone specifically for deletion test
      const zoneToDelete = await createBusDiagramModelZone({
        busDiagramModelId,
        name: 'Zone To Delete',
        rowNumbers: [5, 6],
        priceMultiplier: 1.2,
      });

      // Delete should not throw an error
      await expect(
        deleteBusDiagramModelZone({ id: zoneToDelete.id, busDiagramModelId }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(
        getBusDiagramModelZone({ id: zoneToDelete.id, busDiagramModelId }),
      ).rejects.toThrow();
    });

    test('should return paginated bus diagram model zones', async () => {
      const response = await listZonesByDiagramModelPaginated({
        busDiagramModelId,
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
        getBusDiagramModelZone({ id: 9999, busDiagramModelId }),
      ).rejects.toThrow();
    });

    test('should handle incorrect parent resource relationship', async () => {
      // We expect an error when the busDiagramModelId doesn't match the zone's model
      await expect(
        getBusDiagramModelZone({ id: createdZoneId, busDiagramModelId: 9999 }),
      ).rejects.toThrow();
    });
  });
});
