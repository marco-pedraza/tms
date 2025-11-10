import { inventoryAdapter } from '@/planning/adapters/inventory.adapter';
import { db } from '@/planning/db-service';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import { busModelRepository } from '@/inventory/fleet/bus-models/bus-models.repository';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import { busLineRepository } from '@/inventory/operators/bus-lines/bus-lines.repository';
import { serviceTypeRepository } from '@/inventory/operators/service-types/service-types.repository';
import { transporterRepository } from '@/inventory/operators/transporters/transporters.repository';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueEntity,
} from '@/tests/shared/test-utils';
import {
  busLineFactory,
  busModelFactory,
  nodeFactory,
  serviceTypeFactory,
  transporterFactory,
} from '@/factories';
import { getFactoryDb } from '@/factories/factory-utils';
import type {
  RollingPlan,
  RollingPlanWithRelations,
} from './rolling-plans.types';
import type {
  CreateRollingPlanPayload,
  UpdateRollingPlanPayload,
} from './rolling-plans.types';
import { rollingPlanRepository } from './rolling-plans.repository';
import {
  createRollingPlan,
  deleteRollingPlan,
  getRollingPlan,
  listRollingPlans,
  listRollingPlansPaginated,
  updateRollingPlan,
} from './rolling-plans.controller';

/**
 * Test data interface for consistent test setup
 */
interface TestData {
  suiteId: string;
  factoryDb: ReturnType<typeof getFactoryDb>;
  transporterId: number;
  buslineId: number;
  serviceTypeId: number;
  busModelId: number;
  baseNodeId: number;
  rollingPlanCleanup: ReturnType<typeof createCleanupHelper>;
  testRollingPlan: RollingPlan;
  // Temporary entities created during tests that need cleanup
  temporaryBusLineIds: number[];
  temporaryTransporterIds: number[];
}

describe('Rolling Plans Controller', () => {
  // Tests that don't need test data - no beforeEach/afterEach
  describe('error scenarios without test data', () => {
    test('should handle rolling plan not found', async () => {
      await expect(getRollingPlan({ id: 999999 })).rejects.toThrow();
    });

    test('should handle rolling plan not found on update', async () => {
      const updateData: UpdateRollingPlanPayload = {
        name: 'Non-existent Rolling Plan',
      };

      await expect(
        updateRollingPlan({ id: 999999, ...updateData }),
      ).rejects.toThrow();
    });

    test('should handle rolling plan not found on delete', async () => {
      await expect(deleteRollingPlan({ id: 999999 })).rejects.toThrow();
    });
  });

  // Tests that require test data - with beforeAll/afterAll
  describe('operations requiring test data', () => {
    let testData: TestData;

    /**
     * Creates fresh test data for each test suite to ensure isolation
     */
    async function createTestData(): Promise<TestData> {
      const suiteId = createTestSuiteId('rolling-plans-controller');
      const factoryDb = getFactoryDb(db);

      // Setup cleanup helper for rolling plans
      const rollingPlanCleanup = createCleanupHelper(async ({ id }) => {
        return await rollingPlanRepository.forceDelete(id);
      }, 'rolling plan');

      // Create test dependencies using factories
      // First create transporter (required for bus line)
      const transporterEntity = createUniqueEntity({
        baseName: 'Rolling Plan Test Transporter',
        baseCode: 'RPTR',
        suiteId,
      });

      const testTransporter = (await transporterFactory(factoryDb).create({
        name: transporterEntity.name,
        code: transporterEntity.code || 'RPTR001',
        active: true,
      })) as { id: number };

      // Create service type (required for bus line)
      const serviceTypeEntity = createUniqueEntity({
        baseName: 'Rolling Plan Test Service Type',
        baseCode: 'RPST',
        suiteId,
      });

      const testServiceType = (await serviceTypeFactory(factoryDb).create({
        name: serviceTypeEntity.name,
        code: serviceTypeEntity.code || 'RPST001',
        active: true,
        deletedAt: null,
      })) as { id: number };

      // Create bus line with transporter and service type
      const busLineEntity = createUniqueEntity({
        baseName: 'Rolling Plan Test Bus Line',
        baseCode: 'RPBL',
        suiteId,
      });

      const testBusLine = (await busLineFactory(factoryDb).create({
        name: busLineEntity.name,
        code: busLineEntity.code || 'RPBL001',
        transporterId: testTransporter.id,
        serviceTypeId: testServiceType.id,
        active: true,
        deletedAt: null,
      })) as { id: number };

      const testBusModel = (await busModelFactory(factoryDb).create({
        manufacturer: 'Test Manufacturer',
        model: 'Test Model',
        year: 2024,
        seatingCapacity: 45,
        numFloors: 1,
        amenities: ['Wifi', 'Air Conditioning'],
        engineType: 'diesel',
        active: true,
      })) as { id: number };

      const baseNodeEntity = createUniqueEntity({
        baseName: 'Rolling Plan Test Base Node',
        baseCode: 'RPBN',
        suiteId,
      });

      const testBaseNode = (await nodeFactory(factoryDb).create({
        name: baseNodeEntity.name,
        code: baseNodeEntity.code || 'RPBN001',
        active: true,
        deletedAt: null,
      })) as { id: number };

      // Create a test rolling plan for reuse in multiple tests
      const rollingPlanEntity = createUniqueEntity({
        baseName: 'Rolling Plan Test Plan',
        suiteId,
      });

      // Get bus line to extract serviceTypeId (required for repository.create)
      const busLine = await inventoryAdapter.getBusLine(testBusLine.id);

      const testRollingPlan = await rollingPlanRepository.create({
        name: rollingPlanEntity.name,
        buslineId: testBusLine.id,
        serviceTypeId: busLine.serviceTypeId,
        busModelId: testBusModel.id,
        baseNodeId: testBaseNode.id,
        operationType: 'continuous',
        cycleDurationDays: 7,
        active: true,
        notes: 'Test rolling plan for controller tests',
      } as CreateRollingPlanPayload & { serviceTypeId: number });
      rollingPlanCleanup.track(testRollingPlan.id);

      return {
        suiteId,
        factoryDb,
        transporterId: testTransporter.id,
        buslineId: testBusLine.id,
        serviceTypeId: testServiceType.id,
        busModelId: testBusModel.id,
        baseNodeId: testBaseNode.id,
        rollingPlanCleanup,
        testRollingPlan,
        temporaryBusLineIds: [],
        temporaryTransporterIds: [],
      };
    }

    /**
     * Cleans up test data after test suite
     */
    async function cleanupTestData(data: TestData): Promise<void> {
      // Clean up all tracked rolling plans first (they depend on bus_lines, bus_models, nodes)
      // Use repository forceDelete to ensure hard delete and avoid foreign key issues
      const trackedRollingPlanIds = data.rollingPlanCleanup.getTrackedIds();
      if (trackedRollingPlanIds.length > 0) {
        for (const id of trackedRollingPlanIds) {
          try {
            await rollingPlanRepository.forceDelete(id);
          } catch (error) {
            console.log('⚠️ Error cleaning up rolling plan:', id, error);
          }
        }
      }

      // Clean up temporary bus lines (created during tests, after rolling plans are deleted)
      if (data.temporaryBusLineIds.length > 0) {
        for (const id of data.temporaryBusLineIds) {
          try {
            await busLineRepository.forceDelete(id);
          } catch (error) {
            console.log('⚠️ Error cleaning up temporary bus line:', id, error);
          }
        }
      }

      // Clean up temporary transporters (created during tests, after bus lines are deleted)
      if (data.temporaryTransporterIds.length > 0) {
        for (const id of data.temporaryTransporterIds) {
          try {
            await transporterRepository.forceDelete(id);
          } catch (error) {
            console.log(
              '⚠️ Error cleaning up temporary transporter:',
              id,
              error,
            );
          }
        }
      }

      // Clean up factory-created entities in reverse order of dependencies
      // Order: rolling_plans -> bus_lines -> (service_types, transporters) -> (bus_models, nodes)

      // 1. Clean up bus line (depends on service_type and transporter, but rolling_plans already deleted)
      try {
        await busLineRepository.forceDelete(data.buslineId);
      } catch (error) {
        console.log('⚠️ Error cleaning up bus line:', data.buslineId, error);
      }

      // 2. Clean up service type (no longer referenced by bus line)
      try {
        await serviceTypeRepository.forceDelete(data.serviceTypeId);
      } catch (error) {
        console.log(
          '⚠️ Error cleaning up service type:',
          data.serviceTypeId,
          error,
        );
      }

      // 3. Clean up transporter (no longer referenced by bus line)
      try {
        await transporterRepository.forceDelete(data.transporterId);
      } catch (error) {
        console.log(
          '⚠️ Error cleaning up transporter:',
          data.transporterId,
          error,
        );
      }

      // 4. Clean up bus model (no longer referenced by rolling plans)
      try {
        await busModelRepository.forceDelete(data.busModelId);
      } catch (error) {
        console.log('⚠️ Error cleaning up bus model:', data.busModelId, error);
      }

      // 5. Clean up base node (no longer referenced by rolling plans)
      try {
        await nodeRepository.forceDelete(data.baseNodeId);
      } catch (error) {
        console.log('⚠️ Error cleaning up base node:', data.baseNodeId, error);
      }
    }

    /**
     * Creates a test rolling plan with unique data
     */
    async function createTestRollingPlan(
      data: TestData,
      name: string,
      operationType: 'continuous' | 'specific_days' = 'continuous',
      options: Partial<CreateRollingPlanPayload> = {},
    ): Promise<RollingPlan> {
      // Get bus line to extract serviceTypeId (required for repository.create)
      const busLine = await inventoryAdapter.getBusLine(data.buslineId);

      const rollingPlan = await rollingPlanRepository.create({
        name,
        buslineId: data.buslineId,
        serviceTypeId: busLine.serviceTypeId,
        busModelId: data.busModelId,
        baseNodeId: data.baseNodeId,
        operationType,
        cycleDurationDays: operationType === 'continuous' ? 7 : undefined,
        operationDays:
          operationType === 'specific_days'
            ? { monday: true, wednesday: true, friday: true }
            : undefined,
        active: true,
        ...options,
      } as CreateRollingPlanPayload & { serviceTypeId: number });
      data.rollingPlanCleanup.track(rollingPlan.id);
      return rollingPlan;
    }

    beforeAll(async () => {
      testData = await createTestData();
    });

    afterAll(async () => {
      await cleanupTestData(testData);
    });

    describe('pagination and filtering', () => {
      test('should list rolling plans without pagination', async () => {
        const response = await listRollingPlans({});

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThan(0);
        expect(response).not.toHaveProperty('pagination');

        // Verify our test rolling plan is in the list
        const foundPlan = response.data.find(
          (p) => p.id === testData.testRollingPlan.id,
        );
        expect(foundPlan).toBeDefined();
        expect(foundPlan?.name).toBe(testData.testRollingPlan.name);
      });

      test('should list rolling plans with pagination and relations', async () => {
        const response = await listRollingPlansPaginated({
          page: 1,
          pageSize: 10,
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.pagination).toBeDefined();
        expect(response.pagination.currentPage).toBe(1);
        expect(response.pagination.pageSize).toBe(10);
        expect(response.pagination.totalCount).toBeDefined();
        expect(response.pagination.totalPages).toBeDefined();
        expect(typeof response.pagination.hasNextPage).toBe('boolean');
        expect(typeof response.pagination.hasPreviousPage).toBe('boolean');

        // Verify relations are included in paginated results
        if (response.data.length > 0) {
          const firstPlan = response.data[0] as RollingPlanWithRelations;
          expect(firstPlan.busline).toBeDefined();
          expect(firstPlan.busline.serviceType).toBeDefined();
          expect(firstPlan.busModel).toBeDefined();
          expect(firstPlan.baseNode).toBeDefined();
        }
      });
    });

    describe('CRUD operations', () => {
      test('should create a new rolling plan with continuous operation type', async () => {
        const rollingPlanEntity = createUniqueEntity({
          baseName: 'New Continuous Rolling Plan',
          suiteId: testData.suiteId,
        });

        const payload: CreateRollingPlanPayload = {
          name: rollingPlanEntity.name,
          buslineId: testData.buslineId,
          busModelId: testData.busModelId,
          baseNodeId: testData.baseNodeId,
          operationType: 'continuous',
          cycleDurationDays: 14,
          active: true,
          notes: 'Test continuous rolling plan',
        };

        const response = await createRollingPlan(payload);

        // Track the created rolling plan for cleanup
        testData.rollingPlanCleanup.track(response.id);

        expect(response).toBeDefined();
        expect(response.id).toBeDefined();
        expect(response.name).toBe(payload.name);
        expect(response.buslineId).toBe(payload.buslineId);
        expect(response.serviceTypeId).toBe(testData.serviceTypeId);
        expect(response.busModelId).toBe(payload.busModelId);
        expect(response.baseNodeId).toBe(payload.baseNodeId);
        expect(response.operationType).toBe('continuous');
        expect(response.cycleDurationDays).toBe(payload.cycleDurationDays);
        expect(response.operationDays).toBeNull();
        expect(response.active).toBe(true);
        expect(response.notes).toBe(payload.notes);

        // Verify relations are included
        expect(response.busline).toBeDefined();
        expect(response.busline.id).toBe(testData.buslineId);
        expect(response.busline.serviceType).toBeDefined();
        expect(response.busline.serviceType.id).toBe(testData.serviceTypeId);
        expect(response.busModel).toBeDefined();
        expect(response.busModel.id).toBe(testData.busModelId);
        expect(response.baseNode).toBeDefined();
        expect(response.baseNode.id).toBe(testData.baseNodeId);
      });

      test('should create a new rolling plan with specific_days operation type', async () => {
        const operationDays = {
          monday: true,
          wednesday: true,
          friday: true,
        };

        const rollingPlanEntity = createUniqueEntity({
          baseName: 'New Specific Days Rolling Plan',
          suiteId: testData.suiteId,
        });

        const payload: CreateRollingPlanPayload = {
          name: rollingPlanEntity.name,
          buslineId: testData.buslineId,
          busModelId: testData.busModelId,
          baseNodeId: testData.baseNodeId,
          operationType: 'specific_days',
          operationDays,
          active: true,
        };

        const response = await createRollingPlan(payload);

        // Track the created rolling plan for cleanup
        testData.rollingPlanCleanup.track(response.id);

        expect(response).toBeDefined();
        expect(response.id).toBeDefined();
        expect(response.name).toBe(payload.name);
        expect(response.operationType).toBe('specific_days');
        expect(response.cycleDurationDays).toBeNull();
        expect(response.operationDays).toBeDefined();
        expect(response.operationDays).toEqual(operationDays);
      });

      test('should get a rolling plan by ID with relations', async () => {
        const response = await getRollingPlan({
          id: testData.testRollingPlan.id,
        });

        expect(response).toBeDefined();
        expect(response.id).toBe(testData.testRollingPlan.id);
        expect(response.name).toBe(testData.testRollingPlan.name);
        expect(response.buslineId).toBe(testData.testRollingPlan.buslineId);
        expect(response.serviceTypeId).toBe(
          testData.testRollingPlan.serviceTypeId,
        );
        expect(response.busModelId).toBe(testData.testRollingPlan.busModelId);
        expect(response.baseNodeId).toBe(testData.testRollingPlan.baseNodeId);
        expect(response.operationType).toBe(
          testData.testRollingPlan.operationType,
        );
        expect(response.active).toBe(testData.testRollingPlan.active);

        // Verify relations are included
        expect(response.busline).toBeDefined();
        expect(response.busline.id).toBe(testData.buslineId);
        expect(response.busline.serviceType).toBeDefined();
        expect(response.busline.serviceType.id).toBe(testData.serviceTypeId);
        expect(response.busModel).toBeDefined();
        expect(response.busModel.id).toBe(testData.busModelId);
        expect(response.baseNode).toBeDefined();
        expect(response.baseNode.id).toBe(testData.baseNodeId);
      });

      test('should update a rolling plan', async () => {
        const rollingPlanEntity = createUniqueEntity({
          baseName: 'Updated Rolling Plan',
          suiteId: testData.suiteId,
        });

        const updatePayload: UpdateRollingPlanPayload = {
          name: rollingPlanEntity.name,
          notes: 'Updated notes',
          active: false,
        };

        const response = await updateRollingPlan({
          id: testData.testRollingPlan.id,
          ...updatePayload,
        });

        expect(response).toBeDefined();
        expect(response.id).toBe(testData.testRollingPlan.id);
        expect(response.name).toBe(rollingPlanEntity.name);
        expect(response.notes).toBe(updatePayload.notes);
        expect(response.active).toBe(false);

        // Verify relations are still included
        expect(response.busline).toBeDefined();
        expect(response.busline.serviceType).toBeDefined();
        expect(response.busModel).toBeDefined();
        expect(response.baseNode).toBeDefined();
      });

      test('should update rolling plan operation type from continuous to specific_days', async () => {
        const rollingPlanEntity = createUniqueEntity({
          baseName: 'Plan to Update',
          suiteId: testData.suiteId,
        });

        const continuousPlan = await createTestRollingPlan(
          testData,
          rollingPlanEntity.name,
          'continuous',
          { cycleDurationDays: 7 },
        );

        const operationDays = { tuesday: true, thursday: true, saturday: true };
        const response = await updateRollingPlan({
          id: continuousPlan.id,
          operationType: 'specific_days',
          operationDays,
        });

        expect(response.operationType).toBe('specific_days');
        expect(response.cycleDurationDays).toBeNull();
        expect(response.operationDays).toEqual(operationDays);
      });

      test('should delete a rolling plan', async () => {
        // Create a rolling plan specifically for deletion test
        const rollingPlanEntity = createUniqueEntity({
          baseName: 'Rolling Plan To Delete',
          suiteId: testData.suiteId,
        });

        const rollingPlanToDelete = await createTestRollingPlan(
          testData,
          rollingPlanEntity.name,
          'continuous',
          { cycleDurationDays: 7 },
        );

        await expect(
          deleteRollingPlan({ id: rollingPlanToDelete.id }),
        ).resolves.not.toThrow();

        // Attempt to get should throw a not found error
        await expect(
          getRollingPlan({ id: rollingPlanToDelete.id }),
        ).rejects.toThrow();
      });
    });

    describe('business rule validation', () => {
      /**
       * Helper function to create a base valid payload for testing
       */
      function createBasePayload(
        overrides: Partial<CreateRollingPlanPayload> = {},
      ): CreateRollingPlanPayload {
        return {
          name: createUniqueEntity({
            baseName: 'Test Rolling Plan',
            suiteId: testData.suiteId,
          }).name,
          buslineId: testData.buslineId,
          busModelId: testData.busModelId,
          baseNodeId: testData.baseNodeId,
          operationType: 'continuous',
          cycleDurationDays: 7,
          active: true,
          ...overrides,
        };
      }

      /**
       * Helper function to capture and validate FieldValidationError
       */
      async function expectValidationError(
        payload: CreateRollingPlanPayload | UpdateRollingPlanPayload,
        expectedErrors: {
          field: string;
          code: string;
          message?: string;
        }[],
        operation: 'create' | 'update' = 'create',
        rollingPlanId?: number,
      ): Promise<void> {
        let validationError: FieldValidationError | undefined;

        try {
          if (operation === 'create') {
            await createRollingPlan(payload as CreateRollingPlanPayload);
          } else {
            if (!rollingPlanId) {
              throw new Error(
                'Rolling plan ID is required for update operations',
              );
            }
            await updateRollingPlan({
              id: rollingPlanId,
              ...(payload as UpdateRollingPlanPayload),
            });
          }
        } catch (error) {
          validationError = error as FieldValidationError;
          if (!(error instanceof FieldValidationError)) {
            console.log('⚠️ Unexpected error during validation test:', error);
          }
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

      describe('DUPLICATE errors', () => {
        test('should return DUPLICATE error for duplicate name within same busline', async () => {
          const existingRollingPlan = await getRollingPlan({
            id: testData.testRollingPlan.id,
          });

          const duplicatePayload = createBasePayload({
            name: existingRollingPlan.name,
            buslineId: existingRollingPlan.buslineId,
          });

          await expectValidationError(duplicatePayload, [
            {
              field: 'name',
              code: 'DUPLICATE',
              message: 'rolling plan',
            },
          ]);
        });

        test('should allow same name for different buslines', async () => {
          // Create another bus line
          const anotherTransporterEntity = createUniqueEntity({
            baseName: 'Rolling Plan Another Transporter',
            baseCode: 'RPATR',
            suiteId: testData.suiteId,
          });

          const anotherTransporter = (await transporterFactory(
            testData.factoryDb,
          ).create({
            name: anotherTransporterEntity.name,
            code: anotherTransporterEntity.code || 'RPATR001',
            active: true,
          })) as { id: number };

          // Track temporary transporter for cleanup
          testData.temporaryTransporterIds.push(anotherTransporter.id);

          const anotherBusLineEntity = createUniqueEntity({
            baseName: 'Rolling Plan Another Bus Line',
            baseCode: 'RPABL',
            suiteId: testData.suiteId,
          });

          const anotherBusLine = (await busLineFactory(
            testData.factoryDb,
          ).create({
            name: anotherBusLineEntity.name,
            code: anotherBusLineEntity.code || 'RPABL001',
            transporterId: anotherTransporter.id,
            serviceTypeId: testData.serviceTypeId,
            active: true,
            deletedAt: null,
          })) as { id: number };

          // Track temporary bus line for cleanup
          testData.temporaryBusLineIds.push(anotherBusLine.id);

          // Should succeed - same name but different busline
          const payload = createBasePayload({
            name: testData.testRollingPlan.name,
            buslineId: anotherBusLine.id,
          });

          const response = await createRollingPlan(payload);

          // Track the created rolling plan for cleanup
          testData.rollingPlanCleanup.track(response.id);

          expect(response).toBeDefined();
          expect(response.name).toBe(testData.testRollingPlan.name);
          expect(response.buslineId).toBe(anotherBusLine.id);
        });

        test('should return DUPLICATE error on update with duplicate name', async () => {
          // Ensure the test rolling plan exists and get fresh data
          const existingRollingPlan = await getRollingPlan({
            id: testData.testRollingPlan.id,
          });

          // Create another rolling plan
          const rollingPlanEntity = createUniqueEntity({
            baseName: 'Another Plan',
            suiteId: testData.suiteId,
          });

          const anotherPlan = await createTestRollingPlan(
            testData,
            rollingPlanEntity.name,
          );

          const updatePayload: UpdateRollingPlanPayload = {
            name: existingRollingPlan.name, // Same name as testRollingPlan
          };

          await expectValidationError(
            updatePayload,
            [
              {
                field: 'name',
                code: 'DUPLICATE',
                message: 'rolling plan',
              },
            ],
            'update',
            anotherPlan.id,
          );
        });
      });

      describe('NOT_FOUND errors', () => {
        test('should return NOT_FOUND errors for non-existent related entities', async () => {
          const invalidPayload = createBasePayload({
            buslineId: 999999,
            busModelId: 999997,
            baseNodeId: 999996,
          });

          await expectValidationError(invalidPayload, [
            {
              field: 'buslineId',
              code: 'NOT_FOUND',
              message: 'Bus line',
            },
            {
              field: 'busModelId',
              code: 'NOT_FOUND',
              message: 'Bus model',
            },
            {
              field: 'baseNodeId',
              code: 'NOT_FOUND',
              message: 'Base node',
            },
          ]);
        });

        test('should return NOT_FOUND error on update with non-existent related entity', async () => {
          const updatePayload: UpdateRollingPlanPayload = {
            buslineId: 999999,
          };

          await expectValidationError(
            updatePayload,
            [
              {
                field: 'buslineId',
                code: 'NOT_FOUND',
                message: 'Bus line',
              },
            ],
            'update',
            testData.testRollingPlan.id,
          );
        });
      });

      describe('REQUIRED errors', () => {
        test('should return REQUIRED error for missing cycleDurationDays in continuous operation', async () => {
          const invalidPayload = {
            name: createUniqueEntity({
              baseName: 'Invalid Continuous Plan',
              suiteId: testData.suiteId,
            }).name,
            buslineId: testData.buslineId,
            busModelId: testData.busModelId,
            baseNodeId: testData.baseNodeId,
            operationType: 'continuous' as const,
            active: true,
            // cycleDurationDays is missing
          };

          await expectValidationError(invalidPayload, [
            {
              field: 'cycleDurationDays',
              code: 'REQUIRED',
              message:
                'Cycle duration days is required for continuous operation',
            },
          ]);
        });

        test('should return REQUIRED error for missing operationDays in specific_days operation', async () => {
          const invalidPayload = {
            name: createUniqueEntity({
              baseName: 'Invalid Specific Days Plan',
              suiteId: testData.suiteId,
            }).name,
            buslineId: testData.buslineId,
            busModelId: testData.busModelId,
            baseNodeId: testData.baseNodeId,
            operationType: 'specific_days' as const,
            active: true,
            // operationDays is missing
          };

          await expectValidationError(invalidPayload, [
            {
              field: 'operationDays',
              code: 'REQUIRED',
              message:
                'Operation days configuration is required for specific_days operation',
            },
          ]);
        });
      });

      describe('INVALID_VALUE errors for operationDays', () => {
        /**
         * Helper to create payload for specific_days operation type
         */
        function createSpecificDaysPayload(
          operationDays: Record<string, unknown>,
        ): CreateRollingPlanPayload {
          return {
            name: createUniqueEntity({
              baseName: 'Test Specific Days Plan',
              suiteId: testData.suiteId,
            }).name,
            buslineId: testData.buslineId,
            busModelId: testData.busModelId,
            baseNodeId: testData.baseNodeId,
            operationType: 'specific_days',
            operationDays,
            active: true,
          };
        }

        test.each([
          {
            description: 'string instead of object',
            operationDays: 'not-an-object' as unknown as Record<
              string,
              unknown
            >,
          },
          {
            description: 'array instead of object',
            operationDays: ['monday', 'tuesday'] as unknown as Record<
              string,
              unknown
            >,
          },
        ])(
          'should return INVALID_VALUE error when operationDays is $description',
          async ({ operationDays }) => {
            const invalidPayload = createSpecificDaysPayload(operationDays);

            await expectValidationError(invalidPayload, [
              {
                field: 'operationDays',
                code: 'INVALID_VALUE',
                message: 'Operation days must be an object',
              },
            ]);
          },
        );

        test('should return INVALID_VALUE error when operationDays has invalid keys', async () => {
          const invalidPayload = createSpecificDaysPayload({
            monday: true,
            invalidDay: true, // Invalid key
            tuesday: true,
          });

          await expectValidationError(invalidPayload, [
            {
              field: 'operationDays',
              code: 'INVALID_VALUE',
              message:
                'Operation days can only contain valid day keys: monday, tuesday, wednesday, thursday, friday, saturday, sunday',
            },
          ]);
        });

        test.each([
          {
            description: 'false values',
            operationDays: {
              monday: true,
              tuesday: false,
              wednesday: true,
            },
          },
          {
            description: 'non-boolean values',
            operationDays: {
              monday: true,
              tuesday: 'yes' as unknown as boolean,
              wednesday: 1 as unknown as boolean,
            },
          },
        ])(
          'should return INVALID_VALUE error when operationDays has $description',
          async ({ operationDays }) => {
            const invalidPayload = createSpecificDaysPayload(operationDays);

            await expectValidationError(invalidPayload, [
              {
                field: 'operationDays',
                code: 'INVALID_VALUE',
                message: 'Operation days can only have true values',
              },
            ]);
          },
        );

        test('should return INVALID_VALUE error when operationDays is empty object', async () => {
          const invalidPayload = createSpecificDaysPayload({});

          await expectValidationError(invalidPayload, [
            {
              field: 'operationDays',
              code: 'INVALID_VALUE',
              message: 'At least one operation day must be configured',
            },
          ]);
        });

        test('should accept valid operationDays configuration', async () => {
          const validPayload = createSpecificDaysPayload({
            monday: true,
            wednesday: true,
            friday: true,
          });

          const response = await createRollingPlan(validPayload);

          // Track the created rolling plan for cleanup
          testData.rollingPlanCleanup.track(response.id);

          expect(response).toBeDefined();
          expect(response.operationType).toBe('specific_days');
          expect(response.operationDays).toEqual({
            monday: true,
            wednesday: true,
            friday: true,
          });
        });

        test('should validate operationDays on update', async () => {
          // Create a rolling plan with specific_days operation type
          const rollingPlanEntity = createUniqueEntity({
            baseName: 'Plan to Update Days',
            suiteId: testData.suiteId,
          });

          const existingPlan = await createTestRollingPlan(
            testData,
            rollingPlanEntity.name,
            'specific_days',
            {
              operationDays: {
                monday: true,
                tuesday: true,
              },
            },
          );

          // Try to update with invalid operationDays
          const invalidUpdate: UpdateRollingPlanPayload = {
            operationDays: {
              monday: true,
              invalidDay: true, // Invalid key
            },
          };

          await expectValidationError(
            invalidUpdate,
            [
              {
                field: 'operationDays',
                code: 'INVALID_VALUE',
                message:
                  'Operation days can only contain valid day keys: monday, tuesday, wednesday, thursday, friday, saturday, sunday',
              },
            ],
            'update',
            existingPlan.id,
          );
        });
      });

      describe('update validation errors', () => {
        test('should handle single and multiple update validation errors', async () => {
          // Test single error
          const singleErrorPayload: UpdateRollingPlanPayload = {
            buslineId: 999999,
          };

          await expectValidationError(
            singleErrorPayload,
            [
              {
                field: 'buslineId',
                code: 'NOT_FOUND',
                message: 'Bus line',
              },
            ],
            'update',
            testData.testRollingPlan.id,
          );

          // Test multiple errors
          const multipleErrorsPayload: UpdateRollingPlanPayload = {
            buslineId: 999999,
            busModelId: 999997,
          };

          await expectValidationError(
            multipleErrorsPayload,
            [
              {
                field: 'buslineId',
                code: 'NOT_FOUND',
                message: 'Bus line',
              },
              {
                field: 'busModelId',
                code: 'NOT_FOUND',
                message: 'Bus model',
              },
            ],
            'update',
            testData.testRollingPlan.id,
          );
        });
      });
    });

    describe('pagination', () => {
      test('should return paginated rolling plans with default parameters', async () => {
        const response = await listRollingPlansPaginated({});

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.pagination).toBeDefined();
        expect(response.pagination.currentPage).toBe(1);
        expect(response.pagination.pageSize).toBeDefined();
        expect(response.pagination.totalCount).toBeDefined();
        expect(response.pagination.totalPages).toBeDefined();
      });

      test('should honor page and pageSize parameters', async () => {
        const response = await listRollingPlansPaginated({
          page: 1,
          pageSize: 5,
        });

        expect(response.pagination.currentPage).toBe(1);
        expect(response.pagination.pageSize).toBe(5);
        expect(response.data.length).toBeLessThanOrEqual(5);
      });

      test('should default sort by name in ascending order', async () => {
        // Create test rolling plans with different names for verification of default sorting
        const planAEntity = createUniqueEntity({
          baseName: 'AAA Test Rolling Plan',
          suiteId: testData.suiteId,
        });

        const planZEntity = createUniqueEntity({
          baseName: 'ZZZ Test Rolling Plan',
          suiteId: testData.suiteId,
        });

        const planA = await createTestRollingPlan(testData, planAEntity.name);
        const planZ = await createTestRollingPlan(testData, planZEntity.name);

        // Get rolling plans with large enough page size to include test plans
        const response = await listRollingPlansPaginated({
          pageSize: 50,
        });

        // Find the indices of our test rolling plans
        const indexA = response.data.findIndex((p) => p.id === planA.id);
        const indexZ = response.data.findIndex((p) => p.id === planZ.id);

        // Verify that planA (AAA) comes before planZ (ZZZ) in the results
        if (indexA !== -1 && indexZ !== -1) {
          expect(indexA).toBeLessThan(indexZ);
        }
      });

      test('should return non-paginated list for dropdowns', async () => {
        const response = await listRollingPlans({});

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThan(0);
        // No pagination info should be present
        expect(response).not.toHaveProperty('pagination');
      });
    });

    describe('search functionality', () => {
      test('should search rolling plans using searchTerm in list endpoint', async () => {
        // Create a unique rolling plan for search testing
        const rollingPlanEntity = createUniqueEntity({
          baseName: 'Searchable Test Rolling Plan',
          suiteId: testData.suiteId,
        });

        const searchablePlan = await createTestRollingPlan(
          testData,
          rollingPlanEntity.name,
        );

        // Search for the rolling plan using searchTerm in listRollingPlans
        const response = await listRollingPlans({
          searchTerm: 'Searchable',
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.some((p) => p.id === searchablePlan.id)).toBe(
          true,
        );
      });

      test('should search rolling plans with pagination using searchTerm', async () => {
        const response = await listRollingPlansPaginated({
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

      test('should combine search term with filters', async () => {
        // Create test rolling plans with different active states
        const activeEntity = createUniqueEntity({
          baseName: 'Active Searchable Rolling Plan',
          suiteId: testData.suiteId,
        });

        const inactiveEntity = createUniqueEntity({
          baseName: 'Inactive Searchable Rolling Plan',
          suiteId: testData.suiteId,
        });

        const activeSearchablePlan = await createTestRollingPlan(
          testData,
          activeEntity.name,
          'continuous',
          { active: true },
        );
        const inactiveSearchablePlan = await createTestRollingPlan(
          testData,
          inactiveEntity.name,
          'continuous',
          { active: false },
        );

        // Search for "Searchable" but only active rolling plans
        const response = await listRollingPlans({
          searchTerm: 'Searchable',
          filters: { active: true },
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);

        // Should include the active searchable rolling plan
        expect(
          response.data.some((p) => p.id === activeSearchablePlan.id),
        ).toBe(true);

        // Should NOT include the inactive searchable rolling plan
        expect(
          response.data.some((p) => p.id === inactiveSearchablePlan.id),
        ).toBe(false);

        // All results should be active
        expect(response.data.every((p) => p.active === true)).toBe(true);
      });
    });

    describe('ordering and filtering', () => {
      // Test rolling plans for ordering and filtering tests
      const testRollingPlans: RollingPlan[] = [];

      beforeAll(async () => {
        // Create test rolling plans with different properties
        const plans = [
          {
            entity: createUniqueEntity({
              baseName: 'Alpha Rolling Plan',
              suiteId: testData.suiteId,
            }),
            operationType: 'continuous' as const,
            active: true,
          },
          {
            entity: createUniqueEntity({
              baseName: 'Beta Rolling Plan',
              suiteId: testData.suiteId,
            }),
            operationType: 'specific_days' as const,
            active: false,
          },
          {
            entity: createUniqueEntity({
              baseName: 'Gamma Rolling Plan',
              suiteId: testData.suiteId,
            }),
            operationType: 'continuous' as const,
            active: true,
          },
        ];

        for (const plan of plans) {
          const created = await createTestRollingPlan(
            testData,
            plan.entity.name,
            plan.operationType,
            { active: plan.active },
          );
          testRollingPlans.push(created);
        }
      });

      test('should order rolling plans by name descending', async () => {
        const response = await listRollingPlans({
          orderBy: [{ field: 'name', direction: 'desc' }],
        });

        const names = response.data.map((p) => p.name);
        // Check if names are in descending order
        for (let i = 0; i < names.length - 1; i++) {
          expect(names[i] >= names[i + 1]).toBe(true);
        }
      });

      test('should filter rolling plans by active status', async () => {
        const response = await listRollingPlans({
          filters: { active: true },
        });

        // All returned rolling plans should be active
        expect(response.data.every((p) => p.active === true)).toBe(true);
        // Should include our active test rolling plans
        const activeTestPlanIds = testRollingPlans
          .filter((p) => p.active)
          .map((p) => p.id);

        for (const id of activeTestPlanIds) {
          expect(response.data.some((p) => p.id === id)).toBe(true);
        }
      });

      test('should combine ordering and filtering in paginated results', async () => {
        const response = await listRollingPlansPaginated({
          filters: { active: true },
          orderBy: [{ field: 'name', direction: 'asc' }],
          page: 1,
          pageSize: 10,
        });

        // Check filtering
        expect(response.data.every((p) => p.active === true)).toBe(true);

        // Check ordering (ascending)
        const names = response.data.map((p) => p.name);
        for (let i = 0; i < names.length - 1; i++) {
          expect(names[i] <= names[i + 1]).toBe(true);
        }

        // Check pagination properties
        expect(response.pagination).toBeDefined();
        expect(response.pagination.currentPage).toBe(1);
        expect(response.pagination.pageSize).toBe(10);
      });

      test('should allow multi-field ordering', async () => {
        // Create rolling plans with same active status but different names
        const sameActiveStatusPlans = [
          {
            entity: createUniqueEntity({
              baseName: 'Same Status A',
              suiteId: testData.suiteId,
            }),
            operationType: 'continuous' as const,
            active: true,
          },
          {
            entity: createUniqueEntity({
              baseName: 'Same Status B',
              suiteId: testData.suiteId,
            }),
            operationType: 'continuous' as const,
            active: true,
          },
        ];

        const createdPlans: RollingPlan[] = [];

        for (const plan of sameActiveStatusPlans) {
          const created = await createTestRollingPlan(
            testData,
            plan.entity.name,
            plan.operationType,
            { active: plan.active },
          );
          createdPlans.push(created);
        }

        // Order by active status first, then by name
        const response = await listRollingPlans({
          orderBy: [
            { field: 'active', direction: 'desc' },
            { field: 'name', direction: 'asc' },
          ],
        });

        // Get all active rolling plans and verify they're ordered by name
        const activePlans = response.data.filter((p) => p.active === true);
        const activeNames = activePlans.map((p) => p.name);

        for (let i = 0; i < activeNames.length - 1; i++) {
          if (activePlans[i].active === activePlans[i + 1].active) {
            // If active status is the same, names should be in ascending order
            expect(activeNames[i] <= activeNames[i + 1]).toBe(true);
          }
        }
      });
    });
  });
});
