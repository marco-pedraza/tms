import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type {
  CreateDepartmentPayload,
  Department,
  UpdateDepartmentPayload,
} from './departments.types';
import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  listDepartments,
  listDepartmentsPaginated,
  searchDepartments,
  searchDepartmentsPaginated,
  updateDepartment,
} from './departments.controller';

describe('Departments Controller', () => {
  // Test data
  let departmentId = 0;

  const testDepartment: CreateDepartmentPayload = {
    name: 'Test Department',
    code: 'TEST-DEPT',
    description: 'A test department for automated testing',
  };

  // Variable to store created IDs for cleanup
  const createdDepartmentIds: number[] = [];

  // Clean up after all tests
  afterAll(async () => {
    // Delete created departments
    for (const id of createdDepartmentIds) {
      if (id) {
        try {
          await deleteDepartment({ id });
        } catch (error) {
          console.log(`Error cleaning up test department ${id}:`, error);
        }
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new department', async () => {
      const result = await createDepartment(testDepartment);

      // Save ID for other tests
      departmentId = result.id;
      createdDepartmentIds.push(departmentId);

      // Verify response
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('number');
      expect(result.name).toBe(testDepartment.name);
      expect(result.code).toBe(testDepartment.code);
      expect(result.description).toBe(testDepartment.description);
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    test('should retrieve a department by ID', async () => {
      const response = await getDepartment({ id: departmentId });

      expect(response).toBeDefined();
      expect(response.id).toBe(departmentId);
      expect(response.name).toBe(testDepartment.name);
      expect(response.code).toBe(testDepartment.code);
      expect(response.description).toBe(testDepartment.description);
    });

    test('should update a department', async () => {
      const updateData: UpdateDepartmentPayload = {
        name: 'Updated Department',
        description: 'Updated description for testing',
      };

      const response = await updateDepartment({
        id: departmentId,
        ...updateData,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(departmentId);
      expect(response.name).toBe(updateData.name);
      expect(response.description).toBe(updateData.description);
      expect(response.code).toBe(testDepartment.code);
      expect(response.updatedAt).toBeDefined();
    });

    test('should delete a department', async () => {
      // Create a department specifically for deletion test
      const departmentToDelete = await createDepartment({
        ...testDepartment,
        name: 'Department To Delete',
        code: 'DEPT-DELETE',
      });

      // Delete should not throw an error
      await expect(
        deleteDepartment({ id: departmentToDelete.id }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(
        getDepartment({ id: departmentToDelete.id }),
      ).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getDepartment({ id: 9999999 })).rejects.toThrow();
    });

    test('should handle duplicate errors', async () => {
      // Try to create department with same code
      await expect(createDepartment(testDepartment)).rejects.toThrow();
    });
  });

  describe('pagination, filtering and ordering', () => {
    // Test departments for ordering and filtering tests
    const testDepartments: Department[] = [];

    beforeAll(async () => {
      // Create test departments with different properties
      const departments = [
        {
          ...testDepartment,
          name: 'Alpha Department',
          code: 'ALPHA-DEPT',
          isActive: true,
        },
        {
          ...testDepartment,
          name: 'Beta Department',
          code: 'BETA-DEPT',
          isActive: false,
        },
        {
          ...testDepartment,
          name: 'Gamma Department',
          code: 'GAMMA-DEPT',
          isActive: true,
        },
      ];

      for (const deptData of departments) {
        const created = await createDepartment(deptData);
        testDepartments.push(created);
        createdDepartmentIds.push(created.id);
      }
    });

    test('should return paginated departments with default parameters', async () => {
      const response = await listDepartmentsPaginated({});

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
      const response = await listDepartmentsPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listDepartments({});

      expect(response.departments).toBeDefined();
      expect(Array.isArray(response.departments)).toBe(true);
      expect(response.departments.length).toBeGreaterThan(0);
      // No pagination info should be present
      expect(response).not.toHaveProperty('pagination');
    });

    test('should order departments by name ascending', async () => {
      const response = await listDepartments({
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      const names = response.departments.map((d) => d.name);
      // Check if names are in ascending order
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }
    });

    test('should filter departments by active status', async () => {
      const response = await listDepartments({
        filters: { isActive: true },
      });

      // All returned departments should be active
      expect(response.departments.every((d) => d.isActive === true)).toBe(true);

      // Should include our active test departments
      const activeTestDepartmentIds = testDepartments
        .filter((d) => d.isActive)
        .map((d) => d.id);

      for (const id of activeTestDepartmentIds) {
        expect(response.departments.some((d) => d.id === id)).toBe(true);
      }
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const response = await listDepartmentsPaginated({
        filters: { isActive: true },
        orderBy: [{ field: 'name', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      // Check filtering
      expect(response.data.every((d) => d.isActive === true)).toBe(true);

      // Check ordering (ascending)
      const names = response.data.map((d) => d.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }

      // Check pagination properties
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });
  });

  describe('search functionality', () => {
    test('should search departments', async () => {
      // Create a unique department for search testing
      const searchableDepartment = await createDepartment({
        ...testDepartment,
        name: 'Searchable Department',
        code: 'SEARCH-DEPT',
      });

      createdDepartmentIds.push(searchableDepartment.id);

      try {
        // Search for the department by term
        const response = await searchDepartments({ term: 'Searchable' });

        expect(response.departments).toBeDefined();
        expect(Array.isArray(response.departments)).toBe(true);
        expect(
          response.departments.some((d) => d.id === searchableDepartment.id),
        ).toBe(true);
      } catch (error) {
        // If test fails, still clean up
        await deleteDepartment({ id: searchableDepartment.id });
        throw error;
      }
    });

    test('should search departments with pagination', async () => {
      const response = await searchDepartmentsPaginated({
        term: 'Department',
        page: 1,
        pageSize: 5,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
    });
  });
});
