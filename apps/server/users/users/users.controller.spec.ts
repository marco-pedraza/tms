import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  createDepartment,
  deleteDepartment,
} from '../departments/departments.controller';
import type { CreateDepartmentPayload } from '../departments/departments.types';
import type {
  ChangePasswordPayload,
  CreateUserPayload,
  SafeUser,
  UpdateUserPayload,
} from './users.types';
import {
  changePassword,
  createUser,
  deleteUser,
  getUser,
  listDepartmentUsers,
  listDepartmentUsersPaginated,
  listUsers,
  listUsersPaginated,
  searchUsers,
  searchUsersPaginated,
  updateUser,
} from './users.controller';

describe('Users Controller', () => {
  // Test data and setup
  let departmentId = 0;
  let userId = 0;
  let passwordUserId = 0;

  const testDepartment: CreateDepartmentPayload = {
    name: 'Test Department',
    code: 'TEST-DEPT-USER',
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
    isActive: true,
    isSystemAdmin: false,
  };

  // Variable to store created IDs for cleanup
  const createdUserIds: number[] = [];

  // Clean up after all tests
  afterAll(async () => {
    // Delete created users
    for (const id of createdUserIds) {
      if (id) {
        try {
          await deleteUser({ id });
        } catch (error) {
          console.log(`Error cleaning up test user ${id}:`, error);
        }
      }
    }

    // Delete department
    if (departmentId > 0) {
      try {
        await deleteDepartment({ id: departmentId });
      } catch (error) {
        console.log('Error cleaning up test department:', error);
      }
    }
  });

  describe('Setup', () => {
    test('should create test department', async () => {
      const result = await createDepartment(testDepartment);
      departmentId = result.id;
      expect(departmentId).toBeGreaterThan(0);
    });
  });

  describe('success scenarios', () => {
    test('should create a new user', async () => {
      const result = await createUser({
        ...testUser,
        departmentId,
      });

      // Save ID for other tests
      userId = result.id;
      createdUserIds.push(userId);

      // Verify response
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('number');
      expect(result.firstName).toBe(testUser.firstName);
      expect(result.lastName).toBe(testUser.lastName);
      expect(result.email).toBe(testUser.email);
      expect(result.username).toBe(testUser.username);
      expect(result.phone).toBe(testUser.phone);
      expect(result.position).toBe(testUser.position);
      expect(result.employeeId).toBe(testUser.employeeId);
      expect(result.departmentId).toBe(departmentId);
      expect(result.isActive).toBe(true);
      expect(result.isSystemAdmin).toBe(false);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      // Ensure passwordHash is not exposed
      expect(result).not.toHaveProperty('passwordHash');
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

    test('should update a user', async () => {
      const updateData: UpdateUserPayload = {
        firstName: 'Jane',
        lastName: 'Smith',
        position: 'Senior Test User',
        isActive: false,
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
      expect(response.isActive).toBe(updateData.isActive);
      expect(response.updatedAt).toBeDefined();
    });

    test('should delete a user', async () => {
      // Create a user specifically for deletion test
      const userToDelete = await createUser({
        ...testUser,
        username: 'user_to_delete',
        email: 'delete_me@test.com',
        departmentId,
      });

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
          isActive: true,
        },
        {
          ...testUser,
          username: 'beta_user',
          email: 'beta@test.com',
          firstName: 'Beta',
          lastName: 'User',
          isActive: false,
        },
        {
          ...testUser,
          username: 'gamma_user',
          email: 'gamma@test.com',
          firstName: 'Gamma',
          lastName: 'User',
          isActive: true,
        },
      ];

      for (const userData of users) {
        const created = await createUser({
          ...userData,
          departmentId,
        });
        testUsers.push(created);
        createdUserIds.push(created.id);
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

      expect(response.users).toBeDefined();
      expect(Array.isArray(response.users)).toBe(true);
      expect(response.users.length).toBeGreaterThan(0);
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

      const names = response.users.map((u) => `${u.lastName}, ${u.firstName}`);
      // Check if names are in ascending order
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }
    });

    test('should filter users by active status', async () => {
      const response = await listUsers({
        filters: { isActive: true },
      });

      // All returned users should be active
      expect(response.users.every((u) => u.isActive === true)).toBe(true);

      // Should include our active test users
      const activeTestUserIds = testUsers
        .filter((u) => u.isActive)
        .map((u) => u.id);

      for (const id of activeTestUserIds) {
        expect(response.users.some((u) => u.id === id)).toBe(true);
      }
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const response = await listUsersPaginated({
        filters: { isActive: true },
        orderBy: [{ field: 'firstName', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      // Check filtering
      expect(response.data.every((u) => u.isActive === true)).toBe(true);

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
  });

  describe('department filtering', () => {
    // Test users for department tests
    const filterTestUsers: SafeUser[] = [];

    beforeAll(async () => {
      // Create test users for department testing if needed
      const users = [
        {
          ...testUser,
          username: 'dept_user1',
          email: 'dept1@test.com',
          isActive: true,
        },
        {
          ...testUser,
          username: 'dept_user2',
          email: 'dept2@test.com',
          isActive: false,
        },
      ];

      for (const userData of users) {
        const created = await createUser({
          ...userData,
          departmentId,
        });
        filterTestUsers.push(created);
        createdUserIds.push(created.id);
      }
    });

    test('should return users for a specific department', async () => {
      const response = await listDepartmentUsers({ departmentId });

      // All returned users should belong to the specified department
      expect(response.users.every((u) => u.departmentId === departmentId)).toBe(
        true,
      );

      // Should include our test users
      for (const user of filterTestUsers) {
        expect(response.users.some((u) => u.id === user.id)).toBe(true);
      }
    });

    test('should return paginated users for a specific department', async () => {
      const response = await listDepartmentUsersPaginated({
        departmentId,
        page: 1,
        pageSize: 10,
      });

      // All returned users should belong to the specified department
      expect(response.data.every((u) => u.departmentId === departmentId)).toBe(
        true,
      );

      // Check pagination properties
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });
  });

  describe('search functionality', () => {
    test('should search users', async () => {
      // Create a unique user for search testing
      const searchableUser = await createUser({
        ...testUser,
        username: 'searchable_user',
        email: 'searchable@test.com',
        firstName: 'Searchable',
        lastName: 'Test',
        departmentId,
      });

      createdUserIds.push(searchableUser.id);

      try {
        // Search for the user by term
        const response = await searchUsers({ term: 'Searchable' });

        expect(response.users).toBeDefined();
        expect(Array.isArray(response.users)).toBe(true);
        expect(response.users.some((u) => u.id === searchableUser.id)).toBe(
          true,
        );
      } catch (error) {
        // If test fails, still clean up
        await deleteUser({ id: searchableUser.id });
        throw error;
      }
    });

    test('should search users with pagination', async () => {
      const response = await searchUsersPaginated({
        term: 'Test',
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

  describe('password management', () => {
    beforeAll(async () => {
      // Create a user for password management tests
      const pwdTestUser = await createUser({
        ...testUser,
        username: 'pwdtestuser',
        email: 'password@test.com',
        departmentId,
      });

      passwordUserId = pwdTestUser.id;
      createdUserIds.push(passwordUserId);
      expect(passwordUserId).toBeGreaterThan(0);
    });

    test('should successfully change a user password with correct credentials', async () => {
      const passwordData: ChangePasswordPayload = {
        currentPassword: 'password123',
        newPassword: 'newPassword456',
      };

      const result = await changePassword({
        id: passwordUserId,
        ...passwordData,
      });

      expect(result.id).toBe(passwordUserId);
      expect(result).not.toHaveProperty('passwordHash');
    });

    test('should fail to change password with incorrect current password', async () => {
      const passwordData: ChangePasswordPayload = {
        currentPassword: 'wrongPassword',
        newPassword: 'anotherPassword789',
      };

      await expect(
        changePassword({
          id: passwordUserId,
          ...passwordData,
        }),
      ).rejects.toThrow();
    });

    test('should fail to change password for non-existent user', async () => {
      const passwordData: ChangePasswordPayload = {
        currentPassword: 'password123',
        newPassword: 'newPassword456',
      };

      await expect(
        changePassword({
          id: 999999,
          ...passwordData,
        }),
      ).rejects.toThrow();
    });
  });
});
