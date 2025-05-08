import { expect, describe, test, afterAll, beforeAll } from 'vitest';
import {
  getSeatDiagram,
  listSeatDiagrams,
  listSeatDiagramsPaginated,
  updateSeatDiagram,
  deleteSeatDiagram,
  getSeatDiagramConfiguration,
  createSeatsFromDiagramConfiguration,
} from './seat-diagrams.controller';
import {
  listBusSeatsBySeatDiagram,
  deleteBusSeat,
  createBusSeat,
} from '../bus-seats/bus-seats.controller';
import { seatDiagramUseCases } from './seat-diagrams.use-cases';
import {
  FloorSeats,
  BathroomLocation,
  SpaceType,
  SeatConfiguration,
} from './seat-diagrams.types';
import { SeatType } from '../bus-seats/bus-seats.types';
import { seatDiagramRepository } from './seat-diagrams.repository';
import { createSeatLayoutModel } from '../seat-layout-models/seat-layout-models.controller';
import { SeatLayoutModel } from '../seat-layout-models/seat-layout-models.types';

describe('Seat Diagrams Controller', () => {
  // Test data and setup
  const testFloorSeats: FloorSeats = {
    floorNumber: 1,
    numRows: 10,
    seatsLeft: 2,
    seatsRight: 2,
  };

  const testBathroomLocation: BathroomLocation = {
    floorNumber: 1,
    rowNumber: 5,
  };

  // Before creating the seat diagram, create a seat layout model
  const testLayoutModel = {
    name: 'Test Layout Model',
    description: 'A test model',
    maxCapacity: 50,
    numFloors: 1,
    seatsPerFloor: [testFloorSeats],
    bathroomRows: [testBathroomLocation],
    totalSeats: 40,
    isFactoryDefault: true,
  };

  let basicSeatDiagram: {
    name: string;
    maxCapacity: number;
    numFloors: number;
    allowsAdjacentSeat: boolean;
    seatsPerFloor: FloorSeats[];
    bathroomRows: BathroomLocation[];
    totalSeats: number;
    seatLayoutModelId: number;
  };

  let complexSeatDiagram: {
    name: string;
    maxCapacity: number;
    numFloors: number;
    allowsAdjacentSeat: boolean;
    seatsPerFloor: FloorSeats[];
    bathroomRows: BathroomLocation[];
    totalSeats: number;
    seatLayoutModelId: number;
  };

  const updatePayload = {
    name: 'Updated Diagram',
    maxCapacity: 70,
  };

  // Variables to store created IDs for cleanup
  let createdSeatDiagramId: number;
  let additionalDiagramId: number | undefined;
  let useCaseDiagramId: number;

  let layoutModelResponse: SeatLayoutModel;
  let theoreticalConfig: SeatConfiguration;
  let actualConfig: SeatConfiguration;
  let seatsCreated: number;

  beforeAll(async () => {
    layoutModelResponse = await createSeatLayoutModel(testLayoutModel);

    basicSeatDiagram = {
      seatLayoutModelId: layoutModelResponse.id,
      name: 'Test Diagram',
      maxCapacity: 50,
      numFloors: 1,
      allowsAdjacentSeat: true,
      seatsPerFloor: [testFloorSeats],
      bathroomRows: [testBathroomLocation],
      totalSeats: 40,
    };

    // Define complexSeatDiagram here after layoutModelResponse is available
    complexSeatDiagram = {
      seatLayoutModelId: layoutModelResponse.id,
      name: 'Test Theoretical Diagram',
      maxCapacity: 60,
      numFloors: 2,
      allowsAdjacentSeat: true,
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
      bathroomRows: [
        {
          floorNumber: 1,
          rowNumber: 3,
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
      expect(response.allowsAdjacentSeat).toBe(
        basicSeatDiagram.allowsAdjacentSeat,
      );
      expect(response.seatsPerFloor).toEqual(basicSeatDiagram.seatsPerFloor);
      expect(response.bathroomRows).toEqual(basicSeatDiagram.bathroomRows);
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
      expect(response.seatLayoutModelId).toBe(
        basicSeatDiagram.seatLayoutModelId,
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
        seatLayoutModelId: layoutModelResponse.id,
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
      const floor1 = (() => {
        // Create a Map to safely access the floors by index
        const floorsMap = new Map<number, unknown>();
        if (theoreticalConfig.floors) {
          theoreticalConfig.floors.forEach((floor, idx) =>
            floorsMap.set(idx, floor),
          );
        }
        return floorsMap.get(0);
      })();
      expect(floor1).not.toBeNull();
      expect(floor1.floorNumber).toBe(1);
      expect(floor1.rows).toBeDefined();

      // Safe access to seatsPerFloor[0] using a Map
      const floorConfig0 = (() => {
        // Create a Map to safely access seatsPerFloor by index
        const configMap = new Map<number, unknown>();
        if (complexSeatDiagram.seatsPerFloor) {
          complexSeatDiagram.seatsPerFloor.forEach((config, idx) =>
            configMap.set(idx, config),
          );
        }
        return configMap.get(0);
      })();
      expect(floorConfig0).not.toBeNull();
      expect(floor1.rows.length).toBe(floorConfig0.numRows);

      // Verify bathroom row
      const bathroomRowIndex = (() => {
        // Create a Map to safely access bathroomRows by index
        const bathroomRowsMap = new Map<number, unknown>();
        if (complexSeatDiagram.bathroomRows) {
          complexSeatDiagram.bathroomRows.forEach((row, idx) =>
            bathroomRowsMap.set(idx, row),
          );
        }
        const bathroom = bathroomRowsMap.get(0);
        return bathroom ? bathroom.rowNumber - 1 : 0;
      })();

      // Add bounds checking before accessing arrays with variable indices
      expect(bathroomRowIndex).toBeGreaterThanOrEqual(0);
      expect(bathroomRowIndex).toBeLessThan(floor1.rows.length);

      // Use safe array access with null fallback and bounds checking
      const bathroomRow = (() => {
        // Create a Map to safely access the rows by index
        const rowsMap = new Map<number, unknown>();
        if (floor1?.rows) {
          floor1.rows.forEach((row, idx) => rowsMap.set(idx, row));
        }
        return rowsMap.get(bathroomRowIndex);
      })();

      expect(bathroomRow).not.toBeNull();
      expect(
        bathroomRow.some((space) => space.type === SpaceType.BATHROOM),
      ).toBe(true);

      // Verify regular rows have the correct number of seats
      const regularRowIndices = [0, 1, 3, 4]; // All rows except bathroom row
      for (const rowIndex of regularRowIndices) {
        // Add bounds checking
        expect(rowIndex).toBeLessThan(floor1.rows.length);

        // Use safe array access with null fallback and bounds checking
        const row = (() => {
          // Create a Map to safely access the rows by index
          const rowsMap = new Map<number, unknown>();
          if (floor1?.rows) {
            floor1.rows.forEach((row, idx) => rowsMap.set(idx, row));
          }
          return rowsMap.get(rowIndex);
        })();

        expect(row).not.toBeNull();
        // Count the number of seats in the row
        const seatCount = row.filter(
          (space) => space.type === SpaceType.SEAT,
        ).length;

        // Safe access to seatsPerFloor[0] using a Map
        const floorConfig0 = (() => {
          // Create a Map to safely access seatsPerFloor by index
          const configMap = new Map<number, unknown>();
          if (complexSeatDiagram.seatsPerFloor) {
            complexSeatDiagram.seatsPerFloor.forEach((config, idx) =>
              configMap.set(idx, config),
            );
          }
          return configMap.get(0);
        })();
        expect(floorConfig0).not.toBeNull();

        expect(seatCount).toBe(
          floorConfig0.seatsLeft + floorConfig0.seatsRight,
        );
      }

      // Verify total seat count matches expected
      // Safe access to seatsPerFloor using Maps
      const floorConfigFirst = (() => {
        // Create a Map to safely access seatsPerFloor by index
        const configMap = new Map<number, unknown>();
        if (complexSeatDiagram.seatsPerFloor) {
          complexSeatDiagram.seatsPerFloor.forEach((config, idx) =>
            configMap.set(idx, config),
          );
        }
        return configMap.get(0);
      })();

      const floorConfig1 = (() => {
        // Create a Map to safely access seatsPerFloor by index
        const configMap = new Map<number, unknown>();
        if (complexSeatDiagram.seatsPerFloor) {
          complexSeatDiagram.seatsPerFloor.forEach((config, idx) =>
            configMap.set(idx, config),
          );
        }
        return configMap.get(1);
      })();

      expect(floorConfigFirst).not.toBeNull();
      expect(floorConfig1).not.toBeNull();

      const expectedTotalSeats =
        // Floor 1: 4 regular rows * (2 left + 2 right seats)
        (floorConfigFirst.numRows - 1) *
          (floorConfigFirst.seatsLeft + floorConfigFirst.seatsRight) +
        // Floor 2: 4 regular rows * (2 left + 2 right seats)
        floorConfig1.numRows *
          (floorConfig1.seatsLeft + floorConfig1.seatsRight);

      expect(theoreticalConfig.totalSeats).toBe(expectedTotalSeats);
    });

    test('should create actual seats matching the theoretical model', async () => {
      // Create seats from the theoretical configuration
      const response = await createSeatsFromDiagramConfiguration({
        id: useCaseDiagramId,
      });

      seatsCreated = response.seatsCreated;
      expect(seatsCreated).toBeDefined();
      expect(seatsCreated).toBeGreaterThan(0);
      expect(seatsCreated).toBe(theoreticalConfig.totalSeats);

      // Fetch the actual seats created
      const seatsResponse = await listBusSeatsBySeatDiagram({
        seatDiagramId: useCaseDiagramId,
      });
      expect(seatsResponse.busSeats).toBeDefined();
      expect(seatsResponse.busSeats.length).toBe(seatsCreated);
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

        // Use safe array access with null fallback and bounds checking
        const actualFloor = (() => {
          // Create a Map to safely access the floors by index
          const floorsMap = new Map<number, unknown>();
          if (actualConfig.floors) {
            actualConfig.floors.forEach((floor, idx) =>
              floorsMap.set(idx, floor),
            );
          }
          return floorsMap.get(i);
        })();

        const theoreticalFloor = (() => {
          // Create a Map to safely access the floors by index
          const floorsMap = new Map<number, unknown>();
          if (theoreticalConfig.floors) {
            theoreticalConfig.floors.forEach((floor, idx) =>
              floorsMap.set(idx, floor),
            );
          }
          return floorsMap.get(i);
        })();

        expect(actualFloor).not.toBeNull();
        expect(theoreticalFloor).not.toBeNull();
        expect(actualFloor.floorNumber).toBe(theoreticalFloor.floorNumber);
        expect(actualFloor.rows.length).toBe(theoreticalFloor.rows.length);

        // Verify rows match - compare row structures
        for (let j = 0; j < actualFloor.rows.length; j++) {
          // Add bounds checking
          expect(j).toBeLessThan(theoreticalFloor.rows.length);

          // Use safe array access with null fallback and bounds checking
          const actualRow = (() => {
            // Create a Map to safely access the rows by index
            const rowsMap = new Map<number, unknown>();
            if (actualFloor?.rows) {
              actualFloor.rows.forEach((row, idx) => rowsMap.set(idx, row));
            }
            return rowsMap.get(j);
          })();

          const theoreticalRow = (() => {
            // Create a Map to safely access the rows by index
            const rowsMap = new Map<number, unknown>();
            if (theoreticalFloor?.rows) {
              theoreticalFloor.rows.forEach((row, idx) =>
                rowsMap.set(idx, row),
              );
            }
            return rowsMap.get(j);
          })();

          expect(actualRow).not.toBeNull();
          expect(theoreticalRow).not.toBeNull();
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

    test('should convert deleted seat space to hallway in the diagram', async () => {
      // Create seats from the theoretical configuration first
      await createSeatsFromDiagramConfiguration({ id: useCaseDiagramId });

      // Get initial configuration to identify a seat to delete
      const initialConfig = await getSeatDiagramConfiguration({
        id: useCaseDiagramId,
      });

      // Find a seat to delete - selecting a seat from first floor, first row
      expect(initialConfig.floors.length).toBeGreaterThan(0);
      const floor1 = (() => {
        // Create a Map to safely access the floors by index
        const floorsMap = new Map<number, unknown>();
        if (initialConfig.floors) {
          initialConfig.floors.forEach((floor, idx) =>
            floorsMap.set(idx, floor),
          );
        }
        return floorsMap.get(0);
      })();
      expect(floor1).not.toBeNull();
      expect(floor1.rows.length).toBeGreaterThan(0);
      const firstRow = (() => {
        // Create a Map to safely access the rows by index
        const rowsMap = new Map<number, unknown>();
        if (floor1?.rows) {
          floor1.rows.forEach((row, idx) => rowsMap.set(idx, row));
        }
        return rowsMap.get(0);
      })();
      expect(firstRow).not.toBeNull();

      // Find a seat to delete safely
      const seatToDelete = firstRow.find(
        (space) => space.type === SpaceType.SEAT,
      );
      expect(seatToDelete).toBeDefined();

      // Position info to identify the seat in the configuration
      const seatX = firstRow.indexOf(seatToDelete);
      expect(seatX).toBeGreaterThanOrEqual(0);

      // Get the actual seats to find the one at this position
      const seatsResponse = await listBusSeatsBySeatDiagram({
        seatDiagramId: useCaseDiagramId,
      });
      const targetSeat = seatsResponse.busSeats.find(
        (seat) =>
          seat.position.x === seatX &&
          seat.position.y === 1 && // Position y is 1-indexed in the database
          seat.floorNumber === 1,
      );

      expect(targetSeat).toBeDefined();

      // Delete the seat
      await deleteBusSeat({ id: targetSeat.id });

      // Get the updated configuration
      const updatedConfig = await getSeatDiagramConfiguration({
        id: useCaseDiagramId,
      });

      // Check that the space is now a hallway
      expect(updatedConfig.floors.length).toBeGreaterThan(0);
      const updatedFloor1 = (() => {
        // Create a Map to safely access the floors by index
        const floorsMap = new Map<number, unknown>();
        if (updatedConfig.floors) {
          updatedConfig.floors.forEach((floor, idx) =>
            floorsMap.set(idx, floor),
          );
        }
        return floorsMap.get(0);
      })();
      expect(updatedFloor1).not.toBeNull();
      expect(updatedFloor1.rows.length).toBeGreaterThan(0);
      const updatedFirstRow = (() => {
        // Create a Map to safely access the rows by index
        const rowsMap = new Map<number, unknown>();
        if (updatedFloor1?.rows) {
          updatedFloor1.rows.forEach((row, idx) => rowsMap.set(idx, row));
        }
        return rowsMap.get(0);
      })();
      expect(updatedFirstRow).not.toBeNull();

      // Using a safer approach with bounds checking
      const updatedSpace = (() => {
        // Create a Map to safely access the spaces by index
        const spacesMap = new Map<number, unknown>();
        if (updatedFirstRow) {
          updatedFirstRow.forEach((space, idx) => spacesMap.set(idx, space));
        }
        return spacesMap.get(seatX);
      })();

      expect(updatedSpace).not.toBeNull();
      expect(updatedSpace.type).toBe(SpaceType.HALLWAY);
    });

    test('should restore seat in the same position when recreated', async () => {
      // From the previous test, we have deleted a seat at (x, y) = (seatX, 0) on floor 1
      // Get the current configuration to confirm the hallway position
      const initialConfig = await getSeatDiagramConfiguration({
        id: useCaseDiagramId,
      });
      expect(initialConfig.floors.length).toBeGreaterThan(0);
      const floor1 = (() => {
        // Create a Map to safely access the floors by index
        const floorsMap = new Map<number, unknown>();
        if (initialConfig.floors) {
          initialConfig.floors.forEach((floor, idx) =>
            floorsMap.set(idx, floor),
          );
        }
        return floorsMap.get(0);
      })();
      expect(floor1).not.toBeNull();
      expect(floor1.rows.length).toBeGreaterThan(0);
      const firstRow = (() => {
        // Create a Map to safely access the rows by index
        const rowsMap = new Map<number, unknown>();
        if (floor1?.rows) {
          floor1.rows.forEach((row, idx) => rowsMap.set(idx, row));
        }
        return rowsMap.get(0);
      })();
      expect(firstRow).not.toBeNull();

      // Find the first hallway space (which was our deleted seat)
      const hallwayIndex = firstRow.findIndex(
        (space) => space.type === SpaceType.HALLWAY,
      );
      expect(hallwayIndex).not.toBe(-1);

      // Create a new seat at the same position
      const createSeatPayload = {
        seatDiagramId: useCaseDiagramId,
        seatNumber: 'RESTORED',
        floorNumber: 1,
        seatType: SeatType.REGULAR,
        amenities: ['USB'],
        position: {
          x: hallwayIndex,
          y: 1, // Database is 1-indexed for position.y
        },
        meta: { restored: true },
        active: true,
      };

      // Create the seat
      await createBusSeat(createSeatPayload);

      // Get the updated configuration
      const updatedConfig = await getSeatDiagramConfiguration({
        id: useCaseDiagramId,
      });

      // Check if the space is now a seat again
      expect(updatedConfig.floors.length).toBeGreaterThan(0);
      const updatedFloor1 = (() => {
        // Create a Map to safely access the floors by index
        const floorsMap = new Map<number, unknown>();
        if (updatedConfig.floors) {
          updatedConfig.floors.forEach((floor, idx) =>
            floorsMap.set(idx, floor),
          );
        }
        return floorsMap.get(0);
      })();
      expect(updatedFloor1).not.toBeNull();
      expect(updatedFloor1.rows.length).toBeGreaterThan(0);
      const updatedFirstRow = (() => {
        // Create a Map to safely access the rows by index
        const rowsMap = new Map<number, unknown>();
        if (updatedFloor1?.rows) {
          updatedFloor1.rows.forEach((row, idx) => rowsMap.set(idx, row));
        }
        return rowsMap.get(0);
      })();
      expect(updatedFirstRow).not.toBeNull();

      // Using a safer approach with bounds checking
      const updatedSpace = (() => {
        // Create a Map to safely access the spaces by index
        const spacesMap = new Map<number, unknown>();
        if (updatedFirstRow) {
          updatedFirstRow.forEach((space, idx) => spacesMap.set(idx, space));
        }
        return spacesMap.get(hallwayIndex);
      })();

      expect(updatedSpace).not.toBeNull();
      expect(updatedSpace.type).toBe(SpaceType.SEAT);
      expect(updatedSpace.seatNumber).toBe('RESTORED');
    });
  });
});
