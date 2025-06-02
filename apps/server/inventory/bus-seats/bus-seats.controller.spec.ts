import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { busDiagramModelRepository } from '../bus-diagram-models/bus-diagram-models.repository';
import { deleteSeatDiagram } from '../seat-diagrams/seat-diagrams.controller';
import { seatDiagramRepository } from '../seat-diagrams/seat-diagrams.repository';
import { SeatPosition, SeatType } from './bus-seats.types';
import {
  createBusSeat,
  createBusSeatsBatch,
  deleteBusSeat,
  getBusSeat,
  listBusSeatsBySeatDiagram,
  updateBusSeat,
} from './bus-seats.controller';

describe('Bus Seats Controller', () => {
  // Test data and setup
  let seatDiagramId: number; // We need a valid seat diagram ID for bus seat tests

  const testSeatPosition: SeatPosition = {
    x: 1,
    y: 2,
  };

  const testBusSeat = {
    seatDiagramId: 0, // This will be populated in beforeAll
    seatNumber: 'A1',
    floorNumber: 1,
    seatType: SeatType.REGULAR,
    amenities: ['USB', 'Reclinable'],
    reclinementAngle: 30,
    position: testSeatPosition,
    meta: { legRoom: 'standard' },
    active: true,
  };

  // Variable to store created IDs for cleanup
  const batchCreatedIds: number[] = [];
  let createdBusSeatId: number;

  // Create a test seat diagram before running the bus seat tests
  beforeAll(async () => {
    // Create a test bus diagram model first
    const diagramModel = await busDiagramModelRepository.create({
      name: 'Test Bus Diagram Model',
      description: 'Auto-generated model for Test Seat Diagram',
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

    // Create the seat diagram with the diagram model as template
    const seatDiagram = await seatDiagramRepository.create({
      busDiagramModelId: diagramModel.id,
      name: 'Test Seat Diagram',
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

    seatDiagramId = seatDiagram.id;
    testBusSeat.seatDiagramId = seatDiagramId; // Update the test bus seat with the real seat diagram ID
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up the created bus seat if any
    if (createdBusSeatId) {
      try {
        await deleteBusSeat({ id: createdBusSeatId });
      } catch (error) {
        console.log('Error cleaning up test bus seat:', error);
      }
    }

    // Clean up batch created seats
    for (const id of batchCreatedIds) {
      try {
        await deleteBusSeat({ id });
      } catch (error) {
        console.log(`Error cleaning up batch created bus seat ${id}:`, error);
      }
    }

    // Clean up the created seat diagram
    if (seatDiagramId) {
      try {
        await deleteSeatDiagram({ id: seatDiagramId });
      } catch (error) {
        console.log('Error cleaning up test seat diagram:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new bus seat', async () => {
      // Create a new bus seat
      const response = await createBusSeat(testBusSeat);

      // Store the ID for later cleanup
      createdBusSeatId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.seatDiagramId).toBe(testBusSeat.seatDiagramId);
      expect(response.seatNumber).toBe(testBusSeat.seatNumber);
      expect(response.floorNumber).toBe(testBusSeat.floorNumber);
      expect(response.seatType).toBe(testBusSeat.seatType);
      expect(response.amenities).toEqual(testBusSeat.amenities);
      expect(response.reclinementAngle).toBe(testBusSeat.reclinementAngle);
      expect(response.position).toEqual(testBusSeat.position);
      expect(response.meta).toEqual(testBusSeat.meta);
      expect(response.active).toBe(testBusSeat.active);
      expect(response.createdAt).toBeDefined();
    });

    test('should create multiple bus seats in a batch', async () => {
      // Create batch data
      const batchData = {
        seats: [
          {
            seatDiagramId: seatDiagramId,
            seatNumber: 'B1',
            floorNumber: 1,
            seatType: SeatType.PREMIUM,
            amenities: ['USB', 'Reclinable', 'Entertainment'],
            reclinementAngle: 45,
            position: { x: 2, y: 1 },
            meta: { legRoom: 'extended' },
            active: true,
          },
          {
            seatDiagramId: seatDiagramId,
            seatNumber: 'B2',
            floorNumber: 1,
            seatType: SeatType.PREMIUM,
            amenities: ['USB', 'Reclinable', 'Entertainment'],
            reclinementAngle: 45,
            position: { x: 2, y: 2 },
            meta: { legRoom: 'extended' },
            active: true,
          },
        ],
      };

      // Create seats in batch
      const response = await createBusSeatsBatch(batchData);

      // Store IDs for cleanup
      for (const seat of response.busSeats) {
        batchCreatedIds.push(seat.id);
      }

      // Assertions
      expect(response).toBeDefined();
      expect(response.busSeats).toBeDefined();
      expect(Array.isArray(response.busSeats)).toBe(true);
      expect(response.busSeats.length).toBe(2);

      // Check first seat
      expect(response.busSeats[0].seatNumber).toBe('B1');
      expect(response.busSeats[0].seatType).toBe(SeatType.PREMIUM);

      // Check second seat
      expect(response.busSeats[1].seatNumber).toBe('B2');
      expect(response.busSeats[1].position.x).toBe(2);
      expect(response.busSeats[1].position.y).toBe(2);
    });

    test('should retrieve a bus seat by ID', async () => {
      const response = await getBusSeat({ id: createdBusSeatId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusSeatId);
      expect(response.seatDiagramId).toBe(testBusSeat.seatDiagramId);
      expect(response.seatNumber).toBe(testBusSeat.seatNumber);
    });

    test('should list bus seats by seat diagram ID', async () => {
      const response = await listBusSeatsBySeatDiagram({
        seatDiagramId: seatDiagramId,
      });

      expect(response).toBeDefined();
      expect(response.busSeats).toBeDefined();
      expect(Array.isArray(response.busSeats)).toBe(true);
      expect(response.busSeats.length).toBeGreaterThan(0);

      // All seats should belong to our model
      for (const seat of response.busSeats) {
        expect(seat.seatDiagramId).toBe(seatDiagramId);
      }
    });

    test('should update a bus seat', async () => {
      const updateData = {
        seatType: SeatType.VIP,
        amenities: ['USB', 'Reclinable', 'Premium Audio', 'Footrest'],
        reclinementAngle: 60,
        meta: { legRoom: 'premium', adjustableHeadrest: true },
      };

      const response = await updateBusSeat({
        id: createdBusSeatId,
        ...updateData,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusSeatId);
      expect(response.seatType).toBe(updateData.seatType);
      expect(response.amenities).toEqual(updateData.amenities);
      expect(response.reclinementAngle).toBe(updateData.reclinementAngle);
      expect(response.meta).toEqual(updateData.meta);
    });

    test('should delete a bus seat', async () => {
      // Create a seat specifically for deletion test
      const seatToDelete = await createBusSeat({
        seatDiagramId: seatDiagramId,
        seatNumber: 'DELETE-ME',
        floorNumber: 1,
        position: { x: 99, y: 99 },
        seatType: SeatType.REGULAR,
        amenities: [],
        meta: {},
        active: true,
      });

      // Delete should not throw an error
      await expect(
        deleteBusSeat({ id: seatToDelete.id }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(getBusSeat({ id: seatToDelete.id })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getBusSeat({ id: 9999 })).rejects.toThrow();
    });

    test('should handle invalid seat diagram ID', async () => {
      await expect(
        createBusSeat({
          ...testBusSeat,
          seatDiagramId: 9999, // Non-existent seat diagram ID
          seatNumber: 'ERROR-SEAT',
          position: { x: 0, y: 0 },
        }),
      ).rejects.toThrow();
    });
  });
});
