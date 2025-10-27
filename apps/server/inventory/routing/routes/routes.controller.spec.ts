import { schema } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import { populationRepository } from '@/inventory/locations/populations/populations.repository';
import { busLineRepository } from '@/inventory/operators/bus-lines/bus-lines.repository';
import { serviceTypeRepository } from '@/inventory/operators/service-types/service-types.repository';
import { transporterRepository } from '@/inventory/operators/transporters/transporters.repository';
import { pathwayOptionRepository } from '@/inventory/routing/pathway-options/pathway-options.repository';
import { createPathway } from '@/inventory/routing/pathways/pathways.controller';
import { pathwayRepository } from '@/inventory/routing/pathways/pathways.repository';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueEntity,
} from '@/tests/shared/test-utils';
import { cityFactory, populationFactory } from '@/factories';
import { getFactoryDb } from '@/factories/factory-utils';
import type {
  CreateRoutePayload,
  Route,
  UpdateRoutePayload,
} from './routes.types';
import { routesRepository } from './routes.repository';
import {
  createRoute,
  deleteRoute,
  getRoute,
  listRoutes,
  listRoutesPaginated,
  updateRoute,
} from './routes.controller';

/**
 * Test data interface for consistent test setup
 */
interface TestData {
  suiteId: string;
  factoryDb: ReturnType<typeof getFactoryDb>;
  cityId: number;
  populationId: number;
  originNodeId: number;
  destinationNodeId: number;
  intermediateNodeId: number;
  pathwayId: number;
  pathwayOptionId: number;
  secondPathwayId: number;
  secondPathwayOptionId: number;
  transporterId: number;
  buslineId: number;
  serviceTypeId: number;
  routeCleanup: ReturnType<typeof createCleanupHelper>;
  populationCleanup: ReturnType<typeof createCleanupHelper>;
  nodeCleanup: ReturnType<typeof createCleanupHelper>;
  pathwayCleanup: ReturnType<typeof createCleanupHelper>;
  createdRouteIds: number[];
}

describe('Routes Controller', () => {
  // Tests that don't need test data - no beforeEach/afterEach
  describe('error scenarios without test data', () => {
    test('should handle route not found', async () => {
      await expect(getRoute({ id: 999999 })).rejects.toThrow();
    });

    test('should handle route not found on update', async () => {
      const updateData: UpdateRoutePayload = {
        name: 'Non-existent Route',
      };

      await expect(
        updateRoute({ id: 999999, ...updateData }),
      ).rejects.toThrow();
    });

    test('should handle route not found on delete', async () => {
      await expect(deleteRoute({ id: 999999 })).rejects.toThrow();
    });
  });

  // Tests that require test data - with beforeEach/afterEach
  describe('operations requiring test data', () => {
    let testData: TestData;

    /**
     * Creates fresh test data for each test to ensure isolation
     */
    async function createTestData(): Promise<TestData> {
      const suiteId = createTestSuiteId('routes-controller');
      const factoryDb = getFactoryDb(db);

      // Create cleanup helpers
      const routeCleanup = createCleanupHelper(async ({ id }) => {
        // First delete route legs to avoid foreign key constraint
        try {
          await db
            .delete(schema.routeLegs)
            .where(eq(schema.routeLegs.routeId, id));
        } catch {
          // Ignore cleanup errors for route legs
        }
        // Then delete the route
        return routesRepository.forceDelete(id);
      }, 'route');

      const populationCleanup = createCleanupHelper(
        ({ id }) => populationRepository.forceDelete(id),
        'population',
      );

      const nodeCleanup = createCleanupHelper(({ id }) => {
        return db.delete(schema.nodes).where(eq(schema.nodes.id, id));
      }, 'node');

      const pathwayCleanup = createCleanupHelper(async ({ id }) => {
        // First delete pathway options to avoid foreign key constraint
        try {
          await db
            .delete(schema.pathwayOptions)
            .where(eq(schema.pathwayOptions.pathwayId, id));
        } catch {
          // Ignore cleanup errors for pathway options
        }
        // Then delete the pathway
        return pathwayRepository.forceDelete(id);
      }, 'pathway');

      // Create test dependencies using hybrid strategy:
      // - Factories for cities/states/countries
      // - Repository direct for nodes (to ensure transaction visibility)
      const testCity = await cityFactory(factoryDb).create({
        name: createUniqueEntity({ baseName: 'Test City', suiteId }).name,
      });
      const cityId = testCity.id;

      const populationEntity = createUniqueEntity({
        baseName: 'Test Population',
        baseCode: 'TPOP',
        suiteId,
      });

      const testPopulation = await populationFactory(factoryDb).create({
        code: populationEntity.code || 'TPOP001',
        description: 'Test population for routes',
        active: true,
      });
      const populationId = populationCleanup.track(testPopulation.id);

      // Create origin, intermediate, and destination nodes using repository directly
      const originNodeEntity = createUniqueEntity({
        baseName: 'Origin Node',
        baseCode: 'ORG',
        suiteId,
      });

      const originNode = await nodeRepository.create({
        code: originNodeEntity.code || 'ORG001',
        name: originNodeEntity.name,
        latitude: 19.4326,
        longitude: -99.1332,
        radius: 1000,
        slug: `${originNodeEntity.name.toLowerCase().replace(/\s+/g, '-')}-${suiteId}`,
        cityId,
        populationId,
        allowsBoarding: true,
        allowsAlighting: true,
        active: true,
      });
      const originNodeId = nodeCleanup.track(originNode.id);

      const intermediateNodeEntity = createUniqueEntity({
        baseName: 'Intermediate Node',
        baseCode: 'INT',
        suiteId,
      });

      const intermediateNode = await nodeRepository.create({
        code: intermediateNodeEntity.code || 'INT001',
        name: intermediateNodeEntity.name,
        latitude: 19.4826,
        longitude: -99.1832,
        radius: 1000,
        slug: `${intermediateNodeEntity.name.toLowerCase().replace(/\s+/g, '-')}-${suiteId}`,
        cityId,
        populationId,
        allowsBoarding: true,
        allowsAlighting: true,
        active: true,
      });
      const intermediateNodeId = nodeCleanup.track(intermediateNode.id);

      const destinationNodeEntity = createUniqueEntity({
        baseName: 'Destination Node',
        baseCode: 'DST',
        suiteId,
      });

      const destinationNode = await nodeRepository.create({
        code: destinationNodeEntity.code || 'DST001',
        name: destinationNodeEntity.name,
        latitude: 19.5326,
        longitude: -99.2332,
        radius: 1000,
        slug: `${destinationNodeEntity.name.toLowerCase().replace(/\s+/g, '-')}-${suiteId}`,
        cityId,
        populationId,
        allowsBoarding: true,
        allowsAlighting: true,
        active: true,
      });
      const destinationNodeId = nodeCleanup.track(destinationNode.id);

      // Create a pathway and pathway option for the route legs
      const pathwayEntity = createUniqueEntity({
        baseName: 'Test Pathway',
        baseCode: 'TP',
        suiteId,
      });

      const pathway = await createPathway({
        originNodeId: originNodeId,
        destinationNodeId: intermediateNodeId,
        name: pathwayEntity.name,
        code: pathwayEntity.code || 'TP001',
        description: 'Test pathway for routes',
        isSellable: true,
        isEmptyTrip: false,
        active: true,
      });
      const pathwayId = pathwayCleanup.track(pathway.id);

      // Create a pathway option
      const pathwayOption = await pathwayOptionRepository.create({
        pathwayId: pathwayId,
        name: 'Test Pathway Option',
        description: 'Test option for routes',
        distanceKm: 50,
        typicalTimeMin: 60,
        isDefault: true,
        active: true,
      });

      // Create a second pathway for testing multiple legs (intermediate to destination)
      const secondPathwayEntity = createUniqueEntity({
        baseName: 'Test Pathway 2',
        baseCode: 'TP2',
        suiteId,
      });

      const secondPathway = await createPathway({
        originNodeId: intermediateNodeId,
        destinationNodeId: destinationNodeId,
        name: secondPathwayEntity.name,
        code: secondPathwayEntity.code || 'TP2001',
        description: 'Test pathway 2 for routes',
        isSellable: true,
        isEmptyTrip: false,
        active: false,
      });
      const secondPathwayId = pathwayCleanup.track(secondPathway.id);

      // Create a second pathway option
      const secondPathwayOption = await pathwayOptionRepository.create({
        pathwayId: secondPathwayId,
        name: 'Test Pathway Option 2',
        description: 'Test option 2 for routes',
        distanceKm: 75,
        typicalTimeMin: 90,
        isDefault: true,
        active: true,
      });

      // Create a service type first
      const serviceTypeEntity = createUniqueEntity({
        baseName: 'Test Service Type',
        baseCode: 'TST',
        suiteId,
      });

      const serviceType = await serviceTypeRepository.create({
        code: serviceTypeEntity.code || 'TST001',
        name: serviceTypeEntity.name,
        active: true,
      });

      // Create a transporter
      const transporterEntity = createUniqueEntity({
        baseName: 'Test Transporter',
        baseCode: 'TTR',
        suiteId,
      });

      const transporter = await transporterRepository.create({
        code: transporterEntity.code || 'TTR001',
        name: transporterEntity.name,
        headquarterCityId: cityId,
        active: true,
      });

      // Create a busline with transporter and service type
      const buslineEntity = createUniqueEntity({
        baseName: 'Test Busline',
        baseCode: 'TBL',
        suiteId,
      });

      const busline = await busLineRepository.create({
        code: buslineEntity.code || 'TBL001',
        name: buslineEntity.name,
        transporterId: transporter.id,
        serviceTypeId: serviceType.id,
        active: true,
      });

      return {
        suiteId,
        factoryDb,
        cityId,
        populationId,
        originNodeId,
        destinationNodeId,
        intermediateNodeId,
        pathwayId,
        pathwayOptionId: pathwayOption.id,
        secondPathwayId,
        secondPathwayOptionId: secondPathwayOption.id,
        transporterId: transporter.id,
        buslineId: busline.id,
        serviceTypeId: serviceType.id,
        routeCleanup,
        populationCleanup,
        nodeCleanup,
        pathwayCleanup,
        createdRouteIds: [],
      };
    }

    /**
     * Cleans up test data after each test
     */
    async function cleanupTestData(data: TestData): Promise<void> {
      // Cleanup in correct dependency order (deepest first)

      // 1. First, clean up route legs (deepest dependency)
      if (data.createdRouteIds) {
        for (const routeId of data.createdRouteIds) {
          try {
            await db
              .delete(schema.routeLegs)
              .where(eq(schema.routeLegs.routeId, routeId));
          } catch {
            // Ignore cleanup errors
          }
        }

        // 2. Clean up routes
        for (const routeId of data.createdRouteIds) {
          try {
            await db.delete(schema.routes).where(eq(schema.routes.id, routeId));
          } catch {
            // Ignore cleanup errors
          }
        }
      }

      // 3. Clean up pathway options
      try {
        await db
          .delete(schema.pathwayOptions)
          .where(
            inArray(schema.pathwayOptions.pathwayId, [
              data.pathwayId,
              data.secondPathwayId,
            ]),
          );
      } catch {
        // Ignore cleanup errors
      }

      // 4. Clean up pathways
      await data.pathwayCleanup.cleanupAll();

      // 5. Clean up nodes
      await data.nodeCleanup.cleanupAll();

      // 6. Clean up populations
      await data.populationCleanup.cleanupAll();

      // 7. Clean up buslines
      try {
        await db
          .delete(schema.busLines)
          .where(eq(schema.busLines.id, data.buslineId));
      } catch {
        // Ignore cleanup errors
      }

      // 8. Clean up transporters
      try {
        await db
          .delete(schema.transporters)
          .where(eq(schema.transporters.id, data.transporterId));
      } catch {
        // Ignore cleanup errors
      }

      // 9. Clean up service types
      try {
        await db
          .delete(schema.serviceTypes)
          .where(eq(schema.serviceTypes.id, data.serviceTypeId));
      } catch {
        // Ignore cleanup errors
      }

      // Cities are cleaned up automatically by factories
    }

    /**
     * Creates a test route with unique data
     */
    async function createTestRoute(
      data: TestData,
      overrides: Partial<CreateRoutePayload> = {},
    ): Promise<Route> {
      const routeEntity = createUniqueEntity({
        baseName: 'Test Route',
        baseCode: 'TR',
        suiteId: data.suiteId,
      });

      const routeData: CreateRoutePayload = {
        code: routeEntity.code || 'TR001',
        name: routeEntity.name,
        serviceTypeId: data.serviceTypeId,
        buslineId: data.buslineId,
        originNodeId: data.originNodeId,
        destinationNodeId: data.intermediateNodeId, // Match the pathway destination
        legs: [
          {
            position: 1,
            pathwayId: data.pathwayId,
            pathwayOptionId: data.pathwayOptionId,
            isDerived: false,
            active: true,
          },
        ],
        active: true,
        ...overrides,
      };

      const result = await createRoute(routeData);

      // Track for cleanup
      data.routeCleanup.track(result.id);
      data.createdRouteIds.push(result.id);

      return result;
    }

    beforeEach(async () => {
      testData = await createTestData();
    });

    afterEach(async () => {
      await cleanupTestData(testData);
    });

    describe('CRUD operations', () => {
      test('should create a new route with legs', async () => {
        const result = await createTestRoute(testData);

        expect(result).toBeDefined();
        expect(result.id).toBeTypeOf('number');
        expect(result.name).toContain('Test Route');
        expect(result.code).toContain('TR');
        expect(result.originNodeId).toBe(testData.originNodeId);
        expect(result.destinationNodeId).toBe(testData.intermediateNodeId); // Route destination matches pathway destination
        expect(result.serviceTypeId).toBe(testData.serviceTypeId);
        expect(result.buslineId).toBe(testData.buslineId);
        expect(result.active).toBe(true);
        expect(result.createdAt).toBeDefined();
      });

      test('should get a route by ID with enriched data', async () => {
        const createdRoute = await createTestRoute(testData);

        const result = await getRoute({ id: createdRoute.id });

        expect(result).toBeDefined();
        expect(result.id).toBe(createdRoute.id);
        expect(result.name).toBe(createdRoute.name);
        expect(result.busline).toBeDefined();
        expect(result.serviceType).toBeDefined();
        expect(result.originNode).toBeDefined();
        expect(result.destinationNode).toBeDefined();
        expect(result.legs).toBeDefined();
        expect(result.metrics).toBeDefined();
        expect(result.metrics.totalDistance).toBeTypeOf('number');
        expect(result.metrics.totalTime).toBeTypeOf('number');
        expect(result.metrics.legCount).toBeTypeOf('number');
      });

      test('should update a route', async () => {
        const createdRoute = await createTestRoute(testData);

        const updateEntity = createUniqueEntity({
          baseName: 'Updated Route',
          suiteId: testData.suiteId,
        });

        const updateData: UpdateRoutePayload = {
          name: updateEntity.name,
          active: false,
        };

        const result = await updateRoute({
          id: createdRoute.id,
          ...updateData,
        });

        expect(result).toBeDefined();
        expect(result.id).toBe(createdRoute.id);
        expect(result.name).toBe(updateData.name);
        expect(result.active).toBe(updateData.active);
      });

      test('should delete a route', async () => {
        const routeToDelete = await createTestRoute(testData);

        await expect(
          deleteRoute({ id: routeToDelete.id }),
        ).resolves.not.toThrow();

        // Attempt to get should throw a not found error
        await expect(getRoute({ id: routeToDelete.id })).rejects.toThrow();
      });
    });

    describe('business rule validation', () => {
      /**
       * Helper function to capture and validate FieldValidationError
       */
      async function expectValidationError(
        payload: CreateRoutePayload | UpdateRoutePayload,
        expectedErrors: {
          field: string;
          code: string;
          message?: string;
        }[],
        operation: 'create' | 'update' = 'create',
        routeId?: number,
      ): Promise<void> {
        let validationError: FieldValidationError | undefined;

        try {
          if (operation === 'create') {
            await createRoute(payload as CreateRoutePayload);
          } else {
            if (!routeId) {
              throw new Error('Route ID is required for update operations');
            }
            await updateRoute({
              id: routeId,
              ...(payload as UpdateRoutePayload),
            });
          }
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        expect(validationError).toBeDefined();
        if (!validationError) {
          throw new Error('Expected validation error but none was thrown');
        }

        expect(validationError.name).toBe('FieldValidationError');
        expect(validationError.fieldErrors).toBeDefined();

        // Verify each expected error
        for (const expectedError of expectedErrors) {
          const fieldError = validationError.fieldErrors.find(
            (err) => err.field === expectedError.field,
          );
          expect(fieldError).toBeDefined();
          if (!fieldError) {
            throw new Error(
              `Expected error for field ${expectedError.field} but none was found`,
            );
          }
          expect(fieldError.code).toBe(expectedError.code);
          if (expectedError.message) {
            expect(fieldError.message).toContain(expectedError.message);
          }
        }
      }

      describe('INVALID_VALUE errors', () => {
        test('should return INVALID_VALUE error for same origin and destination', async () => {
          const routeEntity = createUniqueEntity({
            baseName: 'Invalid Route',
            baseCode: 'IR',
            suiteId: testData.suiteId,
          });

          const invalidPayload: CreateRoutePayload = {
            code: routeEntity.code || 'IR001',
            name: routeEntity.name,
            serviceTypeId: testData.serviceTypeId,
            buslineId: testData.buslineId,
            originNodeId: testData.originNodeId,
            destinationNodeId: testData.originNodeId, // Same as origin
            legs: [
              {
                position: 1,
                pathwayId: testData.pathwayId,
                pathwayOptionId: testData.pathwayOptionId,
              },
            ],
            active: true,
          };

          await expectValidationError(invalidPayload, [
            {
              field: 'destinationNodeId',
              code: 'INVALID_VALUE',
              message: 'Origin and destination nodes cannot be the same',
            },
          ]);
        });
      });

      describe('NOT_FOUND errors', () => {
        test('should return NOT_FOUND errors for all non-existent entities', async () => {
          const routeEntity = createUniqueEntity({
            baseName: 'Invalid Route',
            baseCode: 'IR',
            suiteId: testData.suiteId,
          });

          const invalidPayload: CreateRoutePayload = {
            code: routeEntity.code || 'IR002',
            name: routeEntity.name,
            serviceTypeId: 999999, // Non-existent service type
            buslineId: 999998, // Non-existent busline
            originNodeId: 999997, // Non-existent origin node
            destinationNodeId: 999996, // Non-existent destination node
            legs: [
              {
                position: 1,
                pathwayId: 999995, // Non-existent pathway
                pathwayOptionId: 999994, // Non-existent pathway option
              },
            ],
            active: true,
          };

          await expectValidationError(invalidPayload, [
            {
              field: 'serviceTypeId',
              code: 'NOT_FOUND',
              message: 'Service type not found',
            },
            {
              field: 'buslineId',
              code: 'NOT_FOUND',
              message: 'Bus line not found',
            },
            {
              field: 'originNodeId',
              code: 'NOT_FOUND',
              message: 'Origin node not found',
            },
            {
              field: 'destinationNodeId',
              code: 'NOT_FOUND',
              message: 'Destination node not found',
            },
            {
              field: 'legs[0].pathwayId',
              code: 'NOT_FOUND',
              message: 'Pathway with ID 999995 not found',
            },
            {
              field: 'legs[0].pathwayOptionId',
              code: 'NOT_FOUND',
              message: 'Pathway option with ID 999994 not found',
            },
          ]);
        });
      });

      describe('INVALID_REFERENCE errors', () => {
        test('should return INVALID_REFERENCE error for pathway option mismatch', async () => {
          // Create another pathway with its own option
          const anotherPathwayEntity = createUniqueEntity({
            baseName: 'Another Pathway',
            baseCode: 'AP',
            suiteId: testData.suiteId,
          });

          const anotherPathway = await createPathway({
            originNodeId: testData.intermediateNodeId,
            destinationNodeId: testData.destinationNodeId,
            name: anotherPathwayEntity.name,
            code: anotherPathwayEntity.code || 'AP001',
            description: 'Another test pathway',
            isSellable: true,
            isEmptyTrip: false,
            active: false,
          });
          testData.pathwayCleanup.track(anotherPathway.id);

          const anotherPathwayOption = await pathwayOptionRepository.create({
            pathwayId: anotherPathway.id,
            name: 'Another Pathway Option',
            description: 'Another option',
            distanceKm: 30,
            typicalTimeMin: 40,
            isDefault: true,
            active: true,
          });

          const routeEntity = createUniqueEntity({
            baseName: 'Invalid Route',
            baseCode: 'IR',
            suiteId: testData.suiteId,
          });

          const invalidPayload: CreateRoutePayload = {
            code: routeEntity.code || 'IR003',
            name: routeEntity.name,
            serviceTypeId: testData.serviceTypeId,
            buslineId: testData.buslineId,
            originNodeId: testData.originNodeId,
            destinationNodeId: testData.destinationNodeId,
            legs: [
              {
                position: 1,
                pathwayId: testData.pathwayId, // Using first pathway
                pathwayOptionId: anotherPathwayOption.id, // But option from another pathway
              },
            ],
            active: true,
          };

          await expectValidationError(invalidPayload, [
            {
              field: 'legs[0].pathwayOptionId',
              code: 'INVALID_REFERENCE',
              message: `Pathway option ${anotherPathwayOption.id} does not belong to pathway ${testData.pathwayId}`,
            },
          ]);
        });
      });

      describe('INVALID_SEQUENCE errors - leg sequence validation', () => {
        test('should return INVALID_SEQUENCE error when first leg origin does not match route origin', async () => {
          // Create a new pathway with different origin
          const mismatchedOriginPathway = await createPathway({
            originNodeId: testData.destinationNodeId, // Different origin
            destinationNodeId: testData.intermediateNodeId,
            name: 'Mismatched Origin Pathway',
            code: 'MOP001',
            description: 'Pathway with different origin',
            isSellable: true,
            isEmptyTrip: false,
            active: true,
          });
          testData.pathwayCleanup.track(mismatchedOriginPathway.id);

          const mismatchedPathwayOption = await pathwayOptionRepository.create({
            pathwayId: mismatchedOriginPathway.id,
            name: 'Mismatched Origin Pathway Option',
            description: 'Option',
            distanceKm: 50,
            typicalTimeMin: 60,
            isDefault: true,
            active: true,
          });

          const routeEntity = createUniqueEntity({
            baseName: 'Invalid Sequence Route',
            baseCode: 'ISR',
            suiteId: testData.suiteId,
          });

          const invalidPayload: CreateRoutePayload = {
            code: routeEntity.code || 'ISR001',
            name: routeEntity.name,
            serviceTypeId: testData.serviceTypeId,
            buslineId: testData.buslineId,
            originNodeId: testData.originNodeId,
            destinationNodeId: testData.intermediateNodeId,
            legs: [
              {
                position: 1,
                pathwayId: mismatchedOriginPathway.id, // Origin doesn't match route origin
                pathwayOptionId: mismatchedPathwayOption.id,
              },
            ],
            active: true,
          };

          await expectValidationError(invalidPayload, [
            {
              field: 'legs[0].pathwayId',
              code: 'INVALID_SEQUENCE',
              message: 'First leg pathway origin',
            },
          ]);
        });

        test('should return INVALID_SEQUENCE error when last leg destination does not match route destination', async () => {
          // Create a new pathway with different destination
          const mismatchedDestinationPathway = await createPathway({
            originNodeId: testData.originNodeId,
            destinationNodeId: testData.intermediateNodeId, // Different destination
            name: 'Mismatched Destination Pathway',
            code: 'MDP001',
            description: 'Pathway with different destination',
            isSellable: true,
            isEmptyTrip: false,
            active: true,
          });
          testData.pathwayCleanup.track(mismatchedDestinationPathway.id);

          const mismatchedPathwayOption = await pathwayOptionRepository.create({
            pathwayId: mismatchedDestinationPathway.id,
            name: 'Mismatched Destination Pathway Option',
            description: 'Option',
            distanceKm: 50,
            typicalTimeMin: 60,
            isDefault: true,
            active: true,
          });

          const routeEntity = createUniqueEntity({
            baseName: 'Invalid Sequence Route 2',
            baseCode: 'ISR2',
            suiteId: testData.suiteId,
          });

          const invalidPayload: CreateRoutePayload = {
            code: routeEntity.code || 'ISR2001',
            name: routeEntity.name,
            serviceTypeId: testData.serviceTypeId,
            buslineId: testData.buslineId,
            originNodeId: testData.originNodeId,
            destinationNodeId: testData.destinationNodeId, // Route goes to destination
            legs: [
              {
                position: 1,
                pathwayId: mismatchedDestinationPathway.id, // Only goes to intermediate
                pathwayOptionId: mismatchedPathwayOption.id,
              },
            ],
            active: true,
          };

          await expectValidationError(invalidPayload, [
            {
              field: 'legs[0].pathwayId',
              code: 'INVALID_SEQUENCE',
              message: 'Last leg pathway destination',
            },
          ]);
        });

        test('should return INVALID_SEQUENCE error for broken chain between consecutive legs', async () => {
          // Create a pathway that starts at destination instead of intermediate
          // This creates a broken chain: leg 0 ends at intermediate but leg 1 starts at destination
          const disconnectedPathway = await createPathway({
            originNodeId: testData.destinationNodeId, // Starts at destination (wrong: should start at intermediate)
            destinationNodeId: testData.originNodeId, // Goes back to origin
            name: 'Disconnected Pathway',
            code: 'DCP001',
            description:
              'Pathway that breaks the chain by starting at the wrong node',
            isSellable: true,
            isEmptyTrip: false,
            active: true,
          });
          testData.pathwayCleanup.track(disconnectedPathway.id);

          const disconnectedPathwayOption =
            await pathwayOptionRepository.create({
              pathwayId: disconnectedPathway.id,
              name: 'Disconnected Pathway Option',
              description: 'Option',
              distanceKm: 50,
              typicalTimeMin: 60,
              isDefault: true,
              active: true,
            });

          const routeEntity = createUniqueEntity({
            baseName: 'Broken Chain Route',
            baseCode: 'BCR',
            suiteId: testData.suiteId,
          });

          const invalidPayload: CreateRoutePayload = {
            code: routeEntity.code || 'BCR001',
            name: routeEntity.name,
            serviceTypeId: testData.serviceTypeId,
            buslineId: testData.buslineId,
            originNodeId: testData.originNodeId,
            destinationNodeId: testData.destinationNodeId,
            legs: [
              {
                position: 1,
                pathwayId: testData.pathwayId, // origin -> intermediate (ends at intermediate)
                pathwayOptionId: testData.pathwayOptionId,
              },
              {
                position: 2,
                pathwayId: disconnectedPathway.id, // destination -> origin (starts at destination, should start at intermediate)
                pathwayOptionId: disconnectedPathwayOption.id,
              },
            ],
            active: true,
          };

          // Expected error: leg 0 ends at intermediate but leg 1 starts at destination
          // They don't connect, breaking the chain
          await expectValidationError(invalidPayload, [
            {
              field: 'legs[0].pathwayId',
              code: 'INVALID_SEQUENCE',
              message: 'must match leg',
            },
          ]);
        });

        test('should successfully create multi-leg route with valid sequence', async () => {
          const routeEntity = createUniqueEntity({
            baseName: 'Valid Multi-Leg Route',
            baseCode: 'VMLR',
            suiteId: testData.suiteId,
          });

          const validPayload: CreateRoutePayload = {
            code: routeEntity.code || 'VMLR001',
            name: routeEntity.name,
            serviceTypeId: testData.serviceTypeId,
            buslineId: testData.buslineId,
            originNodeId: testData.originNodeId,
            destinationNodeId: testData.destinationNodeId,
            legs: [
              {
                position: 1,
                pathwayId: testData.pathwayId, // origin -> intermediate
                pathwayOptionId: testData.pathwayOptionId,
                isDerived: false,
                active: true,
              },
              {
                position: 2,
                pathwayId: testData.secondPathwayId, // intermediate -> destination
                pathwayOptionId: testData.secondPathwayOptionId,
                isDerived: false,
                active: true,
              },
            ],
            active: true,
          };

          const result = await createRoute(validPayload);
          testData.routeCleanup.track(result.id);
          testData.createdRouteIds.push(result.id);

          // Verify route was created successfully
          expect(result).toBeDefined();
          expect(result.id).toBeDefined();
          expect(result.originNodeId).toBe(testData.originNodeId);
          expect(result.destinationNodeId).toBe(testData.destinationNodeId);

          // Verify route has correct number of legs
          const enrichedRoute = await getRoute({ id: result.id });
          expect(enrichedRoute.legs).toBeDefined();
          expect(enrichedRoute.legs.length).toBe(2);
          expect(enrichedRoute.metrics.legCount).toBe(2);
        });
      });

      describe('update validation errors', () => {
        test('should handle single and multiple update validation errors', async () => {
          const createdRoute = await createTestRoute(testData);

          // Test single error
          const singleErrorPayload: UpdateRoutePayload = {
            originNodeId: 999999, // Non-existent node
          };

          await expectValidationError(
            singleErrorPayload,
            [
              {
                field: 'originNodeId',
                code: 'NOT_FOUND',
                message: 'Origin node not found',
              },
            ],
            'update',
            createdRoute.id,
          );

          // Test multiple errors
          const multipleErrorsPayload: UpdateRoutePayload = {
            originNodeId: 999999, // Non-existent origin
            destinationNodeId: 999998, // Non-existent destination
            buslineId: 999997, // Non-existent busline
          };

          await expectValidationError(
            multipleErrorsPayload,
            [
              {
                field: 'originNodeId',
                code: 'NOT_FOUND',
                message: 'Origin node not found',
              },
              {
                field: 'destinationNodeId',
                code: 'NOT_FOUND',
                message: 'Destination node not found',
              },
              {
                field: 'buslineId',
                code: 'NOT_FOUND',
                message: 'Bus line not found',
              },
            ],
            'update',
            createdRoute.id,
          );
        });
      });

      describe('validation behavior scenarios', () => {
        test('should demonstrate validation stops early for INVALID_VALUE errors', async () => {
          const routeEntity = createUniqueEntity({
            baseName: 'Invalid Route',
            baseCode: 'IR',
            suiteId: testData.suiteId,
          });

          const invalidPayload: CreateRoutePayload = {
            code: routeEntity.code || 'IR004',
            name: routeEntity.name,
            serviceTypeId: 999999, // Non-existent service type
            buslineId: testData.buslineId,
            originNodeId: testData.originNodeId,
            destinationNodeId: testData.originNodeId, // Same as origin (INVALID_VALUE)
            legs: [
              {
                position: 1,
                pathwayId: testData.pathwayId,
                pathwayOptionId: testData.pathwayOptionId,
              },
            ],
            active: true,
          };

          // Note: Validation stops early when INVALID_VALUE error is found
          // Only the INVALID_VALUE error is returned, not the NOT_FOUND error
          await expectValidationError(invalidPayload, [
            {
              field: 'destinationNodeId',
              code: 'INVALID_VALUE',
              message: 'Origin and destination nodes cannot be the same',
            },
          ]);
        });

        test('should accumulate multiple NOT_FOUND errors when no INVALID_VALUE', async () => {
          const routeEntity = createUniqueEntity({
            baseName: 'Invalid Route',
            baseCode: 'IR',
            suiteId: testData.suiteId,
          });

          const invalidPayload: CreateRoutePayload = {
            code: routeEntity.code || 'IR005',
            name: routeEntity.name,
            serviceTypeId: 999999, // Non-existent service type
            buslineId: 999998, // Non-existent busline
            originNodeId: testData.originNodeId,
            destinationNodeId: testData.destinationNodeId, // Different nodes
            legs: [
              {
                position: 1,
                pathwayId: 999997, // Non-existent pathway
                pathwayOptionId: testData.pathwayOptionId,
              },
            ],
            active: true,
          };

          // Multiple NOT_FOUND errors are accumulated when no INVALID_VALUE exists
          await expectValidationError(invalidPayload, [
            {
              field: 'serviceTypeId',
              code: 'NOT_FOUND',
              message: 'Service type not found',
            },
            {
              field: 'buslineId',
              code: 'NOT_FOUND',
              message: 'Bus line not found',
            },
            {
              field: 'legs[0].pathwayId',
              code: 'NOT_FOUND',
              message: 'Pathway with ID 999997 not found',
            },
          ]);
        });
      });
    });

    describe('pagination and filtering', () => {
      test('should return paginated routes with default parameters', async () => {
        await createTestRoute(testData);

        const response = await listRoutesPaginated({});

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
        await createTestRoute(testData);

        const response = await listRoutesPaginated({
          page: 1,
          pageSize: 5,
        });

        expect(response.pagination.currentPage).toBe(1);
        expect(response.pagination.pageSize).toBe(5);
        expect(response.data.length).toBeLessThanOrEqual(5);
      });

      test('should return non-paginated list for dropdowns', async () => {
        const createdRoute = await createTestRoute(testData);

        const response = await listRoutes({});

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThan(0);
        // No pagination info should be present
        expect(response).not.toHaveProperty('pagination');

        const foundRoute = response.data.find((r) => r.id === createdRoute.id);
        expect(foundRoute).toBeDefined();
      });

      test('should search routes using searchTerm in list endpoint', async () => {
        const searchableRoute = await createTestRoute(testData, {
          name: 'Searchable Test Route XYZ',
        });

        // Search for the route using searchTerm in listRoutes
        const response = await listRoutes({ searchTerm: 'Searchable' });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.some((r) => r.id === searchableRoute.id)).toBe(
          true,
        );
      });

      test('should search routes with pagination using searchTerm', async () => {
        await createTestRoute(testData, { name: 'Test Route for Search' });

        const response = await listRoutesPaginated({
          searchTerm: 'Test',
          page: 1,
          pageSize: 5,
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.pagination).toBeDefined();
        expect(response.pagination.currentPage).toBe(1);
        expect(response.pagination.pageSize).toBe(5);
      });

      test('should filter routes by active status', async () => {
        // Create active and inactive routes
        const activeRoute = await createTestRoute(testData, { active: true });
        const inactiveRoute = await createTestRoute(testData, {
          active: false,
        });

        const response = await listRoutes({
          filters: { active: true },
        });

        // All returned routes should be active
        expect(response.data.every((r) => r.active === true)).toBe(true);
        // Should include our active test route
        expect(response.data.some((r) => r.id === activeRoute.id)).toBe(true);
        // Should NOT include our inactive test route
        expect(response.data.some((r) => r.id === inactiveRoute.id)).toBe(
          false,
        );
      });

      test('should order routes by name descending', async () => {
        await createTestRoute(testData, { name: 'AAA Route' });
        await createTestRoute(testData, { name: 'ZZZ Route' });

        const response = await listRoutes({
          orderBy: [{ field: 'name', direction: 'desc' }],
        });

        const names = response.data.map((r) => r.name);
        // Check if names are in descending order
        for (let i = 0; i < names.length - 1; i++) {
          expect(names[i] >= names[i + 1]).toBe(true);
        }
      });

      test('should combine ordering and filtering in paginated results', async () => {
        await createTestRoute(testData, {
          name: 'Active Route A',
          active: true,
        });
        await createTestRoute(testData, {
          name: 'Active Route B',
          active: true,
        });

        const response = await listRoutesPaginated({
          filters: { active: true },
          orderBy: [{ field: 'name', direction: 'asc' }],
          page: 1,
          pageSize: 10,
        });

        // Check filtering
        expect(response.data.every((r) => r.active === true)).toBe(true);

        // Check ordering (ascending)
        const names = response.data.map((r) => r.name);
        for (let i = 0; i < names.length - 1; i++) {
          expect(names[i] <= names[i + 1]).toBe(true);
        }

        // Check pagination properties
        expect(response.pagination).toBeDefined();
        expect(response.pagination.currentPage).toBe(1);
        expect(response.pagination.pageSize).toBe(10);
      });
    });

    describe('enriched data', () => {
      test('should return routes with all relations in paginated list', async () => {
        await createTestRoute(testData);

        const response = await listRoutesPaginated({ pageSize: 10 });

        expect(response.data).toBeDefined();
        expect(response.data.length).toBeGreaterThan(0);

        const route = response.data[0];
        expect(route.busline).toBeDefined();
        expect(route.serviceType).toBeDefined();
        expect(route.originNode).toBeDefined();
        expect(route.destinationNode).toBeDefined();
        expect(route.originCity).toBeDefined();
        expect(route.destinationCity).toBeDefined();
        expect(route.routeLegs).toBeDefined();
      });

      test('should calculate route metrics correctly', async () => {
        const createdRoute = await createTestRoute(testData);

        const enrichedRoute = await getRoute({ id: createdRoute.id });

        expect(enrichedRoute.metrics).toBeDefined();
        expect(enrichedRoute.metrics.totalDistance).toBe(50); // From our test pathway option
        expect(enrichedRoute.metrics.totalTime).toBe(60); // From our test pathway option
        expect(enrichedRoute.metrics.legCount).toBe(1); // One leg
      });

      test('should calculate route metrics correctly with multiple legs', async () => {
        const routeEntity = createUniqueEntity({
          baseName: 'Multi-Leg Route',
          baseCode: 'MLR',
          suiteId: testData.suiteId,
        });

        // Create a route with two legs
        const multiLegRouteData: CreateRoutePayload = {
          code: routeEntity.code || 'MLR001',
          name: routeEntity.name,
          serviceTypeId: testData.serviceTypeId,
          buslineId: testData.buslineId,
          originNodeId: testData.originNodeId,
          destinationNodeId: testData.destinationNodeId,
          legs: [
            {
              position: 1,
              pathwayId: testData.pathwayId, // Origin to intermediate (50km, 60min)
              pathwayOptionId: testData.pathwayOptionId,
              isDerived: false,
              active: true,
            },
            {
              position: 2,
              pathwayId: testData.secondPathwayId, // Intermediate to destination (75km, 90min)
              pathwayOptionId: testData.secondPathwayOptionId,
              isDerived: false,
              active: true,
            },
          ],
          active: true,
        };

        const createdRoute = await createRoute(multiLegRouteData);
        testData.routeCleanup.track(createdRoute.id);
        testData.createdRouteIds.push(createdRoute.id);

        const enrichedRoute = await getRoute({ id: createdRoute.id });

        // Verify metrics are correctly aggregated across both legs
        expect(enrichedRoute.metrics).toBeDefined();
        expect(enrichedRoute.metrics.totalDistance).toBe(125); // 50 + 75
        expect(enrichedRoute.metrics.totalTime).toBe(150); // 60 + 90
        expect(enrichedRoute.metrics.legCount).toBe(2); // Two legs
        expect(enrichedRoute.legs).toBeDefined();
        expect(enrichedRoute.legs.length).toBe(2);
      });

      test('should include pathway option tolls in enriched route legs', async () => {
        const createdRoute = await createTestRoute(testData);

        const enrichedRoute = await getRoute({ id: createdRoute.id });

        expect(enrichedRoute.legs).toBeDefined();
        expect(enrichedRoute.legs.length).toBeGreaterThan(0);

        const leg = enrichedRoute.legs[0];
        expect(leg.pathway).toBeDefined();
        expect(leg.option).toBeDefined();
        expect(leg.option.tollbooths).toBeDefined();
        expect(Array.isArray(leg.option.tollbooths)).toBe(true);
      });
    });
  });
});
