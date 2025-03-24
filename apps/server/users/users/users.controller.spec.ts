import { describe, it, expect, afterAll } from 'vitest';
import {
  createUser,
  getUser,
  listUsers,
  listTenantUsers,
  updateUser,
  deleteUser,
} from './users.controller';
import type { CreateUserPayload, UpdateUserPayload } from './users.types';
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
});
