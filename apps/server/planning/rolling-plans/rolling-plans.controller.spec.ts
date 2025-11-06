import { db } from '@/planning/db-service';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { busModelRepository } from '@/inventory/fleet/bus-models/bus-models.repository';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import { busLineRepository } from '@/inventory/operators/bus-lines/bus-lines.repository';
import { serviceTypeRepository } from '@/inventory/operators/service-types/service-types.repository';
import { transporterRepository } from '@/inventory/operators/transporters/transporters.repository';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueName,
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
import { rollingPlanRepository } from './rolling-plans.repository';
import {
  getRollingPlan,
  listRollingPlans,
  listRollingPlansPaginated,
} from './rolling-plans.controller';

describe('Rolling Plans Controller', () => {
  const testSuiteId = createTestSuiteId('rolling-plans-controller');
  const factoryDb = getFactoryDb(db);

  // Setup cleanup helper for rolling plans
  const rollingPlanCleanup = createCleanupHelper(async ({ id }) => {
    return await rollingPlanRepository.forceDelete(id);
  }, 'rolling plan');

  // Test dependencies
  let testTransporter: { id: number };
  let testBusLine: { id: number };
  let testServiceType: { id: number };
  let testBusModel: { id: number };
  let testBaseNode: { id: number };
  let testRollingPlan: RollingPlan;

  const createTestRollingPlan = async (
    name: string,
    operationType: 'continuous' | 'specific_days' = 'continuous',
    options = {},
  ) => {
    const rollingPlan = await rollingPlanRepository.create({
      name,
      buslineId: testBusLine.id,
      serviceTypeId: testServiceType.id,
      busModelId: testBusModel.id,
      baseNodeId: testBaseNode.id,
      operationType,
      cycleDurationDays: operationType === 'continuous' ? 7 : undefined,
      operationDays:
        operationType === 'specific_days' ? { days: [1, 3, 5] } : undefined,
      active: true,
      ...options,
    });
    rollingPlanCleanup.track(rollingPlan.id);
    return rollingPlan;
  };

  beforeAll(async () => {
    // Create test dependencies using factories
    // First create transporter (required for bus line)
    testTransporter = (await transporterFactory(factoryDb).create({
      name: createUniqueName('Test Transporter', testSuiteId),
      code: `TTR${testSuiteId.substring(0, 4)}`,
      active: true,
    })) as { id: number };

    // Create service type (required for bus line)
    testServiceType = (await serviceTypeFactory(factoryDb).create({
      name: createUniqueName('Test Service Type', testSuiteId),
      code: `TST${testSuiteId.substring(0, 4)}`,
      active: true,
      deletedAt: null,
    })) as { id: number };

    // Create bus line with transporter and service type
    testBusLine = (await busLineFactory(factoryDb).create({
      name: createUniqueName('Test Bus Line', testSuiteId),
      code: `TBL${testSuiteId.substring(0, 4)}`,
      transporterId: testTransporter.id,
      serviceTypeId: testServiceType.id,
      active: true,
      deletedAt: null,
    })) as { id: number };

    testBusModel = (await busModelFactory(factoryDb).create({
      manufacturer: 'Test Manufacturer',
      model: 'Test Model',
      year: 2024,
      seatingCapacity: 45,
      numFloors: 1,
      amenities: ['Wifi', 'Air Conditioning'],
      engineType: 'diesel',
      active: true,
    })) as { id: number };

    testBaseNode = (await nodeFactory(factoryDb).create({
      name: createUniqueName('Test Base Node', testSuiteId),
      code: `TBN${testSuiteId.substring(0, 4)}`,
      active: true,
      deletedAt: null,
    })) as { id: number };

    // Create a test rolling plan for reuse in multiple tests
    testRollingPlan = await createTestRollingPlan(
      createUniqueName('Test Rolling Plan', testSuiteId),
      'continuous',
      {
        cycleDurationDays: 7,
        notes: 'Test rolling plan for controller tests',
      },
    );
  });

  afterAll(async () => {
    // Clean up all tracked rolling plans first
    await rollingPlanCleanup.cleanupAll();

    // Clean up factory-created entities in reverse order of dependencies
    // First clean up entities that depend on others, then their dependencies

    // Clean up bus line BEFORE service type and transporter
    // (bus line depends on both service type and transporter)
    if (testBusLine?.id) {
      try {
        await busLineRepository.forceDelete(testBusLine.id);
      } catch (error) {
        console.log('Error cleaning up test bus line:', error);
      }
    }

    // Now clean up service type (no longer referenced by bus line)
    if (testServiceType?.id) {
      try {
        await serviceTypeRepository.forceDelete(testServiceType.id);
      } catch (error) {
        console.log('Error cleaning up test service type:', error);
      }
    }

    // Finally clean up transporter (no longer referenced by bus line)
    if (testTransporter?.id) {
      try {
        await transporterRepository.forceDelete(testTransporter.id);
      } catch (error) {
        console.log('Error cleaning up test transporter:', error);
      }
    }

    // Clean up bus model (no dependencies in this test)
    if (testBusModel?.id) {
      try {
        await busModelRepository.forceDelete(testBusModel.id);
      } catch (error) {
        console.log('Error cleaning up test bus model:', error);
      }
    }

    // Clean up base node (no dependencies in this test)
    if (testBaseNode?.id) {
      try {
        await nodeRepository.forceDelete(testBaseNode.id);
      } catch (error) {
        console.log('Error cleaning up test base node:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should retrieve a rolling plan by ID with relations', async () => {
      const response = await getRollingPlan({ id: testRollingPlan.id });

      expect(response).toBeDefined();
      expect(response.id).toBe(testRollingPlan.id);
      expect(response.name).toBe(testRollingPlan.name);
      expect(response.buslineId).toBe(testRollingPlan.buslineId);
      expect(response.serviceTypeId).toBe(testRollingPlan.serviceTypeId);
      expect(response.busModelId).toBe(testRollingPlan.busModelId);
      expect(response.baseNodeId).toBe(testRollingPlan.baseNodeId);
      expect(response.operationType).toBe(testRollingPlan.operationType);
      expect(response.active).toBe(testRollingPlan.active);

      // Verify relations are included
      expect(response.busline).toBeDefined();
      expect(response.busline.id).toBe(testBusLine.id);
      expect(response.serviceType).toBeDefined();
      expect(response.serviceType.id).toBe(testServiceType.id);
      expect(response.busModel).toBeDefined();
      expect(response.busModel.id).toBe(testBusModel.id);
      expect(response.baseNode).toBeDefined();
      expect(response.baseNode.id).toBe(testBaseNode.id);
    });

    test('should list rolling plans without pagination', async () => {
      const response = await listRollingPlans({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      expect(response).not.toHaveProperty('pagination');

      // Verify our test rolling plan is in the list
      const foundPlan = response.data.find((p) => p.id === testRollingPlan.id);
      expect(foundPlan).toBeDefined();
      expect(foundPlan?.name).toBe(testRollingPlan.name);
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
        expect(firstPlan.serviceType).toBeDefined();
        expect(firstPlan.busModel).toBeDefined();
        expect(firstPlan.baseNode).toBeDefined();
      }
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getRollingPlan({ id: 99999 })).rejects.toThrow();
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
      const planA = await createTestRollingPlan(
        createUniqueName('AAA Test Rolling Plan', testSuiteId),
      );
      const planZ = await createTestRollingPlan(
        createUniqueName('ZZZ Test Rolling Plan', testSuiteId),
      );

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
      const searchablePlan = await createTestRollingPlan(
        createUniqueName('Searchable Test Rolling Plan', testSuiteId),
      );

      // Search for the rolling plan using searchTerm in listRollingPlans
      const response = await listRollingPlans({
        searchTerm: 'Searchable',
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.some((p) => p.id === searchablePlan.id)).toBe(true);
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
      const activeSearchablePlan = await createTestRollingPlan(
        createUniqueName('Active Searchable Rolling Plan', testSuiteId),
        'continuous',
        { active: true },
      );
      const inactiveSearchablePlan = await createTestRollingPlan(
        createUniqueName('Inactive Searchable Rolling Plan', testSuiteId),
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
      expect(response.data.some((p) => p.id === activeSearchablePlan.id)).toBe(
        true,
      );

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
          name: createUniqueName('Alpha Rolling Plan', testSuiteId),
          operationType: 'continuous' as const,
          active: true,
        },
        {
          name: createUniqueName('Beta Rolling Plan', testSuiteId),
          operationType: 'specific_days' as const,
          active: false,
        },
        {
          name: createUniqueName('Gamma Rolling Plan', testSuiteId),
          operationType: 'continuous' as const,
          active: true,
        },
      ];

      for (const plan of plans) {
        const created = await createTestRollingPlan(
          plan.name,
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
          name: createUniqueName('Same Status A', testSuiteId),
          operationType: 'continuous' as const,
          active: true,
        },
        {
          name: createUniqueName('Same Status B', testSuiteId),
          operationType: 'continuous' as const,
          active: true,
        },
      ];

      const createdPlans: RollingPlan[] = [];

      for (const plan of sameActiveStatusPlans) {
        const created = await createTestRollingPlan(
          plan.name,
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

  describe('operation types', () => {
    test('should retrieve rolling plan with continuous operation type', async () => {
      const continuousPlan = await createTestRollingPlan(
        createUniqueName('Continuous Operation Plan', testSuiteId),
        'continuous',
        { cycleDurationDays: 14 },
      );

      const response = await getRollingPlan({ id: continuousPlan.id });

      expect(response.operationType).toBe('continuous');
      expect(response.cycleDurationDays).toBe(14);
      expect(response.operationDays).toBeNull();
    });

    test('should retrieve rolling plan with specific_days operation type', async () => {
      const operationDays = {
        days: [1, 3, 5],
        hours: { start: '08:00', end: '20:00' },
      };
      const specificDaysPlan = await createTestRollingPlan(
        createUniqueName('Specific Days Operation Plan', testSuiteId),
        'specific_days',
        { operationDays },
      );

      const response = await getRollingPlan({ id: specificDaysPlan.id });

      expect(response.operationType).toBe('specific_days');
      expect(response.cycleDurationDays).toBeNull();
      expect(response.operationDays).toBeDefined();
      expect(response.operationDays).toEqual(operationDays);
    });
  });
});
