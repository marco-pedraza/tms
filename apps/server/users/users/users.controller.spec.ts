import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueCode,
  createUniqueName,
} from '@/tests/shared/test-utils';
import { db } from '../db-service';
import {
  createDepartment,
  deleteDepartment,
} from '../departments/departments.controller';
import type { CreateDepartmentPayload } from '../departments/departments.types';
import { createRole, deleteRole } from '../roles/roles.controller';
import { userRoles } from '../user-permissions/user-permissions.schema';
import type {
  ChangePasswordPayload,
  CreateUserPayload,
  SafeUser,
  UpdateUserPayload,
} from './users.types';
import { userRepository } from './users.repository';
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  listUsersPaginated,
  updateUser,
} from './users.controller';
import { validatePasswordChange } from './users.domain';

describe('Users Controller', () => {
  // Test configuration
  const testSuiteId = createTestSuiteId('users');

  // Cleanup helpers
  const usersCleanup = createCleanupHelper(
    ({ id }) => userRepository.forceDelete(id),
    'user',
  );

  const departmentsCleanup = createCleanupHelper(
    ({ id }) => deleteDepartment({ id }),
    'department',
  );

  const rolesCleanup = createCleanupHelper(
    ({ id }) => deleteRole({ id }),
    'role',
  );

  // Test data and setup
  let departmentId = 0;
  let userId = 0;
  let testRole1: number;
  let testRole2: number;

  const testDepartment: CreateDepartmentPayload = {
    name: createUniqueName('Test Department', testSuiteId),
    code: createUniqueCode('TD'),
    description: 'A test department for user testing',
  };

  const testUser: CreateUserPayload = {
    departmentId: 0, // Will be set after department creation
    username: 'testuser',
    email: 'john.doe@test.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    position: 'Test User',
    employeeId: 'EMP001',
    active: true,
    isSystemAdmin: true,
  };

  beforeAll(async () => {
    // Create test department for all tests
    const result = await createDepartment(testDepartment);
    departmentId = result.id;
    departmentsCleanup.track(departmentId);
    expect(departmentId).toBeGreaterThan(0);

    // Create test roles for all tests
    const role1 = await createRole({
      name: createUniqueName('Test Role 1', testSuiteId),
      description: 'First test role',
      active: true,
    });
    testRole1 = role1.id;
    rolesCleanup.track(testRole1);

    const role2 = await createRole({
      name: createUniqueName('Test Role 2', testSuiteId),
      description: 'Second test role',
      active: true,
    });
    testRole2 = role2.id;
    rolesCleanup.track(testRole2);
  });

  // Clean up after all tests
  afterAll(async () => {
    await usersCleanup.cleanupAll();
    await rolesCleanup.cleanupAll();
    await departmentsCleanup.cleanupAll();
  });

  describe('success scenarios', () => {
    test('should create a new user with roles', async () => {
      const result = await createUser({
        ...testUser,
        departmentId,
        roleIds: [testRole1, testRole2],
      });

      // Save ID for other tests and track for cleanup
      userId = result.id;
      usersCleanup.track(userId);

      // Verify response
      expect(result.id).toBeDefined();
      expect(result.firstName).toBe(testUser.firstName);
      expect(result.lastName).toBe(testUser.lastName);
      expect(result.email).toBe(testUser.email);
      expect(result.username).toBe(testUser.username);
      expect(result.phone).toBe(testUser.phone);
      expect(result.position).toBe(testUser.position);
      expect(result.employeeId).toBe(testUser.employeeId);
      expect(result.departmentId).toBe(departmentId);
      expect(result.active).toBe(true);
      expect(result.isSystemAdmin).toBe(false);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      // Ensure passwordHash is not exposed
      expect(result).not.toHaveProperty('passwordHash');

      // Verify roles are included in response
      expect(result.roles).toBeDefined();
      expect(result.roles).toHaveLength(2);
      const roleIds = result.roles?.map((r) => r.id) ?? [];
      expect(roleIds).toEqual(expect.arrayContaining([testRole1, testRole2]));
    });

    test('should retrieve a user by ID', async () => {
      const response = await getUser({ id: userId });

      expect(response).toBeDefined();
      expect(response.id).toBe(userId);
      expect(response.firstName).toBe(testUser.firstName);
      expect(response.lastName).toBe(testUser.lastName);
      expect(response.email).toBe(testUser.email);
      expect(response.username).toBe(testUser.username);
      // Ensure passwordHash is not exposed
      expect(response).not.toHaveProperty('passwordHash');
    });

    test('should update a user and roles', async () => {
      const updateData: UpdateUserPayload = {
        firstName: 'Jane',
        lastName: 'Smith',
        position: 'Senior Test User',
        active: false,
        roleIds: [testRole1], // Remove role2, keep role1
      };

      const response = await updateUser({
        id: userId,
        ...updateData,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(userId);
      expect(response.firstName).toBe(updateData.firstName);
      expect(response.lastName).toBe(updateData.lastName);
      expect(response.position).toBe(updateData.position);
      expect(response.email).toBe(testUser.email);
      expect(response.username).toBe(testUser.username);
      expect(response.phone).toBe(testUser.phone);
      expect(response.employeeId).toBe(testUser.employeeId);
      expect(response.departmentId).toBe(departmentId);
      expect(response.active).toBe(updateData.active);
      expect(response.updatedAt).toBeDefined();

      // Verify roles are included in response
      expect(response.roles).toBeDefined();
      expect(response.roles).toHaveLength(1);
      expect(response.roles?.[0]?.id).toBe(testRole1);
    });

    test('should delete a user', async () => {
      // Create a user specifically for deletion test
      const userToDelete = await createUser({
        ...testUser,
        username: 'user_to_delete',
        email: 'delete_me@test.com',
        departmentId,
      });

      // Track for cleanup (in case deletion fails)
      usersCleanup.track(userToDelete.id);

      // Delete should not throw an error
      await expect(deleteUser({ id: userToDelete.id })).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(getUser({ id: userToDelete.id })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getUser({ id: 9999999 })).rejects.toThrow();
    });

    test('should handle duplicate errors', async () => {
      // Try to create user with same username/email as existing one
      await expect(
        createUser({
          ...testUser,
          departmentId,
        }),
      ).rejects.toThrow();
    });

    describe('field validation errors', () => {
      test('should throw detailed field validation error for duplicate username', async () => {
        // Ensure the test user exists and get fresh data
        const existingUser = await getUser({ id: userId });

        const duplicateUsernamePayload = {
          ...testUser,
          username: existingUser.username, // Same username as existing user
          email: 'different@test.com', // Different email
          departmentId,
        };

        // Verify that the function rejects
        await expect(createUser(duplicateUsernamePayload)).rejects.toThrow();

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await createUser(duplicateUsernamePayload);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        // Verify that validation error is thrown (middleware transformation happens at HTTP level)
        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');

        // The error should have fieldErrors array
        expect(typedValidationError.fieldErrors).toBeDefined();
        expect(Array.isArray(typedValidationError.fieldErrors)).toBe(true);
        expect(typedValidationError.fieldErrors).toHaveLength(1);
        expect(typedValidationError.fieldErrors[0].field).toBe('username');
        expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
        expect(typedValidationError.fieldErrors[0].message).toContain(
          'already exists',
        );
        expect(typedValidationError.fieldErrors[0].value).toBe(
          existingUser.username,
        );
      });

      test('should throw field validation error with multiple fields', async () => {
        // Ensure the test user exists and get fresh data
        const existingUser = await getUser({ id: userId });

        const duplicateBothPayload = {
          ...testUser,
          username: existingUser.username, // Same username
          email: existingUser.email, // Same email
          departmentId,
        };

        // Verify that the function rejects
        await expect(createUser(duplicateBothPayload)).rejects.toThrow();

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await createUser(duplicateBothPayload);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');

        expect(typedValidationError.fieldErrors).toBeDefined();
        expect(Array.isArray(typedValidationError.fieldErrors)).toBe(true);
        expect(typedValidationError.fieldErrors).toHaveLength(2);

        // Both fields should have DUPLICATE errors
        const usernameError = typedValidationError.fieldErrors.find(
          (e: { field: string }) => e.field === 'username',
        );
        const emailError = typedValidationError.fieldErrors.find(
          (e: { field: string }) => e.field === 'email',
        );

        expect(usernameError).toBeDefined();
        expect(emailError).toBeDefined();
        expect(usernameError?.code).toBe('DUPLICATE');
        expect(emailError?.code).toBe('DUPLICATE');
      });

      test('should handle update validation errors correctly', async () => {
        // Create another user to test duplicate on update
        const anotherUser = await createUser({
          ...testUser,
          username: 'another_test_user',
          email: 'another@test.com',
          departmentId,
        });

        // Track for cleanup
        usersCleanup.track(anotherUser.id);

        // Ensure the test user exists and get fresh data
        const existingUser = await getUser({ id: userId });

        const updatePayload = {
          id: anotherUser.id,
          email: anotherUser.email,
          username: existingUser.username, // This should trigger duplicate validation
        };

        try {
          // Verify that the function rejects
          await expect(updateUser(updatePayload)).rejects.toThrow();

          // Capture the error to make specific assertions
          let validationError: FieldValidationError | undefined;
          try {
            await updateUser(updatePayload);
          } catch (error) {
            validationError = error as FieldValidationError;
          }

          expect(validationError).toBeDefined();
          const typedValidationError = validationError as FieldValidationError;
          expect(typedValidationError.name).toBe('FieldValidationError');
          expect(typedValidationError.message).toContain('Validation failed');
          expect(typedValidationError.fieldErrors).toBeDefined();
          expect(typedValidationError.fieldErrors[0].field).toBe('username');
          expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
        } finally {
          // Clean up the additional user
          await usersCleanup.cleanup(anotherUser.id);
        }
      });
    });
  });

  describe('pagination, filtering and ordering', () => {
    // Test users for ordering and filtering tests
    const testUsers: SafeUser[] = [];

    beforeAll(async () => {
      // Create test users with different properties
      const users = [
        {
          ...testUser,
          username: 'alpha_user',
          email: 'alpha@test.com',
          firstName: 'Alpha',
          lastName: 'User',
          active: true,
        },
        {
          ...testUser,
          username: 'beta_user',
          email: 'beta@test.com',
          firstName: 'Beta',
          lastName: 'User',
          active: false,
        },
        {
          ...testUser,
          username: 'gamma_user',
          email: 'gamma@test.com',
          firstName: 'Gamma',
          lastName: 'User',
          active: true,
        },
      ];

      for (const userData of users) {
        const created = await createUser({
          ...userData,
          departmentId,
        });
        testUsers.push(created);
        usersCleanup.track(created.id);
      }
    });

    test('should return paginated users with default parameters', async () => {
      const response = await listUsersPaginated({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBeDefined();
      expect(response.pagination.totalCount).toBeDefined();
      expect(response.pagination.totalPages).toBeDefined();
      expect(typeof response.pagination.hasNextPage).toBe('boolean');
      expect(typeof response.pagination.hasPreviousPage).toBe('boolean');

      // Verify that users include roles information
      const userWithRoles = response.data.find((u) => u.id === userId);
      expect(userWithRoles).toBeDefined();
      expect(userWithRoles?.roles).toBeDefined();
      expect(userWithRoles?.roles).toHaveLength(1);
      expect(userWithRoles?.roles?.[0]?.id).toBe(testRole1);
    });

    test('should honor page and pageSize parameters', async () => {
      const response = await listUsersPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listUsers({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      // No pagination info should be present
      expect(response).not.toHaveProperty('pagination');
    });

    test('should order users by lastName, firstName ascending', async () => {
      const response = await listUsers({
        orderBy: [
          { field: 'lastName', direction: 'asc' },
          { field: 'firstName', direction: 'asc' },
        ],
      });

      const names = response.data.map((u) => `${u.lastName}, ${u.firstName}`);
      // Check if names are in ascending order
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }
    });

    test('should filter users by active status', async () => {
      const response = await listUsers({
        filters: { active: true },
      });

      // All returned users should be active
      expect(response.data.every((u) => u.active === true)).toBe(true);

      // Should include our active test users
      const activeTestUserIds = testUsers
        .filter((u) => u.active)
        .map((u) => u.id);

      for (const id of activeTestUserIds) {
        expect(response.data.some((u) => u.id === id)).toBe(true);
      }
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const response = await listUsersPaginated({
        filters: { active: true },
        orderBy: [{ field: 'firstName', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      // Check filtering
      expect(response.data.every((u) => u.active === true)).toBe(true);

      // Check ordering (ascending)
      const names = response.data.map((u) => u.firstName);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }

      // Check pagination properties
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });

    test('should order users by firstName descending', async () => {
      const response = await listUsers({
        orderBy: [{ field: 'firstName', direction: 'desc' }],
      });

      const names = response.data.map((u) => u.firstName);
      // Check if names are in descending order
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should allow multi-field ordering', async () => {
      // Create users with same firstName but different lastNames
      const sameFirstNameUsers = [
        {
          ...testUser,
          username: 'same_first_a',
          email: 'samefirsta@test.com',
          firstName: 'Same',
          lastName: 'A',
        },
        {
          ...testUser,
          username: 'same_first_b',
          email: 'samefirstb@test.com',
          firstName: 'Same',
          lastName: 'B',
        },
      ];

      const createdUsers: SafeUser[] = [];

      try {
        for (const userData of sameFirstNameUsers) {
          const created = await createUser({
            ...userData,
            departmentId,
          });
          createdUsers.push(created);
          usersCleanup.track(created.id);
        }

        // Order by firstName first, then by lastName
        const response = await listUsers({
          orderBy: [
            { field: 'firstName', direction: 'asc' },
            { field: 'lastName', direction: 'asc' },
          ],
        });

        // Get all users with the same firstName and verify they're ordered by lastName
        const sameFirstNameResults = response.data.filter(
          (u) => u.firstName === 'Same',
        );
        const lastNames = sameFirstNameResults.map((u) => u.lastName);

        for (let i = 0; i < lastNames.length - 1; i++) {
          // LastNames should be in ascending order for same firstName
          expect(lastNames[i] <= lastNames[i + 1]).toBe(true);
        }
      } finally {
        // Clean up
        for (const user of createdUsers) {
          await usersCleanup.cleanup(user.id);
        }
      }
    });
  });

  describe('search functionality', () => {
    test('should search users using searchTerm in list endpoint', async () => {
      // Create a unique user for search testing
      const searchableUser = await createUser({
        ...testUser,
        username: 'searchable_user',
        email: 'searchable@test.com',
        firstName: 'Searchable',
        lastName: 'Test',
        departmentId,
      });

      usersCleanup.track(searchableUser.id);

      try {
        // Search for the user using searchTerm in listUsers
        const response = await listUsers({ searchTerm: 'Searchable' });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.some((u) => u.id === searchableUser.id)).toBe(
          true,
        );
      } catch (error) {
        // If test fails, still clean up
        await usersCleanup.cleanup(searchableUser.id);
        throw error;
      }
    });

    test('should search users with pagination using searchTerm', async () => {
      const response = await listUsersPaginated({
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

    test('should search in both firstName and lastName', async () => {
      // Create a user with searchable lastName
      const lastNameSearchableUser = await createUser({
        ...testUser,
        username: 'lastname_searchable',
        email: 'lastname@test.com',
        firstName: 'Normal',
        lastName: 'SearchableLastName',
        departmentId,
      });

      usersCleanup.track(lastNameSearchableUser.id);

      try {
        // Search for the keyword that's only in lastName
        const response = await listUsers({ searchTerm: 'SearchableLastName' });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(
          response.data.some((u) => u.id === lastNameSearchableUser.id),
        ).toBe(true);
      } catch (error) {
        // If test fails, still clean up
        await usersCleanup.cleanup(lastNameSearchableUser.id);
        throw error;
      }
    });
  });

  describe('password management', () => {
    let authenticatedUserId = 0;
    let targetUserId = 0;

    beforeAll(async () => {
      // Create an authenticated user (the one who will change passwords)
      const authUser = await createUser({
        ...testUser,
        username: 'authuser',
        email: 'auth@test.com',
        departmentId,
      });

      authenticatedUserId = authUser.id;
      usersCleanup.track(authenticatedUserId);

      // Create a target user (the one whose password will be changed)
      const targetUser = await createUser({
        ...testUser,
        username: 'targetuser',
        email: 'target@test.com',
        departmentId,
      });

      targetUserId = targetUser.id;
      usersCleanup.track(targetUserId);

      expect(authenticatedUserId).toBeGreaterThan(0);
      expect(targetUserId).toBeGreaterThan(0);
    });

    test('should successfully validate password change with correct authenticated user credentials', async () => {
      const passwordData: ChangePasswordPayload = {
        currentPassword: 'password123', // Password of the authenticated user
        newPassword: 'newPassword456', // New password for the target user
      };

      // Test the domain validation function directly
      await expect(
        validatePasswordChange(targetUserId, passwordData, authenticatedUserId),
      ).resolves.not.toThrow();
    });

    test('should fail validation with incorrect authenticated user password', async () => {
      const passwordData: ChangePasswordPayload = {
        currentPassword: 'wrongPassword', // Wrong password for authenticated user
        newPassword: 'anotherPassword789',
      };

      // Capture the error to make specific assertions
      let validationError: FieldValidationError | undefined;
      try {
        await validatePasswordChange(
          targetUserId,
          passwordData,
          authenticatedUserId,
        );
      } catch (error) {
        validationError = error as FieldValidationError;
      }

      // Verify the specific error code and field
      expect(validationError).toBeDefined();
      const typedValidationError = validationError as FieldValidationError;
      expect(typedValidationError.fieldErrors[0].field).toBe('currentPassword');
      expect(typedValidationError.fieldErrors[0].code).toBe('INVALID_PASSWORD');
    });

    test('should fail validation for non-existent target user', async () => {
      const passwordData: ChangePasswordPayload = {
        currentPassword: 'password123', // Correct password for authenticated user
        newPassword: 'newPassword456',
      };

      // Capture the error to make specific assertions
      let validationError: FieldValidationError | undefined;
      try {
        await validatePasswordChange(999999, passwordData, authenticatedUserId); // Non-existent target user
      } catch (error) {
        validationError = error as FieldValidationError;
      }

      // Verify the specific error code and field
      expect(validationError).toBeDefined();
      const typedValidationError = validationError as FieldValidationError;
      expect(typedValidationError.fieldErrors[0].field).toBe('id');
      expect(typedValidationError.fieldErrors[0].code).toBe('NOT_FOUND');
    });
  });

  describe('role assignment edge cases', () => {
    test('should efficiently update roles without deleting unchanged ones', async () => {
      const user = await createUser({
        ...testUser,
        username: 'user_efficiency_test',
        email: 'user.efficiency@test.com',
        departmentId,
        roleIds: [testRole1, testRole2],
      });

      usersCleanup.track(user.id);

      // Get initial user role assignment IDs from database to verify efficiency
      const initialRoles = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, user.id));

      const initialRole1Assignment = initialRoles.find(
        (r) => r.roleId === testRole1,
      );
      expect(initialRole1Assignment).toBeDefined();
      const initialRole1AssignmentId = initialRole1Assignment?.id;

      // Create third role for testing
      const role3 = await createRole({
        name: createUniqueName('Test Role 3', testSuiteId),
        description: 'Third test role',
        active: true,
      });
      rolesCleanup.track(role3.id);

      // Update: keep role1, remove role2, add role3
      const updatedUser = await updateUser({
        id: user.id,
        roleIds: [testRole1, role3.id],
      });

      // Verify roles in response
      expect(updatedUser.roles).toHaveLength(2);
      const updatedRoleIds = updatedUser.roles?.map((r) => r.id) ?? [];
      expect(updatedRoleIds).toEqual(
        expect.arrayContaining([testRole1, role3.id]),
      );

      // Verify efficiency: role1 assignment was not deleted and recreated
      const currentRoles = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, user.id));

      const currentRole1Assignment = currentRoles.find(
        (r) => r.roleId === testRole1,
      );
      expect(currentRole1Assignment?.id).toBe(initialRole1AssignmentId);
    });

    test('should handle empty array and preserve roles when not specified', async () => {
      const user = await createUser({
        ...testUser,
        username: 'user_edge_cases',
        email: 'user.edge.cases@test.com',
        departmentId,
        roleIds: [testRole1],
      });

      usersCleanup.track(user.id);

      // Remove all roles with empty array
      let updatedUser = await updateUser({
        id: user.id,
        roleIds: [],
      });

      expect(updatedUser.roles).toHaveLength(0);

      // Add roles back
      updatedUser = await updateUser({
        id: user.id,
        roleIds: [testRole2],
      });

      expect(updatedUser.roles).toHaveLength(1);
      expect(updatedUser.roles?.[0]?.id).toBe(testRole2);

      // Update user fields without touching roleIds - roles should be preserved
      updatedUser = await updateUser({
        id: user.id,
        firstName: 'Updated Name',
      });

      expect(updatedUser.roles).toHaveLength(1);
      expect(updatedUser.roles?.[0]?.id).toBe(testRole2);
    });

    test('should validate role existence on create and update', async () => {
      const nonExistentRoleId = 999999;

      // Should fail to create with non-existent role
      try {
        await createUser({
          ...testUser,
          username: 'user_invalid_role',
          email: 'user.invalid.role@test.com',
          departmentId,
          roleIds: [nonExistentRoleId],
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        const validationError = error as FieldValidationError;
        expect(validationError).toBeDefined();
        expect(validationError.name).toBe('FieldValidationError');
        expect(validationError.fieldErrors).toBeDefined();
        expect(validationError.fieldErrors).toHaveLength(1);
        expect(validationError.fieldErrors[0].field).toBe('roleIds');
        expect(validationError.fieldErrors[0].code).toBe('NOT_FOUND');
        expect(validationError.fieldErrors[0].message).toContain(
          `Role with id ${nonExistentRoleId} not found`,
        );
        expect(validationError.fieldErrors[0].value).toBe(nonExistentRoleId);
      }

      // Should fail to update with non-existent role
      try {
        await updateUser({
          id: userId,
          roleIds: [nonExistentRoleId],
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        const validationError = error as FieldValidationError;
        expect(validationError).toBeDefined();
        expect(validationError.name).toBe('FieldValidationError');
        expect(validationError.fieldErrors).toBeDefined();
        expect(validationError.fieldErrors).toHaveLength(1);
        expect(validationError.fieldErrors[0].field).toBe('roleIds');
        expect(validationError.fieldErrors[0].code).toBe('NOT_FOUND');
        expect(validationError.fieldErrors[0].message).toContain(
          `Role with id ${nonExistentRoleId} not found`,
        );
        expect(validationError.fieldErrors[0].value).toBe(nonExistentRoleId);
      }
    });
  });
});
