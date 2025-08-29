import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { vi } from 'vitest';
import { FloorSeats, SeatType, SpaceType } from '@/shared/types';
import {
  createBusDiagramModel,
  deleteBusDiagramModel,
} from '@/inventory/fleet/bus-diagram-models/bus-diagram-models.controller';
import { busSeatRepository } from '@/inventory/fleet/bus-seats/bus-seats.repository';
import { busSeats } from '@/inventory/fleet/bus-seats/bus-seats.schema';
import type { SeatBusSeat } from '@/inventory/fleet/bus-seats/bus-seats.types';
import { busSeatUseCases } from '@/inventory/fleet/bus-seats/bus-seats.use-cases';
import type { SeatDiagram } from './seat-diagrams.types';
import { seatDiagramRepository } from './seat-diagrams.repository';
import {
  deleteSeatDiagram,
  getSeatDiagram,
  listSeatDiagramSeats,
  updateSeatDiagram,
  updateSeatDiagramConfiguration,
} from './seat-diagrams.controller';

describe('Seat Diagrams Controller', () => {
  // Type guard to check if a bus seat is a seat (not hallway, stairs, etc.)
  const isSeatType = (seat: unknown): seat is SeatBusSeat => {
    return (seat as { spaceType: SpaceType }).spaceType === SpaceType.SEAT;
  };

  // Test data and setup - create test floor configuration
  const testFloorSeats: FloorSeats = {
    floorNumber: 1,
    numRows: 10,
    seatsLeft: 2,
    seatsRight: 2,
  };

  // Bus diagram model template for creating seat diagrams
  const testBusDiagramModel = {
    name: 'Template Bus Diagram Model for Seat Diagrams',
    description: 'A template model for creating operational seat diagrams',
    maxCapacity: 50,
    numFloors: 1,
    seatsPerFloor: [testFloorSeats],
    totalSeats: 40,
    isFactoryDefault: true,
  };

  const updatePayload = {
    name: 'Updated Seat Diagram',
    description: 'An updated operational diagram',
    maxCapacity: 70,
  };

  // Variables to store created IDs for cleanup
  let baseBusDiagramModelId: number;
  let createdSeatDiagramId: number;
  let additionalDiagramId: number | undefined;

  // Helper functions to reduce code duplication
  const createTestDiagram = async (
    name: string,
    numRows = 2,
  ): Promise<SeatDiagram> => {
    const diagram = await seatDiagramRepository.create({
      name,
      description: `Test diagram with ${numRows} rows`,
      maxCapacity: numRows * 4, // 4 seats per row (2 left + 2 right)
      numFloors: 1,
      seatsPerFloor: [
        {
          floorNumber: 1,
          numRows: numRows,
          seatsLeft: 2,
          seatsRight: 2,
        },
      ],
      totalSeats: numRows * 4,
      busDiagramModelId: baseBusDiagramModelId,
    });

    // Create corresponding seats using repository transaction
    await busSeatRepository.transaction(async (txRepo, tx) => {
      return await busSeatUseCases.createSeatsFromDiagram(diagram.id, tx);
    });

    return diagram;
  };

  const expectBasicDiagramProperties = (
    diagram: SeatDiagram,
    expected: Partial<SeatDiagram>,
  ) => {
    expect(diagram).toBeDefined();
    expect(diagram.id).toBeDefined();
    expect(diagram.name).toBe(expected.name);
    expect(diagram.description).toBe(expected.description);
    expect(diagram.maxCapacity).toBe(expected.maxCapacity);
    expect(diagram.active).toBeDefined();
    expect(diagram.createdAt).toBeDefined();
    expect(diagram.updatedAt).toBeDefined();
  };

  // Setup base dependencies before all tests
  beforeAll(async () => {
    // Create a base bus diagram model that will serve as template for seat diagrams
    const baseModel = await createBusDiagramModel(testBusDiagramModel);
    baseBusDiagramModelId = baseModel.id;
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up the created seat diagram if any
    if (createdSeatDiagramId) {
      try {
        await deleteSeatDiagram({ id: createdSeatDiagramId });
      } catch (error) {
        console.log('Error cleaning up test seat diagram:', error);
      }
    }

    // Clean up additional diagram created for deletion test
    if (additionalDiagramId) {
      try {
        await deleteSeatDiagram({ id: additionalDiagramId });
      } catch (error) {
        console.log('Error cleaning up additional seat diagram:', error);
      }
    }

    // Clean up the base bus diagram model
    if (baseBusDiagramModelId) {
      try {
        await deleteBusDiagramModel({ id: baseBusDiagramModelId });
      } catch (error) {
        console.log('Error cleaning up base bus diagram model:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should handle basic CRUD operations (retrieve, update)', async () => {
      // First create a test diagram
      const testDiagram = await createTestDiagram('CRUD Test Diagram');
      createdSeatDiagramId = testDiagram.id;

      // Test retrieve by ID
      const getResponse = await getSeatDiagram({
        id: createdSeatDiagramId,
      });

      expectBasicDiagramProperties(getResponse, testDiagram);
      expect(getResponse.busDiagramModelId).toBe(baseBusDiagramModelId);
      expect(getResponse.isModified).toBe(false);

      // Test update diagram
      const updateResponse = await updateSeatDiagram({
        id: createdSeatDiagramId,
        ...updatePayload,
      });

      expect(updateResponse).toBeDefined();
      expect(updateResponse.id).toBe(createdSeatDiagramId);
      expect(updateResponse.name).toBe(updatePayload.name);
      expect(updateResponse.description).toBe(updatePayload.description);
      expect(updateResponse.maxCapacity).toBe(updatePayload.maxCapacity);
      expect(updateResponse.isModified).toBe(true);
      // Fields not in updatePayload should remain unchanged
      expect(updateResponse.numFloors).toBe(1);
      expect(updateResponse.busDiagramModelId).toBe(baseBusDiagramModelId);
    });

    test('should delete a seat diagram and clean up associated seats', async () => {
      // Create a diagram specifically for deletion test
      const diagramToDelete = await createTestDiagram('Diagram To Delete');
      additionalDiagramId = diagramToDelete.id;

      // Verify seats were created
      const associatedSeats = await busSeatRepository.findAllBy(
        busSeats.seatDiagramId,
        additionalDiagramId,
      );
      expect(associatedSeats.length).toBeGreaterThan(0);

      // Delete should not throw an error
      await expect(
        deleteSeatDiagram({ id: additionalDiagramId }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(
        getSeatDiagram({ id: additionalDiagramId }),
      ).rejects.toThrow();

      // Reset the ID since we've deleted it
      additionalDiagramId = undefined;
    });

    test('should retrieve seats for a seat diagram', async () => {
      // Get the seats for the created diagram
      const seatsResponse = await listSeatDiagramSeats({
        id: createdSeatDiagramId,
      });

      // Verify the response structure
      expect(seatsResponse).toBeDefined();
      expect(seatsResponse.data).toBeDefined();
      expect(Array.isArray(seatsResponse.data)).toBe(true);

      // Verify we have the expected number of seats (8 seats from the test diagram with 2 rows)
      expect(seatsResponse.data).toHaveLength(8);

      // Verify all returned seats are active (only active seats should be returned)
      const allSeatsActive = seatsResponse.data.every(
        (seat) => seat.active === true,
      );
      expect(allSeatsActive).toBe(true);

      // Verify all seats belong to the correct seat diagram
      const allSeatsForCorrectDiagram = seatsResponse.data.every(
        (seat) => seat.seatDiagramId === createdSeatDiagramId,
      );
      expect(allSeatsForCorrectDiagram).toBe(true);

      // Verify seats are ordered by seatNumber (ascending)
      const seatNumbers = seatsResponse.data
        .filter(isSeatType) // Filter to only seat space types
        .map((seat) => parseInt(seat.seatNumber || '0'))
        .filter((num) => !isNaN(num)) // Filter out any non-numeric seat numbers
        .sort((a, b) => a - b); // Sort numerically

      for (let i = 1; i < seatNumbers.length; i++) {
        expect(seatNumbers[i]).toBeGreaterThanOrEqual(seatNumbers[i - 1]);
      }

      // Verify seat properties structure
      const firstSeat = seatsResponse.data[0];
      expect(firstSeat.id).toBeDefined();
      expect(firstSeat.seatDiagramId).toBe(createdSeatDiagramId);
      expect(firstSeat.floorNumber).toBeDefined();
      expect(firstSeat.position).toBeDefined();
      expect(firstSeat.position.x).toBeGreaterThanOrEqual(0);
      expect(firstSeat.position.y).toBeGreaterThanOrEqual(1);
      expect(firstSeat.amenities).toBeDefined();
      expect(Array.isArray(firstSeat.amenities)).toBe(true);
      expect(firstSeat.meta).toBeDefined();
      expect(typeof firstSeat.meta).toBe('object');
      expect(firstSeat.createdAt).toBeDefined();
      expect(firstSeat.updatedAt).toBeDefined();

      // Verify seat-specific properties for SEAT space types
      if (isSeatType(firstSeat)) {
        expect(firstSeat.seatNumber).toBeDefined();
        expect(firstSeat.seatType).toBeDefined();
      }
    });

    test('should update seat configuration with new, updated, and deactivated seats', async () => {
      // Create a seat diagram with some initial seats
      const initialDiagram = await createTestDiagram(
        'Initial Seat Config Diagram',
        3,
      );

      // Get the initial seats to work with their positions
      const initialSeats = await busSeatRepository.findAllBy(
        busSeats.seatDiagramId,
        initialDiagram.id,
      );

      // Prepare seat configuration update:
      // - Update first 2 seats with new properties
      // - Update 2 additional existing seats with new seat numbers
      // - Leave remaining seats (should be deactivated)
      const seatConfigUpdate = {
        seats: [
          // Update existing seat 1 - change seat number and type
          {
            seatNumber: 'A1',
            floorNumber: 1,
            seatType: SeatType.PREMIUM,
            amenities: ['USB', 'Reading Light'],
            position: initialSeats[0].position,
            active: true,
          },
          // Update existing seat 2 - change amenities
          {
            seatNumber: isSeatType(initialSeats[1])
              ? initialSeats[1].seatNumber
              : 'DEFAULT',
            floorNumber: 1,
            seatType: SeatType.REGULAR,
            amenities: ['USB'],
            position: initialSeats[1].position,
            active: true,
          },
          // Update existing seat at position (1, 3) with new seat number and properties
          {
            seatNumber: 'NEW1',
            floorNumber: 1,
            seatType: SeatType.VIP,
            amenities: ['WiFi', 'Power Outlet'],
            position: { x: 1, y: 3 }, // Existing position - will update existing seat
            active: true,
          },
          // Update existing seat at position (4, 3) with new seat number and properties
          {
            seatNumber: 'NEW2',
            floorNumber: 1,
            seatType: SeatType.EXECUTIVE,
            position: { x: 4, y: 3 }, // Existing position - will update existing seat
            active: true,
          },
        ],
      };

      // Execute the seat configuration update
      const updateResult = await updateSeatDiagramConfiguration({
        id: initialDiagram.id,
        ...seatConfigUpdate,
      });

      // Verify update statistics
      // All positions are existing seats being updated, no new seats created
      expect(updateResult.seatsCreated).toBe(0); // No new positions - all are updates
      expect(updateResult.seatsUpdated).toBe(4); // A1, original seat 2, NEW1, and NEW2
      expect(updateResult.seatsDeactivated).toBe(8); // 8 seats not included in update payload
      expect(updateResult.totalActiveSeats).toBe(4); // 4 seats remain active after update

      // Query all seats after the operation to verify the complete result
      const allSeats = await busSeatRepository.findAllBy(
        busSeats.seatDiagramId,
        initialDiagram.id,
        {
          orderBy: [{ field: 'seatNumber', direction: 'asc' }],
        },
      );
      expect(allSeats).toHaveLength(12); // Same 12 original seats (no new seats created)

      // Verify the updated seats in detail - filter only active SEAT space types
      const seatOnlyModels = await busSeatRepository.findAll({
        filters: {
          seatDiagramId: initialDiagram.id,
          active: true,
          spaceType: SpaceType.SEAT,
        },
        orderBy: [{ field: 'seatNumber', direction: 'asc' }],
      });
      expect(seatOnlyModels).toHaveLength(4);

      // Since we filtered by spaceType: SEAT, all models are guaranteed to be seat types
      const seatModels = seatOnlyModels as SeatBusSeat[];

      // Find and verify the premium seat (A1)
      const premiumSeat = seatModels.find((seat) => seat.seatNumber === 'A1');
      expect(premiumSeat).toBeDefined();
      expect(premiumSeat?.seatType).toBe(SeatType.PREMIUM);
      expect(premiumSeat?.amenities).toEqual(['USB', 'Reading Light']);

      // Find and verify the regular seat with metadata
      const initialSeat1SeatNumber = isSeatType(initialSeats[1])
        ? initialSeats[1].seatNumber
        : 'DEFAULT';
      const regularSeat = seatModels.find(
        (seat) => seat.seatNumber === initialSeat1SeatNumber,
      );
      expect(regularSeat).toBeDefined();
      expect(regularSeat?.amenities).toEqual(['USB']);

      // Find and verify updated VIP seat (was existing seat, now updated with NEW1 number)
      const vipSeat = seatModels.find((seat) => seat.seatNumber === 'NEW1');
      expect(vipSeat).toBeDefined();
      expect(vipSeat?.seatType).toBe(SeatType.VIP);
      expect(vipSeat?.position).toEqual({ x: 1, y: 3 });
      expect(vipSeat?.amenities).toEqual(['WiFi', 'Power Outlet']);

      // Find and verify updated executive seat (was existing seat, now updated with NEW2 number)
      const executiveSeat = seatModels.find(
        (seat) => seat.seatNumber === 'NEW2',
      );
      expect(executiveSeat).toBeDefined();
      expect(executiveSeat?.seatType).toBe(SeatType.EXECUTIVE);
      expect(executiveSeat?.position).toEqual({ x: 4, y: 3 });

      // Verify that the diagram was updated with new total seats
      const updatedDiagram = await getSeatDiagram({ id: initialDiagram.id });
      expect(updatedDiagram.totalSeats).toBe(4);

      // Clean up
      await deleteSeatDiagram({ id: initialDiagram.id });
    });

    test('should create new seats when using positions beyond initial layout', async () => {
      // Create a seat diagram with a 5-row layout
      const testDiagram = await createTestDiagram('Extended Layout Diagram', 5);

      // System automatically created 20 seats (5 rows × 4 seats each)
      const initialSeats = await busSeatRepository.findAllBy(
        busSeats.seatDiagramId,
        testDiagram.id,
      );
      expect(initialSeats).toHaveLength(20);

      // Now manually delete seats from rows 3-5 to simulate having space for new seats
      for (const seat of initialSeats) {
        if (seat.position.y > 2) {
          await busSeatRepository.delete(seat.id);
        }
      }

      // Update with seats that include new positions in rows 4-5
      const updateResult = await updateSeatDiagramConfiguration({
        id: testDiagram.id,
        seats: [
          // Keep one existing seat from row 1
          {
            seatNumber: 'EXISTING1',
            floorNumber: 1,
            position: { x: 0, y: 1 },
            active: true,
          },
          // Create new seats in row 4 (positions that don't exist yet)
          {
            seatNumber: 'NEW_ROW4_1',
            floorNumber: 1,
            seatType: SeatType.VIP,
            position: { x: 0, y: 4 }, // New position in row 4 - will be created
            active: true,
          },
          {
            seatNumber: 'NEW_ROW4_2',
            floorNumber: 1,
            seatType: SeatType.PREMIUM,
            position: { x: 3, y: 4 }, // New position in row 4 right side - will be created
            active: true,
          },
        ],
      });

      // Verify that new seats were actually created
      expect(updateResult.seatsCreated).toBe(2); // NEW_ROW4_1 and NEW_ROW4_2
      expect(updateResult.seatsUpdated).toBe(1); // EXISTING1
      expect(updateResult.seatsDeactivated).toBeGreaterThan(0); // Other existing seats
      expect(updateResult.totalActiveSeats).toBe(3);

      // Verify the new seats exist with correct properties - filter only active SEAT space types
      const activeSeatModels = await busSeatRepository.findAll({
        filters: {
          seatDiagramId: testDiagram.id,
          active: true,
          spaceType: SpaceType.SEAT,
        },
      });
      expect(activeSeatModels).toHaveLength(3);

      // Since we filtered by spaceType: SEAT, all models are guaranteed to be seat types
      const seatModels = activeSeatModels as SeatBusSeat[];

      // Find the new VIP seat in row 4
      const newVipSeat = seatModels.find(
        (seat) => seat.seatNumber === 'NEW_ROW4_1',
      );
      expect(newVipSeat).toBeDefined();
      expect(newVipSeat?.seatType).toBe(SeatType.VIP);
      expect(newVipSeat?.position).toEqual({ x: 0, y: 4 });

      // Find the new premium seat in row 4
      const newPremiumSeat = seatModels.find(
        (seat) => seat.seatNumber === 'NEW_ROW4_2',
      );
      expect(newPremiumSeat).toBeDefined();
      expect(newPremiumSeat?.seatType).toBe(SeatType.PREMIUM);
      expect(newPremiumSeat?.position).toEqual({ x: 3, y: 4 });

      // Clean up
      await deleteSeatDiagram({ id: testDiagram.id });
    });

    test('should handle special seat configuration scenarios (empty config and aisle seats)', async () => {
      // Test 1: Empty configuration (deactivate all seats)
      const emptyConfigDiagram = await createTestDiagram(
        'Empty Config Test Diagram',
      );

      // Update with empty seat configuration
      const emptyResult = await updateSeatDiagramConfiguration({
        id: emptyConfigDiagram.id,
        seats: [], // Empty array should deactivate all existing seats
      });

      // Verify all seats were deactivated
      expect(emptyResult.seatsCreated).toBe(0);
      expect(emptyResult.seatsUpdated).toBe(0);
      expect(emptyResult.seatsDeactivated).toBe(8);
      expect(emptyResult.totalActiveSeats).toBe(0);

      // Verify the diagram was updated
      const emptyUpdatedDiagram = await getSeatDiagram({
        id: emptyConfigDiagram.id,
      });
      expect(emptyUpdatedDiagram.totalSeats).toBe(0);

      // Test 2: Aisle seats for flexible configurations
      const aisleConfigDiagram = await createTestDiagram(
        'Flexible Seat Configuration Diagram',
        3,
      );

      // Test various aisle seat configurations
      const aisleResult = await updateSeatDiagramConfiguration({
        id: aisleConfigDiagram.id,
        seats: [
          // Regular left side seats
          { seatNumber: 'A1', floorNumber: 1, position: { x: 0, y: 1 } },
          { seatNumber: 'B1', floorNumber: 1, position: { x: 1, y: 1 } },
          // Aisle seat (foldable or center seat)
          { seatNumber: 'C1', floorNumber: 1, position: { x: 2, y: 1 } },
          // Regular right side seats
          { seatNumber: 'D1', floorNumber: 1, position: { x: 3, y: 1 } },
          { seatNumber: 'E1', floorNumber: 1, position: { x: 4, y: 1 } },
          // Last row spanning full width (typical in buses)
          { seatNumber: 'BACK1', floorNumber: 1, position: { x: 0, y: 3 } },
          { seatNumber: 'BACK2', floorNumber: 1, position: { x: 1, y: 3 } },
          { seatNumber: 'BACK3', floorNumber: 1, position: { x: 2, y: 3 } }, // Aisle position in last row
          { seatNumber: 'BACK4', floorNumber: 1, position: { x: 3, y: 3 } },
          { seatNumber: 'BACK5', floorNumber: 1, position: { x: 4, y: 3 } },
        ],
      });

      // Verify aisle seats were processed successfully
      expect(aisleResult.seatsCreated + aisleResult.seatsUpdated).toBe(10);
      expect(aisleResult.totalActiveSeats).toBeGreaterThanOrEqual(10);

      // Verify aisle seats were created properly - filter only SEAT space types
      const seatSpaceModels = await busSeatRepository.findAll({
        filters: {
          seatDiagramId: aisleConfigDiagram.id,
          spaceType: SpaceType.SEAT,
        },
      });

      // Since we filtered by spaceType: SEAT, all models are guaranteed to be seat types
      const seatModels = seatSpaceModels as SeatBusSeat[];

      const aisleSeat1 = seatModels.find((seat) => seat.seatNumber === 'C1');
      const aisleLastRowSeat = seatModels.find(
        (seat) => seat.seatNumber === 'BACK3',
      );

      expect(aisleSeat1).toBeDefined();
      expect(aisleSeat1?.position.x).toBe(2); // Aisle position
      expect(aisleLastRowSeat).toBeDefined();
      expect(aisleLastRowSeat?.position.x).toBe(2); // Aisle position in last row

      // Clean up both diagrams
      await deleteSeatDiagram({ id: emptyConfigDiagram.id });
      await deleteSeatDiagram({ id: aisleConfigDiagram.id });
    });

    test('should mark isModified as true when updating diagram properties or seat configuration', async () => {
      // Test 1: Update diagram basic properties - should mark as modified
      const diagram1 = await createTestDiagram('IsModified Test Diagram 1');

      // Verify initial state: isModified should be false
      expect(diagram1.isModified).toBe(false);

      const updatedDiagram = await updateSeatDiagram({
        id: diagram1.id,
        name: 'Modified Diagram Name',
        description: 'This diagram has been modified',
      });

      expect(updatedDiagram.isModified).toBe(true);
      expect(updatedDiagram.name).toBe('Modified Diagram Name');
      expect(updatedDiagram.description).toBe('This diagram has been modified');

      // Test 2: Update seat configuration - should mark as modified
      const diagram2 = await createTestDiagram('IsModified Test Diagram 2');

      // Verify initial state: isModified should be false
      expect(diagram2.isModified).toBe(false);

      const seatConfigResult = await updateSeatDiagramConfiguration({
        id: diagram2.id,
        seats: [
          {
            seatNumber: 'MODIFIED_SEAT_1',
            floorNumber: 1,
            seatType: SeatType.PREMIUM,
            position: { x: 0, y: 1 },
            active: true,
          },
          {
            seatNumber: 'MODIFIED_SEAT_2',
            floorNumber: 1,
            seatType: SeatType.VIP,
            position: { x: 1, y: 1 },
            active: true,
          },
        ],
      });

      // Verify seat configuration was updated
      expect(seatConfigResult.seatsUpdated).toBeGreaterThan(0);

      // Verify diagram was marked as modified
      const diagramAfterSeatUpdate = await getSeatDiagram({
        id: diagram2.id,
      });
      expect(diagramAfterSeatUpdate.isModified).toBe(true);
      expect(diagramAfterSeatUpdate.totalSeats).toBe(2); // Only 2 active seats now

      // Test 3: Verify both operations together preserve the modified state
      const finalUpdate = await updateSeatDiagram({
        id: diagram2.id,
        maxCapacity: 100, // Change another property
      });

      expect(finalUpdate.isModified).toBe(true);
      expect(finalUpdate.maxCapacity).toBe(100);

      // Clean up
      await deleteSeatDiagram({ id: diagram1.id });
      await deleteSeatDiagram({ id: diagram2.id });
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getSeatDiagram({ id: 9999 })).rejects.toThrow();

      await expect(
        updateSeatDiagram({
          id: 9999,
          name: 'Does not exist',
        }),
      ).rejects.toThrow();

      await expect(deleteSeatDiagram({ id: 9999 })).rejects.toThrow();

      await expect(
        updateSeatDiagramConfiguration({
          id: 9999,
          seats: [
            {
              seatNumber: 'SEAT1',
              floorNumber: 1,
              position: { x: 0, y: 1 },
            },
          ],
        }),
      ).rejects.toThrow();
    });

    test('should handle comprehensive seat configuration validation errors', async () => {
      // Create a test diagram for all validation scenarios
      const testDiagram = await createTestDiagram(
        'Comprehensive Validation Test Diagram',
      );

      // Test 1: Duplicate seat numbers
      await expect(
        updateSeatDiagramConfiguration({
          id: testDiagram.id,
          seats: [
            {
              seatNumber: 'DUPLICATE',
              floorNumber: 1,
              position: { x: 0, y: 1 },
            },
            {
              seatNumber: 'DUPLICATE',
              floorNumber: 1,
              position: { x: 1, y: 1 },
            },
          ],
        }),
      ).rejects.toThrow('Duplicate seat numbers found in payload');

      // Test 2: Duplicate positions
      await expect(
        updateSeatDiagramConfiguration({
          id: testDiagram.id,
          seats: [
            {
              seatNumber: 'SEAT1',
              floorNumber: 1,
              position: { x: 0, y: 1 },
            },
            {
              seatNumber: 'SEAT2',
              floorNumber: 1,
              position: { x: 0, y: 1 }, // Same position
            },
          ],
        }),
      ).rejects.toThrow('Duplicate positions found in payload');

      // Test 3: Invalid floor number
      await expect(
        updateSeatDiagramConfiguration({
          id: testDiagram.id,
          seats: [
            {
              seatNumber: 'INVALID_FLOOR',
              floorNumber: 2, // Invalid - only floor 1 exists
              position: { x: 0, y: 1 },
            },
          ],
        }),
      ).rejects.toThrow('Invalid floor number 2. Must be between 1 and 1');

      // Test 4: Invalid row number
      await expect(
        updateSeatDiagramConfiguration({
          id: testDiagram.id,
          seats: [
            {
              seatNumber: 'INVALID_ROW',
              floorNumber: 1,
              position: { x: 0, y: 5 }, // Invalid - only rows 1-2 exist
            },
          ],
        }),
      ).rejects.toThrow(
        'Invalid row number 5 for floor 1. Must be between 1 and 2',
      );

      // Test 5: Invalid column numbers (both beyond and negative)
      await expect(
        updateSeatDiagramConfiguration({
          id: testDiagram.id,
          seats: [
            {
              seatNumber: 'BEYOND_SEAT',
              floorNumber: 1,
              position: { x: 10, y: 1 }, // Invalid - way beyond valid columns
            },
          ],
        }),
      ).rejects.toThrow(
        'Invalid column number 10 for floor 1. Must be between 0 and 4',
      );

      await expect(
        updateSeatDiagramConfiguration({
          id: testDiagram.id,
          seats: [
            {
              seatNumber: 'NEGATIVE_SEAT',
              floorNumber: 1,
              position: { x: -1, y: 1 }, // Invalid - negative column
            },
          ],
        }),
      ).rejects.toThrow(
        'Invalid column number -1 for floor 1. Must be between 0 and 4',
      );

      // Clean up
      await deleteSeatDiagram({ id: testDiagram.id });
    });

    test('should rollback seat diagram operations if seat creation fails', async () => {
      // Create a test diagram first
      const testDiagram = await createTestDiagram('Rollback Test Diagram');

      // Store original values before the failed operation
      const originalDiagram = await getSeatDiagram({ id: testDiagram.id });
      const originalSeats = await busSeatRepository.findAllBy(
        busSeats.seatDiagramId,
        testDiagram.id,
      );
      const originalActiveSeatsCount = originalSeats.filter(
        (seat) => seat.active,
      ).length;

      // Mock the seat use case to fail using vi.spyOn
      const mockSpy = vi
        .spyOn(busSeatUseCases, 'batchUpdateSeatConfiguration')
        .mockRejectedValue(new Error('Seat configuration update failed'));

      try {
        // Attempt to update seat configuration with new totalSeats - this should fail
        await updateSeatDiagramConfiguration({
          id: testDiagram.id,
          seats: [
            {
              seatNumber: 'TEST_SEAT',
              floorNumber: 1,
              position: { x: 0, y: 1 },
            },
          ],
        });

        // If we reach here, the test should fail
        expect('Update should have failed').toBe(false);
      } catch (error) {
        // Expected error
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
          'Seat configuration update failed',
        );
      }

      // Verify that the seat diagram was rolled back to original values
      const diagramAfterFailure = await getSeatDiagram({ id: testDiagram.id });
      expect(diagramAfterFailure).toBeDefined();
      expect(diagramAfterFailure.id).toBe(originalDiagram.id);
      expect(diagramAfterFailure.totalSeats).toBe(originalDiagram.totalSeats); // Should not have changed
      expect(diagramAfterFailure.name).toBe(originalDiagram.name);
      expect(diagramAfterFailure.description).toBe(originalDiagram.description);
      expect(diagramAfterFailure.maxCapacity).toBe(originalDiagram.maxCapacity);
      expect(diagramAfterFailure.updatedAt).toEqual(originalDiagram.updatedAt); // Should not have been updated

      // Verify that seats were not modified (rollback preserved original state)
      const seatsAfterFailure = await busSeatRepository.findAllBy(
        busSeats.seatDiagramId,
        testDiagram.id,
      );
      const activeSeatsAfterFailure = seatsAfterFailure.filter(
        (seat) => seat.active,
      ).length;

      expect(seatsAfterFailure).toHaveLength(originalSeats.length); // Same number of total seats
      expect(activeSeatsAfterFailure).toBe(originalActiveSeatsCount); // Same number of active seats

      // Verify no new seat with the test seat number was created
      const testSeat = seatsAfterFailure.find(
        (seat) =>
          seat.spaceType === SpaceType.SEAT &&
          (seat as SeatBusSeat).seatNumber === 'TEST_SEAT',
      );
      expect(testSeat).toBeUndefined(); // Should not exist due to rollback

      // Restore the mock
      mockSpy.mockRestore();

      // Clean up
      await deleteSeatDiagram({ id: testDiagram.id });
    });

    // NOTE: We are not testing validation errors because they're handled by Encore's rust runtime
  });
});
