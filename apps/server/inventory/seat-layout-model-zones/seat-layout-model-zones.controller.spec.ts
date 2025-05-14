import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { seatLayoutModelRepository } from '../seat-layout-models/seat-layout-models.repository';
import {
  createSeatLayoutModelZone,
  deleteSeatLayoutModelZone,
  getSeatLayoutModelZone,
  listZonesByLayoutModel,
  listZonesByLayoutModelPaginated,
  updateSeatLayoutModelZone,
} from './seat-layout-model-zones.controller';

describe('Seat Layout Model Zones Controller', () => {
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

  let seatLayoutModelId: number;
  let createdZoneId: number;

  // Create a test layout model for zones to reference
  beforeAll(async () => {
    // Create a layout model
    const layoutModel = await seatLayoutModelRepository.create({
      name: 'Test Layout Model for Zones',
      description: 'Test layout model for zone testing',
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

    seatLayoutModelId = layoutModel.id;
  });

  // Cleanup after tests
  afterAll(async () => {
    if (createdZoneId) {
      try {
        await deleteSeatLayoutModelZone({
          id: createdZoneId,
          seatLayoutModelId,
        });
      } catch {
        // Silent error handling for cleanup
      }
    }

    if (seatLayoutModelId) {
      try {
        await seatLayoutModelRepository.delete(seatLayoutModelId);
      } catch {
        // Silent error handling for cleanup
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new seat layout model zone', async () => {
      const response = await createSeatLayoutModelZone({
        ...testZone,
        seatLayoutModelId,
      });

      // Store the ID for later cleanup
      createdZoneId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testZone.name);
      expect(response.rowNumbers).toEqual(testZone.rowNumbers);
      expect(Number(response.priceMultiplier)).toBe(testZone.priceMultiplier);
      expect(response.seatLayoutModelId).toBe(seatLayoutModelId);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a seat layout model zone by ID', async () => {
      const response = await getSeatLayoutModelZone({
        id: createdZoneId,
        seatLayoutModelId,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdZoneId);
      expect(response.name).toBe(testZone.name);
      expect(response.seatLayoutModelId).toBe(seatLayoutModelId);
    });

    test('should retrieve all zones for a seat layout model', async () => {
      const response = await listZonesByLayoutModel({
        seatLayoutModelId,
      });

      expect(response).toBeDefined();
      expect(response.seatLayoutModelZones).toBeDefined();
      expect(Array.isArray(response.seatLayoutModelZones)).toBe(true);
      expect(response.seatLayoutModelZones.length).toBeGreaterThan(0);
      expect(
        response.seatLayoutModelZones.some((zone) => zone.id === createdZoneId),
      ).toBe(true);
    });

    test('should update a seat layout model zone', async () => {
      const updatedName = 'Updated Premium Zone';
      const updatedRowNumbers = [1, 2, 3, 4];
      const response = await updateSeatLayoutModelZone({
        id: createdZoneId,
        seatLayoutModelId,
        name: updatedName,
        rowNumbers: updatedRowNumbers,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdZoneId);
      expect(response.name).toBe(updatedName);
      expect(response.rowNumbers).toEqual(updatedRowNumbers);
    });

    test('should delete a seat layout model zone', async () => {
      // Create a zone specifically for deletion test
      const zoneToDelete = await createSeatLayoutModelZone({
        seatLayoutModelId,
        name: 'Zone To Delete',
        rowNumbers: [5, 6],
        priceMultiplier: 1.2,
      });

      // Delete should not throw an error
      await expect(
        deleteSeatLayoutModelZone({ id: zoneToDelete.id, seatLayoutModelId }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(
        getSeatLayoutModelZone({ id: zoneToDelete.id, seatLayoutModelId }),
      ).rejects.toThrow();
    });

    test('should return paginated seat layout model zones', async () => {
      const response = await listZonesByLayoutModelPaginated({
        seatLayoutModelId,
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
        getSeatLayoutModelZone({ id: 9999, seatLayoutModelId }),
      ).rejects.toThrow();
    });

    test('should handle incorrect parent resource relationship', async () => {
      // We expect an error when the seatLayoutModelId doesn't match the zone's model
      await expect(
        getSeatLayoutModelZone({ id: createdZoneId, seatLayoutModelId: 9999 }),
      ).rejects.toThrow();
    });
  });
});
