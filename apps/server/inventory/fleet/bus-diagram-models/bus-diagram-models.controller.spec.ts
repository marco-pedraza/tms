import { afterAll, describe, expect, test } from 'vitest';
import { vi } from 'vitest';
import { FloorSeats, SeatType, SpaceType } from '@/shared/types';
import { createBusDiagramModelZone } from '@/inventory/fleet/bus-diagram-model-zones/bus-diagram-model-zones.controller';
import { busDiagramModelZoneRepository } from '@/inventory/fleet/bus-diagram-model-zones/bus-diagram-model-zones.repository';
import type { BusDiagramModelZone } from '@/inventory/fleet/bus-diagram-model-zones/bus-diagram-model-zones.types';
import { busSeatModelRepository } from '@/inventory/fleet/bus-seat-models/bus-seat-models.repository';
import { busSeatModels } from '@/inventory/fleet/bus-seat-models/bus-seat-models.schema';
import type {
  BusSeatModel,
  SeatBusSeatModel,
} from '@/inventory/fleet/bus-seat-models/bus-seat-models.types';
import { busSeatModelUseCases } from '@/inventory/fleet/bus-seat-models/bus-seat-models.use-cases';
import { busSeatRepository } from '@/inventory/fleet/bus-seats/bus-seats.repository';
import type { BusSeat } from '@/inventory/fleet/bus-seats/bus-seats.types';
import { busSeatUseCases } from '@/inventory/fleet/bus-seats/bus-seats.use-cases';
import { seatDiagramZoneRepository } from '@/inventory/fleet/seat-diagram-zones/seat-diagram-zones.repository';
import type { SeatDiagramZone } from '@/inventory/fleet/seat-diagram-zones/seat-diagram-zones.types';
import { updateSeatDiagram } from '@/inventory/fleet/seat-diagrams/seat-diagrams.controller';
import { seatDiagramRepository } from '@/inventory/fleet/seat-diagrams/seat-diagrams.repository';
import type { CreateSeatDiagramPayload } from '@/inventory/fleet/seat-diagrams/seat-diagrams.types';
import type { SeatDiagram } from '@/inventory/fleet/seat-diagrams/seat-diagrams.types';
import type { BusDiagramModel } from './bus-diagram-models.types';
import {
  createBusDiagramModel,
  deleteBusDiagramModel,
  getBusDiagramModel,
  listBusDiagramModelSeats,
  listBusDiagramModels,
  listBusDiagramModelsPaginated,
  regenerateSeats,
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
  const createSimpleTestModel = async (
    name: string,
    numRows = 2,
  ): Promise<BusDiagramModel> => {
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

  /**
   * Helper function to create a seat diagram from a bus diagram model
   */
  const createSeatDiagramFromModel = async (
    busDiagramModelId: number,
    name: string,
  ) => {
    // Get the parent model to copy its configuration
    const parentModel = await getBusDiagramModel({ id: busDiagramModelId });

    // Create the seat diagram payload
    const seatDiagramPayload: CreateSeatDiagramPayload = {
      busDiagramModelId: parentModel.id,
      name: name,
      description: `Operational diagram based on ${parentModel.name}`,
      maxCapacity: parentModel.maxCapacity,
      numFloors: parentModel.numFloors,
      seatsPerFloor: parentModel.seatsPerFloor,
      totalSeats: parentModel.totalSeats,
      isFactoryDefault: parentModel.isFactoryDefault,
    };

    // Create the seat diagram
    const seatDiagram = await seatDiagramRepository.create(seatDiagramPayload);

    // Create corresponding seats using repository transaction
    await busSeatRepository.transaction(async (txRepo, tx) => {
      return await busSeatUseCases.createSeatsFromDiagram(seatDiagram.id, tx);
    });

    return seatDiagram;
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
      const listResponse = await listBusDiagramModels({
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      expect(listResponse).toBeDefined();
      expect(listResponse.data).toBeDefined();
      expect(Array.isArray(listResponse.data)).toBe(true);
      expect(listResponse.data.length).toBeGreaterThan(0);

      // Find our test model in the list
      const foundModel = listResponse.data.find(
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
      const seatsResponse = await listBusDiagramModelSeats({
        id: createdBusDiagramModelId,
      });

      // Verify the response structure
      expect(seatsResponse).toBeDefined();
      expect(seatsResponse.data).toBeDefined();
      expect(Array.isArray(seatsResponse.data)).toBe(true);

      // Verify we have the expected number of seats (40 seats from the test model)
      expect(seatsResponse.data).toHaveLength(40);

      // Verify all returned models are active (only active seats should be returned)
      const allSeatsActive = seatsResponse.data.every(
        (seat) => seat.active === true,
      );
      expect(allSeatsActive).toBe(true);

      // Verify all seats belong to the correct diagram model
      const allSeatsForCorrectModel = seatsResponse.data.every(
        (seat) => seat.busDiagramModelId === createdBusDiagramModelId,
      );
      expect(allSeatsForCorrectModel).toBe(true);

      // Verify seats are ordered by seatNumber (ascending)
      const seatNumbers = seatsResponse.data
        .filter(isSeatModel) // Filter to only seat space types
        .map((seat) => parseInt(seat.seatNumber || '0'))
        .filter((num) => !isNaN(num)) // Filter out any non-numeric seat numbers
        .sort((a, b) => a - b); // Sort numerically

      for (let i = 1; i < seatNumbers.length; i++) {
        expect(seatNumbers[i]).toBeGreaterThanOrEqual(seatNumbers[i - 1]);
      }

      // Verify seat properties structure
      const firstSeat = seatsResponse.data[0];
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

    test('should update bus diagram model and regenerate seat models in single transaction', async () => {
      // Create initial model using helper function
      const initialModel = await createSimpleTestModel(
        'Regenerate Test Model',
        3,
      );

      // Get initial seat count and verify setup
      const initialSeats = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        initialModel.id,
      );
      expect(initialSeats).toHaveLength(12); // 3 rows × 4 seats = 12 seats

      // New configuration with more rows
      const newConfiguration = {
        name: 'Updated Regenerate Model',
        description: 'Updated model with new seat configuration',
        maxCapacity: 20, // 5 rows × 4 seats
        numFloors: 1,
        seatsPerFloor: [
          {
            floorNumber: 1,
            numRows: 5, // Increased from 3 to 5 rows
            seatsLeft: 2,
            seatsRight: 2,
          },
        ],
        totalSeats: 20,
      };

      // Update the model with regenerateSeats=true
      const updateResponse = await updateBusDiagramModel({
        id: initialModel.id,
        regenerateSeats: true,
        ...newConfiguration,
      });

      // Verify the bus diagram model was updated using helper
      expectBasicModelProperties(updateResponse, newConfiguration);
      expect(updateResponse.id).toBe(initialModel.id);
      expect(updateResponse.seatsPerFloor).toEqual(
        newConfiguration.seatsPerFloor,
      );
      expect(updateResponse.totalSeats).toBe(newConfiguration.totalSeats);

      // Verify that seat models were regenerated with new configuration
      const regeneratedSeats = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        initialModel.id,
        {
          orderBy: [{ field: 'seatNumber', direction: 'asc' }],
        },
      );

      // Should have 20 seats now (5 rows × 4 seats per row)
      expect(regeneratedSeats).toHaveLength(20);

      // Verify all seats are active and belong to the correct model
      const allSeatsActive = regeneratedSeats.every(
        (seat) => seat.active === true,
      );
      expect(allSeatsActive).toBe(true);

      const allSeatsForCorrectModel = regeneratedSeats.every(
        (seat) => seat.busDiagramModelId === initialModel.id,
      );
      expect(allSeatsForCorrectModel).toBe(true);

      // Verify seat numbers are sequential from 1 to 20
      const seatNumbers = regeneratedSeats
        .filter(isSeatModel)
        .map((seat) => parseInt(seat.seatNumber || '0'))
        .sort((a, b) => a - b);

      expect(seatNumbers[0]).toBe(1);
      expect(seatNumbers[seatNumbers.length - 1]).toBe(20);

      // Verify that seats for new row exist
      const seatsWithRow5 = regeneratedSeats.filter(
        (seat) => seat.position.y === 5, // Row 5 (new row)
      );
      expect(seatsWithRow5).toHaveLength(4); // 4 seats in row 5

      // Clean up the test model - first delete seat models to avoid dependency errors
      const cleanupSeatModels = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        initialModel.id,
      );
      for (const seatModel of cleanupSeatModels) {
        await busSeatModelRepository.delete(seatModel.id);
      }
      await deleteBusDiagramModel({ id: initialModel.id });
    });

    test('should soft delete a bus diagram model', async () => {
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

      // Soft delete should work even with dependencies (seat models)
      const deletedModel = await deleteBusDiagramModel({
        id: additionalModelId,
      });
      expect(deletedModel).toBeDefined();
      expect(deletedModel.id).toBe(additionalModelId);

      // Attempt to get should throw a not found error (soft deleted records are filtered out)
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
            numRows: 4,
            seatsLeft: 2,
            seatsRight: 2,
          },
        ],
        totalSeats: 16,
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
      expect(updateResult.seatsDeactivated).toBe(12); // 12 seats not included in update payload
      expect(updateResult.totalActiveSeats).toBe(4); // 4 seats remain active after update

      // Query all seats after the operation to verify the complete result
      const allSeats = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        initialModel.id,
        {
          orderBy: [{ field: 'seatNumber', direction: 'asc' }],
        },
      );
      expect(allSeats).toHaveLength(16); // Same 16 original seats (no new seats created)

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

      // Clean up - first delete seat models to avoid dependency errors
      const cleanupSeatModels = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        initialModel.id,
      );
      for (const seatModel of cleanupSeatModels) {
        await busSeatModelRepository.delete(seatModel.id);
      }
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

      // Clean up - first delete seat models to avoid dependency errors
      const testModelSeatModels = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        testModel.id,
      );
      for (const seatModel of testModelSeatModels) {
        await busSeatModelRepository.delete(seatModel.id);
      }
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
        maxCapacity: 16,
        numFloors: 1,
        seatsPerFloor: [
          {
            floorNumber: 1,
            numRows: 4,
            seatsLeft: 2,
            seatsRight: 2,
          },
        ],
        totalSeats: 16,
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

      // Clean up both models - first delete seat models to avoid dependency errors
      const emptyConfigSeatModels = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        emptyConfigModel.id,
      );
      for (const seatModel of emptyConfigSeatModels) {
        await busSeatModelRepository.delete(seatModel.id);
      }

      const aisleConfigSeatModels = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        aisleConfigModel.id,
      );
      for (const seatModel of aisleConfigSeatModels) {
        await busSeatModelRepository.delete(seatModel.id);
      }

      await deleteBusDiagramModel({ id: emptyConfigModel.id });
      await deleteBusDiagramModel({ id: aisleConfigModel.id });
    });

    test('should handle inserting seat in middle with sequential renumbering', async () => {
      // Create a diagram model with 15 seats (3 rows × 5 seats per row: 2+1 aisle+2)
      const testModel = await createBusDiagramModel({
        name: 'Renumbering Test Model',
        description: 'Test model for seat renumbering scenario',
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
        totalSeats: 12, // 3 rows × 4 seats per row (excluding aisle)
      });

      // Initial state: seats numbered 1-12
      // Now simulate inserting a new seat at position that would be seat number 5
      // This requires renumbering all subsequent seats
      const updateResult = await updateSeatConfiguration({
        id: testModel.id,
        seats: [
          // Keep seats 1-4 unchanged
          { seatNumber: '1', floorNumber: 1, position: { x: 0, y: 0 } },
          { seatNumber: '2', floorNumber: 1, position: { x: 1, y: 0 } },
          { seatNumber: '3', floorNumber: 1, position: { x: 3, y: 0 } },
          { seatNumber: '4', floorNumber: 1, position: { x: 4, y: 0 } },
          // Insert NEW seat at aisle position (becomes seat 5)
          {
            seatNumber: '5',
            floorNumber: 1,
            position: { x: 2, y: 1 },
            seatType: SeatType.VIP,
          },
          // Original seats 5-12 now become 6-13
          { seatNumber: '6', floorNumber: 1, position: { x: 0, y: 1 } },
          { seatNumber: '7', floorNumber: 1, position: { x: 1, y: 1 } },
          { seatNumber: '8', floorNumber: 1, position: { x: 3, y: 1 } },
          { seatNumber: '9', floorNumber: 1, position: { x: 4, y: 1 } },
          { seatNumber: '10', floorNumber: 1, position: { x: 0, y: 2 } },
          { seatNumber: '11', floorNumber: 1, position: { x: 1, y: 2 } },
          { seatNumber: '12', floorNumber: 1, position: { x: 3, y: 2 } },
          { seatNumber: '13', floorNumber: 1, position: { x: 4, y: 2 } },
        ],
      });

      // Verify the operation succeeded without unique constraint violations
      // expect(updateResult.seatsCreated).toBe(1); // One new seat created
      expect(updateResult.seatsUpdated).toBeGreaterThan(0); // Multiple seats updated
      expect(updateResult.totalActiveSeats).toBe(13);

      // Verify all seats have correct numbers
      const allSeats = await busSeatModelRepository.findAll({
        filters: {
          busDiagramModelId: testModel.id,
          active: true,
          spaceType: SpaceType.SEAT,
        },
        orderBy: [{ field: 'seatNumber', direction: 'asc' }],
      });

      expect(allSeats).toHaveLength(13);

      // Verify the new seat at position (2, 2) is seat number 5
      const newSeat = allSeats.find(
        (seat) => seat.position.x === 2 && seat.position.y === 1,
      );
      expect(newSeat).toBeDefined();
      if (newSeat && isSeatModel(newSeat)) {
        expect(newSeat.seatNumber).toBe('5');
      }

      // Clean up
      const cleanupSeatModels = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        testModel.id,
      );
      for (const seatModel of cleanupSeatModels) {
        await busSeatModelRepository.delete(seatModel.id);
      }
      await deleteBusDiagramModel({ id: testModel.id });
    });

    test('should handle seat number swaps without constraint violations', async () => {
      // Create a simple diagram with a few seats
      const testModel = await createBusDiagramModel({
        name: 'Seat Swap Test Model',
        description: 'Test model for seat number swapping',
        maxCapacity: 8,
        numFloors: 1,
        seatsPerFloor: [
          {
            floorNumber: 1,
            numRows: 2,
            seatsLeft: 2,
            seatsRight: 2,
          },
        ],
        totalSeats: 8,
      });

      // Swap seat numbers: seat at position (0,1) from '1' to '5', and (0,2) from '5' to '1'
      const updateResult = await updateSeatConfiguration({
        id: testModel.id,
        seats: [
          { seatNumber: '5', floorNumber: 1, position: { x: 0, y: 0 } }, // Was '1'
          { seatNumber: '2', floorNumber: 1, position: { x: 1, y: 0 } },
          { seatNumber: '3', floorNumber: 1, position: { x: 3, y: 0 } },
          { seatNumber: '4', floorNumber: 1, position: { x: 4, y: 0 } },
          { seatNumber: '1', floorNumber: 1, position: { x: 0, y: 1 } }, // Was '5'
          { seatNumber: '6', floorNumber: 1, position: { x: 1, y: 1 } },
          { seatNumber: '7', floorNumber: 1, position: { x: 3, y: 1 } },
          { seatNumber: '8', floorNumber: 1, position: { x: 4, y: 1 } },
        ],
      });

      // Verify the swap succeeded without constraint violations
      expect(updateResult.seatsUpdated).toBeGreaterThan(0);
      expect(updateResult.totalActiveSeats).toBe(8);

      // Verify the swap worked correctly
      const allSeats = await busSeatModelRepository.findAll({
        filters: {
          busDiagramModelId: testModel.id,
          active: true,
          spaceType: SpaceType.SEAT,
        },
      });

      // Cast to seat models since we filtered by spaceType: SEAT
      const seatModels = allSeats as SeatBusSeatModel[];
      const seat1 = seatModels.find((seat) => seat.seatNumber === '1');
      const seat5 = seatModels.find((seat) => seat.seatNumber === '5');

      expect(seat1).toBeDefined();
      expect(seat1?.position).toEqual({ x: 0, y: 1 }); // Now at position that was '5'

      expect(seat5).toBeDefined();
      expect(seat5?.position).toEqual({ x: 0, y: 0 }); // Now at position that was '1'

      // Clean up
      const cleanupSeatModels = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        testModel.id,
      );
      for (const seatModel of cleanupSeatModels) {
        await busSeatModelRepository.delete(seatModel.id);
      }
      await deleteBusDiagramModel({ id: testModel.id });
    });

    test('should handle updating auto-generated seats with different numbering scheme', async () => {
      // This test simulates the scenario where:
      // 1. A diagram is created and seats are auto-generated with sequential numbers (1-44)
      // 2. Frontend sends an update with a different numbering scheme (with gaps for aisles)
      // This happens when creating a new diagram and the frontend sends its own seat configuration

      const testModel = await createBusDiagramModel({
        name: 'Auto-Generated Numbering Test',
        description: 'Test model for auto-generated vs custom numbering',
        maxCapacity: 44,
        numFloors: 1,
        seatsPerFloor: [
          {
            floorNumber: 1,
            numRows: 11,
            seatsLeft: 2,
            seatsRight: 2,
          },
        ],
        totalSeats: 44,
      });

      // System auto-generates seats numbered 1-44 sequentially
      const initialSeats = await busSeatModelRepository.findAll({
        filters: {
          busDiagramModelId: testModel.id,
          spaceType: SpaceType.SEAT,
        },
        orderBy: [{ field: 'seatNumber', direction: 'asc' }],
      });
      expect(initialSeats.length).toBe(44);

      // Now update with a payload that has different numbering
      // (simulating what frontend sends with gaps for aisles)
      const customNumbering = [
        // Row 0: 1, 2, 3, 4
        { seatNumber: '1', floorNumber: 1, position: { x: 0, y: 1 } },
        { seatNumber: '2', floorNumber: 1, position: { x: 1, y: 1 } },
        { seatNumber: '3', floorNumber: 1, position: { x: 3, y: 1 } },
        { seatNumber: '4', floorNumber: 1, position: { x: 4, y: 1 } },
        // Row 1: 5, 6, 7, 8 (skipping to show pattern)
        { seatNumber: '5', floorNumber: 1, position: { x: 0, y: 2 } },
        { seatNumber: '6', floorNumber: 1, position: { x: 1, y: 2 } },
        { seatNumber: '7', floorNumber: 1, position: { x: 3, y: 2 } },
        { seatNumber: '8', floorNumber: 1, position: { x: 4, y: 2 } },
        // Continue with same pattern for remaining rows...
        { seatNumber: '9', floorNumber: 1, position: { x: 0, y: 3 } },
        { seatNumber: '10', floorNumber: 1, position: { x: 1, y: 3 } },
        { seatNumber: '11', floorNumber: 1, position: { x: 3, y: 3 } },
        { seatNumber: '12', floorNumber: 1, position: { x: 4, y: 3 } },
      ];

      // This should succeed without constraint violations
      const updateResult = await updateSeatConfiguration({
        id: testModel.id,
        seats: customNumbering,
      });

      // Verify the update succeeded
      expect(updateResult.seatsUpdated).toBeGreaterThan(0);
      expect(updateResult.totalActiveSeats).toBe(12); // Only 12 seats in the update

      // Verify the numbering is correct
      const updatedSeats = await busSeatModelRepository.findAll({
        filters: {
          busDiagramModelId: testModel.id,
          active: true,
          spaceType: SpaceType.SEAT,
        },
        orderBy: [{ field: 'seatNumber', direction: 'asc' }],
      });

      // Cast to seat models since we filtered by spaceType: SEAT
      const seatModels = updatedSeats as SeatBusSeatModel[];
      expect(seatModels.length).toBe(12);
      // expect(seatModels[0].seatNumber).toBe('1');
      // expect(seatModels[11].seatNumber).toBe('12');

      // Clean up
      const cleanupSeatModels = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        testModel.id,
      );
      for (const seatModel of cleanupSeatModels) {
        await busSeatModelRepository.delete(seatModel.id);
      }
      await deleteBusDiagramModel({ id: testModel.id });
    });
  });

  describe('regenerateSeats functionality', () => {
    // Shared test data that will be created once for all tests
    let parentModel1: BusDiagramModel;
    let parentModel2: BusDiagramModel;
    let childDiagram1A: SeatDiagram,
      childDiagram1B: SeatDiagram,
      childDiagram1C: SeatDiagram;
    let childDiagram2A: SeatDiagram, childDiagram2B: SeatDiagram;
    let parentModel1Seats: BusSeatModel[];
    let parentModel2Seats: BusSeatModel[];
    let parentModel1Zones: BusDiagramModelZone[];
    let parentModel2Zones: BusDiagramModelZone[];

    // Helper function to compare seat structures (excluding IDs and diagram references)
    const compareSeats = (parentSeat: BusSeatModel, childSeat: BusSeat) => {
      expect(childSeat.spaceType).toBe(parentSeat.spaceType);
      expect(childSeat.floorNumber).toBe(parentSeat.floorNumber);
      expect(childSeat.position).toEqual(parentSeat.position);
      expect(childSeat.active).toBe(parentSeat.active);
      expect(childSeat.amenities).toEqual(parentSeat.amenities);

      // Only check seat-specific properties if both are seats
      if (
        parentSeat.spaceType === SpaceType.SEAT &&
        childSeat.spaceType === SpaceType.SEAT
      ) {
        const parentSeatTyped = parentSeat;
        const childSeatTyped = childSeat;
        expect(childSeatTyped.seatNumber).toBe(parentSeatTyped.seatNumber);
        expect(childSeatTyped.seatType).toBe(parentSeatTyped.seatType);
        expect(childSeatTyped.reclinementAngle).toBe(
          parentSeatTyped.reclinementAngle,
        );
      }
    };

    // Helper function to compare zone structures (excluding IDs and diagram references)
    const compareZones = (
      parentZone: BusDiagramModelZone,
      childZone: SeatDiagramZone,
    ) => {
      expect(childZone.name).toBe(parentZone.name);
      expect(childZone.priceMultiplier).toBe(parentZone.priceMultiplier);
      expect(childZone.rowNumbers).toEqual(parentZone.rowNumbers);
    };

    test('should setup parent models and child diagrams correctly', async () => {
      // Create two parent diagram models with different configurations
      parentModel1 = await createBusDiagramModel({
        name: 'Test Parent Model 1',
        description: 'First parent model for regenerate test',
        maxCapacity: 32,
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
        isFactoryDefault: true,
      });

      parentModel2 = await createBusDiagramModel({
        name: 'Test Parent Model 2',
        description: 'Second parent model for regenerate test',
        maxCapacity: 24,
        numFloors: 1,
        seatsPerFloor: [
          {
            floorNumber: 1,
            numRows: 7,
            seatsLeft: 2,
            seatsRight: 2,
          },
        ],
        totalSeats: 24,
        isFactoryDefault: true,
      });

      // Create operational seat diagrams (child instances)
      childDiagram1A = await createSeatDiagramFromModel(
        parentModel1.id,
        'Bus 001 - Operational Diagram',
      );

      childDiagram1B = await createSeatDiagramFromModel(
        parentModel1.id,
        'Bus 002 - Custom Layout',
      );

      childDiagram1C = await createSeatDiagramFromModel(
        parentModel1.id,
        'Bus 003 - Standard Layout',
      );

      childDiagram2A = await createSeatDiagramFromModel(
        parentModel2.id,
        'Van 101 - Standard Layout',
      );

      childDiagram2B = await createSeatDiagramFromModel(
        parentModel2.id,
        'Van 102 - Custom Layout',
      );

      // Simulate modification of certain diagrams
      // childDiagram1B and childDiagram2B should be marked as modified
      await updateSeatDiagram({
        id: childDiagram1B.id,
        description: 'This diagram has been customized',
      });

      await updateSeatDiagram({
        id: childDiagram2B.id,
        description: 'This van diagram has been customized',
      });

      // Create zones for parent models using the controller
      await createBusDiagramModelZone({
        busDiagramModelId: parentModel1.id,
        name: 'Premium Zone',
        rowNumbers: [1, 2, 3],
        priceMultiplier: 1.5,
      });

      await createBusDiagramModelZone({
        busDiagramModelId: parentModel1.id,
        name: 'Business Zone',
        rowNumbers: [4, 5],
        priceMultiplier: 1.2,
      });

      await createBusDiagramModelZone({
        busDiagramModelId: parentModel2.id,
        name: 'VIP Zone',
        rowNumbers: [1, 2],
        priceMultiplier: 2.0,
      });

      // Get parent seats for future comparisons
      parentModel1Seats = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        parentModel1.id,
        { orderBy: [{ field: 'seatNumber', direction: 'asc' }] },
      );

      parentModel2Seats = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        parentModel2.id,
        { orderBy: [{ field: 'seatNumber', direction: 'asc' }] },
      );

      // Get parent zones for future comparisons
      parentModel1Zones = await busDiagramModelZoneRepository.findAll({
        filters: { busDiagramModelId: parentModel1.id },
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      parentModel2Zones = await busDiagramModelZoneRepository.findAll({
        filters: { busDiagramModelId: parentModel2.id },
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      // Verify parent models have correct number of seats and zones
      expect(parentModel1Seats).toHaveLength(32);
      expect(parentModel2Seats).toHaveLength(28);
      expect(parentModel1Zones).toHaveLength(2); // Premium and Business
      expect(parentModel2Zones).toHaveLength(1); // VIP

      // Verify all child diagrams were created successfully
      expect(childDiagram1A.id).toBeDefined();
      expect(childDiagram1B.id).toBeDefined();
      expect(childDiagram1C.id).toBeDefined();
      expect(childDiagram2A.id).toBeDefined();
      expect(childDiagram2B.id).toBeDefined();
    });

    test('should ensure child diagrams initially match their parent models exactly', async () => {
      // Verify child diagrams for parentModel1 match parent seats
      for (const childDiagram of [
        childDiagram1A,
        childDiagram1B,
        childDiagram1C,
      ]) {
        const childSeats = await busSeatRepository.findAll({
          filters: { seatDiagramId: childDiagram.id },
          orderBy: [{ field: 'seatNumber', direction: 'asc' }],
        });

        expect(childSeats).toHaveLength(32); // Same as parent1

        // Compare each seat with corresponding parent seat
        for (let i = 0; i < parentModel1Seats.length; i++) {
          compareSeats(parentModel1Seats[i], childSeats[i]);
        }
      }

      // Verify child diagrams for parentModel2 match parent seats
      for (const childDiagram of [childDiagram2A, childDiagram2B]) {
        const childSeats = await busSeatRepository.findAll({
          filters: { seatDiagramId: childDiagram.id },
          orderBy: [{ field: 'seatNumber', direction: 'asc' }],
        });

        expect(childSeats).toHaveLength(28); // Same as parent2

        // Compare each seat with corresponding parent seat
        for (let i = 0; i < parentModel2Seats.length; i++) {
          compareSeats(parentModel2Seats[i], childSeats[i]);
        }
      }
    });

    test('should regenerate seats only for non-modified diagrams of parent model 1', async () => {
      // First, modify the parent model 1 by updating some existing seats properties
      // We'll change amenities and seat types of existing seats (keeping same positions)
      const existingSeats = parentModel1Seats.slice(0, 20); // Use first 20 existing seats

      await updateSeatConfiguration({
        id: parentModel1.id,
        seats: existingSeats.map((seat, i) => ({
          seatNumber: isSeatModel(seat)
            ? seat.seatNumber || `S${i + 1}`
            : `S${i + 1}`,
          floorNumber: seat.floorNumber,
          seatType: i < 5 ? SeatType.VIP : SeatType.REGULAR, // First 5 become VIP
          position: seat.position,
          amenities: i < 5 ? ['WiFi', 'USB', 'Premium'] : ['USB'], // VIP get extra amenities
          active: true,
        })),
      });

      // Now regenerate seats - this should sync the changes to non-modified diagrams
      const regenerateResponse = await regenerateSeats({
        id: parentModel1.id,
      });

      expect(regenerateResponse).toBeDefined();
      expect(regenerateResponse.summaries).toBeDefined();
      expect(Array.isArray(regenerateResponse.summaries)).toBe(true);

      // Should have exactly 2 summaries (for the 2 non-modified diagrams)
      expect(regenerateResponse.summaries).toHaveLength(2);

      // Verify each summary has the correct structure and IDs
      const regeneratedIds = regenerateResponse.summaries.map(
        (s) => s.seatDiagramId,
      );
      expect(regeneratedIds).toContain(childDiagram1A.id);
      expect(regeneratedIds).toContain(childDiagram1C.id);
      expect(regeneratedIds).not.toContain(childDiagram1B.id); // Modified diagram should be excluded

      // Each summary should show the structure
      regenerateResponse.summaries.forEach((summary) => {
        expect(summary.seatDiagramId).toBeDefined();
        expect(typeof summary.seatDiagramId).toBe('number');
        expect(typeof summary.created).toBe('number');
        expect(typeof summary.updated).toBe('number');
        expect(typeof summary.deleted).toBe('number');

        // Since we're changing parent configuration, expect some changes
        expect(summary.created).toBeGreaterThanOrEqual(0);
        expect(summary.updated).toBeGreaterThanOrEqual(0);
        expect(summary.deleted).toBeGreaterThanOrEqual(0);
      });

      // Verify zones were synchronized to non-modified diagrams
      for (const diagramId of [childDiagram1A.id, childDiagram1C.id]) {
        const syncedZones = await seatDiagramZoneRepository.findAll({
          filters: { seatDiagramId: diagramId },
          orderBy: [{ field: 'name', direction: 'asc' }],
        });

        expect(syncedZones).toHaveLength(2); // Should match parent model zones

        // Compare each zone with corresponding parent zone
        for (let i = 0; i < parentModel1Zones.length; i++) {
          compareZones(parentModel1Zones[i], syncedZones[i]);
        }
      }
    });

    test('should regenerate seats only for non-modified diagrams of parent model 2', async () => {
      // First, modify the parent model 2 by updating existing seats properties
      const existingSeats = parentModel2Seats.slice(0, 15); // Use first 15 existing seats

      await updateSeatConfiguration({
        id: parentModel2.id,
        seats: existingSeats.map((seat, i) => ({
          seatNumber: isSeatModel(seat)
            ? seat.seatNumber || `V${i + 1}`
            : `V${i + 1}`,
          floorNumber: seat.floorNumber,
          seatType: i < 3 ? SeatType.PREMIUM : SeatType.REGULAR, // First 3 become premium
          position: seat.position,
          amenities: i < 3 ? ['WiFi', 'USB', 'Comfort'] : ['USB'],
          active: true,
        })),
      });

      const regenerateResponse = await regenerateSeats({
        id: parentModel2.id,
      });

      expect(regenerateResponse.summaries).toHaveLength(1);
      expect(regenerateResponse.summaries[0].seatDiagramId).toBe(
        childDiagram2A.id,
      );

      // Verify summary structure
      const summary = regenerateResponse.summaries[0];
      expect(typeof summary.created).toBe('number');
      expect(typeof summary.updated).toBe('number');
      expect(typeof summary.deleted).toBe('number');

      // Basic validation of the response structure
      expect(summary.created).toBeGreaterThanOrEqual(0);
      expect(summary.updated).toBeGreaterThanOrEqual(0);
      expect(summary.deleted).toBeGreaterThanOrEqual(0);

      // Verify zones were synchronized to the non-modified diagram
      const syncedZones = await seatDiagramZoneRepository.findAll({
        filters: { seatDiagramId: childDiagram2A.id },
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      expect(syncedZones).toHaveLength(1); // Should match parent model 2 zones

      // Compare zones with corresponding parent zones
      for (let i = 0; i < parentModel2Zones.length; i++) {
        compareZones(parentModel2Zones[i], syncedZones[i]);
      }
    });

    test('should not affect modified diagrams during regeneration', async () => {
      // Verify that modified diagram from parent model 1 was NOT changed
      // It should still have the original 32 seats from before parent modification
      const unchangedSeats1B = await busSeatRepository.findAll({
        filters: { seatDiagramId: childDiagram1B.id },
        orderBy: [{ field: 'seatNumber', direction: 'asc' }],
      });

      expect(unchangedSeats1B).toHaveLength(32); // Should still have original seat count

      // Modified diagram should still match the ORIGINAL parent seats (before modification)
      // This proves that regenerateSeats did NOT affect the modified diagram
      for (let i = 0; i < parentModel1Seats.length; i++) {
        compareSeats(parentModel1Seats[i], unchangedSeats1B[i]);
      }

      // Verify that modified diagram from parent model 2 was NOT changed
      // It should still have the original 24 seats from before parent modification
      const unchangedSeats2B = await busSeatRepository.findAll({
        filters: { seatDiagramId: childDiagram2B.id },
        orderBy: [{ field: 'seatNumber', direction: 'asc' }],
      });

      expect(unchangedSeats2B).toHaveLength(28); // Should still have original seat count

      // Should still match the ORIGINAL parent seats (before modification)
      for (let i = 0; i < parentModel2Seats.length; i++) {
        compareSeats(parentModel2Seats[i], unchangedSeats2B[i]);
      }

      // Verify zones in modified diagrams were NOT affected by regenerateSeats
      // They should still have the original zones from when they were created
      const unchangedZones1B = await seatDiagramZoneRepository.findAll({
        filters: { seatDiagramId: childDiagram1B.id },
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      const unchangedZones2B = await seatDiagramZoneRepository.findAll({
        filters: { seatDiagramId: childDiagram2B.id },
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      // Modified diagrams should not have received zones from regenerateSeats
      // They should still have 0 zones since they were marked as modified before sync
      expect(unchangedZones1B).toHaveLength(0); // Should not have received zones
      expect(unchangedZones2B).toHaveLength(0); // Should not have received zones
    });

    test('should return empty summaries for models with no child diagrams', async () => {
      // Test regenerateSeats on a model with no seat diagrams (original createdBusDiagramModelId)
      const regenerateResponseEmpty = await regenerateSeats({
        id: createdBusDiagramModelId,
      });

      expect(regenerateResponseEmpty.summaries).toHaveLength(0);
    });

    test('should clean up all test data properly', async () => {
      // Delete child seat diagrams first (to avoid foreign key constraints)
      await seatDiagramRepository.delete(childDiagram1A.id);
      await seatDiagramRepository.delete(childDiagram1B.id);
      await seatDiagramRepository.delete(childDiagram1C.id);
      await seatDiagramRepository.delete(childDiagram2A.id);
      await seatDiagramRepository.delete(childDiagram2B.id);

      // Delete zones before deleting parent models
      const zones1 = await busDiagramModelZoneRepository.findAll({
        filters: { busDiagramModelId: parentModel1.id },
      });
      for (const zone of zones1) {
        await busDiagramModelZoneRepository.delete(zone.id);
      }

      const zones2 = await busDiagramModelZoneRepository.findAll({
        filters: { busDiagramModelId: parentModel2.id },
      });
      for (const zone of zones2) {
        await busDiagramModelZoneRepository.delete(zone.id);
      }

      // Delete seat models before deleting parent models
      const seatModels1 = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        parentModel1.id,
      );
      for (const seatModel of seatModels1) {
        await busSeatModelRepository.delete(seatModel.id);
      }

      const seatModels2 = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        parentModel2.id,
      );
      for (const seatModel of seatModels2) {
        await busSeatModelRepository.delete(seatModel.id);
      }

      // Then delete parent diagram models
      await deleteBusDiagramModel({ id: parentModel1.id });
      await deleteBusDiagramModel({ id: parentModel2.id });

      // Verify cleanup was successful by trying to get deleted models
      await expect(
        getBusDiagramModel({ id: parentModel1.id }),
      ).rejects.toThrow();
      await expect(
        getBusDiagramModel({ id: parentModel2.id }),
      ).rejects.toThrow();
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

      // Clean up - first delete seat models to avoid dependency errors
      const validationTestSeatModels = await busSeatModelRepository.findAllBy(
        busSeatModels.busDiagramModelId,
        testModel.id,
      );
      for (const seatModel of validationTestSeatModels) {
        await busSeatModelRepository.delete(seatModel.id);
      }
      await deleteBusDiagramModel({ id: testModel.id });
    });

    test('should rollback diagram model creation if seat models creation fails', async () => {
      // Get initial count of diagram models
      const initialDiagramModels = await listBusDiagramModels({
        orderBy: [{ field: 'name', direction: 'asc' }],
      });
      const initialCount = initialDiagramModels.data.length;

      // Mock the seat model use case to fail using vi.spyOn
      const mockSpy = vi
        .spyOn(busSeatModelUseCases, 'createSeatModelsFromDiagramModel')
        .mockRejectedValue(new Error('Seat models creation failed'));

      // Verify the mock is active before proceeding
      expect(mockSpy).toBeDefined();
      expect(mockSpy.getMockImplementation()).toBeDefined();

      try {
        // Attempt to create a diagram model - this should fail and rollback
        await createBusDiagramModel(testBusDiagramModel);

        // If we reach here, the mock did not work - fail the test immediately
        // This is a test design issue, not a cleanup issue
        throw new Error(
          'TEST DESIGN ERROR: Mock did not intercept the call. The transaction should have failed.',
        );
      } catch (error) {
        // Verify the error is from our mock
        expect(error).toBeInstanceOf(Error);
        const errorMessage = (error as Error).message;
        expect(errorMessage).toBe('Seat models creation failed');

        // Verify the mock was called (this confirms the mock worked)
        expect(mockSpy).toHaveBeenCalled();
      } finally {
        // Always restore the mock
        mockSpy.mockRestore();
      }

      // Verify that no new diagram model was created (transaction was rolled back)
      const finalDiagramModels = await listBusDiagramModels({
        orderBy: [{ field: 'name', direction: 'asc' }],
      });
      expect(finalDiagramModels.data).toHaveLength(initialCount);

      // Double-check: verify no model with the test name exists
      const testModelExists = finalDiagramModels.data.some(
        (model) => model.name === testBusDiagramModel.name,
      );
      expect(testModelExists).toBe(false);
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
      const nonPaginatedResponse = await listBusDiagramModels({
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      expect(nonPaginatedResponse.data).toBeDefined();
      expect(Array.isArray(nonPaginatedResponse.data)).toBe(true);
      expect(nonPaginatedResponse.data.length).toBeGreaterThan(0);
      // No pagination info should be present
      expect(nonPaginatedResponse).not.toHaveProperty('pagination');
    });
  });
});
