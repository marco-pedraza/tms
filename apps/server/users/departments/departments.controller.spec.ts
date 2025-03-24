import { describe, it, expect, afterAll } from 'vitest';
import {
  createDepartment,
  getDepartment,
  listDepartments,
  listTenantDepartments,
  updateDepartment,
  deleteDepartment,
} from './departments.controller';
import type { CreateDepartmentPayload, UpdateDepartmentPayload } from './departments.types';
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
        })
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
      
      const foundDepartment = result.departments.find(d => d.id === departmentId);
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
      
      const foundDepartment = result.departments.find(d => d.id === departmentId);
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
      const result = await updateDepartment({ id: departmentId, ...updateData });

      expect(result.id).toBe(departmentId);
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      expect(result.code).toBe(testDepartment.code);
      expect(result.tenantId).toBe(tenantId);
      expect(result.updatedAt).toBeDefined();
    });

    it('should fail to update non-existent department', async () => {
      await expect(
        updateDepartment({ id: 999999, ...updateData })
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
}); 