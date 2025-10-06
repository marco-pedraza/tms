import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import {
  createPermission,
  deletePermission,
} from '../permissions/permissions.controller';
import type { CreatePermissionPayload } from '../permissions/permissions.types';
import type { CreateRolePayload, RoleWithPermissions } from './roles.types';
import { roleRepository } from './roles.repository';
import {
  assignPermissionsToRole,
  createRole,
  deleteRole,
  getRole,
  listRoles,
  listRolesPaginated,
  updateRole,
} from './roles.controller';

describe('Roles Controller', () => {
  // Test data and setup
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
    code: 'TEST_ROLE',
    name: 'Test Role',
    description: 'A test role for automated testing',
  };

  // Variables to store created IDs for cleanup
  let createdRoleId: number;
  let permissionId1: number;
  let permissionId2: number;

  beforeAll(async () => {
    // Create test permissions
    const result1 = await createPermission(testPermission1);
    permissionId1 = result1.id;

    const result2 = await createPermission(testPermission2);
    permissionId2 = result2.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (createdRoleId) {
      try {
        // Clear permissions first
        await roleRepository.assignPermissions(createdRoleId, {
          permissionIds: [],
        });
        await roleRepository.forceDelete(createdRoleId);
      } catch (error) {
        console.log('Error cleaning up test role:', error);
      }
    }
    if (permissionId1) {
      try {
        await deletePermission({ id: permissionId1 });
      } catch (error) {
        console.log('Error cleaning up test permission 1:', error);
      }
    }
    if (permissionId2) {
      try {
        await deletePermission({ id: permissionId2 });
      } catch (error) {
        console.log('Error cleaning up test permission 2:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new role', async () => {
      // Create a new role
      const response = await createRole(testRole);

      // Store the ID for later cleanup
      createdRoleId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.code).toBe(testRole.code);
      expect(response.name).toBe(testRole.name);
      expect(response.description).toBe(testRole.description);
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();
      expect(response.permissions).toBeDefined();
      expect(Array.isArray(response.permissions)).toBe(true);
    });

    test('should create a new role with permissions', async () => {
      const roleWithPermissions = {
        code: 'TEST_ROLE_WITH_PERMS',
        name: 'Test Role With Permissions',
        description: 'A role with initial permissions',
        permissionIds: [permissionId1, permissionId2],
      };

      const result = await createRole(roleWithPermissions);
      const roleWithPermsId = result.id;

      try {
        // Verify the role was created with permissions
        expect(result.id).toBeDefined();
        expect(result.permissions).toBeDefined();
        expect(result.permissions.length).toBe(2);

        // Check that both permissions are assigned
        const permissionIds = result.permissions.map((p) => p.id);
        expect(permissionIds).toContain(permissionId1);
        expect(permissionIds).toContain(permissionId2);
      } finally {
        // Clean up the test role - clear permissions first
        await roleRepository.assignPermissions(roleWithPermsId, {
          permissionIds: [],
        });
        await roleRepository.forceDelete(roleWithPermsId);
      }
    });

    test('should retrieve a role by ID', async () => {
      const response = await getRole({ id: createdRoleId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdRoleId);
      expect(response.code).toBe(testRole.code);
      expect(response.name).toBe(testRole.name);
      expect(response.description).toBe(testRole.description);
      expect(response.permissions).toBeDefined();
      expect(Array.isArray(response.permissions)).toBe(true);
    });

    test('should update a role', async () => {
      const updatedName = 'Updated Test Role';
      const updatedCode = 'UPDATED_ROLE';
      const response = await updateRole({
        id: createdRoleId,
        name: updatedName,
        code: updatedCode,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdRoleId);
      expect(response.name).toBe(updatedName);
      expect(response.code).toBe(updatedCode);
      expect(response.updatedAt).toBeDefined();
    });

    test('should assign permissions to a role', async () => {
      const result = await assignPermissionsToRole({
        id: createdRoleId,
        permissionIds: [permissionId1, permissionId2],
      });

      expect(result.id).toBe(createdRoleId);
      expect(result.permissions).toBeDefined();
      expect(result.permissions.length).toBe(2);

      // Check that both permissions are assigned
      const permissionIds = result.permissions.map((p) => p.id);
      expect(permissionIds).toContain(permissionId1);
      expect(permissionIds).toContain(permissionId2);
    });

    test('should delete a role', async () => {
      // Create a role specifically for deletion test
      const roleToDelete = await createRole({
        code: 'ROLE_TO_DELETE',
        name: 'Role To Delete',
        description: 'A role to be deleted',
      });

      // Delete should not throw an error
      await expect(deleteRole({ id: roleToDelete.id })).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(getRole({ id: roleToDelete.id })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getRole({ id: 999999 })).rejects.toThrow();
    });

    test('should handle duplicate errors', async () => {
      // Ensure the test role exists and get fresh data
      const existingRole = await getRole({ id: createdRoleId });

      // Try to create role with same code as existing one
      await expect(
        createRole({
          code: existingRole.code,
          name: 'Different Name',
          description: 'Duplicate test',
        }),
      ).rejects.toThrow();
    });

    test('should fail to update non-existent role', async () => {
      await expect(
        updateRole({
          id: 999999,
          name: 'Non-existent',
        }),
      ).rejects.toThrow();
    });

    test('should fail to delete non-existent role', async () => {
      await expect(deleteRole({ id: 999999 })).rejects.toThrow();
    });

    test('should fail to assign permissions to non-existent role', async () => {
      await expect(
        assignPermissionsToRole({
          id: 999999,
          permissionIds: [permissionId1],
        }),
      ).rejects.toThrow();
    });

    describe('field validation errors', () => {
      test('should throw detailed field validation error for duplicate code', async () => {
        // Ensure the test role exists and get fresh data
        const existingRole = await getRole({ id: createdRoleId });

        const duplicateCodePayload = {
          code: existingRole.code, // Same code as existing role
          name: 'Different Role Name', // Different name
          description: 'Duplicate code test',
        };

        // Verify that the function rejects
        await expect(createRole(duplicateCodePayload)).rejects.toThrow();

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await createRole(duplicateCodePayload);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        // Verify that validation error is thrown
        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');

        // The error should have fieldErrors array
        expect(typedValidationError.fieldErrors).toBeDefined();
        expect(Array.isArray(typedValidationError.fieldErrors)).toBe(true);
        expect(typedValidationError.fieldErrors).toHaveLength(1);
        expect(typedValidationError.fieldErrors[0].field).toBe('code');
        expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
        expect(typedValidationError.fieldErrors[0].message).toContain(
          'already exists',
        );
        expect(typedValidationError.fieldErrors[0].value).toBe(
          existingRole.code,
        );
      });

      test('should handle update validation errors correctly', async () => {
        // Create another role to test duplicate on update
        const anotherRole = await createRole({
          code: 'ANOTHER_TEST_ROLE',
          name: 'Another Test Role',
          description: 'Another role for testing',
        });

        // Ensure the test role exists and get fresh data
        const existingRole = await getRole({ id: createdRoleId });

        const updatePayload = {
          id: anotherRole.id,
          code: existingRole.code, // This should trigger duplicate validation
        };

        try {
          // Verify that the function rejects
          await expect(updateRole(updatePayload)).rejects.toThrow();

          // Capture the error to make specific assertions
          let validationError: FieldValidationError | undefined;
          try {
            await updateRole(updatePayload);
          } catch (error) {
            validationError = error as FieldValidationError;
          }

          expect(validationError).toBeDefined();
          const typedValidationError = validationError as FieldValidationError;
          expect(typedValidationError.name).toBe('FieldValidationError');
          expect(typedValidationError.message).toContain('Validation failed');
          expect(typedValidationError.fieldErrors).toBeDefined();
          expect(typedValidationError.fieldErrors[0].field).toBe('code');
          expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
        } finally {
          // Clean up the additional role
          await roleRepository.forceDelete(anotherRole.id);
        }
      });

      test('should throw detailed field validation error for non-existent permissions', async () => {
        const nonExistentPermissionIds = [999999, 999998];
        const payload = {
          id: createdRoleId,
          permissionIds: nonExistentPermissionIds,
        };

        // Verify that the function rejects
        await expect(assignPermissionsToRole(payload)).rejects.toThrow();

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await assignPermissionsToRole(payload);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        // Verify that validation error is thrown
        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');

        // The error should have fieldErrors array
        expect(typedValidationError.fieldErrors).toBeDefined();
        expect(Array.isArray(typedValidationError.fieldErrors)).toBe(true);
        expect(typedValidationError.fieldErrors.length).toBe(2); // Two non-existent permissions

        // Check that all errors are for permissionIds field
        typedValidationError.fieldErrors.forEach((error) => {
          expect(error.field).toBe('permissionIds');
          expect(error.code).toBe('NOT_FOUND');
          expect(error.message).toContain('Permission with id');
          expect(error.message).toContain('not found');
          expect(nonExistentPermissionIds).toContain(error.value);
        });
      });
    });
  });

  describe('pagination', () => {
    test('should return paginated roles with default parameters', async () => {
      const response = await listRolesPaginated({});

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
      const response = await listRolesPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should default sort by name in ascending order', async () => {
      // Create test roles with different names for verification of default sorting
      const roleA = await createRole({
        code: 'AAA_TEST_ROLE',
        name: 'AAA Test Role',
        description: 'Test role A',
      });
      const roleZ = await createRole({
        code: 'ZZZ_TEST_ROLE',
        name: 'ZZZ Test Role',
        description: 'Test role Z',
      });

      try {
        // Get roles with large enough page size to include test roles
        const response = await listRolesPaginated({
          pageSize: 50,
        });

        // Find the indices of our test roles
        const indexA = response.data.findIndex((r) => r.id === roleA.id);
        const indexZ = response.data.findIndex((r) => r.id === roleZ.id);

        // Verify that roleA (AAA) comes before roleZ (ZZZ) in the results
        if (indexA !== -1 && indexZ !== -1) {
          expect(indexA).toBeLessThan(indexZ);
        }
      } finally {
        // Clean up test roles
        await roleRepository.forceDelete(roleA.id);
        await roleRepository.forceDelete(roleZ.id);
      }
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listRoles({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      // No pagination info should be present
      expect(response).not.toHaveProperty('pagination');
    });

    test('should return paginated roles with permissions', async () => {
      const response = await listRolesPaginated({ includePermissions: true });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      if (response.data.length > 0) {
        const roleWithPerms = response.data[0] as RoleWithPermissions;
        expect(roleWithPerms.permissions).toBeDefined();
      }
    });
  });

  describe('search functionality', () => {
    test('should search roles using searchTerm in list endpoint', async () => {
      // Create a unique role for search testing
      const searchableRole = await createRole({
        code: 'SEARCHABLE_TEST_ROLE',
        name: 'Searchable Test Role',
        description: 'A searchable role for testing',
      });

      try {
        // Search for the role using searchTerm in listRoles
        const response = await listRoles({ searchTerm: 'Searchable' });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.some((r) => r.id === searchableRole.id)).toBe(
          true,
        );
      } finally {
        // Clean up
        await roleRepository.forceDelete(searchableRole.id);
      }
    });

    test('should search roles with pagination using searchTerm', async () => {
      const response = await listRolesPaginated({
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

    test('should search in both name and code', async () => {
      // Create a role with searchable code
      const codeSearchableRole = await createRole({
        code: 'UNIQUE_CODE_SEARCHABLE',
        name: 'Normal Role Name',
        description: 'A role with searchable code',
      });

      try {
        // Search for the keyword that's only in code
        const response = await listRoles({ searchTerm: 'UNIQUE_CODE' });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.some((r) => r.id === codeSearchableRole.id)).toBe(
          true,
        );
      } finally {
        // Clean up
        await roleRepository.forceDelete(codeSearchableRole.id);
      }
    });
  });

  describe('ordering and filtering', () => {
    // Test roles for ordering and filtering tests
    const testRoles: { id: number; code: string; name: string }[] = [];

    beforeAll(async () => {
      // Create test roles with different properties
      const rolesToCreate = [
        { code: 'ALPHA_ROLE', name: 'Alpha Role', description: 'First role' },
        { code: 'BETA_ROLE', name: 'Beta Role', description: 'Second role' },
        { code: 'GAMMA_ROLE', name: 'Gamma Role', description: 'Third role' },
      ];

      for (const roleData of rolesToCreate) {
        const created = await createRole(roleData);
        testRoles.push(created);
      }
    });

    afterAll(async () => {
      // Clean up test roles
      for (const role of testRoles) {
        try {
          await roleRepository.forceDelete(role.id);
        } catch (error) {
          console.log(`Error cleaning up test role ${role.id}:`, error);
        }
      }
    });

    test('should order roles by name descending', async () => {
      const response = await listRoles({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      const names = response.data.map((r) => r.name);
      // Check if names are in descending order
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should order roles by code in ascending order', async () => {
      const response = await listRoles({
        orderBy: [{ field: 'code', direction: 'asc' }],
      });

      const codes = response.data.map((r) => r.code);
      // Check if codes are in ascending order
      for (let i = 0; i < codes.length - 1; i++) {
        expect(codes[i] <= codes[i + 1]).toBe(true);
      }
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const response = await listRolesPaginated({
        orderBy: [{ field: 'name', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      // Check ordering (ascending)
      const names = response.data.map((r) => r.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }

      // Check pagination properties
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });
  });
});
