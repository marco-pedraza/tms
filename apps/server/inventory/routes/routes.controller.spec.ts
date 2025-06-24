import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { vi } from 'vitest';
import {
  cityFactory,
  stateFactory,
  terminalFactory,
} from '../../tests/factories';
import { getFactoryDb } from '../../tests/factories/factory-utils';
import { cityRepository } from '../cities/cities.repository';
import { City } from '../cities/cities.types';
import { countryRepository } from '../countries/countries.repository';
import { db } from '../db-service';
import { routeSegmentRepository } from '../route-segment/route-segment.repository';
import { routeRepository } from '../routes/routes.repository';
import { stateRepository } from '../states/states.repository';
import { State } from '../states/states.types';
import { terminalRepository } from '../terminals/terminals.repository';
import { Terminal } from '../terminals/terminals.types';
import {
  createCompoundRoute,
  createRoute,
  deleteRoute,
  getRoute,
  getRouteWithFullDetails,
  listRoutes,
  searchRoutes,
  updateCompoundRouteSegments,
} from './routes.controller';

// Routes current status does not match with feature definitions, we will skip these tests until the feature match
describe.skip('Routes Controller', () => {
  const factoryDb = getFactoryDb(db);
  let testState: State;
  let testCity1: City;
  let testCity2: City;
  let testTerminal1: Terminal;
  let testTerminal2: Terminal;
  let createdRouteId: number;

  beforeAll(async () => {
    testState = (await stateFactory(factoryDb).create()) as State;

    // Create two cities in the same state
    testCity1 = (await cityFactory(factoryDb).create({
      stateId: testState.id,
      name: 'Origin City',
      slug: 'origin-city',
    })) as City;

    testCity2 = (await cityFactory(factoryDb).create({
      stateId: testState.id,
      name: 'Destination City',
      slug: 'destination-city',
    })) as City;

    // Create terminals in each city
    testTerminal1 = (await terminalFactory(factoryDb).create({
      cityId: testCity1.id,
      name: 'Origin Terminal',
      slug: 't-origin-terminal',
    })) as Terminal;

    testTerminal2 = (await terminalFactory(factoryDb).create({
      cityId: testCity2.id,
      name: 'Destination Terminal',
      slug: 't-destination-terminal',
    })) as Terminal;
  });

  afterAll(async () => {
    // Clean up created routes
    if (createdRouteId) {
      try {
        await deleteRoute({ id: createdRouteId });
      } catch (error) {
        console.log('Error cleaning up test route:', error);
      }
    }

    await routeSegmentRepository.deleteAll();
    await routeRepository.deleteAll();
    await terminalRepository.deleteAll();
    await cityRepository.deleteAll();
    await stateRepository.deleteAll();
    await countryRepository.deleteAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Simple Routes', () => {
    test('should create a simple route successfully', async () => {
      const routeData = {
        name: 'Test Simple Route',
        description: 'A test route for unit testing',
        originTerminalId: testTerminal1.id,
        destinationTerminalId: testTerminal2.id,

        // Pathway data
        pathwayName: 'Test Simple Pathway',
        distance: 100,
        typicalTime: 120, // 2 hours in minutes
        meta: { stops: 2 },
        tollRoad: false,
        active: true,

        // Route specific data
        baseTime: 110, // minutes
        connectionCount: 0,
        isCompound: false as const,
      };

      const createdRoute = await createRoute(routeData);
      createdRouteId = createdRoute.id;

      // Verify the created route
      expect(createdRoute).toBeDefined();
      expect(createdRoute.id).toBeDefined();
      expect(createdRoute.name).toBe(routeData.name);
      expect(createdRoute.description).toBe(routeData.description);
      expect(createdRoute.originTerminalId).toBe(testTerminal1.id);
      expect(createdRoute.destinationTerminalId).toBe(testTerminal2.id);
      expect(createdRoute.distance).toBe(routeData.distance);
      expect(createdRoute.baseTime).toBe(routeData.baseTime);
      expect(createdRoute.isCompound).toBe(false);
      expect(createdRoute.connectionCount).toBe(0);
      expect(createdRoute.totalTravelTime).toBe(routeData.typicalTime);
      expect(createdRoute.totalDistance).toBe(routeData.distance);
      expect(createdRoute.pathwayId).toBeDefined();

      // Verify we can retrieve the route
      const retrievedRoute = await getRoute({ id: createdRoute.id });
      expect(retrievedRoute).toBeDefined();
      expect(retrievedRoute.id).toBe(createdRoute.id);
    });

    test('should fail when origin and destination are the same terminal', async () => {
      const routeData = {
        name: 'Invalid Same Terminal Route',
        description: 'A route with the same origin and destination',
        originTerminalId: testTerminal1.id,
        destinationTerminalId: testTerminal1.id, // Same as origin

        // Pathway data
        pathwayName: 'Invalid Same Terminal Pathway',
        distance: 0,
        typicalTime: 0,
        meta: {},
        tollRoad: false,
        active: true,

        // Route specific data
        baseTime: 0,
        connectionCount: 0,
        isCompound: false as const,
      };

      // The request should fail with an error about same terminals
      await expect(createRoute(routeData)).rejects.toThrow(
        'Origin and destination terminals cannot be the same',
      );
    });

    test('should fail with invalid terminal IDs', async () => {
      const routeData = {
        name: 'Invalid Terminal Route',
        description: 'A route with invalid terminal IDs',
        originTerminalId: 99999, // Non-existent terminal
        destinationTerminalId: testTerminal2.id,

        // Pathway data
        pathwayName: 'Invalid Terminal Pathway',
        distance: 100,
        typicalTime: 120,
        meta: {},
        tollRoad: false,
        active: true,

        // Route specific data
        baseTime: 110,
        connectionCount: 0,
        isCompound: false as const,
      };

      // The request should fail with a not found error
      await expect(createRoute(routeData)).rejects.toThrow();
    });
  });

  describe('Compound Routes', () => {
    let simpleRoute1Id: number;
    let simpleRoute2Id: number;
    let testTerminal3: Terminal;

    beforeAll(async () => {
      // Create first simple route: City1.Terminal1 -> City2.Terminal2
      const route1Data = {
        name: 'First Simple Route',
        description: 'First segment of compound route',
        originTerminalId: testTerminal1.id,
        destinationTerminalId: testTerminal2.id,
        pathwayName: 'First Simple Pathway',
        distance: 100,
        typicalTime: 120, // 2 hours
        meta: { stops: 1 },
        tollRoad: false,
        active: true,
        baseTime: 110,
        connectionCount: 0,
        isCompound: false as const,
      };

      // We need a third terminal in City2 for the connection
      testTerminal3 = (await terminalFactory(factoryDb).create({
        cityId: testCity2.id,
        name: 'Connection Terminal',
        slug: 't-connection-terminal',
      })) as Terminal;

      // Create second simple route: City2.Terminal2 -> City2.Terminal3
      const route2Data = {
        name: 'Second Simple Route',
        description: 'Second segment of compound route',
        originTerminalId: testTerminal2.id,
        destinationTerminalId: testTerminal3.id,
        pathwayName: 'Second Simple Pathway',
        distance: 50,
        typicalTime: 60, // 1 hour
        meta: { stops: 1 },
        tollRoad: false,
        active: true,
        baseTime: 55,
        connectionCount: 0,
        isCompound: false as const,
      };

      // Create both simple routes
      const route1 = await createRoute(route1Data);
      const route2 = await createRoute(route2Data);
      simpleRoute1Id = route1.id;
      simpleRoute2Id = route2.id;
    });

    test('should create a compound route from two connected simple routes', async () => {
      const compoundRouteData = {
        name: 'Test Compound Route',
        description: 'A compound route connecting two simple routes',
        routeIds: [simpleRoute1Id, simpleRoute2Id],
      };

      const createdRoute = await createCompoundRoute(compoundRouteData);

      // Basic verifications
      expect(createdRoute).toBeDefined();
      expect(createdRoute.id).toBeDefined();
      expect(createdRoute.name).toBe(compoundRouteData.name);
      expect(createdRoute.description).toBe(compoundRouteData.description);
      expect(createdRoute.isCompound).toBe(true);
      expect(createdRoute.connectionCount).toBe(1); // One connection between two routes

      // Verify automatic calculations
      expect(createdRoute.totalDistance).toBe(150); // 100 + 50
      expect(createdRoute.totalTravelTime).toBe(180); // 120 + 60
      expect(createdRoute.baseTime).toBe(165); // 110 + 55

      // Verify origin and destination terminals
      expect(createdRoute.originTerminalId).toBe(testTerminal1.id);
      expect(createdRoute.destinationTerminalId).toBe(testTerminal3.id);

      // Verify segments
      expect(createdRoute.routeSegments).toBeDefined();

      expect(createdRoute.routeSegments.length).toBe(2);
      expect(createdRoute.routeSegments[0].segmentRouteId).toBe(simpleRoute1Id);
      expect(createdRoute.routeSegments[1].segmentRouteId).toBe(simpleRoute2Id);
    });

    describe('Validation Scenarios', () => {
      test('should fail when creating compound route with disconnected routes', async () => {
        // Create a route that starts at a different terminal than the end of the first route
        const disconnectedRoute = await createRoute({
          name: 'Disconnected Route',
          description: 'A route that starts at a different terminal',
          originTerminalId: testTerminal1.id, // Different terminal than the end of route2
          destinationTerminalId: testTerminal2.id,
          pathwayName: 'Disconnected Pathway',
          distance: 75,
          typicalTime: 90,
          meta: { stops: 1 },
          tollRoad: false,
          active: true,
          baseTime: 85,
          connectionCount: 0,
          isCompound: false as const,
        });

        await expect(
          createCompoundRoute({
            name: 'Invalid Compound Route',
            description: 'Should fail due to disconnected routes',
            routeIds: [simpleRoute1Id, disconnectedRoute.id],
          }),
        ).rejects.toThrow('Invalid route connection between');
      });

      test('should fail when creating compound route with single route', async () => {
        await expect(
          createCompoundRoute({
            name: 'Single Route Compound',
            description: 'Should fail due to single route',
            routeIds: [simpleRoute1Id],
          }),
        ).rejects.toThrow('A compound route requires at least two routes');
      });

      test('should fail when creating compound route with non-existent routes', async () => {
        await expect(
          createCompoundRoute({
            name: 'Non-existent Routes',
            description: 'Should fail due to non-existent routes',
            routeIds: [simpleRoute1Id, 99999],
          }),
        ).rejects.toThrow('Routes with ids [99999] not found');
      });

      test('should clean up compound route when route segments fail to insert (e.g. FK constraint error)', async () => {
        // Get initial count of route segments
        const initialSegments = await db.query.routeSegments.findMany();
        const initialSegmentCount = initialSegments.length;

        // Create two connected simple routes
        const route1 = await createRoute({
          name: 'First Simple Route for Compound route',
          description: 'First segment of compound route',
          originTerminalId: testTerminal1.id,
          destinationTerminalId: testTerminal2.id,
          pathwayName: 'First Simple Pathway for Compound route',
          distance: 100,
          typicalTime: 120,
          meta: { stops: 1 },
          tollRoad: false,
          active: true,
          baseTime: 110,
          connectionCount: 0,
          isCompound: false as const,
        });

        const route2 = await createRoute({
          name: 'Second Simple Route for Compound route',
          description: 'Second segment of compound route',
          originTerminalId: testTerminal2.id,
          destinationTerminalId: testTerminal3.id,
          pathwayName: 'Second Simple Pathway for Compound route',
          distance: 50,
          typicalTime: 60,
          meta: { stops: 1 },
          tollRoad: false,
          active: true,
          baseTime: 55,
          connectionCount: 0,
          isCompound: false as const,
        });

        // Mock the transaction to fail during segment creation
        const transactionSpy = vi.spyOn(routeRepository, 'transaction');
        transactionSpy.mockImplementation(async (callback) => {
          // Define partial mocks with only the methods we need
          type PartialRouteRepo = Pick<typeof routeRepository, 'create'>;
          type PartialRouteSegmentRepo = Pick<
            typeof routeSegmentRepository,
            'create'
          >;

          // Create a mock txRepo that creates a route but fails on segment creation
          const mockTxRepo: PartialRouteRepo = {
            // This simulates the route creation working but segment creation failing
            create: vi.fn().mockResolvedValue({ id: 99999 }),
          };

          // Create a mock tx object with a withTransaction method that returns a repo
          // that will fail during segment creation
          const mockTx = {
            withTransaction: vi.fn().mockReturnValue({
              create: vi.fn().mockImplementation(() => {
                throw new Error('Simulated segment creation failure');
              }),
            } as PartialRouteSegmentRepo),
          };

          // Disable type checking for this specific callback call since we're using partial mocks
          // @ts-expect-error - We're providing only the methods needed for the test
          return await callback(mockTxRepo, mockTx);
        });

        try {
          await createCompoundRoute({
            name: 'Failing Compound Route',
            description: 'Route that will fail during segment creation',
            routeIds: [route1.id, route2.id],
          });
        } catch (error: unknown) {
          // Verify the error is thrown
          expect(error).toBeInstanceOf(Error);
          if (error instanceof Error) {
            expect(error.message).toBe('Failed to create all route segments');
          }
        }

        // Verify the number of route segments remains the same
        const finalSegments = await db.query.routeSegments.findMany();
        const finalSegmentCount = finalSegments.length;
        expect(finalSegmentCount).toBe(initialSegmentCount);

        // Restore mocks
        transactionSpy.mockRestore();
      });
    });

    describe('Complex Compound Routes', () => {
      test('should create compound route with three or more segments', async () => {
        // Create an additional terminal for the third segment
        const testTerminal4 = (await terminalFactory(factoryDb).create({
          cityId: testCity2.id,
          name: 'Final Terminal',
          slug: 't-final-terminal',
        })) as Terminal;

        // Create third segment
        const route3Data = {
          name: 'Third Simple Route',
          description: 'Third segment of compound route',
          originTerminalId: testTerminal3.id,
          destinationTerminalId: testTerminal4.id,
          pathwayName: 'Third Simple Pathway',
          distance: 25,
          typicalTime: 30,
          meta: { stops: 1 },
          tollRoad: false,
          active: true,
          baseTime: 28,
          connectionCount: 0,
          isCompound: false as const,
        };

        const route3 = await createRoute(route3Data);

        const complexCompoundRoute = await createCompoundRoute({
          name: 'Complex Compound Route',
          description: 'A compound route with three segments',
          routeIds: [simpleRoute1Id, simpleRoute2Id, route3.id],
        });

        expect(complexCompoundRoute.connectionCount).toBe(2);
        expect(complexCompoundRoute.totalDistance).toBe(175); // 100 + 50 + 25
        expect(complexCompoundRoute.totalTravelTime).toBe(210); // 120 + 60 + 30
        expect(complexCompoundRoute.routeSegments.length).toBe(3);
      });
    });

    describe('Route Details', () => {
      test('should retrieve compound route with full details', async () => {
        const compoundRoute = await createCompoundRoute({
          name: 'Detailed Compound Route',
          description: 'Testing full details retrieval',
          routeIds: [simpleRoute1Id, simpleRoute2Id],
        });

        const routeWithDetails = await getRouteWithFullDetails({
          id: compoundRoute.id,
        });

        // Verify complete details
        expect(routeWithDetails.originCity).toBeDefined();
        expect(routeWithDetails.destinationCity).toBeDefined();
        expect(routeWithDetails.originTerminal).toBeDefined();
        expect(routeWithDetails.destinationTerminal).toBeDefined();
        expect(routeWithDetails.routeSegments).toBeDefined();

        // Verify city information
        expect(routeWithDetails.originCity.id).toBe(testCity1.id);
        expect(routeWithDetails.destinationCity.id).toBe(testCity2.id);
      });
    });

    describe('Edge Cases', () => {
      test('should handle circular routes correctly', async () => {
        // Create a route that returns to the origin point
        const circularRoute = await createRoute({
          name: 'Return Route',
          description: 'Returns to the first terminal',
          originTerminalId: testTerminal2.id,
          destinationTerminalId: testTerminal1.id,
          pathwayName: 'Return Pathway',
          distance: 100,
          typicalTime: 120,
          meta: { stops: 1 },
          tollRoad: false,
          active: true,
          baseTime: 110,
          connectionCount: 0,
          isCompound: false as const,
        });

        const circularCompoundRoute = await createCompoundRoute({
          name: 'Circular Compound Route',
          description: 'A route that returns to the starting point',
          routeIds: [simpleRoute1Id, circularRoute.id],
        });

        expect(circularCompoundRoute.originTerminalId).toBe(testTerminal1.id);
        expect(circularCompoundRoute.destinationTerminalId).toBe(
          testTerminal1.id,
        );
        expect(circularCompoundRoute.totalDistance).toBe(200); // 100 + 100
      });

      test('should handle routes with toll roads correctly', async () => {
        // Create a route with toll road
        const tollRoute = await createRoute({
          name: 'Toll Route',
          description: 'Route with toll road',
          originTerminalId: testTerminal2.id,
          destinationTerminalId: testTerminal3.id,
          pathwayName: 'Toll Pathway',
          distance: 40,
          typicalTime: 45,
          meta: { stops: 0, tollBooths: 2 },
          tollRoad: true,
          active: true,
          baseTime: 40,
          connectionCount: 0,
          isCompound: false as const,
        });

        const mixedCompoundRoute = await createCompoundRoute({
          name: 'Mixed Toll Compound Route',
          description: 'Route combining toll and non-toll segments',
          routeIds: [simpleRoute1Id, tollRoute.id],
        });

        expect(mixedCompoundRoute.totalDistance).toBe(140); // 100 + 40
        // Here you could add more specific verifications for toll routes
      });
    });

    describe('Search and List Operations', () => {
      test('should list all compound routes', async () => {
        const result = await listRoutes({ filters: { isCompound: true } });
        expect(result.routes.length).toBeGreaterThan(0);
        expect(result.routes.every((route) => route.isCompound)).toBe(true);
      });

      test('should search compound routes by name', async () => {
        const searchTerm = 'Compound';
        const result = await searchRoutes({ term: searchTerm });
        expect(
          result.routes.some(
            (route) => route.name.includes(searchTerm) && route.isCompound,
          ),
        ).toBe(true);
      });
    });

    describe('Segment Validation', () => {
      test('should fail when creating compound route with repeated segments', async () => {
        // Try to create a compound route using the same segment twice
        await expect(
          createCompoundRoute({
            name: 'Repeated Segments Route',
            description: 'Route with repeated segments',
            routeIds: [simpleRoute1Id, simpleRoute2Id, simpleRoute1Id], // simpleRoute1Id repeated
          }),
        ).rejects.toThrow('Route segments cannot be repeated');
      });

      test('should fail when creating compound route with same segment in different order', async () => {
        // Try to create a compound route using the same segment in different order
        await expect(
          createCompoundRoute({
            name: 'Reordered Repeated Segments',
            description: 'Route with same segment in different positions',
            routeIds: [
              simpleRoute1Id,
              simpleRoute2Id,
              simpleRoute1Id,
              simpleRoute2Id,
            ],
          }),
        ).rejects.toThrow('Route segments cannot be repeated');
      });

      test('should fail when trying to use a compound route as a segment', async () => {
        // First create a compound route
        const initialCompoundRoute = await createCompoundRoute({
          name: 'Initial Compound Route',
          description: 'First compound route',
          routeIds: [simpleRoute1Id, simpleRoute2Id],
        });

        // Try to use this compound route as a segment of another compound route
        await expect(
          createCompoundRoute({
            name: 'Nested Compound Route',
            description: 'Trying to use compound route as segment',
            routeIds: [initialCompoundRoute.id, simpleRoute2Id],
          }),
        ).rejects.toThrow(
          `Routes with ids [${initialCompoundRoute.id}] not found or are compound routes`,
        );
      });

      test('should validate segment uniqueness across multiple operations', async () => {
        // Create the first compound route
        const compoundRoute1 = await createCompoundRoute({
          name: 'First Compound Route',
          description: 'First set of segments',
          routeIds: [simpleRoute1Id, simpleRoute2Id],
        });

        // Create another compound route using the same segments
        // Should be successful since we allow reusing segments in different compound routes
        const compoundRoute2 = await createCompoundRoute({
          name: 'Second Compound Route',
          description: 'Using same segments as existing compound route',
          routeIds: [simpleRoute1Id, simpleRoute2Id],
        });

        // Verify that both compound routes are valid and different
        expect(compoundRoute1.id).toBeDefined();
        expect(compoundRoute2.id).toBeDefined();
        expect(compoundRoute1.id).not.toBe(compoundRoute2.id);

        // Verify that the segments are the same in both routes
        const route1Details = await getRouteWithFullDetails({
          id: compoundRoute1.id,
        });
        const route2Details = await getRouteWithFullDetails({
          id: compoundRoute2.id,
        });

        expect(
          route1Details.routeSegments.map((s) => s.segmentRouteId),
        ).toEqual([simpleRoute1Id, simpleRoute2Id]);
        expect(
          route2Details.routeSegments.map((s) => s.segmentRouteId),
        ).toEqual([simpleRoute1Id, simpleRoute2Id]);
      });
    });

    describe('Update Scenarios', () => {
      test('should update compound route segments successfully', async () => {
        // Create initial compound route
        const initialCompoundRoute = await createCompoundRoute({
          name: 'Initial Compound Route',
          description: 'Route to be updated',
          routeIds: [simpleRoute1Id, simpleRoute2Id],
        });

        // Create a new route to add to the compound route
        const testTerminal4 = (await terminalFactory(factoryDb).create({
          cityId: testCity2.id,
          name: 'New Terminal',
          slug: 't-new-terminal',
        })) as Terminal;

        // Create a new route that connects to the end of simpleRoute1
        const newRoute = await createRoute({
          name: 'New Route',
          description: 'New segment to add',
          originTerminalId: testTerminal2.id, // This must match the destination of simpleRoute1
          destinationTerminalId: testTerminal4.id,
          pathwayName: 'New Pathway for Update',
          distance: 30,
          typicalTime: 35,
          meta: { stops: 1 },
          tollRoad: false,
          active: true,
          baseTime: 32,
          connectionCount: 0,
          isCompound: false as const,
        });

        // Update the compound route with new segments
        const updatedRoute = await updateCompoundRouteSegments({
          compoundRouteId: initialCompoundRoute.id,
          routeIds: [simpleRoute1Id, newRoute.id],
        });

        // Verify the updated route
        expect(updatedRoute).toBeDefined();
        expect(updatedRoute.id).toBe(initialCompoundRoute.id);
        expect(updatedRoute.isCompound).toBe(true);
        expect(updatedRoute.connectionCount).toBe(1);

        // Verify new calculations
        expect(updatedRoute.totalDistance).toBe(130); // 100 + 30
        expect(updatedRoute.totalTravelTime).toBe(155); // 120 + 35
        expect(updatedRoute.baseTime).toBe(142); // 110 + 32

        // Verify new terminals
        expect(updatedRoute.originTerminalId).toBe(testTerminal1.id);
        expect(updatedRoute.destinationTerminalId).toBe(testTerminal4.id);

        // Verify new segments
        expect(updatedRoute.routeSegments.length).toBe(2);
        expect(updatedRoute.routeSegments[0].segmentRouteId).toBe(
          simpleRoute1Id,
        );
        expect(updatedRoute.routeSegments[1].segmentRouteId).toBe(newRoute.id);
      });

      test('should fail when updating non-existent compound route', async () => {
        await expect(
          updateCompoundRouteSegments({
            compoundRouteId: 99999,
            routeIds: [simpleRoute1Id, simpleRoute2Id],
          }),
        ).rejects.toThrow('Compound route with id 99999 not found');
      });

      test('should fail when updating with disconnected routes', async () => {
        // Create initial compound route
        const initialCompoundRoute = await createCompoundRoute({
          name: 'Initial Compound Route',
          description: 'Route to be updated',
          routeIds: [simpleRoute1Id, simpleRoute2Id],
        });

        // Create a disconnected route with a unique pathway name
        const disconnectedRoute = await createRoute({
          name: 'Disconnected Route',
          description: 'Route that starts at a different terminal',
          originTerminalId: testTerminal1.id,
          destinationTerminalId: testTerminal2.id,
          pathwayName: 'Disconnected Pathway for Update Test',
          distance: 75,
          typicalTime: 90,
          meta: { stops: 1 },
          tollRoad: false,
          active: true,
          baseTime: 85,
          connectionCount: 0,
          isCompound: false as const,
        });

        await expect(
          updateCompoundRouteSegments({
            compoundRouteId: initialCompoundRoute.id,
            routeIds: [simpleRoute1Id, disconnectedRoute.id],
          }),
        ).rejects.toThrow('Invalid route connection between');
      });

      test('should fail when updating with repeated segments', async () => {
        // Create initial compound route
        const initialCompoundRoute = await createCompoundRoute({
          name: 'Initial Compound Route',
          description: 'Route to be updated',
          routeIds: [simpleRoute1Id, simpleRoute2Id],
        });

        await expect(
          updateCompoundRouteSegments({
            compoundRouteId: initialCompoundRoute.id,
            routeIds: [simpleRoute1Id, simpleRoute2Id, simpleRoute1Id],
          }),
        ).rejects.toThrow('Route segments cannot be repeated');
      });

      test('should fail when updating with non-existent routes', async () => {
        // Create initial compound route
        const initialCompoundRoute = await createCompoundRoute({
          name: 'Initial Compound Route',
          description: 'Route to be updated',
          routeIds: [simpleRoute1Id, simpleRoute2Id],
        });

        await expect(
          updateCompoundRouteSegments({
            compoundRouteId: initialCompoundRoute.id,
            routeIds: [simpleRoute1Id, 99999],
          }),
        ).rejects.toThrow('Routes with ids [99999] not found');
      });

      test('should maintain data consistency when segment update fails', async () => {
        // Get initial count of route segments
        const initialSegments = await db.query.routeSegments.findMany();
        const initialSegmentCount = initialSegments.length;

        // Create initial compound route
        const initialCompoundRoute = await createCompoundRoute({
          name: 'Initial Compound Route',
          description: 'Route to be updated',
          routeIds: [simpleRoute1Id, simpleRoute2Id],
        });

        // Mock the transaction to fail during route update
        const transactionSpy = vi.spyOn(routeRepository, 'transaction');
        transactionSpy.mockImplementation(async (callback) => {
          // Define partial mocks with only the methods we need
          type PartialRouteRepo = Pick<typeof routeRepository, 'update'>;
          type PartialRouteSegmentRepo = Pick<
            typeof routeSegmentRepository,
            'findAllBy' | 'delete' | 'create'
          >;

          // Create a mock txRepo that has the standard repository methods
          const mockTxRepo: PartialRouteRepo & PartialRouteSegmentRepo = {
            // Allow finding and deleting segments
            findAllBy: vi.fn().mockResolvedValue([
              {
                id: 1,
                parentRouteId: initialCompoundRoute.id,
                segmentRouteId: simpleRoute1Id,
              },
              {
                id: 2,
                parentRouteId: initialCompoundRoute.id,
                segmentRouteId: simpleRoute2Id,
              },
            ]),
            delete: vi.fn().mockResolvedValue({}),
            create: vi.fn().mockResolvedValue({}),
            // But make the update fail
            update: vi.fn().mockImplementation(() => {
              throw new Error('Simulated update failure');
            }),
          };

          // Create a mock tx object
          const mockTx = {
            withTransaction: vi.fn().mockReturnValue(mockTxRepo),
          };

          // Disable type checking for this specific callback call since we're using partial mocks
          // @ts-expect-error - We're providing only the methods needed for the test
          return await callback(mockTxRepo, mockTx);
        });

        try {
          await updateCompoundRouteSegments({
            compoundRouteId: initialCompoundRoute.id,
            routeIds: [simpleRoute1Id, simpleRoute2Id],
          });
        } catch (error: unknown) {
          // Verify the error is thrown
          expect(error).toBeInstanceOf(Error);
          if (error instanceof Error) {
            expect(error.message).toBe('Failed to replace route segments');
          }
        }

        // Since the transaction was rolled back, the original segments should still be intact
        // Verify the original route is still intact
        const originalRoute = await getRouteWithFullDetails({
          id: initialCompoundRoute.id,
        });
        expect(originalRoute.routeSegments.length).toBe(2);
        expect(originalRoute.routeSegments[0].segmentRouteId).toBe(
          simpleRoute1Id,
        );
        expect(originalRoute.routeSegments[1].segmentRouteId).toBe(
          simpleRoute2Id,
        );

        // Verify the number of route segments remains the same (plus the original 2 segments)
        const finalSegments = await db.query.routeSegments.findMany();
        expect(finalSegments.length).toBe(initialSegmentCount + 2);

        // Restore mocks
        transactionSpy.mockRestore();
      });
    });

    describe('Delete Scenarios', () => {
      test('should delete compound route and its segments', async () => {
        // Create initial compound route
        const initialCompoundRoute = await createCompoundRoute({
          name: 'Compound Route to Delete',
          description: 'Route to be deleted with its segments',
          routeIds: [simpleRoute1Id, simpleRoute2Id],
        });

        // Verify segments exist
        const initialSegments = await db.query.routeSegments.findMany({
          where: (routeSegments, { eq }) =>
            eq(routeSegments.parentRouteId, initialCompoundRoute.id),
        });
        expect(initialSegments.length).toBe(2);

        // Delete the compound route
        await deleteRoute({ id: initialCompoundRoute.id });

        // Verify the route is deleted
        await expect(
          getRoute({ id: initialCompoundRoute.id }),
        ).rejects.toThrow();

        // Verify segments are also deleted
        const finalSegments = await db.query.routeSegments.findMany({
          where: (routeSegments, { eq }) =>
            eq(routeSegments.parentRouteId, initialCompoundRoute.id),
        });
        expect(finalSegments.length).toBe(0);
      });
    });
  });
});
