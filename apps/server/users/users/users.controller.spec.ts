import { describe, it, expect, afterAll } from 'vitest';
import {
  createUser,
  getUser,
  listUsers,
  listUsersWithPagination,
  listTenantUsers,
  listTenantUsersWithPagination,
  updateUser,
  changePassword,
  deleteUser,
} from './users.controller';
import type {
  CreateUserPayload,
  UpdateUserPayload,
  ChangePasswordPayload,
} from './users.types';
import { createTenant, deleteTenant } from '../tenants/tenants.controller';
import type { CreateTenantPayload } from '../tenants/tenants.types';
import {
  createDepartment,
  deleteDepartment,
} from '../departments/departments.controller';
import type { CreateDepartmentPayload } from '../departments/departments.types';

describe('Users Controller', () => {
  // Test data
  let tenantId = 0;
  let departmentId = 0;
  let userId = 0;
  let passwordUser = 0;

  const testTenant: CreateTenantPayload = {
    name: 'Test Tenant',
    code: 'TEST-TENANT-USER',
    description: 'A test tenant for user testing',
  };

  const testDepartment: CreateDepartmentPayload = {
    name: 'Test Department',
    code: 'TEST-DEPT-USER',
    description: 'A test department for user testing',
  };

  const testUser: CreateUserPayload = {
    tenantId: 0, // Will be set after tenant creation
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

  // Clean up after all tests
  afterAll(async () => {
    if (userId > 0) {
      await deleteUser({ id: userId });
    }
    if (passwordUser > 0) {
      await deleteUser({ id: passwordUser });
    }
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

    it('should create test department', async () => {
      const result = await createDepartment({
        ...testDepartment,
        tenantId,
      });
      departmentId = result.id;
      expect(departmentId).toBeGreaterThan(0);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const result = await createUser({
        ...testUser,
        tenantId,
        departmentId,
      });

      // Save ID for other tests
      userId = result.id;

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
      expect(result.tenantId).toBe(tenantId);
      expect(result.departmentId).toBe(departmentId);
      expect(result.isActive).toBe(true);
      expect(result.isSystemAdmin).toBe(false);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should fail to create user with duplicate email in same tenant', async () => {
      await expect(
        createUser({
          ...testUser,
          tenantId,
          departmentId,
          username: 'different',
        }),
      ).rejects.toThrow();
    });
  });

  describe('getUser', () => {
    it('should get an existing user', async () => {
      const result = await getUser({ id: userId });

      expect(result.id).toBe(userId);
      expect(result.firstName).toBe(testUser.firstName);
      expect(result.lastName).toBe(testUser.lastName);
      expect(result.email).toBe(testUser.email);
      expect(result.username).toBe(testUser.username);
      expect(result.phone).toBe(testUser.phone);
      expect(result.position).toBe(testUser.position);
      expect(result.employeeId).toBe(testUser.employeeId);
      expect(result.tenantId).toBe(tenantId);
      expect(result.departmentId).toBe(departmentId);
    });

    it('should fail to get non-existent user', async () => {
      await expect(getUser({ id: 999999 })).rejects.toThrow();
    });
  });

  describe('listUsers', () => {
    it('should list all users', async () => {
      const result = await listUsers();
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.users.length).toBeGreaterThan(0);

      const foundUser = result.users.find((u) => u.id === userId);
      expect(foundUser).toBeDefined();
      expect(foundUser?.firstName).toBe(testUser.firstName);
      expect(foundUser?.lastName).toBe(testUser.lastName);
      expect(foundUser?.email).toBe(testUser.email);
      expect(foundUser?.username).toBe(testUser.username);
    });
  });

  describe('listTenantUsers', () => {
    it('should list users for a tenant', async () => {
      const result = await listTenantUsers({ tenantId });

      expect(Array.isArray(result.users)).toBe(true);
      expect(result.users.length).toBeGreaterThan(0);

      const foundUser = result.users.find((u) => u.id === userId);
      expect(foundUser).toBeDefined();
      expect(foundUser?.firstName).toBe(testUser.firstName);
      expect(foundUser?.lastName).toBe(testUser.lastName);
      expect(foundUser?.email).toBe(testUser.email);
      expect(foundUser?.username).toBe(testUser.username);
    });

    it('should return empty list for non-existent tenant', async () => {
      const result = await listTenantUsers({ tenantId: 999999 });
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.users.length).toBe(0);
    });
  });

  describe('updateUser', () => {
    const updateData: UpdateUserPayload = {
      firstName: 'Jane',
      lastName: 'Smith',
      position: 'Senior Test User',
      isActive: false,
    };

    it('should update an existing user', async () => {
      const result = await updateUser({ id: userId, ...updateData });

      expect(result.id).toBe(userId);
      expect(result.firstName).toBe(updateData.firstName);
      expect(result.lastName).toBe(updateData.lastName);
      expect(result.position).toBe(updateData.position);
      expect(result.email).toBe(testUser.email);
      expect(result.username).toBe(testUser.username);
      expect(result.phone).toBe(testUser.phone);
      expect(result.employeeId).toBe(testUser.employeeId);
      expect(result.tenantId).toBe(tenantId);
      expect(result.departmentId).toBe(departmentId);
      expect(result.isActive).toBe(updateData.isActive);
      expect(result.updatedAt).toBeDefined();
    });

    it('should fail to update non-existent user', async () => {
      await expect(updateUser({ id: 999999, ...updateData })).rejects.toThrow();
    });
  });

  describe('deleteUser', () => {
    it('should fail to delete non-existent user', async () => {
      await expect(deleteUser({ id: 999999 })).rejects.toThrow();
    });

    it('should delete an existing user', async () => {
      const result = await deleteUser({ id: userId });

      expect(result.id).toBe(userId);
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result.email).toBe(testUser.email);
      expect(result.username).toBe(testUser.username);

      // Mark as deleted so afterAll doesn't try to delete again
      userId = 0;
    });
  });

  describe('pagination', () => {
    let userA: { id: number };
    let userZ: { id: number };

    afterAll(async () => {
      // Clean up test users
      if (userA?.id) {
        await deleteUser({ id: userA.id });
      }
      if (userZ?.id) {
        await deleteUser({ id: userZ.id });
      }
    });

    it('should return paginated users with default parameters', async () => {
      const response = await listUsersWithPagination({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBeDefined();
      expect(response.pagination.totalCount).toBeDefined();
      expect(response.pagination.totalPages).toBeDefined();
      expect(typeof response.pagination.hasNextPage).toBe('boolean');
      expect(typeof response.pagination.hasPreviousPage).toBe('boolean');

      // Verify sensitive data is not included
      response.data.forEach((user) => {
        expect(user).not.toHaveProperty('passwordHash');
      });
    });

    it('should honor page and pageSize parameters', async () => {
      const response = await listUsersWithPagination({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);

      // Verify sensitive data is not included
      response.data.forEach((user) => {
        expect(user).not.toHaveProperty('passwordHash');
      });
    });

    it('should default sort by lastName, firstName in ascending order', async () => {
      // Create test users with different names for verification of default sorting
      userA = await createUser({
        ...testUser,
        username: 'aaa_user',
        email: 'aaa@example.com',
        firstName: 'AAA',
        lastName: 'Test',
        tenantId,
        departmentId,
      });
      userZ = await createUser({
        ...testUser,
        username: 'zzz_user',
        email: 'zzz@example.com',
        firstName: 'ZZZ',
        lastName: 'Test',
        tenantId,
        departmentId,
      });

      // Get users with large enough page size to include test users
      const response = await listUsersWithPagination({
        pageSize: 50,
      });

      // Find the indices of our test users
      const indexA = response.data.findIndex((u) => u.id === userA.id);
      const indexZ = response.data.findIndex((u) => u.id === userZ.id);

      // Verify that userA (AAA) comes before userZ (ZZZ) in the results
      if (indexA !== -1 && indexZ !== -1) {
        expect(indexA).toBeLessThan(indexZ);
      }
    });

    describe('tenant users pagination', () => {
      it('should return paginated tenant users with default parameters', async () => {
        const response = await listTenantUsersWithPagination({
          tenantId,
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.pagination).toBeDefined();
        expect(response.pagination.currentPage).toBe(1);
        expect(response.pagination.pageSize).toBeDefined();
        expect(response.pagination.totalCount).toBeDefined();
        expect(response.pagination.totalPages).toBeDefined();
        expect(typeof response.pagination.hasNextPage).toBe('boolean');
        expect(typeof response.pagination.hasPreviousPage).toBe('boolean');

        // Verify we only get users for the specified tenant
        response.data.forEach((user) => {
          expect(user.tenantId).toBe(tenantId);
          expect(user).not.toHaveProperty('passwordHash');
        });
      });

      it('should honor page and pageSize parameters for tenant users', async () => {
        const response = await listTenantUsersWithPagination({
          tenantId,
          page: 1,
          pageSize: 5,
        });

        expect(response.pagination.currentPage).toBe(1);
        expect(response.pagination.pageSize).toBe(5);
        expect(response.data.length).toBeLessThanOrEqual(5);

        // Verify we only get users for the specified tenant
        response.data.forEach((user) => {
          expect(user.tenantId).toBe(tenantId);
          expect(user).not.toHaveProperty('passwordHash');
        });
      });

      it('should return empty paginated result for non-existent tenant', async () => {
        const response = await listTenantUsersWithPagination({
          tenantId: 999999,
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBe(0);
        expect(response.pagination.totalCount).toBe(0);
      });
    });
  });

  describe('changePassword', () => {
    it('should create a test user for password tests', async () => {
      const pwdTestUser = await createUser({
        ...testUser,
        username: 'pwdtestuser',
        email: 'password@test.com',
        tenantId,
        departmentId,
      });

      passwordUser = pwdTestUser.id;
      expect(passwordUser).toBeGreaterThan(0);
    });

    it('should successfully change a user password with correct credentials', async () => {
      const passwordData: ChangePasswordPayload = {
        currentPassword: 'password123',
        newPassword: 'newPassword456',
      };

      const result = await changePassword({
        id: passwordUser,
        ...passwordData,
      });

      expect(result.id).toBe(passwordUser);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should fail to change password with incorrect current password', async () => {
      const passwordData: ChangePasswordPayload = {
        currentPassword: 'wrongPassword',
        newPassword: 'anotherPassword789',
      };

      await expect(
        changePassword({
          id: passwordUser,
          ...passwordData,
        }),
      ).rejects.toThrow();
    });

    it('should fail to change password for non-existent user', async () => {
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
