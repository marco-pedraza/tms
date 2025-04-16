import { expect, describe, test, afterAll } from 'vitest';
import {
  createBusModel,
  getBusModel,
  listBusModels,
  listBusModelsPaginated,
  updateBusModel,
  deleteBusModel,
  getBusModelSeatConfiguration,
  createBusSeatsFromConfiguration,
} from './bus-models.controller';
import { FloorSeats, BathroomLocation, SpaceType } from './bus-models.types';
import {
  listBusSeatsByModel,
  deleteBusSeat,
} from '../bus-seats/bus-seats.controller';
import { busModelUseCases } from './bus-models.use-cases';
import { busSeatRepository } from '../bus-seats/bus-seats.repository';

describe('Bus Models Controller', () => {
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

  const testBusModel = {
    manufacturer: 'TestManufacturer',
    model: 'TestModel-1',
    year: 2023,
    seatingCapacity: 40,
    numFloors: 1,
    seatsPerFloor: [testFloorSeats],
    bathroomRows: [testBathroomLocation],
    amenities: ['WiFi', 'USB Charging', 'Air Conditioning'],
    engineType: 'Diesel',
    distributionType: 'Intercity',
    active: true,
  };

  // For use case tests
  const testUseCaseModel = {
    manufacturer: 'TestManufacturer',
    model: 'TestModel-UseCases',
    year: 2023,
    seatingCapacity: 40,
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
    bathroomRows: [
      {
        floorNumber: 1,
        rowNumber: 3,
      },
    ],
    amenities: ['WiFi', 'USB Charging'],
    active: true,
  };

  // Variables to store created IDs for cleanup
  let createdBusModelId: number;
  let additionalModelId: number;
  let useCaseModelId: number;
  let theoreticalConfig: unknown;
  let actualConfig: unknown;
  let seatsCreated: number;

  // Clean up after all tests
  afterAll(async () => {
    // Clean up the created bus model if any
    if (createdBusModelId) {
      try {
        // First clean up any seats associated with this model
        const seatsResponse = await listBusSeatsByModel({
          modelId: createdBusModelId,
        });
        if (seatsResponse?.busSeats) {
          for (const seat of seatsResponse.busSeats) {
            try {
              await deleteBusSeat({ id: seat.id });
            } catch (error) {
              console.log(`Error cleaning up bus seat ${seat.id}:`, error);
            }
          }
        }
        // Then delete the model
        await deleteBusModel({ id: createdBusModelId });
      } catch (error) {
        console.log('Error cleaning up test bus model:', error);
      }
    }

    // Clean up additional model created for deletion test
    if (additionalModelId) {
      try {
        // First clean up any seats associated with this model
        const seatsResponse = await listBusSeatsByModel({
          modelId: additionalModelId,
        });
        if (seatsResponse?.busSeats) {
          for (const seat of seatsResponse.busSeats) {
            try {
              await deleteBusSeat({ id: seat.id });
            } catch (error) {
              console.log(`Error cleaning up bus seat ${seat.id}:`, error);
            }
          }
        }
        // Then delete the model
        await deleteBusModel({ id: additionalModelId });
      } catch (error) {
        console.log('Error cleaning up additional bus model:', error);
      }
    }

    // Clean up use case model
    if (useCaseModelId) {
      try {
        // First clean up any seats associated with this model
        const seatsResponse = await listBusSeatsByModel({
          modelId: useCaseModelId,
        });
        if (seatsResponse?.busSeats) {
          for (const seat of seatsResponse.busSeats) {
            try {
              await deleteBusSeat({ id: seat.id });
            } catch (error) {
              console.log(`Error cleaning up bus seat ${seat.id}:`, error);
            }
          }
        }
        // Then delete the model
        await deleteBusModel({ id: useCaseModelId });
      } catch (error) {
        console.log('Error cleaning up use case bus model:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new bus model', async () => {
      // Create a new bus model
      const response = await createBusModel(testBusModel);

      // Store the ID for later cleanup
      createdBusModelId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.manufacturer).toBe(testBusModel.manufacturer);
      expect(response.model).toBe(testBusModel.model);
      expect(response.year).toBe(testBusModel.year);
      expect(response.seatingCapacity).toBe(testBusModel.seatingCapacity);
      expect(response.numFloors).toBe(testBusModel.numFloors);
      expect(response.seatsPerFloor).toEqual(testBusModel.seatsPerFloor);
      expect(response.bathroomRows).toEqual(testBusModel.bathroomRows);
      expect(response.amenities).toEqual(testBusModel.amenities);
      expect(response.engineType).toBe(testBusModel.engineType);
      expect(response.distributionType).toBe(testBusModel.distributionType);
      expect(response.active).toBe(testBusModel.active);
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();
    });

    test('should retrieve a bus model by ID', async () => {
      const response = await getBusModel({ id: createdBusModelId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusModelId);
      expect(response.manufacturer).toBe(testBusModel.manufacturer);
      expect(response.model).toBe(testBusModel.model);
      expect(response.year).toBe(testBusModel.year);
    });

    test('should list all bus models', async () => {
      const response = await listBusModels();

      expect(response).toBeDefined();
      expect(response.busModels).toBeDefined();
      expect(Array.isArray(response.busModels)).toBe(true);
      expect(response.busModels.length).toBeGreaterThan(0);

      // Find our test model in the list
      const foundModel = response.busModels.find(
        (model) => model.id === createdBusModelId,
      );
      expect(foundModel).toBeDefined();
      expect(foundModel?.manufacturer).toBe(testBusModel.manufacturer);
    });

    test('should update a bus model', async () => {
      const updateData = {
        manufacturer: 'UpdatedManufacturer',
        model: 'UpdatedModel',
        seatingCapacity: 45,
        amenities: [
          'WiFi',
          'USB Charging',
          'Air Conditioning',
          'Entertainment System',
        ],
        engineType: 'Electric',
      };

      const response = await updateBusModel({
        id: createdBusModelId,
        ...updateData,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusModelId);
      expect(response.manufacturer).toBe(updateData.manufacturer);
      expect(response.model).toBe(updateData.model);
      expect(response.seatingCapacity).toBe(updateData.seatingCapacity);
      expect(response.amenities).toEqual(updateData.amenities);
      expect(response.engineType).toBe(updateData.engineType);
      // Fields not in updateData should remain unchanged
      expect(response.year).toBe(testBusModel.year);
      expect(response.numFloors).toBe(testBusModel.numFloors);
    });

    test('should get seat configuration for a bus model', async () => {
      const response = await getBusModelSeatConfiguration({
        id: createdBusModelId,
      });

      expect(response).toBeDefined();
      expect(response.floors).toBeDefined();
      expect(Array.isArray(response.floors)).toBe(true);
      expect(response.floors.length).toBe(testBusModel.numFloors);
      expect(response.totalSeats).toBeGreaterThan(0);
      expect(response.amenities).toBeDefined();
    });

    test('should create seats from configuration', async () => {
      const response = await createBusSeatsFromConfiguration({
        id: createdBusModelId,
      });

      expect(response).toBeDefined();
      expect(response.seatsCreated).toBeDefined();
      expect(typeof response.seatsCreated).toBe('number');
      expect(response.seatsCreated).toBeGreaterThan(0);
    });

    test('should delete a bus model', async () => {
      // Create a model specifically for deletion test
      const modelToDelete = await createBusModel({
        manufacturer: 'DeleteManufacturer',
        model: 'DeleteModel',
        year: 2023,
        seatingCapacity: 30,
        numFloors: 1,
        seatsPerFloor: [
          {
            floorNumber: 1,
            numRows: 8,
            seatsLeft: 2,
            seatsRight: 2,
          },
        ],
        amenities: [],
        active: true,
      });

      additionalModelId = modelToDelete.id;

      // Delete should not throw an error
      await expect(
        deleteBusModel({ id: additionalModelId }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(getBusModel({ id: additionalModelId })).rejects.toThrow();

      // Reset the ID since we've deleted it
      additionalModelId = undefined;
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getBusModel({ id: 9999 })).rejects.toThrow();
    });

    // NOTE: We are not testing validation errors because they're handled by Encore's rust runtime
  });

  describe('pagination', () => {
    test('should return paginated bus models with default parameters', async () => {
      const response = await listBusModelsPaginated({});

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
      const response = await listBusModelsPaginated({
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
      // Create a bus model for testing use cases
      const model = await createBusModel(testUseCaseModel);
      useCaseModelId = model.id;

      // Get the theoretical configuration directly
      theoreticalConfig = busModelUseCases.buildTheoreticalConfiguration(model);

      // Assertions for theoretical configuration
      expect(theoreticalConfig).toBeDefined();
      expect(theoreticalConfig.floors).toBeDefined();
      expect(Array.isArray(theoreticalConfig.floors)).toBe(true);
      expect(theoreticalConfig.floors.length).toBe(testUseCaseModel.numFloors);
      expect(theoreticalConfig.amenities).toEqual(testUseCaseModel.amenities);

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
        if (testUseCaseModel.seatsPerFloor) {
          testUseCaseModel.seatsPerFloor.forEach((config, idx) =>
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
        if (testUseCaseModel.bathroomRows) {
          testUseCaseModel.bathroomRows.forEach((row, idx) =>
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
          if (testUseCaseModel.seatsPerFloor) {
            testUseCaseModel.seatsPerFloor.forEach((config, idx) =>
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
        if (testUseCaseModel.seatsPerFloor) {
          testUseCaseModel.seatsPerFloor.forEach((config, idx) =>
            configMap.set(idx, config),
          );
        }
        return configMap.get(0);
      })();

      const floorConfig1 = (() => {
        // Create a Map to safely access seatsPerFloor by index
        const configMap = new Map<number, unknown>();
        if (testUseCaseModel.seatsPerFloor) {
          testUseCaseModel.seatsPerFloor.forEach((config, idx) =>
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
      const response = await createBusSeatsFromConfiguration({
        id: useCaseModelId,
      });

      seatsCreated = response.seatsCreated;
      expect(seatsCreated).toBeDefined();
      expect(seatsCreated).toBeGreaterThan(0);
      expect(seatsCreated).toBe(theoreticalConfig.totalSeats);

      // Fetch the actual seats created
      const seatsResponse = await listBusSeatsByModel({
        modelId: useCaseModelId,
      });
      expect(seatsResponse.busSeats).toBeDefined();
      expect(seatsResponse.busSeats.length).toBe(seatsCreated);
    });

    test('should generate seat configuration matching the theoretical model', async () => {
      // Get the seat configuration via the controller
      actualConfig = await getBusModelSeatConfiguration({ id: useCaseModelId });

      // Assertions for the actual configuration
      expect(actualConfig).toBeDefined();
      expect(actualConfig.floors).toBeDefined();
      expect(Array.isArray(actualConfig.floors)).toBe(true);
      expect(actualConfig.floors.length).toBe(testUseCaseModel.numFloors);
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
      await createBusSeatsFromConfiguration({ id: useCaseModelId });

      // Get initial configuration to identify a seat to delete
      const initialConfig = await getBusModelSeatConfiguration({
        id: useCaseModelId,
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
      const seatsResponse = await listBusSeatsByModel({
        modelId: useCaseModelId,
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
      const updatedConfig = await getBusModelSeatConfiguration({
        id: useCaseModelId,
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
      const initialConfig = await getBusModelSeatConfiguration({
        id: useCaseModelId,
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
        modelId: useCaseModelId,
        seatNumber: 'RESTORED',
        floorNumber: 1,
        seatType: 'regular',
        amenities: ['USB'],
        position: {
          x: hallwayIndex,
          y: 1, // Database is 1-indexed for position.y
        },
        meta: { restored: true },
        active: true,
      };

      // Create the seat
      await busSeatRepository.create(createSeatPayload);

      // Get the updated configuration
      const updatedConfig = await getBusModelSeatConfiguration({
        id: useCaseModelId,
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
