import { afterAll, describe, expect, test } from 'vitest';
import { vi } from 'vitest';
import { FloorSeats, SeatType, SpaceType } from '../../shared/types';
import { busSeatModelRepository } from '../bus-seat-models/bus-seat-models.repository';
import { busSeatModels } from '../bus-seat-models/bus-seat-models.schema';
import type {
  BusSeatModel,
  SeatBusSeatModel,
} from '../bus-seat-models/bus-seat-models.types';
import { busSeatModelUseCases } from '../bus-seat-models/bus-seat-models.use-cases';
import {
  createBusDiagramModel,
  deleteBusDiagramModel,
  getBusDiagramModel,
  getBusDiagramModelSeats,
  listBusDiagramModels,
  listBusDiagramModelsPaginated,
  updateBusDiagramModel,
  updateSeatConfiguration,
} from './bus-diagram-models.controller';

describe('Bus Diagram Models Controller', () => {
  // Type guard to check if a bus seat model is a seat (not hallway, stairs, etc.)
  const isSeatModel = (model: BusSeatModel): model is SeatBusSeatModel => {
    return model.spaceType === SpaceType.SEAT;
  };

  // Test data and setup
  const testFloorSeats: FloorSeats = {
    floorNumber: 1,
    numRows: 10,
    seatsLeft: 2,
    seatsRight: 2,
  };

  const testBusDiagramModel = {
    name: 'Test Bus Diagram Model',
    description: 'A test model',
    maxCapacity: 50,
    numFloors: 1,
    seatsPerFloor: [testFloorSeats],
    totalSeats: 40,
    isFactoryDefault: true,
  };

  const updatePayload = {
    name: 'Updated Bus Diagram Model',
    description: 'An updated model',
    maxCapacity: 70,
  };

  // Variables to store created IDs for cleanup
  let createdBusDiagramModelId: number;
  let additionalModelId: number | undefined;

  // Helper functions to reduce code duplication
  const createSimpleTestModel = async (name: string, numRows = 2) => {
    return await createBusDiagramModel({
      name,
      description: 'Test model for validation',
      maxCapacity: numRows * 4,
      numFloors: 1,
      seatsPerFloor: [
        {
          floorNumber: 1,
          numRows,
          seatsLeft: 2,
          seatsRight: 2,
        },
      ],
      totalSeats: numRows * 4,
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expectBasicModelProperties = (model: any, expected: any) => {
    expect(model).toBeDefined();
    expect(model.id).toBeDefined();
    expect(model.name).toBe(expected.name);
    expect(model.description).toBe(expected.description);
    expect(model.maxCapacity).toBe(expected.maxCapacity);
    expect(model.active).toBeDefined();
    expect(model.createdAt).toBeDefined();
    expect(model.updatedAt).toBeDefined();
  };

  // Clean up after all tests
  afterAll(async () => {
    // Clean up the created bus diagram model if any
    if (createdBusDiagramModelId) {
      try {
        await deleteBusDiagramModel({ id: createdBusDiagramModelId });
      } catch (error) {
        console.log('Error cleaning up test bus diagram model:', error);
      }
    }

    // Clean up additional model created for deletion test
    if (additionalModelId) {
      try {
        await deleteBusDiagramModel({ id: additionalModelId });
      } catch (error) {
        console.log('Error cleaning up additional bus diagram model:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new bus diagram model and automatically generate seat models', async () => {
      // Create a new bus diagram model
      const response = await createBusDiagramModel(testBusDiagramModel);

      // Store the ID for later cleanup
      createdBusDiagramModelId = response.id;

      // Assertions for diagram model
      expectBasicModelProperties(response, testBusDiagramModel);
      expect(response.numFloors).toBe(testBusDiagramModel.numFloors);
      expect(response.seatsPerFloor).toEqual(testBusDiagramModel.seatsPerFloor);
      expect(response.totalSeats).toBe(testBusDiagramModel.totalSeats);

      // Verify that seat models were created automatically (atomicity test)
      const seatModelsResult = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        createdBusDiagramModelId,
        {
          orderBy: [{ field: 'seatNumber', direction: 'asc' }],
        },
      );

      // Expected seats calculation: Floor 1: 10 rows × (2 left + 2 right) = 40 seats
      expect(seatModelsResult).toHaveLength(40);

      // Verify seat model properties
      const firstSeat = seatModelsResult[0];
      expect(firstSeat.busDiagramModelId).toBe(createdBusDiagramModelId);
      expect(firstSeat.floorNumber).toBe(1);
      expect(firstSeat.position).toBeDefined();
      expect(firstSeat.position.x).toBeGreaterThanOrEqual(0);
      expect(firstSeat.position.y).toBeGreaterThanOrEqual(1);
      expect(firstSeat.active).toBe(true);

      // For seat-specific properties, check if it's a seat type
      if (isSeatModel(firstSeat)) {
        expect(firstSeat.seatNumber).toBeDefined();
      }

      // Verify all seats have sequential numbers
      const seatNumbers = seatModelsResult
        .filter(isSeatModel) // Filter to only seat space types
        .map((s) => parseInt(s.seatNumber || '0'))
        .sort((a: number, b: number) => a - b);

      expect(seatNumbers[0]).toBe(1);
      expect(seatNumbers[seatNumbers.length - 1]).toBe(40);
    });

    test('should handle basic CRUD operations (retrieve, list, update)', async () => {
      // Test retrieve by ID
      const getResponse = await getBusDiagramModel({
        id: createdBusDiagramModelId,
      });

      expect(getResponse).toBeDefined();
      expect(getResponse.id).toBe(createdBusDiagramModelId);
      expect(getResponse.name).toBe(testBusDiagramModel.name);
      expect(getResponse.description).toBe(testBusDiagramModel.description);
      expect(getResponse.maxCapacity).toBe(testBusDiagramModel.maxCapacity);

      // Test list all models
      const listResponse = await listBusDiagramModels();

      expect(listResponse).toBeDefined();
      expect(listResponse.busDiagramModels).toBeDefined();
      expect(Array.isArray(listResponse.busDiagramModels)).toBe(true);
      expect(listResponse.busDiagramModels.length).toBeGreaterThan(0);

      // Find our test model in the list
      const foundModel = listResponse.busDiagramModels.find(
        (model) => model.id === createdBusDiagramModelId,
      );
      expect(foundModel).toBeDefined();
      expect(foundModel?.name).toBe(testBusDiagramModel.name);

      // Test update model
      const updateResponse = await updateBusDiagramModel({
        id: createdBusDiagramModelId,
        ...updatePayload,
      });

      expect(updateResponse).toBeDefined();
      expect(updateResponse.id).toBe(createdBusDiagramModelId);
      expect(updateResponse.name).toBe(updatePayload.name);
      expect(updateResponse.description).toBe(updatePayload.description);
      expect(updateResponse.maxCapacity).toBe(updatePayload.maxCapacity);
      // Fields not in updatePayload should remain unchanged
      expect(updateResponse.numFloors).toBe(testBusDiagramModel.numFloors);
    });

    test('should retrieve seat models for a bus diagram model', async () => {
      // Get the seat models for the created diagram model
      const seatsResponse = await getBusDiagramModelSeats({
        id: createdBusDiagramModelId,
      });

      // Verify the response structure
      expect(seatsResponse).toBeDefined();
      expect(seatsResponse.busSeatModels).toBeDefined();
      expect(Array.isArray(seatsResponse.busSeatModels)).toBe(true);

      // Verify we have the expected number of seats (40 seats from the test model)
      expect(seatsResponse.busSeatModels).toHaveLength(40);

      // Verify all returned models are active (only active seats should be returned)
      const allSeatsActive = seatsResponse.busSeatModels.every(
        (seat) => seat.active === true,
      );
      expect(allSeatsActive).toBe(true);

      // Verify all seats belong to the correct diagram model
      const allSeatsForCorrectModel = seatsResponse.busSeatModels.every(
        (seat) => seat.busDiagramModelId === createdBusDiagramModelId,
      );
      expect(allSeatsForCorrectModel).toBe(true);

      // Verify seats are ordered by seatNumber (ascending)
      const seatNumbers = seatsResponse.busSeatModels
        .filter(isSeatModel) // Filter to only seat space types
        .map((seat) => parseInt(seat.seatNumber || '0'))
        .filter((num) => !isNaN(num)) // Filter out any non-numeric seat numbers
        .sort((a, b) => a - b); // Sort numerically

      for (let i = 1; i < seatNumbers.length; i++) {
        expect(seatNumbers[i]).toBeGreaterThanOrEqual(seatNumbers[i - 1]);
      }

      // Verify seat properties structure
      const firstSeat = seatsResponse.busSeatModels[0];
      expect(firstSeat.id).toBeDefined();
      expect(firstSeat.busDiagramModelId).toBe(createdBusDiagramModelId);
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
      if (isSeatModel(firstSeat)) {
        expect(firstSeat.seatNumber).toBeDefined();
        expect(firstSeat.seatType).toBeDefined();
      }
    });

    test('should delete a bus diagram model', async () => {
      // Create a model specifically for deletion test
      const modelToDelete = await createBusDiagramModel({
        name: 'Model To Delete',
        description: 'Temporary model for deletion test',
        maxCapacity: 40,
        numFloors: 1,
        seatsPerFloor: [
          {
            floorNumber: 1,
            numRows: 8,
            seatsLeft: 2,
            seatsRight: 2,
          },
        ],
        totalSeats: 32,
        isFactoryDefault: false,
      });

      additionalModelId = modelToDelete.id;

      // Delete should not throw an error
      await expect(
        deleteBusDiagramModel({ id: additionalModelId }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(
        getBusDiagramModel({ id: additionalModelId }),
      ).rejects.toThrow();

      // Reset the ID since we've deleted it
      additionalModelId = undefined;
    });

    test('should update seat configuration with new, updated, and deactivated seats', async () => {
      // First, create a bus diagram model with some initial seats
      const initialModel = await createBusDiagramModel({
        name: 'Initial Seat Config Model',
        description: 'Test model for seat configuration',
        maxCapacity: 20,
        numFloors: 1,
        seatsPerFloor: [
          {
            floorNumber: 1,
            numRows: 3,
            seatsLeft: 2,
            seatsRight: 2,
          },
        ],
        totalSeats: 12,
      });

      // Get the initial seats to work with their positions
      const initialSeats = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        initialModel.id,
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
          // Update existing seat 2 - change amenities and add metadata
          {
            seatNumber: isSeatModel(initialSeats[1])
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
      const updateResult = await updateSeatConfiguration({
        id: initialModel.id,
        ...seatConfigUpdate,
      });

      // Verify update statistics
      // All positions are existing seats being updated, no new seats created
      expect(updateResult.seatsCreated).toBe(0); // No new positions - all are updates
      expect(updateResult.seatsUpdated).toBe(4); // A1, original seat 2, NEW1, and NEW2
      expect(updateResult.seatsDeactivated).toBe(8); // 8 seats not included in update payload
      expect(updateResult.totalActiveSeats).toBe(4); // 4 seats remain active after update

      // Query all seats after the operation to verify the complete result
      const allSeats = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        initialModel.id,
        {
          orderBy: [{ field: 'seatNumber', direction: 'asc' }],
        },
      );
      expect(allSeats).toHaveLength(12); // Same 12 original seats (no new seats created)

      // Verify the updated seats in detail - filter only active SEAT space types
      const seatOnlyModels = await busSeatModelRepository.findAll({
        filters: {
          busDiagramModelId: initialModel.id,
          active: true,
          spaceType: SpaceType.SEAT,
        },
        orderBy: [{ field: 'seatNumber', direction: 'asc' }],
      });
      expect(seatOnlyModels).toHaveLength(4);

      // Since we filtered by spaceType: SEAT, all models are guaranteed to be seat types
      const seatModels = seatOnlyModels as SeatBusSeatModel[];

      // Find and verify the premium seat (A1)
      const premiumSeat = seatModels.find((seat) => seat.seatNumber === 'A1');
      expect(premiumSeat).toBeDefined();
      expect(premiumSeat?.seatType).toBe(SeatType.PREMIUM);
      expect(premiumSeat?.amenities).toEqual(['USB', 'Reading Light']);

      // Find and verify the regular seat with metadata
      const initialSeat1SeatNumber = isSeatModel(initialSeats[1])
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

      // Verify that the diagram model was updated with new total seats
      const updatedModel = await getBusDiagramModel({ id: initialModel.id });
      expect(updatedModel.totalSeats).toBe(4);

      // Clean up
      await deleteBusDiagramModel({ id: initialModel.id });
    });

    test('should create new seats when using positions beyond initial layout', async () => {
      // Create a bus diagram model with more rows than initially populated
      const testModel = await createBusDiagramModel({
        name: 'Extended Layout Model',
        description: 'Test model for creating seats beyond initial layout',
        maxCapacity: 20,
        numFloors: 1,
        seatsPerFloor: [
          {
            floorNumber: 1,
            numRows: 5,
            seatsLeft: 2,
            seatsRight: 2,
          },
        ],
        totalSeats: 20,
      });

      // System automatically created 20 seats (5 rows × 4 seats each)
      // Now manually delete seats from rows 3-5 to simulate having space for new seats
      const allInitialSeats = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        testModel.id,
      );

      // Delete seats from rows 3-5 (y > 2), keeping only rows 1-2
      for (const seat of allInitialSeats) {
        if (seat.position.y > 2) {
          await busSeatModelRepository.delete(seat.id);
        }
      }

      // Update with seats that include new positions in rows 4-5
      const updateResult = await updateSeatConfiguration({
        id: testModel.id,
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
      const activeSeatModels = await busSeatModelRepository.findAll({
        filters: {
          busDiagramModelId: testModel.id,
          active: true,
          spaceType: SpaceType.SEAT,
        },
      });
      expect(activeSeatModels).toHaveLength(3);

      // Since we filtered by spaceType: SEAT, all models are guaranteed to be seat types
      const seatModels = activeSeatModels as SeatBusSeatModel[];

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
      await deleteBusDiagramModel({ id: testModel.id });
    });

    test('should handle special seat configuration scenarios (empty config and aisle seats)', async () => {
      // Test 1: Empty configuration (deactivate all seats)
      const emptyConfigModel = await createSimpleTestModel(
        'Empty Config Test Model',
      );

      // Update with empty seat configuration
      const emptyResult = await updateSeatConfiguration({
        id: emptyConfigModel.id,
        seats: [], // Empty array should deactivate all existing seats
      });

      // Verify all seats were deactivated
      expect(emptyResult.seatsCreated).toBe(0);
      expect(emptyResult.seatsUpdated).toBe(0);
      expect(emptyResult.seatsDeactivated).toBe(8);
      expect(emptyResult.totalActiveSeats).toBe(0);

      // Verify the diagram model was updated
      const emptyUpdatedModel = await getBusDiagramModel({
        id: emptyConfigModel.id,
      });
      expect(emptyUpdatedModel.totalSeats).toBe(0);

      // Test 2: Aisle seats for flexible configurations
      const aisleConfigModel = await createBusDiagramModel({
        name: 'Flexible Seat Configuration Model',
        description:
          'Test model for aisle seats (vans, last row, foldable seats)',
        maxCapacity: 15,
        numFloors: 1,
        seatsPerFloor: [
          {
            floorNumber: 1,
            numRows: 3,
            seatsLeft: 2,
            seatsRight: 2,
          },
        ],
        totalSeats: 15,
      });

      // Test various aisle seat configurations
      const aisleResult = await updateSeatConfiguration({
        id: aisleConfigModel.id,
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
      const seatSpaceModels = await busSeatModelRepository.findAll({
        filters: {
          busDiagramModelId: aisleConfigModel.id,
          spaceType: SpaceType.SEAT,
        },
      });

      // Since we filtered by spaceType: SEAT, all models are guaranteed to be seat types
      const seatModels = seatSpaceModels as SeatBusSeatModel[];

      const aisleSeat1 = seatModels.find((seat) => seat.seatNumber === 'C1');
      const aisleLastRowSeat = seatModels.find(
        (seat) => seat.seatNumber === 'BACK3',
      );

      expect(aisleSeat1).toBeDefined();
      expect(aisleSeat1?.position.x).toBe(2); // Aisle position
      expect(aisleLastRowSeat).toBeDefined();
      expect(aisleLastRowSeat?.position.x).toBe(2); // Aisle position in last row

      // Clean up both models
      await deleteBusDiagramModel({ id: emptyConfigModel.id });
      await deleteBusDiagramModel({ id: aisleConfigModel.id });
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getBusDiagramModel({ id: 9999 })).rejects.toThrow();

      await expect(
        updateSeatConfiguration({
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
      // Create a test model for all validation scenarios
      const testModel = await createSimpleTestModel(
        'Comprehensive Validation Test Model',
      );

      // Test 1: Duplicate seat numbers
      await expect(
        updateSeatConfiguration({
          id: testModel.id,
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
        updateSeatConfiguration({
          id: testModel.id,
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
        updateSeatConfiguration({
          id: testModel.id,
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
        updateSeatConfiguration({
          id: testModel.id,
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
        updateSeatConfiguration({
          id: testModel.id,
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
        updateSeatConfiguration({
          id: testModel.id,
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
      await deleteBusDiagramModel({ id: testModel.id });
    });

    test('should rollback diagram model creation if seat models creation fails', async () => {
      // Get initial count of diagram models
      const initialDiagramModels = await listBusDiagramModels();
      const initialCount = initialDiagramModels.busDiagramModels.length;

      // Mock the seat model use case to fail using vi.spyOn
      vi.spyOn(
        busSeatModelUseCases,
        'createSeatModelsFromDiagramModel',
      ).mockRejectedValue(new Error('Seat models creation failed'));

      try {
        // Attempt to create a diagram model - this should fail and rollback
        await createBusDiagramModel(testBusDiagramModel);

        // If we reach here, the test should fail
        expect('Transaction should have failed').toBe(false);
      } catch (error) {
        // Expected error
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Seat models creation failed');
      }

      // Verify that no new diagram model was created (transaction was rolled back)
      const finalDiagramModels = await listBusDiagramModels();
      expect(finalDiagramModels.busDiagramModels).toHaveLength(initialCount);
    });

    // NOTE: We are not testing validation errors because they're handled by Encore's rust runtime
  });

  describe('pagination', () => {
    test('should handle paginated and non-paginated list operations', async () => {
      // Test paginated list with default parameters
      const paginatedResponse = await listBusDiagramModelsPaginated({});

      expect(paginatedResponse.data).toBeDefined();
      expect(Array.isArray(paginatedResponse.data)).toBe(true);
      expect(paginatedResponse.pagination).toBeDefined();
      expect(paginatedResponse.pagination.currentPage).toBe(1);
      expect(paginatedResponse.pagination.pageSize).toBeDefined();
      expect(paginatedResponse.pagination.totalCount).toBeDefined();
      expect(paginatedResponse.pagination.totalPages).toBeDefined();
      expect(typeof paginatedResponse.pagination.hasNextPage).toBe('boolean');
      expect(typeof paginatedResponse.pagination.hasPreviousPage).toBe(
        'boolean',
      );

      // Test paginated list with custom parameters
      const customPageResponse = await listBusDiagramModelsPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(customPageResponse.pagination.currentPage).toBe(1);
      expect(customPageResponse.pagination.pageSize).toBe(5);
      expect(customPageResponse.data.length).toBeLessThanOrEqual(5);

      // Test non-paginated list (for dropdowns)
      const nonPaginatedResponse = await listBusDiagramModels();

      expect(nonPaginatedResponse.busDiagramModels).toBeDefined();
      expect(Array.isArray(nonPaginatedResponse.busDiagramModels)).toBe(true);
      expect(nonPaginatedResponse.busDiagramModels.length).toBeGreaterThan(0);
      // No pagination info should be present
      expect(nonPaginatedResponse).not.toHaveProperty('pagination');
    });
  });
});
