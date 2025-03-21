import { describe, it, expect, afterAll, vi } from 'vitest';
import { randomUUID } from 'crypto';
import {
  createDepartment,
  getDepartment,
  listDepartments,
  listTenantDepartments,
  updateDepartment,
  deleteDepartment,
} from './departments.controller';
import type { CreateDepartmentPayload, UpdateDepartmentPayload } from './departments.types';

describe('Departments Controller', () => {
  // Test data
  const tenantId = randomUUID();
  const testDepartment: CreateDepartmentPayload = {
    tenantId,
    name: 'Test Department',
    code: 'TEST-DEP',
    description: 'Test department for testing',
  };

  let departmentId = '';

  // Cleanup
  afterAll(async () => {
    // Clean up created department
    if (departmentId) {
      try {
        await deleteDepartment({ id: departmentId });
      } catch (error) {
        console.error('Failed to clean up test department:', error);
      }
    }
  });

  describe('Success scenarios', () => {
    it('should create a new department', async () => {
      const response = await createDepartment(testDepartment);
      
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testDepartment.name);
      expect(response.code).toBe(testDepartment.code);
      expect(response.description).toBe(testDepartment.description);
      expect(response.tenantId).toBe(tenantId);
      
      // Save ID for later tests
      departmentId = response.id;
    });

    it('should get a department by ID', async () => {
      const response = await getDepartment({ id: departmentId });
      
      expect(response).toBeDefined();
      expect(response.id).toBe(departmentId);
      expect(response.name).toBe(testDepartment.name);
      expect(response.code).toBe(testDepartment.code);
    });

    it('should list all departments', async () => {
      const response = await listDepartments();
      
      expect(response).toBeDefined();
      expect(response.departments).toBeInstanceOf(Array);
      expect(response.departments.length).toBeGreaterThan(0);
      
      const foundDepartment = response.departments.find(dept => dept.id === departmentId);
      expect(foundDepartment).toBeDefined();
    });

    it('should list departments by tenant ID', async () => {
      const response = await listTenantDepartments({ tenantId });
      
      expect(response).toBeDefined();
      expect(response.departments).toBeInstanceOf(Array);
      expect(response.departments.length).toBeGreaterThan(0);
      
      const foundDepartment = response.departments.find(dept => dept.id === departmentId);
      expect(foundDepartment).toBeDefined();
    });

    it('should update a department', async () => {
      const updateData: UpdateDepartmentPayload = {
        name: 'Updated Department Name',
        description: 'Updated department description',
      };
      
      const response = await updateDepartment({ id: departmentId, ...updateData });
      
      expect(response).toBeDefined();
      expect(response.id).toBe(departmentId);
      expect(response.name).toBe(updateData.name);
      expect(response.description).toBe(updateData.description);
      expect(response.code).toBe(testDepartment.code); // Code should remain unchanged
    });

    it('should delete a department', async () => {
      const response = await deleteDepartment({ id: departmentId });
      
      expect(response).toBeDefined();
      expect(response.id).toBe(departmentId);
      
      // Reset ID since we've deleted the department
      departmentId = '';
    });
  });

  describe('Error scenarios', () => {
    it('should throw error when retrieving non-existent department', async () => {
      const nonExistentId = randomUUID();
      
      await expect(getDepartment({ id: nonExistentId })).rejects.toThrow();
    });

    it('should throw error when creating department with duplicate code in the same tenant', async () => {
      // First create a department
      const response = await createDepartment(testDepartment);
      departmentId = response.id;
      
      // Try to create another department with the same code in the same tenant
      await expect(createDepartment(testDepartment)).rejects.toThrow();
    });

    it('should throw error when updating department to have a duplicate code', async () => {
      // Create another department with a different code
      const anotherDepartment = await createDepartment({
        tenantId,
        name: 'Another Department',
        code: 'ANOTHER',
        description: 'Another test department',
      });
      
      // Try to update second department to have the same code as the first
      await expect(
        updateDepartment({
          id: anotherDepartment.id,
          code: testDepartment.code,
        })
      ).rejects.toThrow();
      
      // Clean up the second department
      await deleteDepartment({ id: anotherDepartment.id });
    });

    it('should throw error when deleting non-existent department', async () => {
      const nonExistentId = randomUUID();
      
      await expect(deleteDepartment({ id: nonExistentId })).rejects.toThrow();
    });
  });
}); 