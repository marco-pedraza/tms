import { inventoryAdapter } from '@/planning/adapters/inventory.adapter';
import { db } from '@/planning/db-service';
import { rollingPlanRepository } from '@/planning/rolling-plans/rolling-plans.repository';
import type { CreateRollingPlanPayload } from '@/planning/rolling-plans/rolling-plans.types';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
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
} from './rolling-plan-versions.types';
import { rollingPlanVersionRepository } from './rolling-plan-versions.repository';
import {
  getRollingPlanVersion,
  listRollingPlanVersions,
} from './rolling-plan-versions.controller';

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
      });
      versionCleanup.track(version1.id);
      testVersions.push(version1);

      // Version 2: Active
      const version2 = await rollingPlanVersionRepository.create({
        rollingPlanId: testRollingPlan.id,
        name: `${testRollingPlan.name} - Active Version`,
        state: 'active',
        activatedAt: new Date(),
        notes: 'Test active version',
      });
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
      });
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
      // Clean up all tracked rolling plan versions first
      // Use repository forceDelete to ensure hard delete and avoid foreign key issues
      const trackedVersionIds = data.versionCleanup.getTrackedIds();
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
      const version = await rollingPlanVersionRepository.create({
        rollingPlanId: options.rollingPlanId ?? data.rollingPlanId,
        name,
        state,
        notes: options.notes,
        activatedAt: options.activatedAt,
        deactivatedAt: options.deactivatedAt,
      } as CreateRollingPlanVersionPayload);
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
  });
});
