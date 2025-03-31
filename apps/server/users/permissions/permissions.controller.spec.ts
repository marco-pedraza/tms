import { describe, it, expect, afterAll } from 'vitest';
import {
  createPermission,
  getPermission,
  listPermissions,
  listPermissionsWithPagination,
  updatePermission,
  deletePermission,
} from './permissions.controller';
import type { CreatePermissionPayload, UpdatePermissionPayload } from './permissions.types';
import { permissionRepository } from './permissions.repository';

describe('Permissions Controller', () => {
  // Test data
  let permissionId = 0;
  const testPermission: CreatePermissionPayload = {
    name: 'Test Permission',
    code: 'TEST_PERMISSION',
    description: 'A test permission for automated testing',
  };

  // Clean up after all tests
  afterAll(async () => {
    if (permissionId > 0) {
      await deletePermission({ id: permissionId });
    }
  });

  describe('createPermission', () => {
    it('should create a new permission', async () => {
      const result = await createPermission(testPermission);

      // Save ID for other tests
      permissionId = result.id;

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
    it('should list permissions', async () => {
      const result = await listPermissions();

      expect(Array.isArray(result.permissions)).toBe(true);
      expect(result.permissions.length).toBeGreaterThan(0);

      const foundPermission = result.permissions.find((p) => p.id === permissionId);
      expect(foundPermission).toBeDefined();
      expect(foundPermission?.name).toBe(testPermission.name);
      expect(foundPermission?.code).toBe(testPermission.code);
    });
  });

  describe('updatePermission', () => {
    const updateData: UpdatePermissionPayload = {
      name: 'Updated Permission',
      description: 'Updated description for testing',
    };

    it('should update an existing permission', async () => {
      const result = await updatePermission({ id: permissionId, ...updateData });

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
      const result = await deletePermission({ id: permissionId });

      expect(result.id).toBe(permissionId);
      expect(result.name).toBe('Updated Permission');
      expect(result.code).toBe(testPermission.code);

      // Mark as deleted so afterAll doesn't try to delete again
      permissionId = 0;
    });
  });

  describe('pagination', () => {
    let permissionA: { id: number };
    let permissionZ: { id: number };

    afterAll(async () => {
      // Clean up test permissions
      if (permissionA?.id) {
        await deletePermission({ id: permissionA.id });
      }
      if (permissionZ?.id) {
        await deletePermission({ id: permissionZ.id });
      }
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

    it('should default sort by name in ascending order', async () => {
      // Create test permissions with different names for verification of default sorting
      permissionA = await createPermission({
        ...testPermission,
        name: 'AAA Test Permission',
        code: 'AAA_PERMISSION',
      });
      permissionZ = await createPermission({
        ...testPermission,
        name: 'ZZZ Test Permission',
        code: 'ZZZ_PERMISSION',
      });

      // Get permissions with large enough page size to include test permissions
      const response = await listPermissionsWithPagination({
        pageSize: 50,
      });

      // Find the indices of our test permissions
      const indexA = response.data.findIndex((p) => p.id === permissionA.id);
      const indexZ = response.data.findIndex((p) => p.id === permissionZ.id);

      // Verify that permissionA (AAA) comes before permissionZ (ZZZ) in the results
      if (indexA !== -1 && indexZ !== -1) {
        expect(indexA).toBeLessThan(indexZ);
      }
    });
  });
}); 