import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import {
  createPermission,
  getPermission,
  listPermissions,
  listPermissionsWithPagination,
  updatePermission,
  deletePermission,
  searchPermissions,
  searchPermissionsPaginated,
} from './permissions.controller';
import type {
  CreatePermissionPayload,
  UpdatePermissionPayload,
  Permission,
} from './permissions.types';

describe('Permissions Controller', () => {
  // Test data and IDs array for cleanup
  const testIds: number[] = [];

  let permissionId = 0;
  const testPermission: CreatePermissionPayload = {
    name: 'Test Permission',
    code: 'TEST_PERMISSION',
    description: 'A test permission for automated testing',
  };

  // Clean up after all tests
  afterAll(async () => {
    // Delete all test permissions
    for (const id of testIds) {
      try {
        await deletePermission({ id });
      } catch {
        // Ignore errors from already deleted permissions
      }
    }
  });

  describe('createPermission', () => {
    it('should create a new permission', async () => {
      const result = await createPermission(testPermission);

      // Save ID for other tests and cleanup
      permissionId = result.id;
      testIds.push(permissionId);

      // Verify response
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('number');
      expect(result.name).toBe(testPermission.name);
      expect(result.code).toBe(testPermission.code);
      expect(result.description).toBe(testPermission.description);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should fail to create permission with duplicate code', async () => {
      await expect(createPermission(testPermission)).rejects.toThrow();
    });
  });

  describe('getPermission', () => {
    it('should get an existing permission', async () => {
      const result = await getPermission({ id: permissionId });

      expect(result.id).toBe(permissionId);
      expect(result.name).toBe(testPermission.name);
      expect(result.code).toBe(testPermission.code);
      expect(result.description).toBe(testPermission.description);
    });

    it('should fail to get non-existent permission', async () => {
      await expect(getPermission({ id: 999999 })).rejects.toThrow();
    });
  });

  describe('listPermissions', () => {
    it('should list permissions without query options', async () => {
      const result = await listPermissions({});

      expect(Array.isArray(result.permissions)).toBe(true);
      expect(result.permissions.length).toBeGreaterThan(0);

      const foundPermission = result.permissions.find(
        (p) => p.id === permissionId,
      );
      expect(foundPermission).toBeDefined();
      expect(foundPermission?.name).toBe(testPermission.name);
      expect(foundPermission?.code).toBe(testPermission.code);
    });

    it('should list permissions with orderBy option', async () => {
      // Create additional test permissions
      const permissionB: Permission = await createPermission({
        name: 'B Test Permission',
        code: 'B_TEST_PERMISSION',
        description: 'B test description',
      });
      testIds.push(permissionB.id);

      const permissionC: Permission = await createPermission({
        name: 'C Test Permission',
        code: 'C_TEST_PERMISSION',
        description: 'C test description',
      });
      testIds.push(permissionC.id);

      // Test ordering by name descending
      const resultDesc = await listPermissions({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      // Verify order is descending by name
      const namesDesc = resultDesc.permissions
        .filter((p) => testIds.includes(p.id))
        .map((p) => p.name);

      expect(namesDesc).toEqual([...namesDesc].sort().reverse());

      // Test ordering by name ascending
      const resultAsc = await listPermissions({
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      // Verify order is ascending by name
      const namesAsc = resultAsc.permissions
        .filter((p) => testIds.includes(p.id))
        .map((p) => p.name);

      expect(namesAsc).toEqual([...namesAsc].sort());
    });

    it('should list permissions with filters option', async () => {
      // Test filtering by name
      const result = await listPermissions({
        filters: { name: 'B Test Permission' },
      });

      expect(result.permissions.length).toBeGreaterThan(0);
      expect(
        result.permissions.every((p) => p.name === 'B Test Permission'),
      ).toBe(true);
    });
  });

  describe('updatePermission', () => {
    const updateData: UpdatePermissionPayload = {
      name: 'Updated Permission',
      description: 'Updated description for testing',
    };

    it('should update an existing permission', async () => {
      const result = await updatePermission({
        id: permissionId,
        ...updateData,
      });

      expect(result.id).toBe(permissionId);
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      expect(result.code).toBe(testPermission.code);
      expect(result.updatedAt).toBeDefined();
    });

    it('should fail to update non-existent permission', async () => {
      await expect(
        updatePermission({ id: 999999, ...updateData }),
      ).rejects.toThrow();
    });
  });

  describe('deletePermission', () => {
    it('should fail to delete non-existent permission', async () => {
      await expect(deletePermission({ id: 999999 })).rejects.toThrow();
    });

    it('should delete an existing permission', async () => {
      // Create a permission specifically for deletion test
      const deleteTestPermission = await createPermission({
        name: 'Delete Test',
        code: 'DELETE_TEST',
        description: 'Permission to be deleted',
      });

      const deleteId = deleteTestPermission.id;

      const result = await deletePermission({ id: deleteId });

      expect(result.id).toBe(deleteId);
      expect(result.name).toBe('Delete Test');
      expect(result.code).toBe('DELETE_TEST');

      // Remove from testIds as it's already deleted
      const index = testIds.indexOf(deleteId);
      if (index > -1) {
        testIds.splice(index, 1);
      }
    });
  });

  describe('pagination and ordering', () => {
    let permissionA: Permission;
    let permissionZ: Permission;

    beforeAll(async () => {
      // Create test permissions with different names for verification of sorting
      permissionA = await createPermission({
        name: 'AAA Test Permission',
        code: 'AAA_PERMISSION',
        description: 'AAA description',
      });
      testIds.push(permissionA.id);

      permissionZ = await createPermission({
        name: 'ZZZ Test Permission',
        code: 'ZZZ_PERMISSION',
        description: 'ZZZ description',
      });
      testIds.push(permissionZ.id);
    });

    it('should return paginated permissions with default parameters', async () => {
      const response = await listPermissionsWithPagination({});

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
      const response = await listPermissionsWithPagination({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    it('should sort by specified field and direction', async () => {
      // Test ascending sort
      const responseAsc = await listPermissionsWithPagination({
        pageSize: 50,
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      // Find indices of test permissions
      const indexAAsc = responseAsc.data.findIndex(
        (p) => p.id === permissionA.id,
      );
      const indexZAsc = responseAsc.data.findIndex(
        (p) => p.id === permissionZ.id,
      );

      // Verify correct ordering when both found
      if (indexAAsc !== -1 && indexZAsc !== -1) {
        expect(indexAAsc).toBeLessThan(indexZAsc);
      }

      // Test descending sort
      const responseDesc = await listPermissionsWithPagination({
        pageSize: 50,
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      // Find indices of test permissions
      const indexADesc = responseDesc.data.findIndex(
        (p) => p.id === permissionA.id,
      );
      const indexZDesc = responseDesc.data.findIndex(
        (p) => p.id === permissionZ.id,
      );

      // Verify correct ordering when both found
      if (indexADesc !== -1 && indexZDesc !== -1) {
        expect(indexZDesc).toBeLessThan(indexADesc);
      }
    });

    it('should filter by specified criteria', async () => {
      // Test filtering by name
      const responseFilter = await listPermissionsWithPagination({
        filters: { name: 'AAA Test Permission' },
      });

      expect(responseFilter.data.length).toBeGreaterThan(0);
      expect(
        responseFilter.data.every((p) => p.name === 'AAA Test Permission'),
      ).toBe(true);
    });
  });

  describe('search functionality', () => {
    beforeAll(async () => {
      // Create permissions with searchable content if they don't exist yet
      if (!testIds.length) {
        const searchTestPermission1 = await createPermission({
          name: 'Dashboard View',
          code: 'DASHBOARD_VIEW',
          description: 'Permission to view the admin dashboard',
        });
        testIds.push(searchTestPermission1.id);

        const searchTestPermission2 = await createPermission({
          name: 'User Management',
          code: 'USER_MANAGE',
          description: 'Permission to manage user accounts',
        });
        testIds.push(searchTestPermission2.id);
      }
    });

    it('should search permissions by term', async () => {
      const result = await searchPermissions({ term: 'Test' });

      expect(Array.isArray(result.permissions)).toBe(true);
      expect(result.permissions.length).toBeGreaterThan(0);
      expect(
        result.permissions.some(
          (p) =>
            p.name.toLowerCase().includes('test') ||
            p.code.toLowerCase().includes('test'),
        ),
      ).toBe(true);
    });

    it('should search permissions with pagination', async () => {
      const result = await searchPermissionsPaginated({
        term: 'User',
        page: 1,
        pageSize: 10,
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();

      // Verify search results contain the search term
      if (result.data.length > 0) {
        expect(
          result.data.some(
            (p) =>
              p.name.toLowerCase().includes('user') ||
              p.code.toLowerCase().includes('user'),
          ),
        ).toBe(true);
      }
    });

    it('should search with pagination and ordering', async () => {
      const result = await searchPermissionsPaginated({
        term: 'test',
        orderBy: [{ field: 'name', direction: 'desc' }],
        page: 1,
        pageSize: 20,
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // Verify search results are ordered correctly when there are multiple matches
      if (result.data.length > 1) {
        const names = result.data.map((p) => p.name);
        expect(names).toEqual([...names].sort().reverse());
      }
    });
  });
});
