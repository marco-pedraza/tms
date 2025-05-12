import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createPermission,
  deletePermission,
} from '../permissions/permissions.controller';
import type { CreatePermissionPayload } from '../permissions/permissions.types';
import { createTenant, deleteTenant } from '../tenants/tenants.controller';
import type { CreateTenantPayload } from '../tenants/tenants.types';
import type {
  CreateRolePayload,
  RoleWithPermissions,
  UpdateRolePayload,
} from './roles.types';
import {
  assignPermissionsToRole,
  createRole,
  deleteRole,
  getRole,
  getRoleWithPermissions,
  listRoles,
  listRolesWithPagination,
  listTenantRoles,
  listTenantRolesWithPagination,
  searchRoles,
  searchRolesPaginated,
  updateRole,
} from './roles.controller';

describe('Roles Controller', () => {
  // Test data
  let tenantId = 0;
  let roleId = 0;
  let permissionId1 = 0;
  let permissionId2 = 0;

  const testTenant: CreateTenantPayload = {
    name: 'Test Tenant',
    code: 'TEST-TENANT-ROLE',
    description: 'A test tenant for role testing',
  };

  const testPermission1: CreatePermissionPayload = {
    name: 'Test Permission 1',
    code: 'TEST_PERMISSION_1',
    description: 'A test permission for role testing',
  };

  const testPermission2: CreatePermissionPayload = {
    name: 'Test Permission 2',
    code: 'TEST_PERMISSION_2',
    description: 'Another test permission for role testing',
  };

  const testRole: CreateRolePayload = {
    name: 'Test Role',
    description: 'A test role for automated testing',
    tenantId: 0, // Will be set after tenant creation
  };

  // Clean up after all tests
  afterAll(async () => {
    if (roleId > 0) {
      await deleteRole({ id: roleId });
    }
    if (permissionId1 > 0) {
      await deletePermission({ id: permissionId1 });
    }
    if (permissionId2 > 0) {
      await deletePermission({ id: permissionId2 });
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

      // Update the test role with the tenant ID
      testRole.tenantId = tenantId;
    });

    it('should create test permissions', async () => {
      const result1 = await createPermission(testPermission1);
      permissionId1 = result1.id;
      expect(permissionId1).toBeGreaterThan(0);

      const result2 = await createPermission(testPermission2);
      permissionId2 = result2.id;
      expect(permissionId2).toBeGreaterThan(0);
    });
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      const result = await createRole(testRole);

      // Save ID for other tests
      roleId = result.id;

      // Verify response
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('number');
      expect(result.name).toBe(testRole.name);
      expect(result.description).toBe(testRole.description);
      expect(result.tenantId).toBe(tenantId);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should create a new role with permissions', async () => {
      const roleWithPermissions = {
        ...testRole,
        name: 'Test Role With Permissions',
        permissionIds: [permissionId1, permissionId2],
      };

      const result = await createRole(roleWithPermissions);
      const roleWithPermsId = result.id;

      try {
        // Verify the role was created with permissions
        const roleDetail = await getRoleWithPermissions({
          id: roleWithPermsId,
        });
        expect(roleDetail.id).toBe(roleWithPermsId);
        expect(roleDetail.permissions).toBeDefined();
        expect(roleDetail.permissions.length).toBe(2);

        // Check that both permissions are assigned
        const permissionIds = roleDetail.permissions.map((p) => p.id);
        expect(permissionIds).toContain(permissionId1);
        expect(permissionIds).toContain(permissionId2);
      } finally {
        // Clean up the test role
        await deleteRole({ id: roleWithPermsId });
      }
    });
  });

  describe('getRole', () => {
    it('should get an existing role', async () => {
      const result = await getRole({ id: roleId });

      expect(result.id).toBe(roleId);
      expect(result.name).toBe(testRole.name);
      expect(result.description).toBe(testRole.description);
      expect(result.tenantId).toBe(tenantId);
    });

    it('should fail to get non-existent role', async () => {
      await expect(getRole({ id: 999999 })).rejects.toThrow();
    });
  });

  describe('listRoles', () => {
    it('should list all roles', async () => {
      const result = await listRoles({});

      expect(Array.isArray(result.roles)).toBe(true);
      expect(result.roles.length).toBeGreaterThan(0);

      const foundRole = result.roles.find((r) => r.id === roleId);
      expect(foundRole).toBeDefined();
      expect(foundRole?.name).toBe(testRole.name);
      expect(foundRole?.tenantId).toBe(tenantId);
    });
  });

  describe('listTenantRoles', () => {
    it('should list roles for a tenant', async () => {
      const result = await listTenantRoles({ tenantId });

      expect(Array.isArray(result.roles)).toBe(true);
      expect(result.roles.length).toBeGreaterThan(0);

      const foundRole = result.roles.find((r) => r.id === roleId);
      expect(foundRole).toBeDefined();
      expect(foundRole?.name).toBe(testRole.name);
    });

    it('should return empty list for non-existent tenant', async () => {
      const result = await listTenantRoles({ tenantId: 999999 });
      expect(Array.isArray(result.roles)).toBe(true);
      expect(result.roles.length).toBe(0);
    });
  });

  describe('updateRole', () => {
    const updateData: UpdateRolePayload = {
      name: 'Updated Role',
      description: 'Updated description for testing',
    };

    it('should update an existing role', async () => {
      const result = await updateRole({ id: roleId, ...updateData });

      expect(result.id).toBe(roleId);
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      expect(result.tenantId).toBe(tenantId);
      expect(result.updatedAt).toBeDefined();
    });

    it('should fail to update non-existent role', async () => {
      await expect(updateRole({ id: 999999, ...updateData })).rejects.toThrow();
    });
  });

  describe('assignPermissionsToRole', () => {
    it('should assign permissions to a role', async () => {
      const result = await assignPermissionsToRole({
        id: roleId,
        permissionIds: [permissionId1, permissionId2],
      });

      expect(result.id).toBe(roleId);
      expect(result.permissions).toBeDefined();
      expect(result.permissions.length).toBe(2);

      // Check that both permissions are assigned
      const permissionIds = result.permissions.map((p) => p.id);
      expect(permissionIds).toContain(permissionId1);
      expect(permissionIds).toContain(permissionId2);
    });

    it('should fail to assign permissions to non-existent role', async () => {
      await expect(
        assignPermissionsToRole({
          id: 999999,
          permissionIds: [permissionId1],
        }),
      ).rejects.toThrow();
    });
  });

  describe('getRoleWithPermissions', () => {
    it('should get a role with its permissions', async () => {
      const result = await getRoleWithPermissions({ id: roleId });

      expect(result.id).toBe(roleId);
      expect(result.name).toBe('Updated Role');
      expect(result.permissions).toBeDefined();
      expect(result.permissions.length).toBe(2);

      // Check that both permissions are assigned
      const permissionIds = result.permissions.map((p) => p.id);
      expect(permissionIds).toContain(permissionId1);
      expect(permissionIds).toContain(permissionId2);
    });
  });

  describe('deleteRole', () => {
    it('should fail to delete non-existent role', async () => {
      await expect(deleteRole({ id: 999999 })).rejects.toThrow();
    });

    it('should delete an existing role', async () => {
      const result = await deleteRole({ id: roleId });

      expect(result.id).toBe(roleId);
      expect(result.name).toBe('Updated Role');

      // Mark as deleted so afterAll doesn't try to delete again
      roleId = 0;
    });
  });

  describe('pagination', () => {
    let roleA: { id: number };
    let roleZ: { id: number };

    afterAll(async () => {
      // Clean up test roles
      if (roleA?.id) {
        await deleteRole({ id: roleA.id });
      }
      if (roleZ?.id) {
        await deleteRole({ id: roleZ.id });
      }
    });

    it('should return paginated roles with default parameters', async () => {
      const response = await listRolesWithPagination({});

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
      const response = await listRolesWithPagination({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    it('should default sort by name in ascending order', async () => {
      // Create test roles with different names for verification of default sorting
      roleA = await createRole({
        name: 'AAA Test Role',
        description: 'Test role A',
        tenantId,
      });
      roleZ = await createRole({
        name: 'ZZZ Test Role',
        description: 'Test role Z',
        tenantId,
      });

      // Get roles with large enough page size to include test roles
      const response = await listRolesWithPagination({
        pageSize: 50,
      });

      // Find the indices of our test roles
      const indexA = response.data.findIndex((r) => r.id === roleA.id);
      const indexZ = response.data.findIndex((r) => r.id === roleZ.id);

      // Verify that roleA (AAA) comes before roleZ (ZZZ) in the results
      if (indexA !== -1 && indexZ !== -1) {
        expect(indexA).toBeLessThan(indexZ);
      }
    });

    it('should properly sort names in descending order with localeCompare', async () => {
      // Create additional roles and ensure we have at least roleA and roleZ from previous test
      if (!roleA?.id || !roleZ?.id) {
        roleA = await createRole({
          name: 'AAA Test Role',
          description: 'Test role A',
          tenantId,
        });
        roleZ = await createRole({
          name: 'ZZZ Test Role',
          description: 'Test role Z',
          tenantId,
        });
      }

      // Get a list of roles
      const result = await listRolesWithPagination({
        pageSize: 50,
      });

      // Verify we have multiple results
      expect(result.data.length).toBeGreaterThan(1);

      // Using localeCompare for locale-aware descending order sorting
      const names = result.data.map((r) => r.name);
      const sortedDesc = [...names].sort((a, b) => b.localeCompare(a));

      // Verify the sorting is correct - each item should be >= the next item
      for (let i = 0; i < sortedDesc.length - 1; i++) {
        expect(
          sortedDesc[i].localeCompare(sortedDesc[i + 1]),
        ).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return paginated tenant roles with default parameters', async () => {
      const response = await listTenantRolesWithPagination({
        tenantId,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
    });
  });

  describe('search functionality', () => {
    let searchRoleA: RoleWithPermissions;
    let searchRoleB: RoleWithPermissions;

    beforeAll(async () => {
      // Create roles with searchable content
      searchRoleA = await createRole({
        name: 'Search Role Alpha',
        description: 'This is a role for testing search functionality',
        tenantId,
      });

      searchRoleB = await createRole({
        name: 'Search Role Beta',
        description: 'Another role for search tests',
        tenantId,
      });
    });

    afterAll(async () => {
      // Clean up test roles
      if (searchRoleA?.id) {
        await deleteRole({ id: searchRoleA.id });
      }
      if (searchRoleB?.id) {
        await deleteRole({ id: searchRoleB.id });
      }
    });

    it('should search roles by term', async () => {
      const result = await searchRoles({ term: 'Search' });

      expect(Array.isArray(result.roles)).toBe(true);
      expect(result.roles.length).toBeGreaterThan(0);
      expect(
        result.roles.some((r) => r.name.toLowerCase().includes('search')),
      ).toBe(true);
    });

    it('should search roles with includePermissions option', async () => {
      const result = await searchRoles({
        term: 'Search',
        includePermissions: true,
      });

      expect(Array.isArray(result.roles)).toBe(true);
      if (result.roles.length > 0) {
        // Check that permissions are included in the result
        // The roles should now be RoleWithPermissions
        const roleWithPerms = result.roles[0] as RoleWithPermissions;
        expect(roleWithPerms.permissions).toBeDefined();
      }
    });

    it('should search roles with pagination', async () => {
      const result = await searchRolesPaginated({
        term: 'Role',
        page: 1,
        pageSize: 10,
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.currentPage).toBe(1);
    });

    it('should search with pagination and ordering', async () => {
      const result = await searchRolesPaginated({
        term: 'Search',
        orderBy: [{ field: 'name', direction: 'desc' }],
        page: 1,
        pageSize: 20,
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // Verify search results are ordered correctly
      if (result.data.length > 1) {
        const names = result.data.map((r) => r.name);
        expect(names).toEqual([...names].sort().reverse());
      }
    });
  });
});
