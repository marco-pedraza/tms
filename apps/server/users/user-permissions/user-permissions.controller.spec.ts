import { afterAll, describe, expect, it } from 'vitest';
import { createTestSuiteId, createUniqueName } from '@/tests/shared/test-utils';
import {
  createDepartment,
  deleteDepartment,
} from '../departments/departments.controller';
import type { CreateDepartmentPayload } from '../departments/departments.types';
import {
  createPermission,
  deletePermission,
} from '../permissions/permissions.controller';
import type { CreatePermissionPayload } from '../permissions/permissions.types';
import { createRole } from '../roles/roles.controller';
import { roleRepository } from '../roles/roles.repository';
import type { CreateRolePayload } from '../roles/roles.types';
import { createUser } from '../users/users.controller';
import { userRepository } from '../users/users.repository';
import type { CreateUserPayload } from '../users/users.types';
import type {
  AssignPermissionsToUserPayload,
  AssignRolesToUserPayload,
} from './user-permissions.types';
import {
  assignPermissionsToUser,
  assignRolesToUser,
  getUserPermissions,
  getUserRoles,
} from './user-permissions.controller';

describe('User Permissions Controller', () => {
  const testSuiteId = createTestSuiteId('user-permissions');

  // Test data
  let departmentId = 0;
  let userId = 0;
  let permissionId1 = 0;
  let permissionId2 = 0;
  let roleId = 0;

  const testDepartment: CreateDepartmentPayload = {
    name: createUniqueName('Test Department', testSuiteId),
    code: `TEST-DEPT-UPER-${testSuiteId.substring(0, 8)}`,
    description: 'A test department for user permissions testing',
  };

  const testUser: CreateUserPayload = {
    departmentId: 0, // Will be set after department creation
    username: `testuser_perm_${testSuiteId.substring(0, 8)}`,
    email: `permissions.test.${testSuiteId}@example.com`,
    password: 'password123',
    firstName: 'Permission',
    lastName: 'Test',
    phone: `+123456${testSuiteId.substring(0, 4)}`,
    position: 'Test User',
    employeeId: `EMP-PERM-${testSuiteId.substring(0, 8)}`,
    active: true,
    isSystemAdmin: false,
  };

  const testPermission1: CreatePermissionPayload = {
    name: createUniqueName('Test User Permission 1', testSuiteId),
    code: `TEST_USER_PERM_1_${testSuiteId.substring(0, 8)}`,
    description: 'A test permission for user permissions testing',
  };

  const testPermission2: CreatePermissionPayload = {
    name: createUniqueName('Test User Permission 2', testSuiteId),
    code: `TEST_USER_PERM_2_${testSuiteId.substring(0, 8)}`,
    description: 'Another test permission for user permissions testing',
  };

  const testRole: CreateRolePayload = {
    code: `TEST_USER_ROLE_${testSuiteId.substring(0, 8)}`,
    name: createUniqueName('Test User Role', testSuiteId),
    description: 'A test role for user permissions testing',
  };

  // Clean up after all tests
  afterAll(async () => {
    if (userId > 0) {
      await userRepository.forceDelete(userId);
    }
    if (roleId > 0) {
      // Clear permissions first
      await roleRepository.assignPermissions(roleId, { permissionIds: [] });
      await roleRepository.forceDelete(roleId);
    }
    if (permissionId1 > 0) {
      await deletePermission({ id: permissionId1 });
    }
    if (permissionId2 > 0) {
      await deletePermission({ id: permissionId2 });
    }
    if (departmentId > 0) {
      await deleteDepartment({ id: departmentId });
    }
  });

  describe('Setup', () => {
    it('should create test department', async () => {
      const result = await createDepartment(testDepartment);
      departmentId = result.id;
      expect(departmentId).toBeGreaterThan(0);

      // Update test user with the department ID
      testUser.departmentId = departmentId;
    });

    it('should create test user', async () => {
      const result = await createUser(testUser);
      userId = result.id;
      expect(userId).toBeGreaterThan(0);
    });

    it('should create test permissions', async () => {
      const result1 = await createPermission(testPermission1);
      permissionId1 = result1.id;
      expect(permissionId1).toBeGreaterThan(0);

      const result2 = await createPermission(testPermission2);
      permissionId2 = result2.id;
      expect(permissionId2).toBeGreaterThan(0);
    });

    it('should create test role', async () => {
      const result = await createRole(testRole);
      roleId = result.id;
      expect(roleId).toBeGreaterThan(0);
    });
  });

  describe('assignPermissionsToUser', () => {
    it('should assign permissions to a user', async () => {
      const permissions: AssignPermissionsToUserPayload = {
        permissionIds: [permissionId1, permissionId2],
      };

      const result = await assignPermissionsToUser({
        userId,
        ...permissions,
      });

      expect(result.id).toBe(userId);
      expect(result.directPermissions).toBeDefined();
      expect(result.directPermissions.length).toBe(2);

      // Check that both permissions are assigned
      const permissionIds = result.directPermissions.map((p) => p.id);
      expect(permissionIds).toContain(permissionId1);
      expect(permissionIds).toContain(permissionId2);
    });

    it('should replace existing permissions when assigning permissions', async () => {
      const permissions: AssignPermissionsToUserPayload = {
        permissionIds: [permissionId1], // Only assign one permission now
      };

      const result = await assignPermissionsToUser({
        userId,
        ...permissions,
      });

      expect(result.directPermissions.length).toBe(1);
      expect(result.directPermissions[0].id).toBe(permissionId1);
    });

    it('should fail to assign permissions to non-existent user', async () => {
      const permissions: AssignPermissionsToUserPayload = {
        permissionIds: [permissionId1],
      };

      await expect(
        assignPermissionsToUser({
          userId: 999999,
          ...permissions,
        }),
      ).rejects.toThrow();
    });
  });

  describe('getUserPermissions', () => {
    it('should get user permissions', async () => {
      const result = await getUserPermissions({ userId });

      expect(result.id).toBe(userId);
      expect(result.directPermissions).toBeDefined();
      expect(result.directPermissions.length).toBe(1);
      expect(result.directPermissions[0].id).toBe(permissionId1);

      // No role permissions yet
      expect(result.roles).toBeDefined();
      expect(result.roles.length).toBe(0);

      // Effective permissions should match direct permissions at this point
      expect(result.effectivePermissions).toBeDefined();
      expect(result.effectivePermissions.length).toBe(1);
      expect(result.effectivePermissions[0].id).toBe(permissionId1);
    });

    it('should fail to get permissions for non-existent user', async () => {
      await expect(getUserPermissions({ userId: 999999 })).rejects.toThrow();
    });
  });

  describe('assignRolesToUser', () => {
    it('should assign roles to a user', async () => {
      const roles: AssignRolesToUserPayload = {
        roleIds: [roleId],
      };

      const result = await assignRolesToUser({
        userId,
        ...roles,
      });

      expect(result.id).toBe(userId);
      expect(result.roles).toBeDefined();
      expect(result.roles.length).toBe(1);
      expect(result.roles[0].id).toBe(roleId);
    });

    it('should replace existing roles when assigning roles', async () => {
      // Create another role
      const anotherRole = await createRole({
        code: 'ANOTHER_ROLE',
        name: 'Another Role',
        description: 'Another test role',
      });

      try {
        // Assign both roles
        await assignRolesToUser({
          userId,
          roleIds: [roleId, anotherRole.id],
        });

        // Verify both roles are assigned
        const userWithTwoRoles = await getUserRoles({ userId });
        expect(userWithTwoRoles.roles.length).toBe(2);

        // Now assign just the first role again
        const result = await assignRolesToUser({
          userId,
          roleIds: [roleId],
        });

        // Verify only one role remains assigned
        expect(result.roles.length).toBe(1);
        expect(result.roles[0].id).toBe(roleId);
      } finally {
        // Clean up the additional role
        await roleRepository.forceDelete(anotherRole.id);
      }
    });

    it('should fail to assign roles to non-existent user', async () => {
      const roles: AssignRolesToUserPayload = {
        roleIds: [roleId],
      };

      await expect(
        assignRolesToUser({
          userId: 999999,
          ...roles,
        }),
      ).rejects.toThrow();
    });
  });

  describe('getUserRoles', () => {
    it('should get user roles', async () => {
      const result = await getUserRoles({ userId });

      expect(result.id).toBe(userId);
      expect(result.roles).toBeDefined();
      expect(result.roles.length).toBe(1);
      expect(result.roles[0].id).toBe(roleId);
    });

    it('should fail to get roles for non-existent user', async () => {
      await expect(getUserRoles({ userId: 999999 })).rejects.toThrow();
    });
  });

  describe('Combined permissions from roles and direct assignments', () => {
    it('should combine permissions from roles and direct assignments', async () => {
      // First, assign permission to the role
      await assignPermissionsToRole();

      // Then check that the user has permissions from both direct assignment and role
      const result = await getUserPermissions({ userId });

      // Direct permissions should still be the same
      expect(result.directPermissions.length).toBe(1);
      expect(result.directPermissions[0].id).toBe(permissionId1);

      // Role should have the second permission
      expect(result.roles.length).toBe(1);
      expect(result.roles[0].permissions.length).toBe(1);
      expect(result.roles[0].permissions[0].id).toBe(permissionId2);

      // Effective permissions should have both permissions
      expect(result.effectivePermissions.length).toBe(2);
      const effectivePermIds = result.effectivePermissions.map((p) => p.id);
      expect(effectivePermIds).toContain(permissionId1);
      expect(effectivePermIds).toContain(permissionId2);
    });

    // Helper function to assign permissions to the role
    async function assignPermissionsToRole() {
      // Import the actual assignPermissionsToRole here to avoid adding it to the imports
      const { assignPermissionsToRole } = await import(
        '../roles/roles.controller'
      );

      await assignPermissionsToRole({
        id: roleId,
        permissionIds: [permissionId2], // Assign the second permission to the role
      });
    }
  });
});
