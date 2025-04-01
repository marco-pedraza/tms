import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import {
  login,
  refreshToken,
  logout,
  revokeAllTokens,
} from './auth.controller';
import type {
  LoginPayload,
  RefreshTokenPayload,
  LogoutPayload,
} from './auth.types';
import { createUser, deleteUser } from '../users/users.controller';
import type { CreateUserPayload } from '../users/users.types';
import { createTenant, deleteTenant } from '../tenants/tenants.controller';
import type { CreateTenantPayload } from '../tenants/tenants.types';
import { createDepartment, deleteDepartment } from '../departments/departments.controller';
import type { CreateDepartmentPayload } from '../departments/departments.types';

describe('Auth Controller', () => {
  // Test data
  let tenantId = 0;
  let departmentId = 0;
  let userId = 0;
  let refreshTokenString = '';

  const testTenant: CreateTenantPayload = {
    name: 'Test Tenant Auth',
    code: 'TEST-TENANT-AUTH',
    description: 'A test tenant for auth testing',
  };

  const testDepartment: CreateDepartmentPayload = {
    name: 'Test Department Auth',
    code: 'TEST-DEPT-AUTH',
    description: 'A test department for auth testing',
  };

  const testUser: CreateUserPayload = {
    tenantId: 0, // Will be set after tenant creation
    departmentId: 0, // Will be set after department creation
    username: 'testauth',
    email: 'auth.test@test.com',
    password: 'password123',
    firstName: 'Auth',
    lastName: 'Test',
    phone: '+1234567890',
    position: 'Auth Test User',
    employeeId: 'EMP002',
    isActive: true,
    isSystemAdmin: false,
  };

  const loginPayload: LoginPayload = {
    username: 'testauth',
    password: 'password123',
  };

  // Setup and teardown
  beforeAll(async () => {
    // Create tenant
    const tenant = await createTenant(testTenant);
    tenantId = tenant.id;
    expect(tenantId).toBeGreaterThan(0);

    // Create department
    const department = await createDepartment({
      ...testDepartment,
      tenantId,
    });
    departmentId = department.id;
    expect(departmentId).toBeGreaterThan(0);

    // Create test user
    const user = await createUser({
      ...testUser,
      tenantId,
      departmentId,
    });
    userId = user.id;
    expect(userId).toBeGreaterThan(0);
  });

  afterAll(async () => {
    // Clean up
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

  describe('login', () => {
    it('should authenticate a user with valid credentials', async () => {
      const result = await login(loginPayload);

      // Check response structure
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      
      // Verify user data
      expect(result.user.id).toBe(userId);
      expect(result.user.username).toBe(testUser.username);
      expect(result.user.firstName).toBe(testUser.firstName);
      expect(result.user.lastName).toBe(testUser.lastName);
      expect(result.user.email).toBe(testUser.email);
      expect(result.user.passwordHash).toBeUndefined();
      
      // JWT tokens
      expect(typeof result.accessToken).toBe('string');
      expect(result.accessToken.length).toBeGreaterThan(20);
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken.length).toBeGreaterThan(20);

      // Save refresh token for later tests
      refreshTokenString = result.refreshToken;
    });

    it('should fail with invalid credentials', async () => {
      await expect(
        login({
          username: loginPayload.username,
          password: 'wrongpassword',
        })
      ).rejects.toThrow();
    });

    it('should fail with non-existent user', async () => {
      await expect(
        login({
          username: 'nonexistentuser',
          password: loginPayload.password,
        })
      ).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it.skip('should refresh a valid token', async () => {
      // Skip if no refresh token from login test
      if (!refreshTokenString) {
        return;
      }

      const refreshData: RefreshTokenPayload = {
        refreshToken: refreshTokenString,
      };

      const result = await refreshToken(refreshData);

      // Check response structure
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      
      // JWT tokens
      expect(typeof result.accessToken).toBe('string');
      expect(result.accessToken.length).toBeGreaterThan(20);
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken.length).toBeGreaterThan(20);
      
      // Tokens should be different
      expect(result.refreshToken).not.toBe(refreshTokenString);

      // Save new refresh token for logout test
      refreshTokenString = result.refreshToken;
    });

    it('should fail with invalid refresh token', async () => {
      const refreshData: RefreshTokenPayload = {
        refreshToken: 'invalid-token',
      };

      await expect(refreshToken(refreshData)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it.skip('should log out a user with valid refresh token', async () => {
      // Skip if no refresh token from previous tests
      if (!refreshTokenString) {
        return;
      }

      const logoutData: LogoutPayload = {
        refreshToken: refreshTokenString,
      };

      const result = await logout(logoutData);

      // Check response
      expect(result).toBeDefined();
      expect(result.message).toBe('Logged out successfully');
    });

    it.skip('should not fail with invalid refresh token', async () => {
      const logoutData: LogoutPayload = {
        refreshToken: 'invalid-token',
      };

      // Should not throw error for security reasons
      const result = await logout(logoutData);
      
      // Should still return success message
      expect(result).toBeDefined();
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('revokeAllTokens', () => {
    it.skip('should revoke all tokens for a user', async () => {
      // First login to create a token
      await login(loginPayload);
      
      // Then revoke all tokens
      const result = await revokeAllTokens({ userId });

      // Check response
      expect(result).toBeDefined();
      expect(result.count).toBeGreaterThanOrEqual(1);
    });

    it('should fail with non-existent user', async () => {
      await expect(revokeAllTokens({ userId: 999999 })).rejects.toThrow();
    });

    it('should fail with invalid user ID', async () => {
      await expect(revokeAllTokens({ userId: NaN })).rejects.toThrow();
    });
  });
}); 