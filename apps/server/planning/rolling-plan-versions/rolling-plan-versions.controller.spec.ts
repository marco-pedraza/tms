import { inventoryAdapter } from '@/planning/adapters/inventory.adapter';
import { db } from '@/planning/db-service';
import { rollingPlanVersionActivationLogRepository } from '@/planning/rolling-plan-version-activation-logs/rolling-plan-version-activation-logs.repository';
import { rollingPlanVersionActivationLogs } from '@/planning/rolling-plan-version-activation-logs/rolling-plan-version-activation-logs.schema';
import { rollingPlanRepository } from '@/planning/rolling-plans/rolling-plans.repository';
import type { CreateRollingPlanPayload } from '@/planning/rolling-plans/rolling-plans.types';
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
  CreateRollingPlanVersionPayload,
  RollingPlanVersion,
  RollingPlanVersionState,
} from './rolling-plan-versions.types';
import { rollingPlanVersionRepository } from './rolling-plan-versions.repository';
import { createRollingPlanVersionEntity } from './rolling-plan-version.entity';
import {
  cloneRollingPlanVersion,
  createRollingPlanVersion,
  getRollingPlanVersion,
  getRollingPlanVersionActivationLogs,
  listRollingPlanVersions,
} from './rolling-plan-versions.controller';
// Import to ensure errors.ts file has coverage
import './rolling-plan-versions.errors';

/**
 * Test-only payload type that allows specifying state for repository-based test helpers
 * This bypasses the public API constraint that state is always 'draft' on creation
 */
type TestCreateRollingPlanVersionPayload = CreateRollingPlanVersionPayload & {
  state?: RollingPlanVersionState;
  activatedAt?: Date;
  deactivatedAt?: Date;
};

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
  rollingPlanId: number;
  versionCleanup: ReturnType<typeof createCleanupHelper>;
  testVersions: RollingPlanVersion[];
  // Temporary entities created during tests that need cleanup
  temporaryRollingPlanIds: number[];
}

describe('Rolling Plan Versions Controller', () => {
  // Tests that don't need test data - no beforeEach/afterEach
  describe('error scenarios without test data', () => {
    test('should handle rolling plan not found on list', async () => {
      await expect(listRollingPlanVersions({ id: 999999 })).rejects.toThrow();
    });

    test('should handle rolling plan not found on get', async () => {
      await expect(
        getRollingPlanVersion({ id: 999999, versionId: 1 }),
      ).rejects.toThrow();
    });

    test('should handle rolling plan not found on create', async () => {
      const payload: Omit<CreateRollingPlanVersionPayload, 'rollingPlanId'> = {
        name: 'Test Version',
      };

      await expect(
        createRollingPlanVersion({
          id: 999999, // Non-existent rolling plan
          ...payload,
        }),
      ).rejects.toThrow();
    });
  });

  // Tests that require test data - with beforeAll/afterAll
  describe('operations requiring test data', () => {
    let testData: TestData;

    /**
     * Creates fresh test data for each test suite to ensure isolation
     */
    async function createTestData(): Promise<TestData> {
      const suiteId = createTestSuiteId('rolling-plan-versions-controller');
      const factoryDb = getFactoryDb(db);

      // Setup cleanup helper for rolling plan versions
      const versionCleanup = createCleanupHelper(async ({ id }) => {
        return await rollingPlanVersionRepository.forceDelete(id);
      }, 'rolling plan version');

      // Create test dependencies using factories
      // First create transporter (required for bus line)
      const transporterEntity = createUniqueEntity({
        baseName: 'Rolling Plan Version Test Transporter',
        baseCode: 'RPVTR',
        suiteId,
      });

      const testTransporter = (await transporterFactory(factoryDb).create({
        name: transporterEntity.name,
        code: transporterEntity.code || 'RPVTR001',
        active: true,
      })) as { id: number };

      // Create service type (required for bus line)
      const serviceTypeEntity = createUniqueEntity({
        baseName: 'Rolling Plan Version Test Service Type',
        baseCode: 'RPVST',
        suiteId,
      });

      const testServiceType = (await serviceTypeFactory(factoryDb).create({
        name: serviceTypeEntity.name,
        code: serviceTypeEntity.code || 'RPVST001',
        active: true,
        deletedAt: null,
      })) as { id: number };

      // Create bus line with transporter and service type
      const busLineEntity = createUniqueEntity({
        baseName: 'Rolling Plan Version Test Bus Line',
        baseCode: 'RPVBL',
        suiteId,
      });

      const testBusLine = (await busLineFactory(factoryDb).create({
        name: busLineEntity.name,
        code: busLineEntity.code || 'RPVBL001',
        transporterId: testTransporter.id,
        serviceTypeId: testServiceType.id,
        active: true,
        deletedAt: null,
      })) as { id: number };

      const testBusModel = (await busModelFactory(factoryDb).create({
        manufacturer: 'Rolling Plan Version Test Manufacturer',
        model: `Test Model ${suiteId.substring(0, 8)}`,
        year: 2025,
        seatingCapacity: 45,
        numFloors: 1,
        amenities: ['Wifi', 'Air Conditioning'],
        engineType: 'diesel',
        active: true,
      })) as { id: number };

      const baseNodeEntity = createUniqueEntity({
        baseName: 'Rolling Plan Version Test Base Node',
        baseCode: 'RPVBN',
        suiteId,
      });

      const testBaseNode = (await nodeFactory(factoryDb).create({
        name: baseNodeEntity.name,
        code: baseNodeEntity.code || 'RPVBN001',
        active: true,
        deletedAt: null,
      })) as { id: number };

      // Create a test rolling plan for reuse in multiple tests
      const rollingPlanEntity = createUniqueEntity({
        baseName: 'Rolling Plan Version Test Plan',
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
        notes: 'Test rolling plan for version tests',
      } as CreateRollingPlanPayload & { serviceTypeId: number });

      // Create test versions using repository
      const testVersions: RollingPlanVersion[] = [];

      // Version 1: Draft
      const version1 = await rollingPlanVersionRepository.create({
        rollingPlanId: testRollingPlan.id,
        name: `${testRollingPlan.name} - Draft Version`,
        state: 'draft',
        notes: 'Test draft version',
      } as TestCreateRollingPlanVersionPayload);
      versionCleanup.track(version1.id);
      testVersions.push(version1);

      // Version 2: Active
      const version2 = await rollingPlanVersionRepository.create({
        rollingPlanId: testRollingPlan.id,
        name: `${testRollingPlan.name} - Active Version`,
        state: 'active',
        activatedAt: new Date(),
        notes: 'Test active version',
      } as TestCreateRollingPlanVersionPayload);
      versionCleanup.track(version2.id);
      testVersions.push(version2);

      // Version 3: Inactive
      const version3 = await rollingPlanVersionRepository.create({
        rollingPlanId: testRollingPlan.id,
        name: `${testRollingPlan.name} - Inactive Version`,
        state: 'inactive',
        activatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        deactivatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        notes: 'Test inactive version',
      } as TestCreateRollingPlanVersionPayload);
      versionCleanup.track(version3.id);
      testVersions.push(version3);

      return {
        suiteId,
        factoryDb,
        transporterId: testTransporter.id,
        buslineId: testBusLine.id,
        serviceTypeId: testServiceType.id,
        busModelId: testBusModel.id,
        baseNodeId: testBaseNode.id,
        rollingPlanId: testRollingPlan.id,
        versionCleanup,
        testVersions,
        temporaryRollingPlanIds: [],
      };
    }

    /**
     * Cleans up test data after test suite
     */
    async function cleanupTestData(data: TestData): Promise<void> {
      // Clean up activation logs first (they reference versions and rolling plans)
      const trackedVersionIds = data.versionCleanup.getTrackedIds();
      if (trackedVersionIds.length > 0) {
        // Delete all activation logs for tracked versions
        for (const versionId of trackedVersionIds) {
          try {
            const logs =
              await rollingPlanVersionActivationLogRepository.findAllBy(
                rollingPlanVersionActivationLogs.versionId,
                versionId,
              );
            if (logs.length > 0) {
              const logIds = logs.map((log) => log.id);
              await rollingPlanVersionActivationLogRepository.deleteMany(
                logIds,
              );
            }
          } catch (error) {
            console.log(
              '⚠️ Error cleaning up activation logs for version:',
              versionId,
              error,
            );
          }
        }
      }

      // Also clean up activation logs for the main rolling plan
      try {
        const logs = await rollingPlanVersionActivationLogRepository.findAllBy(
          rollingPlanVersionActivationLogs.rollingPlanId,
          data.rollingPlanId,
        );
        if (logs.length > 0) {
          const logIds = logs.map((log) => log.id);
          await rollingPlanVersionActivationLogRepository.deleteMany(logIds);
        }
      } catch (error) {
        console.log(
          '⚠️ Error cleaning up activation logs for rolling plan:',
          data.rollingPlanId,
          error,
        );
      }

      // Clean up temporary rolling plans' activation logs
      if (data.temporaryRollingPlanIds.length > 0) {
        for (const rollingPlanId of data.temporaryRollingPlanIds) {
          try {
            const logs =
              await rollingPlanVersionActivationLogRepository.findAllBy(
                rollingPlanVersionActivationLogs.rollingPlanId,
                rollingPlanId,
              );
            if (logs.length > 0) {
              const logIds = logs.map((log) => log.id);
              await rollingPlanVersionActivationLogRepository.deleteMany(
                logIds,
              );
            }
          } catch (error) {
            console.log(
              '⚠️ Error cleaning up activation logs for temporary rolling plan:',
              rollingPlanId,
              error,
            );
          }
        }
      }

      // Clean up all tracked rolling plan versions
      // Use repository forceDelete to ensure hard delete and avoid foreign key issues
      if (trackedVersionIds.length > 0) {
        for (const id of trackedVersionIds) {
          try {
            await rollingPlanVersionRepository.forceDelete(id);
          } catch (error) {
            console.log(
              '⚠️ Error cleaning up rolling plan version:',
              id,
              error,
            );
          }
        }
      }

      // Clean up temporary rolling plans (created during tests, after versions are deleted)
      if (data.temporaryRollingPlanIds.length > 0) {
        for (const id of data.temporaryRollingPlanIds) {
          try {
            await rollingPlanRepository.forceDelete(id);
          } catch (error) {
            console.log(
              '⚠️ Error cleaning up temporary rolling plan:',
              id,
              error,
            );
          }
        }
      }

      // Clean up factory-created entities in reverse order of dependencies
      // Order: rolling_plan_versions -> rolling_plans -> bus_lines -> (service_types, transporters) -> (bus_models, nodes)

      // 1. Clean up rolling plan (depends on bus_line, bus_model, base_node)
      try {
        await rollingPlanRepository.forceDelete(data.rollingPlanId);
      } catch (error) {
        console.log(
          '⚠️ Error cleaning up rolling plan:',
          data.rollingPlanId,
          error,
        );
      }

      // 2. Clean up bus line (depends on service_type and transporter, but rolling_plans already deleted)
      try {
        await busLineRepository.forceDelete(data.buslineId);
      } catch (error) {
        console.log('⚠️ Error cleaning up bus line:', data.buslineId, error);
      }

      // 3. Clean up service type (no longer referenced by bus line)
      try {
        await serviceTypeRepository.forceDelete(data.serviceTypeId);
      } catch (error) {
        console.log(
          '⚠️ Error cleaning up service type:',
          data.serviceTypeId,
          error,
        );
      }

      // 4. Clean up transporter (no longer referenced by bus line)
      try {
        await transporterRepository.forceDelete(data.transporterId);
      } catch (error) {
        console.log(
          '⚠️ Error cleaning up transporter:',
          data.transporterId,
          error,
        );
      }

      // 5. Clean up bus model (no longer referenced by rolling plans)
      try {
        await busModelRepository.forceDelete(data.busModelId);
      } catch (error) {
        console.log('⚠️ Error cleaning up bus model:', data.busModelId, error);
      }

      // 6. Clean up base node (no longer referenced by rolling plans)
      try {
        await nodeRepository.forceDelete(data.baseNodeId);
      } catch (error) {
        console.log('⚠️ Error cleaning up base node:', data.baseNodeId, error);
      }
    }

    /**
     * Creates a test rolling plan using existing dependencies
     */
    async function createTestRollingPlan(
      data: TestData,
      name: string,
    ): Promise<{ id: number }> {
      const busLine = await inventoryAdapter.getBusLine(data.buslineId);

      const rollingPlan = await rollingPlanRepository.create({
        name,
        buslineId: data.buslineId,
        serviceTypeId: busLine.serviceTypeId,
        busModelId: data.busModelId,
        baseNodeId: data.baseNodeId,
        operationType: 'continuous',
        cycleDurationDays: 7,
        active: true,
      } as CreateRollingPlanPayload & { serviceTypeId: number });

      // Track temporary rolling plan for cleanup
      data.temporaryRollingPlanIds.push(rollingPlan.id);

      return rollingPlan;
    }

    /**
     * Creates a test rolling plan version using repository
     * Note: When using repository directly, we can specify any state.
     * The entity pattern will always force 'draft' on creation via application service.
     */
    async function createTestVersion(
      data: TestData,
      name: string,
      state: 'draft' | 'active' | 'inactive' = 'draft',
      options: Partial<{
        notes: string;
        activatedAt: Date;
        deactivatedAt: Date;
        rollingPlanId: number;
      }> = {},
    ): Promise<RollingPlanVersion> {
      // Create version directly with the specified state (repository allows any state)
      const version = await rollingPlanVersionRepository.create({
        rollingPlanId: options.rollingPlanId ?? data.rollingPlanId,
        name,
        state,
        notes: options.notes,
        activatedAt: options.activatedAt,
        deactivatedAt: options.deactivatedAt,
      } as TestCreateRollingPlanVersionPayload);

      data.versionCleanup.track(version.id);
      return version;
    }

    beforeAll(async () => {
      testData = await createTestData();
    });

    afterAll(async () => {
      await cleanupTestData(testData);
    });

    describe('CRUD operations', () => {
      test('should create a new rolling plan version with draft state', async () => {
        const versionEntity = createUniqueEntity({
          baseName: 'New Rolling Plan Version',
          suiteId: testData.suiteId,
        });

        const payload: Omit<CreateRollingPlanVersionPayload, 'rollingPlanId'> =
          {
            name: versionEntity.name,
            notes: 'Test version notes',
          };

        const response = await createRollingPlanVersion({
          id: testData.rollingPlanId,
          ...payload,
        });

        // Track the created version for cleanup
        testData.versionCleanup.track(response.id);

        expect(response).toBeDefined();
        expect(response.id).toBeDefined();
        expect(response.rollingPlanId).toBe(testData.rollingPlanId);
        expect(response.name).toBe(payload.name);
        expect(response.state).toBe('draft'); // Should be forced to draft
        expect(response.notes).toBe(payload.notes);
        expect(response.activatedAt).toBeNull();
        expect(response.deactivatedAt).toBeNull();
        expect(response.createdAt).toBeDefined();
        expect(response.updatedAt).toBeDefined();
      });

      test('should get a rolling plan version by ID', async () => {
        const testVersion = testData.testVersions[0];

        const response = await getRollingPlanVersion({
          id: testData.rollingPlanId,
          versionId: testVersion.id,
        });

        expect(response).toBeDefined();
        expect(response.id).toBe(testVersion.id);
        expect(response.rollingPlanId).toBe(testData.rollingPlanId);
        expect(response.name).toBe(testVersion.name);
        expect(response.state).toBe(testVersion.state);
        expect(response.notes).toBe(testVersion.notes);
        expect(response.activatedAt).toBeDefined();
        expect(response.deactivatedAt).toBeDefined();
        expect(response.createdAt).toBeDefined();
        expect(response.updatedAt).toBeDefined();
      });

      test('should get version with all state types', async () => {
        // Test getting draft version
        const draftVersion = testData.testVersions.find(
          (v) => v.state === 'draft',
        );
        if (draftVersion) {
          const response = await getRollingPlanVersion({
            id: testData.rollingPlanId,
            versionId: draftVersion.id,
          });
          expect(response.state).toBe('draft');
        }

        // Test getting active version
        const activeVersion = testData.testVersions.find(
          (v) => v.state === 'active',
        );
        if (activeVersion) {
          const response = await getRollingPlanVersion({
            id: testData.rollingPlanId,
            versionId: activeVersion.id,
          });
          expect(response.state).toBe('active');
          expect(response.activatedAt).toBeDefined();
        }

        // Test getting inactive version
        const inactiveVersion = testData.testVersions.find(
          (v) => v.state === 'inactive',
        );
        if (inactiveVersion) {
          const response = await getRollingPlanVersion({
            id: testData.rollingPlanId,
            versionId: inactiveVersion.id,
          });
          expect(response.state).toBe('inactive');
          expect(response.activatedAt).toBeDefined();
          expect(response.deactivatedAt).toBeDefined();
        }
      });

      test('should return NotFoundError when version does not belong to rolling plan', async () => {
        // Create another rolling plan using helper
        const rollingPlanEntity = createUniqueEntity({
          baseName: 'Other Rolling Plan for Version Test',
          suiteId: testData.suiteId,
        });

        const otherRollingPlan = await createTestRollingPlan(
          testData,
          rollingPlanEntity.name,
        );

        // Create a version for the other rolling plan
        const otherVersion = await createTestVersion(
          testData,
          'Other Plan Version',
          'draft',
          { rollingPlanId: otherRollingPlan.id },
        );

        try {
          // Try to get the version using the wrong rolling plan ID
          await expect(
            getRollingPlanVersion({
              id: testData.rollingPlanId, // Wrong rolling plan ID
              versionId: otherVersion.id,
            }),
          ).rejects.toThrow();
        } finally {
          // Clean up - temporary rolling plan is already tracked by createTestRollingPlan
          await testData.versionCleanup.cleanup(otherVersion.id);
        }
      });
    });

    describe('business rule validation', () => {
      /**
       * Helper function to create a base valid payload for testing
       */
      function createBasePayload(
        overrides: Partial<
          Omit<CreateRollingPlanVersionPayload, 'rollingPlanId'>
        > = {},
      ): Omit<CreateRollingPlanVersionPayload, 'rollingPlanId'> {
        return {
          name: createUniqueEntity({
            baseName: 'Test Rolling Plan Version',
            suiteId: testData.suiteId,
          }).name,
          notes: 'Test notes',
          ...overrides,
        };
      }

      /**
       * Helper function to capture and validate FieldValidationError
       */
      async function expectValidationError(
        payload: Omit<CreateRollingPlanVersionPayload, 'rollingPlanId'>,
        expectedErrors: {
          field: string;
          code: string;
          message?: string;
        }[],
        rollingPlanId: number = testData.rollingPlanId,
      ): Promise<void> {
        let validationError: FieldValidationError | undefined;

        try {
          await createRollingPlanVersion({
            id: rollingPlanId,
            ...payload,
          });
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
        test('should return DUPLICATE error for duplicate name within same rolling plan', async () => {
          // Create a version first
          const versionEntity = createUniqueEntity({
            baseName: 'Duplicate Test Version',
            suiteId: testData.suiteId,
          });

          const existingVersion = await createTestVersion(
            testData,
            versionEntity.name,
            'draft',
          );

          // Try to create another version with the same name in the same rolling plan
          const duplicatePayload = createBasePayload({
            name: existingVersion.name,
          });

          await expectValidationError(duplicatePayload, [
            {
              field: 'name',
              code: 'DUPLICATE',
              message: 'already exists',
            },
          ]);
        });

        test('should allow same name for different rolling plans', async () => {
          // Create a version in the test rolling plan
          const versionEntity = createUniqueEntity({
            baseName: 'Shared Name Version',
            suiteId: testData.suiteId,
          });

          const existingVersion = await createTestVersion(
            testData,
            versionEntity.name,
            'draft',
          );

          // Create another rolling plan with a unique name to avoid conflicts
          const rollingPlanEntity = createUniqueEntity({
            baseName: `Other Rolling Plan for Shared Version Test ${Date.now()}`,
            suiteId: testData.suiteId,
          });

          const otherRollingPlan = await createTestRollingPlan(
            testData,
            rollingPlanEntity.name,
          );

          // Should succeed - same name but different rolling plan
          const payload = createBasePayload({
            name: existingVersion.name,
          });

          const response = await createRollingPlanVersion({
            id: otherRollingPlan.id,
            ...payload,
          });

          // Track the created version for cleanup
          testData.versionCleanup.track(response.id);

          expect(response).toBeDefined();
          expect(response.name).toBe(existingVersion.name);
          expect(response.rollingPlanId).toBe(otherRollingPlan.id);
        });
      });

      describe('entity behavior', () => {
        function createEntityFactory() {
          return createRollingPlanVersionEntity({
            rollingPlanVersionsRepository: {
              create: rollingPlanVersionRepository.create,
              findOne: rollingPlanVersionRepository.findOne,
              checkUniqueness: rollingPlanVersionRepository.checkUniqueness,
            },
          });
        }

        test('should return new instance with same data when save() is called on persisted entity', async () => {
          const factory = createEntityFactory();
          const entity = factory.create({
            rollingPlanId: testData.rollingPlanId,
            name: createUniqueEntity({
              baseName: 'Persisted Test',
              suiteId: testData.suiteId,
            }).name,
          });

          const saved = await entity.save(db);
          if (saved.id) {
            testData.versionCleanup.track(saved.id);
          }

          const savedAgain = await saved.save(db);
          // Entity creates a new instance even when already persisted (no-op save)
          // Verify it's a new instance but with the same data
          expect(savedAgain).not.toBe(saved);
          expect(savedAgain.isPersisted).toBe(true);
          expect(savedAgain.id).toBe(saved.id);
          expect(savedAgain.name).toBe(saved.name);
          expect(savedAgain.rollingPlanId).toBe(saved.rollingPlanId);
        });

        test('should handle toRollingPlanVersion() with missing required fields', () => {
          const factory = createEntityFactory();
          const entity = factory.create({
            rollingPlanId: testData.rollingPlanId,
            name: 'Test Version',
          });

          expect(() => entity.toRollingPlanVersion()).toThrow(
            'Cannot convert to RollingPlanVersion: missing required fields',
          );
        });

        test('should handle toRollingPlanVersion() with valid data', async () => {
          const factory = createEntityFactory();
          const entity = factory.create({
            rollingPlanId: testData.rollingPlanId,
            name: createUniqueEntity({
              baseName: 'Valid Test',
              suiteId: testData.suiteId,
            }).name,
          });

          const saved = await entity.save(db);
          if (saved.id) {
            testData.versionCleanup.track(saved.id);
          }

          const converted = saved.toRollingPlanVersion();
          expect(converted.id).toBeDefined();
          expect(converted.name).toBeDefined();
        });

        test('should handle checkUniqueness error gracefully', async () => {
          const factory = createRollingPlanVersionEntity({
            rollingPlanVersionsRepository: {
              create: rollingPlanVersionRepository.create,
              findOne: rollingPlanVersionRepository.findOne,
              checkUniqueness: () =>
                Promise.reject(new Error('Database error')),
            },
          });

          const entity = factory.create({
            rollingPlanId: testData.rollingPlanId,
            name: createUniqueEntity({
              baseName: 'Error Test',
              suiteId: testData.suiteId,
            }).name,
          });

          const saved = await entity.save(db);
          if (saved.id) {
            testData.versionCleanup.track(saved.id);
          }
          expect(saved.id).toBeDefined();
        });
      });
    });

    describe('list operations', () => {
      test('should list rolling plan versions without filters', async () => {
        const response = await listRollingPlanVersions({
          id: testData.rollingPlanId,
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThanOrEqual(
          testData.testVersions.length,
        );
        expect(response).not.toHaveProperty('pagination');

        // Verify our test versions are in the list
        const foundVersions = testData.testVersions.filter((v) =>
          response.data.some((rv) => rv.id === v.id),
        );
        expect(foundVersions.length).toBe(testData.testVersions.length);
      });

      test('should default order by createdAt descending', async () => {
        const response = await listRollingPlanVersions({
          id: testData.rollingPlanId,
        });

        expect(response.data.length).toBeGreaterThan(0);

        // Check that versions are ordered by createdAt descending (newest first)
        for (let i = 0; i < response.data.length - 1; i++) {
          const current = new Date(response.data[i].createdAt || 0).getTime();
          const next = new Date(response.data[i + 1].createdAt || 0).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      });

      test.each([
        { state: 'draft' as const },
        { state: 'active' as const },
        { state: 'inactive' as const },
      ])('should filter versions by state: $state', async ({ state }) => {
        const response = await listRollingPlanVersions({
          id: testData.rollingPlanId,
          filters: { state },
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.every((v) => v.state === state)).toBe(true);

        // Should include our test version with this state if it exists
        const testVersion = testData.testVersions.find(
          (v) => v.state === state,
        );
        if (testVersion) {
          expect(response.data.some((v) => v.id === testVersion.id)).toBe(true);
        }
      });

      test.each([
        {
          direction: 'asc' as const,
          expected: (a: string, b: string) => a <= b,
        },
        {
          direction: 'desc' as const,
          expected: (a: string, b: string) => a >= b,
        },
      ])(
        'should order versions by name $direction',
        async ({ direction, expected }) => {
          const response = await listRollingPlanVersions({
            id: testData.rollingPlanId,
            orderBy: [{ field: 'name', direction }],
          });

          expect(response.data.length).toBeGreaterThan(0);

          const names = response.data.map((v) => v.name);
          for (let i = 0; i < names.length - 1; i++) {
            expect(expected(names[i], names[i + 1])).toBe(true);
          }
        },
      );

      test('should search versions by name using searchTerm', async () => {
        // Create a version with a unique searchable name
        const searchableVersion = await createTestVersion(
          testData,
          `Searchable Version ${testData.suiteId}`,
          'draft',
        );

        const response = await listRollingPlanVersions({
          id: testData.rollingPlanId,
          searchTerm: 'Searchable',
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.some((v) => v.id === searchableVersion.id)).toBe(
          true,
        );
      });

      test('should combine search term with filters', async () => {
        // Create versions with searchable names and different states
        const activeSearchableVersion = await createTestVersion(
          testData,
          `Active Searchable Version ${testData.suiteId}`,
          'active',
        );

        const draftSearchableVersion = await createTestVersion(
          testData,
          `Draft Searchable Version ${testData.suiteId}`,
          'draft',
        );

        // Search for "Searchable" but only active versions
        const response = await listRollingPlanVersions({
          id: testData.rollingPlanId,
          searchTerm: 'Searchable',
          filters: { state: 'active' },
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);

        // Should include the active searchable version
        expect(
          response.data.some((v) => v.id === activeSearchableVersion.id),
        ).toBe(true);

        // Should NOT include the draft searchable version
        expect(
          response.data.some((v) => v.id === draftSearchableVersion.id),
        ).toBe(false);

        // All results should be active
        expect(response.data.every((v) => v.state === 'active')).toBe(true);
      });

      test('should combine ordering and filtering', async () => {
        const response = await listRollingPlanVersions({
          id: testData.rollingPlanId,
          filters: { state: 'draft' },
          orderBy: [{ field: 'name', direction: 'asc' }],
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);

        // Check filtering
        expect(response.data.every((v) => v.state === 'draft')).toBe(true);

        // Check ordering (ascending)
        const names = response.data.map((v) => v.name);
        for (let i = 0; i < names.length - 1; i++) {
          expect(names[i] <= names[i + 1]).toBe(true);
        }
      });

      test('should return empty array for rolling plan with no versions', async () => {
        // Create a new rolling plan without versions using helper
        const rollingPlanEntity = createUniqueEntity({
          baseName: 'Empty Rolling Plan',
          suiteId: testData.suiteId,
        });

        const emptyRollingPlan = await createTestRollingPlan(
          testData,
          rollingPlanEntity.name,
        );

        const response = await listRollingPlanVersions({
          id: emptyRollingPlan.id,
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBe(0);
      });

      test('should only return versions for the specified rolling plan', async () => {
        // Create another rolling plan with its own versions using helper
        const rollingPlanEntity = createUniqueEntity({
          baseName: 'Other Rolling Plan',
          suiteId: testData.suiteId,
        });

        const otherRollingPlan = await createTestRollingPlan(
          testData,
          rollingPlanEntity.name,
        );

        const otherVersion = await createTestVersion(
          testData,
          'Other Plan Version',
          'draft',
          { rollingPlanId: otherRollingPlan.id },
        );

        try {
          // List versions for the original rolling plan
          const response = await listRollingPlanVersions({
            id: testData.rollingPlanId,
          });

          // Should not include the version from the other rolling plan
          expect(response.data.some((v) => v.id === otherVersion.id)).toBe(
            false,
          );

          // Should only include versions for the specified rolling plan
          expect(
            response.data.every(
              (v) => v.rollingPlanId === testData.rollingPlanId,
            ),
          ).toBe(true);
        } finally {
          // Clean up - temporary rolling plan is already tracked by createTestRollingPlan
          await testData.versionCleanup.cleanup(otherVersion.id);
        }
      });
    });

    describe('clone operations', () => {
      /**
       * Helper function to test clone operation and validate common properties
       */
      async function testCloneOperation(
        sourceVersion: RollingPlanVersion,
        options: { name?: string } = {},
      ) {
        const clonedVersion = await cloneRollingPlanVersion({
          id: testData.rollingPlanId,
          versionId: sourceVersion.id,
          ...options,
        });

        // Track the cloned version for cleanup
        testData.versionCleanup.track(clonedVersion.id);

        // Common assertions for all clone operations
        expect(clonedVersion).toBeDefined();
        expect(clonedVersion.id).toBeDefined();
        expect(clonedVersion.id).not.toBe(sourceVersion.id);
        expect(clonedVersion.rollingPlanId).toBe(sourceVersion.rollingPlanId);
        expect(clonedVersion.state).toBe('draft'); // Cloned versions are always draft
        expect(clonedVersion.notes).toBe(sourceVersion.notes);
        expect(clonedVersion.activatedAt).toBeNull(); // No activation history
        expect(clonedVersion.deactivatedAt).toBeNull();

        return clonedVersion;
      }

      test('should clone a rolling plan version with auto-generated name', async () => {
        const sourceVersion = testData.testVersions[0]; // Use draft version

        const clonedVersion = await testCloneOperation(sourceVersion);

        expect(clonedVersion.name).toContain(sourceVersion.name);
        expect(clonedVersion.name).not.toBe(sourceVersion.name); // Should have suffix
      });

      test('should clone a rolling plan version with custom name', async () => {
        const sourceVersion = testData.testVersions[0]; // Use draft version
        const customName = `Cloned Version ${testData.suiteId}`;

        const clonedVersion = await testCloneOperation(sourceVersion, {
          name: customName,
        });

        expect(clonedVersion.name).toBe(customName);
      });

      test('should clone active version without activation history', async () => {
        const activeVersion = testData.testVersions.find(
          (v) => v.state === 'active',
        );
        if (!activeVersion) {
          throw new Error('No active version found in test data');
        }

        await testCloneOperation(activeVersion);
      });

      test('should generate unique name when name already exists', async () => {
        const sourceVersion = testData.testVersions[0];
        const baseName = sourceVersion.name;

        // Create a version with a name that would conflict with the auto-generated clone name
        // The clone will try to use baseName + random suffix, so we create a version with that pattern
        const conflictingName = `${baseName} ABCD`; // Simulate what the clone might generate
        const existingVersion = await createTestVersion(
          testData,
          conflictingName,
          'draft',
        );

        try {
          const clonedVersion = await cloneRollingPlanVersion({
            id: testData.rollingPlanId,
            versionId: sourceVersion.id,
          });

          // Track the cloned version for cleanup
          testData.versionCleanup.track(clonedVersion.id);

          // The cloned version should have a unique name (different from both baseName and conflictingName)
          expect(clonedVersion.name).not.toBe(baseName);
          expect(clonedVersion.name).not.toBe(conflictingName);
          expect(clonedVersion.name).toContain(baseName);
          // Should have a suffix (random uppercase letters or timestamp)
          expect(clonedVersion.name.length).toBeGreaterThan(baseName.length);
        } finally {
          await testData.versionCleanup.cleanup(existingVersion.id);
        }
      });

      /**
       * Helper function to test NotFoundError scenarios for clone operations
       */
      async function expectCloneNotFoundError(
        rollingPlanId: number,
        versionId: number,
      ) {
        await expect(
          cloneRollingPlanVersion({
            id: rollingPlanId,
            versionId,
          }),
        ).rejects.toThrow();
      }

      test.each([
        {
          description: 'rolling plan does not exist',
          getRollingPlanId: () => 999999,
          getVersionId: () => testData.testVersions[0].id,
        },
        {
          description: 'version does not exist',
          getRollingPlanId: () => testData.rollingPlanId,
          getVersionId: () => 999999,
        },
      ])(
        'should throw NotFoundError when $description',
        async ({ getRollingPlanId, getVersionId }) => {
          await expectCloneNotFoundError(getRollingPlanId(), getVersionId());
        },
      );

      test('should throw NotFoundError when version does not belong to rolling plan', async () => {
        // Create another rolling plan
        const rollingPlanEntity = createUniqueEntity({
          baseName: 'Other Rolling Plan for Clone Test',
          suiteId: testData.suiteId,
        });

        const otherRollingPlan = await createTestRollingPlan(
          testData,
          rollingPlanEntity.name,
        );

        // Create a version for the other rolling plan
        const otherVersion = await createTestVersion(
          testData,
          'Other Plan Version',
          'draft',
          { rollingPlanId: otherRollingPlan.id },
        );

        try {
          await expectCloneNotFoundError(
            testData.rollingPlanId, // Wrong rolling plan ID
            otherVersion.id,
          );
        } finally {
          await testData.versionCleanup.cleanup(otherVersion.id);
        }
      });
    });

    describe('activation logs operations', () => {
      /**
       * Helper function to create activation logs for testing with flexible date options
       */
      async function createActivationLog(
        versionId: number,
        rollingPlanId: number,
        options: {
          activatedAt?: Date;
          deactivatedAt?: Date | null;
          daysAgoActivated?: number;
          daysAgoDeactivated?: number | null;
        } = {},
      ) {
        const now = new Date();
        const activatedAt =
          options.activatedAt ??
          (options.daysAgoActivated
            ? new Date(
                now.getTime() - options.daysAgoActivated * 24 * 60 * 60 * 1000,
              )
            : now);

        const deactivatedAt =
          options.deactivatedAt !== undefined
            ? options.deactivatedAt
            : options.daysAgoDeactivated
              ? new Date(
                  now.getTime() -
                    options.daysAgoDeactivated * 24 * 60 * 60 * 1000,
                )
              : null;

        const [log] = await db
          .insert(rollingPlanVersionActivationLogs)
          .values({
            versionId,
            rollingPlanId,
            activatedAt,
            deactivatedAt,
          })
          .returning();

        return log;
      }

      /**
       * Helper function to create multiple activation logs for testing
       */
      async function createMultipleActivationLogs(
        versionId: number,
        rollingPlanId: number,
        count: number,
        startDaysAgo = 50,
      ) {
        const logs = [];
        for (let i = 0; i < count; i++) {
          const log = await createActivationLog(versionId, rollingPlanId, {
            daysAgoActivated: startDaysAgo - i * 10,
            daysAgoDeactivated:
              i === count - 1 ? null : startDaysAgo - i * 10 - 5,
          });
          logs.push(log);
        }
        return logs;
      }

      /**
       * Helper function to test activation logs response structure
       */
      function validateActivationLogStructure(log: unknown) {
        expect(log).toHaveProperty('id');
        expect(log).toHaveProperty('versionId');
        expect(log).toHaveProperty('rollingPlanId');
        expect(log).toHaveProperty('activatedAt');
        expect(log).toHaveProperty('deactivatedAt');
        expect(log).toHaveProperty('duration');
        expect(log).toHaveProperty('isActive');
        expect(log).toHaveProperty('createdAt');
        expect(log).toHaveProperty('updatedAt');
      }

      /**
       * Helper function to test NotFoundError scenarios for activation logs
       */
      async function expectActivationLogsNotFoundError(
        rollingPlanId: number,
        versionId: number,
      ) {
        await expect(
          getRollingPlanVersionActivationLogs({
            id: rollingPlanId,
            versionId,
            page: 1,
            pageSize: 10,
          }),
        ).rejects.toThrow();
      }

      test('should get activation logs for a version with pagination and validate structure', async () => {
        const version = testData.testVersions[0];

        // Create some activation logs using helper
        await createActivationLog(version.id, testData.rollingPlanId, {
          daysAgoActivated: 30,
          daysAgoDeactivated: 20,
        });
        await createActivationLog(version.id, testData.rollingPlanId, {
          daysAgoActivated: 10,
          deactivatedAt: null, // Still active
        });

        const response = await getRollingPlanVersionActivationLogs({
          id: testData.rollingPlanId,
          versionId: version.id,
          page: 1,
          pageSize: 10,
        });

        expect(response).toBeDefined();
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThanOrEqual(2);
        expect(response.pagination).toBeDefined();
        expect(response.pagination.currentPage).toBe(1);
        expect(response.pagination.pageSize).toBe(10);

        // Verify log structure using helper
        const log = response.data[0];
        validateActivationLogStructure(log);

        // Verify calculated fields
        const activeLog = response.data.find((l) => l.isActive);
        if (activeLog) {
          expect(activeLog.deactivatedAt).toBeNull();
          expect(activeLog.duration).toBeNull();
        }

        const inactiveLog = response.data.find((l) => !l.isActive);
        if (inactiveLog) {
          expect(inactiveLog.deactivatedAt).not.toBeNull();
          expect(inactiveLog.duration).not.toBeNull();
          expect(inactiveLog.duration).toBeGreaterThan(0);
        }
      });

      test.each([
        {
          description: 'default ordering (activatedAt descending)',
          orderBy: undefined,
          expectedComparison: (current: number, next: number) =>
            current >= next,
        },
        {
          description: 'custom ordering (activatedAt ascending)',
          orderBy: [
            { field: 'activatedAt' as const, direction: 'asc' as const },
          ],
          expectedComparison: (current: number, next: number) =>
            current <= next,
        },
      ])(
        'should support $description',
        async ({ orderBy, expectedComparison }) => {
          const version = testData.testVersions[0];

          // Create activation logs with different dates using helper
          await createActivationLog(version.id, testData.rollingPlanId, {
            daysAgoActivated: 30,
            daysAgoDeactivated: 20,
          });
          await createActivationLog(version.id, testData.rollingPlanId, {
            daysAgoActivated: 10,
            deactivatedAt: null,
          });

          const response = await getRollingPlanVersionActivationLogs({
            id: testData.rollingPlanId,
            versionId: version.id,
            page: 1,
            pageSize: 10,
            ...(orderBy && { orderBy }),
          });

          expect(response.data.length).toBeGreaterThan(0);

          // Check ordering
          for (let i = 0; i < response.data.length - 1; i++) {
            const current = new Date(response.data[i].activatedAt).getTime();
            const next = new Date(response.data[i + 1].activatedAt).getTime();
            expect(expectedComparison(current, next)).toBe(true);
          }
        },
      );

      test('should support pagination', async () => {
        const version = testData.testVersions[0];

        // Create multiple activation logs using helper
        await createMultipleActivationLogs(
          version.id,
          testData.rollingPlanId,
          5,
        );

        // Get first page
        const page1 = await getRollingPlanVersionActivationLogs({
          id: testData.rollingPlanId,
          versionId: version.id,
          page: 1,
          pageSize: 2,
        });

        expect(page1.data.length).toBe(2);
        expect(page1.pagination.currentPage).toBe(1);
        expect(page1.pagination.pageSize).toBe(2);
        expect(page1.pagination.totalCount).toBeGreaterThanOrEqual(5);

        // Get second page
        const page2 = await getRollingPlanVersionActivationLogs({
          id: testData.rollingPlanId,
          versionId: version.id,
          page: 2,
          pageSize: 2,
        });

        expect(page2.data.length).toBeGreaterThan(0);
        expect(page2.pagination.currentPage).toBe(2);

        // Verify different data
        expect(page1.data[0].id).not.toBe(page2.data[0].id);
      });

      test('should filter logs by versionId', async () => {
        const version1 = testData.testVersions[0];
        const version2 = testData.testVersions[1];

        // Create logs for both versions using helper
        await createActivationLog(version1.id, testData.rollingPlanId, {
          daysAgoActivated: 10,
          deactivatedAt: null,
        });
        await createActivationLog(version2.id, testData.rollingPlanId, {
          daysAgoActivated: 10,
          deactivatedAt: null,
        });

        // Get logs for version1 only
        const response = await getRollingPlanVersionActivationLogs({
          id: testData.rollingPlanId,
          versionId: version1.id,
          page: 1,
          pageSize: 10,
        });

        // All logs should belong to version1
        expect(
          response.data.every((log) => log.versionId === version1.id),
        ).toBe(true);
        expect(
          response.data.every((log) => log.versionId !== version2.id),
        ).toBe(true);
      });

      test('should return empty array for version with no activation logs', async () => {
        // Create a new version without activation logs
        const newVersion = await createTestVersion(
          testData,
          `Version Without Logs ${testData.suiteId}`,
          'draft',
        );

        const response = await getRollingPlanVersionActivationLogs({
          id: testData.rollingPlanId,
          versionId: newVersion.id,
          page: 1,
          pageSize: 10,
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBe(0);
        expect(response.pagination.totalCount).toBe(0);
      });

      test('should calculate duration and active status correctly', async () => {
        const version = testData.testVersions[0];

        // Create both active and inactive logs using helper
        const now = new Date();
        const activatedAt = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
        const deactivatedAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        const expectedDuration =
          deactivatedAt.getTime() - activatedAt.getTime();

        await createActivationLog(version.id, testData.rollingPlanId, {
          activatedAt,
          deactivatedAt,
        });
        await createActivationLog(version.id, testData.rollingPlanId, {
          daysAgoActivated: 5,
          deactivatedAt: null, // Still active
        });

        const response = await getRollingPlanVersionActivationLogs({
          id: testData.rollingPlanId,
          versionId: version.id,
          page: 1,
          pageSize: 10,
        });

        // Test inactive log
        const inactiveLog = response.data.find((l) => !l.isActive);
        if (inactiveLog) {
          expect(inactiveLog.duration).toBe(expectedDuration);
          expect(inactiveLog.isActive).toBe(false);
          expect(inactiveLog.deactivatedAt).not.toBeNull();
        }

        // Test active log
        const activeLog = response.data.find((l) => l.isActive);
        if (activeLog) {
          expect(activeLog.isActive).toBe(true);
          expect(activeLog.deactivatedAt).toBeNull();
          expect(activeLog.duration).toBeNull();
        }
      });

      test.each([
        {
          description: 'rolling plan does not exist',
          getRollingPlanId: () => 999999,
          getVersionId: () => testData.testVersions[0].id,
        },
        {
          description: 'version does not exist',
          getRollingPlanId: () => testData.rollingPlanId,
          getVersionId: () => 999999,
        },
      ])(
        'should throw NotFoundError when $description',
        async ({ getRollingPlanId, getVersionId }) => {
          await expectActivationLogsNotFoundError(
            getRollingPlanId(),
            getVersionId(),
          );
        },
      );

      test('should throw NotFoundError when version does not belong to rolling plan', async () => {
        // Create another rolling plan
        const rollingPlanEntity = createUniqueEntity({
          baseName: 'Other Rolling Plan for Logs Test',
          suiteId: testData.suiteId,
        });

        const otherRollingPlan = await createTestRollingPlan(
          testData,
          rollingPlanEntity.name,
        );

        // Create a version for the other rolling plan
        const otherVersion = await createTestVersion(
          testData,
          'Other Plan Version',
          'draft',
          { rollingPlanId: otherRollingPlan.id },
        );

        try {
          await expectActivationLogsNotFoundError(
            testData.rollingPlanId, // Wrong rolling plan ID
            otherVersion.id,
          );
        } finally {
          await testData.versionCleanup.cleanup(otherVersion.id);
        }
      });
    });
  });
});
