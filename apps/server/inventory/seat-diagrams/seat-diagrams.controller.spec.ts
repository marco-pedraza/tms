import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createBusDiagramModel } from '../bus-diagram-models/bus-diagram-models.controller';
import { BusDiagramModel } from '../bus-diagram-models/bus-diagram-models.types';
import { createBusSeat } from '../bus-seats/bus-seats.controller';
import { SeatType } from '../bus-seats/bus-seats.types';
import {
  FloorSeats,
  SeatConfiguration,
  SpaceType,
} from './seat-diagrams.types';
import { seatDiagramRepository } from './seat-diagrams.repository';
import {
  deleteSeatDiagram,
  getSeatDiagram,
  getSeatDiagramConfiguration,
  listSeatDiagrams,
  listSeatDiagramsPaginated,
  updateSeatDiagram,
} from './seat-diagrams.controller';
import { seatDiagramUseCases } from './seat-diagrams.use-cases';

describe('Seat Diagrams Controller', () => {
  // Test data and setup
  const testFloorSeats: FloorSeats = {
    floorNumber: 1,
    numRows: 10,
    seatsLeft: 2,
    seatsRight: 2,
  };

  // Before creating the seat diagram, create a bus diagram model
  const testDiagramModel = {
    name: 'Test Bus Diagram Model',
    description: 'A test model',
    maxCapacity: 50,
    numFloors: 1,
    seatsPerFloor: [testFloorSeats],
    totalSeats: 40,
    isFactoryDefault: true,
  };

  let basicSeatDiagram: {
    name: string;
    maxCapacity: number;
    numFloors: number;
    seatsPerFloor: FloorSeats[];
    totalSeats: number;
    busDiagramModelId: number;
  };

  let complexSeatDiagram: {
    name: string;
    maxCapacity: number;
    numFloors: number;
    seatsPerFloor: FloorSeats[];
    totalSeats: number;
    busDiagramModelId: number;
  };

  const updatePayload = {
    name: 'Updated Diagram',
    maxCapacity: 70,
  };

  // Variables to store created IDs for cleanup
  let createdSeatDiagramId: number;
  let additionalDiagramId: number | undefined;
  let useCaseDiagramId: number;

  let diagramModelResponse: BusDiagramModel;
  let theoreticalConfig: SeatConfiguration;
  let actualConfig: SeatConfiguration;

  beforeAll(async () => {
    diagramModelResponse = await createBusDiagramModel(testDiagramModel);

    basicSeatDiagram = {
      busDiagramModelId: diagramModelResponse.id,
      name: 'Test Diagram',
      maxCapacity: 50,
      numFloors: 1,
      seatsPerFloor: [testFloorSeats],
      totalSeats: 40,
    };

    // Define complexSeatDiagram here after diagramModelResponse is available
    complexSeatDiagram = {
      busDiagramModelId: diagramModelResponse.id,
      name: 'Test Theoretical Diagram',
      maxCapacity: 60,
      numFloors: 2,
      seatsPerFloor: [
        {
          floorNumber: 1,
          numRows: 5,
          seatsLeft: 2,
          seatsRight: 2,
        },
        {
          floorNumber: 2,
          numRows: 4,
          seatsLeft: 2,
          seatsRight: 2,
        },
      ],
      totalSeats: 32,
    };
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
  });

  describe('success scenarios', () => {
    test('should create a new seat diagram', async () => {
      // Create a new seat diagram using the repository directly
      const response = await seatDiagramRepository.create(basicSeatDiagram);

      // Store the ID for later cleanup
      createdSeatDiagramId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(basicSeatDiagram.name);
      expect(response.maxCapacity).toBe(basicSeatDiagram.maxCapacity);
      expect(response.numFloors).toBe(basicSeatDiagram.numFloors);
      expect(response.seatsPerFloor).toEqual(basicSeatDiagram.seatsPerFloor);
      expect(response.totalSeats).toBe(basicSeatDiagram.totalSeats);
      expect(response.active).toBeDefined();
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();
    });

    test('should retrieve a seat diagram by ID', async () => {
      const response = await getSeatDiagram({ id: createdSeatDiagramId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdSeatDiagramId);
      expect(response.name).toBe(basicSeatDiagram.name);
      expect(response.maxCapacity).toBe(basicSeatDiagram.maxCapacity);
    });

    test('should list all seat diagrams', async () => {
      const response = await listSeatDiagrams();

      expect(response).toBeDefined();
      expect(response.seatDiagrams).toBeDefined();
      expect(Array.isArray(response.seatDiagrams)).toBe(true);
      expect(response.seatDiagrams.length).toBeGreaterThan(0);

      // Find our test diagram in the list
      const foundDiagram = response.seatDiagrams.find(
        (diagram) => diagram.id === createdSeatDiagramId,
      );
      expect(foundDiagram).toBeDefined();
    });

    test('should update a seat diagram', async () => {
      const response = await updateSeatDiagram({
        id: createdSeatDiagramId,
        ...updatePayload,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdSeatDiagramId);
      expect(response.name).toBe(updatePayload.name);
      expect(response.maxCapacity).toBe(updatePayload.maxCapacity);
      // Fields not in updatePayload should remain unchanged
      expect(response.numFloors).toBe(basicSeatDiagram.numFloors);
      expect(response.busDiagramModelId).toBe(
        basicSeatDiagram.busDiagramModelId,
      );
    });

    test('should delete a seat diagram', async () => {
      // Create a diagram specifically for deletion test using the repository
      const diagramToDelete = await seatDiagramRepository.create({
        name: 'Diagram To Delete',
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
        busDiagramModelId: diagramModelResponse.id,
      });

      additionalDiagramId = diagramToDelete.id;

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
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getSeatDiagram({ id: 9999 })).rejects.toThrow();
    });

    // NOTE: We are not testing validation errors because they're handled by Encore's rust runtime
  });

  describe('pagination', () => {
    test('should return paginated seat diagrams with default parameters', async () => {
      const response = await listSeatDiagramsPaginated({});

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
      const response = await listSeatDiagramsPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('seat generation from theoretical model', () => {
    test('should build a theoretical configuration matching model specifications', async () => {
      // Create a seat diagram for testing use cases (using repository directly)
      const diagram = await seatDiagramRepository.create(complexSeatDiagram);
      useCaseDiagramId = diagram.id;

      // Get the theoretical configuration directly
      theoreticalConfig =
        seatDiagramUseCases.buildTheoreticalConfiguration(diagram);

      // Assertions for theoretical configuration
      expect(theoreticalConfig).toBeDefined();
      expect(theoreticalConfig.floors).toBeDefined();
      expect(Array.isArray(theoreticalConfig.floors)).toBe(true);
      expect(theoreticalConfig.floors.length).toBe(
        complexSeatDiagram.numFloors,
      );

      // Check floor 1 configuration - add bounds checking
      expect(theoreticalConfig.floors.length).toBeGreaterThan(0);
      const floor1 = theoreticalConfig.floors[0];
      expect(floor1).toBeDefined();
      expect(floor1.floorNumber).toBe(1);
      expect(floor1.rows).toBeDefined();

      // Safe access to seatsPerFloor[0]
      const floorConfig0 = complexSeatDiagram.seatsPerFloor[0];
      expect(floorConfig0).toBeDefined();
      expect(floor1.rows.length).toBe(floorConfig0.numRows);

      // Verify regular rows have the correct number of seats
      const regularRowIndices = [0, 1, 2, 3, 4]; // All rows are regular now
      for (const rowIndex of regularRowIndices) {
        // Add bounds checking
        expect(rowIndex).toBeLessThan(floor1.rows.length);

        const row = floor1.rows[rowIndex];
        expect(row).toBeDefined();

        // Count the number of seats in the row
        const seatCount = row.filter(
          (space) => space.type === SpaceType.SEAT,
        ).length;

        expect(seatCount).toBe(
          floorConfig0.seatsLeft + floorConfig0.seatsRight,
        );
      }

      // Verify total seat count matches expected
      const floorConfigFirst = complexSeatDiagram.seatsPerFloor[0];
      const floorConfig1 = complexSeatDiagram.seatsPerFloor[1];

      expect(floorConfigFirst).toBeDefined();
      expect(floorConfig1).toBeDefined();

      const expectedTotalSeats =
        // Floor 1: 5 regular rows * (2 left + 2 right seats)
        floorConfigFirst.numRows *
          (floorConfigFirst.seatsLeft + floorConfigFirst.seatsRight) +
        // Floor 2: 4 regular rows * (2 left + 2 right seats)
        floorConfig1.numRows *
          (floorConfig1.seatsLeft + floorConfig1.seatsRight);

      expect(theoreticalConfig.totalSeats).toBe(expectedTotalSeats);
    });

    test('should generate seat configuration matching the theoretical model', async () => {
      // Get the seat configuration via the controller
      actualConfig = await getSeatDiagramConfiguration({
        id: useCaseDiagramId,
      });

      // Assertions for the actual configuration
      expect(actualConfig).toBeDefined();
      expect(actualConfig.floors).toBeDefined();
      expect(Array.isArray(actualConfig.floors)).toBe(true);
      expect(actualConfig.floors.length).toBe(complexSeatDiagram.numFloors);
      expect(actualConfig.totalSeats).toBe(theoreticalConfig.totalSeats);

      // Compare key aspects of the configurations
      expect(actualConfig.totalSeats).toBe(theoreticalConfig.totalSeats);
      expect(actualConfig.floors.length).toBe(theoreticalConfig.floors.length);

      // Verify floors match
      for (let i = 0; i < actualConfig.floors.length; i++) {
        // Add bounds checking for array accesses
        expect(i).toBeLessThan(theoreticalConfig.floors.length);

        // Use safe array access with bounds checking
        const actualFloor = actualConfig.floors[i];
        const theoreticalFloor = theoreticalConfig.floors[i];

        expect(actualFloor).toBeDefined();
        expect(theoreticalFloor).toBeDefined();
        expect(actualFloor.floorNumber).toBe(theoreticalFloor.floorNumber);
        expect(actualFloor.rows.length).toBe(theoreticalFloor.rows.length);

        // Verify rows match - compare row structures
        for (let j = 0; j < actualFloor.rows.length; j++) {
          // Add bounds checking
          expect(j).toBeLessThan(theoreticalFloor.rows.length);

          const actualRow = actualFloor.rows[j];
          const theoreticalRow = theoreticalFloor.rows[j];

          expect(actualRow).toBeDefined();
          expect(theoreticalRow).toBeDefined();
          expect(actualRow.length).toBe(theoreticalRow.length);

          // Count seat types in each row
          const actualSeatCount = actualRow.filter(
            (space) => space.type === SpaceType.SEAT,
          ).length;
          const theoreticalSeatCount = theoreticalRow.filter(
            (space) => space.type === SpaceType.SEAT,
          ).length;
          expect(actualSeatCount).toBe(theoreticalSeatCount);

          // Check if bathroom exists in both rows
          const actualHasBathroom = actualRow.some(
            (space) => space.type === SpaceType.BATHROOM,
          );
          const theoreticalHasBathroom = theoreticalRow.some(
            (space) => space.type === SpaceType.BATHROOM,
          );
          expect(actualHasBathroom).toBe(theoreticalHasBathroom);
        }
      }
    });

    test('should create custom seat and override theoretical configuration', async () => {
      // Ensure we have a valid diagram ID from the previous test
      expect(useCaseDiagramId).toBeDefined();
      expect(useCaseDiagramId).toBeGreaterThan(0);

      // Get the initial theoretical configuration (no existing seats)
      const initialConfig = await getSeatDiagramConfiguration({
        id: useCaseDiagramId,
      });
      expect(initialConfig.floors.length).toBeGreaterThan(0);
      const floor1 = initialConfig.floors[0];
      expect(floor1).toBeDefined();
      expect(floor1.rows.length).toBeGreaterThan(0);
      const firstRow = floor1.rows[0];
      expect(firstRow).toBeDefined();

      // In a theoretical configuration, position 0 should be a seat
      const initialSpace = firstRow[0];
      expect(initialSpace).toBeDefined();
      expect(initialSpace.type).toBe(SpaceType.SEAT);

      // Now create a custom seat at position 0
      const createSeatPayload = {
        seatDiagramId: useCaseDiagramId,
        seatNumber: 'CUSTOM_01',
        floorNumber: 1,
        seatType: SeatType.REGULAR,
        amenities: ['USB', 'WIFI'],
        position: {
          x: 0, // First position on the left side
          y: 1, // First row (1-indexed in database)
        },
        meta: { custom: true },
        active: true,
      };

      // Create the seat
      await createBusSeat(createSeatPayload);

      // Get the updated configuration (should now show the custom seat)
      const updatedConfig = await getSeatDiagramConfiguration({
        id: useCaseDiagramId,
      });

      // Check if the space now has our custom seat data
      expect(updatedConfig.floors.length).toBeGreaterThan(0);
      const updatedFloor1 = updatedConfig.floors[0];
      expect(updatedFloor1).toBeDefined();
      expect(updatedFloor1.rows.length).toBeGreaterThan(0);
      const updatedFirstRow = updatedFloor1.rows[0];
      expect(updatedFirstRow).toBeDefined();

      const updatedSpace = updatedFirstRow[0];
      expect(updatedSpace).toBeDefined();
      expect(updatedSpace.type).toBe(SpaceType.SEAT);
      expect(updatedSpace.seatNumber).toBe('CUSTOM_01');
      expect(updatedSpace.amenities).toContain('USB');
      expect(updatedSpace.amenities).toContain('WIFI');
    });
  });
});
