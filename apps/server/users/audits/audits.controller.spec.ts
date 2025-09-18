import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createDepartment } from '../departments/departments.controller';
import { createUser, deleteUser } from '../users/users.controller';
import { CreateUserPayload } from '../users/users.types';
import { auditsRepository } from './audits.repository';
import { listAuditsPaginated } from './audits.controller';

describe('Audits Controller', () => {
  // Variables to store created test resource IDs
  let testDepartmentId: number;
  let testUserId: number;
  const createdAuditIds: number[] = [];

  // Setup test resources before all tests
  beforeAll(async () => {
    // Create test department
    const department = await createDepartment({
      name: 'Test Department',
      code: 'TEST_DEPT',
      description: 'Department for audit tests',
    });
    testDepartmentId = department.id;

    // Create test user
    const testUser: CreateUserPayload = {
      departmentId: testDepartmentId,
      username: 'testaudituser',
      email: 'testaudit@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Audit',
      phone: '5551234567',
      position: 'Test Position',
      employeeId: 'EMP123',
      isActive: true,
      isSystemAdmin: false,
    };

    const createdUser = await createUser(testUser);
    testUserId = createdUser.id;

    // Create some audit entries for testing
    const auditServices = [
      'authentication',
      'user-management',
      'inventory',
      'settings',
      'reporting',
    ];

    const endpoints = [
      '/api/login',
      '/api/users',
      '/api/inventory/items',
      '/api/settings',
      '/api/reports/generate',
    ];

    for (let i = 0; i < auditServices.length; i++) {
      const auditData = {
        userId: testUserId,
        service: auditServices[i],
        endpoint: endpoints[i],
        details: { event: 'user-activity', service: auditServices[i] },
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      };

      const createdAudit = await auditsRepository.create(auditData);
      createdAuditIds.push(createdAudit.id);
    }
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up audit records first
    for (const auditId of createdAuditIds) {
      try {
        await auditsRepository.delete(auditId);
      } catch (error) {
        console.log(`Error cleaning up audit record ${auditId}:`, error);
      }
    }

    // Clean up test user after audits are deleted
    if (testUserId) {
      try {
        await deleteUser({ id: testUserId });
      } catch (error) {
        console.log('Error cleaning up test user:', error);
      }
    }

    // Note: We don't clean up the department because there might be
    // foreign key constraints in the database preventing deletion.
    // In a real application, you would need a proper cleanup strategy.
  });

  describe('listAuditsPaginated', () => {
    test('should return paginated audits with default settings', async () => {
      // Get paginated audits with default settings
      const response = await listAuditsPaginated({});

      // Assertions
      expect(response).toBeDefined();
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('pagination');
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
      expect(response.pagination.totalCount).toBeGreaterThanOrEqual(5);
    });

    test('should return paginated audits with custom pagination and sorting', async () => {
      // Get paginated audits with custom settings
      const response = await listAuditsPaginated({
        page: 1,
        pageSize: 3,
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
      });

      // Assertions
      expect(response).toBeDefined();
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('pagination');
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeLessThanOrEqual(3); // Should be limited by pageSize
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(3);
      expect(response.pagination.totalCount).toBeGreaterThanOrEqual(5);

      // Verify sorting (most recent first)
      if (response.data.length >= 2) {
        const firstDate = new Date(response.data[0].createdAt);
        const secondDate = new Date(response.data[1].createdAt);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(
          secondDate.getTime(),
        );
      }
    });

    test('should apply filters correctly', async () => {
      // Get paginated audits with filtering by service
      const serviceToFilter = 'reporting';

      const response = await listAuditsPaginated({
        filters: {
          service: serviceToFilter,
        },
      });

      // Assertions
      expect(response).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // All returned audits should have the filtered service
      response.data.forEach((audit) => {
        expect(audit.service).toBe(serviceToFilter);
      });
    });

    test('should filter audits by endpoint', async () => {
      // Get paginated audits with filtering by endpoint
      const endpointToFilter = '/api/login';

      const response = await listAuditsPaginated({
        filters: {
          endpoint: endpointToFilter,
        },
      });

      // Assertions
      expect(response).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // All returned audits should have the filtered endpoint
      response.data.forEach((audit) => {
        expect(audit.endpoint).toBe(endpointToFilter);
      });
    });

    test('should filter audits by user ID', async () => {
      // Get paginated audits with filtering by userId
      const response = await listAuditsPaginated({
        filters: {
          userId: testUserId,
        },
      });

      // Assertions
      expect(response).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // All returned audits should have the specified userId
      response.data.forEach((audit) => {
        expect(audit.userId).toBe(testUserId);
      });
    });
  });
});
