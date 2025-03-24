import { describe, it, expect, afterAll } from 'vitest';
import {
  createDepartment,
  getDepartment,
  listDepartments,
  listDepartmentsWithPagination,
  listTenantDepartments,
  listTenantDepartmentsWithPagination,
  updateDepartment,
  deleteDepartment,
} from './departments.controller';
import type {
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from './departments.types';
import { createTenant, deleteTenant } from '../tenants/tenants.controller';
import type { CreateTenantPayload } from '../tenants/tenants.types';

describe('Departments Controller', () => {
  // Test data
  let tenantId = 0;
  let departmentId = 0;

  const testTenant: CreateTenantPayload = {
    name: 'Test Tenant',
    code: 'TEST-TENANT-DEPT',
    description: 'A test tenant for department testing',
  };

  const testDepartment: CreateDepartmentPayload = {
    name: 'Test Department',
    code: 'TEST-DEPT',
    description: 'A test department for automated testing',
  };

  // Clean up after all tests
  afterAll(async () => {
    if (departmentId > 0) {
      await deleteDepartment({ id: departmentId });
    }
    if (tenantId > 0) {
      await deleteTenant({ id: tenantId });
    }
  });

  describe('Setup', () => {
    it('should create test tenant', async () => {
      const result = await createTenant(testTenant);
      tenantId = result.id;
      expect(tenantId).toBeGreaterThan(0);
    });
  });

  describe('createDepartment', () => {
    it('should create a new department', async () => {
      const result = await createDepartment({
        ...testDepartment,
        tenantId,
      });

      // Save ID for other tests
      departmentId = result.id;

      // Verify response
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('number');
      expect(result.name).toBe(testDepartment.name);
      expect(result.code).toBe(testDepartment.code);
      expect(result.description).toBe(testDepartment.description);
      expect(result.tenantId).toBe(tenantId);
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should fail to create department with duplicate code in same tenant', async () => {
      await expect(
        createDepartment({
          ...testDepartment,
          tenantId,
        }),
      ).rejects.toThrow();
    });
  });

  describe('getDepartment', () => {
    it('should get an existing department', async () => {
      const result = await getDepartment({ id: departmentId });

      expect(result.id).toBe(departmentId);
      expect(result.name).toBe(testDepartment.name);
      expect(result.code).toBe(testDepartment.code);
      expect(result.description).toBe(testDepartment.description);
      expect(result.tenantId).toBe(tenantId);
    });

    it('should fail to get non-existent department', async () => {
      await expect(getDepartment({ id: 999999 })).rejects.toThrow();
    });
  });

  describe('listDepartments', () => {
    it('should list all departments', async () => {
      const result = await listDepartments();

      expect(Array.isArray(result.departments)).toBe(true);
      expect(result.departments.length).toBeGreaterThan(0);

      const foundDepartment = result.departments.find(
        (d) => d.id === departmentId,
      );
      expect(foundDepartment).toBeDefined();
      expect(foundDepartment?.name).toBe(testDepartment.name);
      expect(foundDepartment?.code).toBe(testDepartment.code);
    });
  });

  describe('listTenantDepartments', () => {
    it('should list departments for a tenant', async () => {
      const result = await listTenantDepartments({ tenantId });

      expect(Array.isArray(result.departments)).toBe(true);
      expect(result.departments.length).toBeGreaterThan(0);

      const foundDepartment = result.departments.find(
        (d) => d.id === departmentId,
      );
      expect(foundDepartment).toBeDefined();
      expect(foundDepartment?.name).toBe(testDepartment.name);
      expect(foundDepartment?.code).toBe(testDepartment.code);
    });

    it('should return empty list for non-existent tenant', async () => {
      const result = await listTenantDepartments({ tenantId: 999999 });
      expect(Array.isArray(result.departments)).toBe(true);
      expect(result.departments.length).toBe(0);
    });
  });

  describe('updateDepartment', () => {
    const updateData: UpdateDepartmentPayload = {
      name: 'Updated Department',
      description: 'Updated description for testing',
    };

    it('should update an existing department', async () => {
      const result = await updateDepartment({
        id: departmentId,
        ...updateData,
      });

      expect(result.id).toBe(departmentId);
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      expect(result.code).toBe(testDepartment.code);
      expect(result.tenantId).toBe(tenantId);
      expect(result.updatedAt).toBeDefined();
    });

    it('should fail to update non-existent department', async () => {
      await expect(
        updateDepartment({ id: 999999, ...updateData }),
      ).rejects.toThrow();
    });
  });

  describe('deleteDepartment', () => {
    it('should fail to delete non-existent department', async () => {
      await expect(deleteDepartment({ id: 999999 })).rejects.toThrow();
    });

    it('should delete an existing department', async () => {
      const result = await deleteDepartment({ id: departmentId });

      expect(result.id).toBe(departmentId);
      expect(result.name).toBe('Updated Department');
      expect(result.code).toBe(testDepartment.code);

      // Mark as deleted so afterAll doesn't try to delete again
      departmentId = 0;
    });
  });

  describe('pagination', () => {
    let departmentA: { id: number };
    let departmentZ: { id: number };

    afterAll(async () => {
      // Clean up test departments
      if (departmentA?.id) {
        await deleteDepartment({ id: departmentA.id });
      }
      if (departmentZ?.id) {
        await deleteDepartment({ id: departmentZ.id });
      }
    });

    it('should return paginated departments with default parameters', async () => {
      const response = await listDepartmentsWithPagination({});

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

    it('should honor page and pageSize parameters', async () => {
      const response = await listDepartmentsWithPagination({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    it('should default sort by name in ascending order', async () => {
      // Create test departments with different names for verification of default sorting
      departmentA = await createDepartment({
        ...testDepartment,
        name: 'AAA Test Department',
        code: 'AAA-DEPT',
        tenantId,
      });
      departmentZ = await createDepartment({
        ...testDepartment,
        name: 'ZZZ Test Department',
        code: 'ZZZ-DEPT',
        tenantId,
      });

      // Get departments with large enough page size to include test departments
      const response = await listDepartmentsWithPagination({
        pageSize: 50,
      });

      // Find the indices of our test departments
      const indexA = response.data.findIndex((d) => d.id === departmentA.id);
      const indexZ = response.data.findIndex((d) => d.id === departmentZ.id);

      // Verify that departmentA (AAA) comes before departmentZ (ZZZ) in the results
      if (indexA !== -1 && indexZ !== -1) {
        expect(indexA).toBeLessThan(indexZ);
      }
    });

    describe('tenant departments pagination', () => {
      it('should return paginated tenant departments with default parameters', async () => {
        const response = await listTenantDepartmentsWithPagination({
          tenantId,
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.pagination).toBeDefined();
        expect(response.pagination.currentPage).toBe(1);
        expect(response.pagination.pageSize).toBeDefined();
        expect(response.pagination.totalCount).toBeDefined();
        expect(response.pagination.totalPages).toBeDefined();
        expect(typeof response.pagination.hasNextPage).toBe('boolean');
        expect(typeof response.pagination.hasPreviousPage).toBe('boolean');

        // Verify we only get departments for the specified tenant
        response.data.forEach((department) => {
          expect(department.tenantId).toBe(tenantId);
        });
      });

      it('should honor page and pageSize parameters for tenant departments', async () => {
        const response = await listTenantDepartmentsWithPagination({
          tenantId,
          page: 1,
          pageSize: 5,
        });

        expect(response.pagination.currentPage).toBe(1);
        expect(response.pagination.pageSize).toBe(5);
        expect(response.data.length).toBeLessThanOrEqual(5);

        // Verify we only get departments for the specified tenant
        response.data.forEach((department) => {
          expect(department.tenantId).toBe(tenantId);
        });
      });

      it('should return empty paginated result for non-existent tenant', async () => {
        const response = await listTenantDepartmentsWithPagination({
          tenantId: 999999,
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBe(0);
        expect(response.pagination.totalCount).toBe(0);
      });
    });
  });
});
