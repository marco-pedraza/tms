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
import {
  createDepartment,
  deleteDepartment,
} from '../departments/departments.controller';
import type { CreateDepartmentPayload } from '../departments/departments.types';
import { authRepository } from './auth.repository';

describe('Auth Controller', () => {
  // Test data for reuse
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

  describe('login', () => {
    // Setup for login tests
    let tenantId = 0;
    let departmentId = 0;
    let userId = 0;
    // This variable is necessary for storing the token during tests
    // even though it might appear unused in this specific scope
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let refreshTokenString = '';

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
      try {
        // Clean up in the correct order to respect foreign key constraints

        // 1. First revoke all refresh tokens for the user
        if (userId > 0) {
          try {
            await revokeAllTokens({ userId });

            // Try to directly delete tokens from repository
            const tokens = await authRepository.findAllBy('userId', userId, {
              orderBy: [],
            });
            for (const token of tokens) {
              try {
                await authRepository.delete(token.id);
              } catch {
                // Ignore errors
              }
            }
          } catch {
            // Ignore errors
          }
        }

        // 2. Now delete the user
        if (userId > 0) {
          try {
            await deleteUser({ id: userId });
          } catch {
            // Ignore errors
          }
        }

        // 3. Delete the department
        if (departmentId > 0) {
          try {
            await deleteDepartment({ id: departmentId });
          } catch {
            // Ignore errors
          }
        }

        // 4. Delete the tenant
        if (tenantId > 0) {
          try {
            await deleteTenant({ id: tenantId });
          } catch {
            // Ignore errors
          }
        }
      } catch {
        // Ignore errors
      }
    });

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
        }),
      ).rejects.toThrow();
    });

    it('should fail with non-existent user', async () => {
      await expect(
        login({
          username: 'nonexistentuser',
          password: loginPayload.password,
        }),
      ).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    // Setup for refresh token tests
    let tenantId = 0;
    let departmentId = 0;
    let userId = 0;
    let refreshTokenString = '';

    beforeAll(async () => {
      // Create tenant
      const tenant = await createTenant({
        ...testTenant,
        code: `${testTenant.code}-REFRESH`,
      });
      tenantId = tenant.id;

      // Create department
      const department = await createDepartment({
        ...testDepartment,
        code: `${testDepartment.code}-REFRESH`,
        tenantId,
      });
      departmentId = department.id;

      // Create test user
      const user = await createUser({
        ...testUser,
        username: `${testUser.username}_refresh`,
        email: `refresh.${testUser.email}`,
        tenantId,
        departmentId,
      });
      userId = user.id;

      // Login to get refresh token
      const result = await login({
        username: `${testUser.username}_refresh`,
        password: testUser.password,
      });

      refreshTokenString = result.refreshToken;

      // Add a small delay to ensure token is properly saved and validated
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    afterAll(async () => {
      try {
        // Clean up in the correct order
        if (userId > 0) {
          try {
            await revokeAllTokens({ userId });
            const tokens = await authRepository.findAllBy('userId', userId, {
              orderBy: [],
            });
            for (const token of tokens) {
              try {
                await authRepository.delete(token.id);
              } catch {
                // Ignore errors
              }
            }
          } catch {
            // Ignore errors
          }
        }

        if (userId > 0)
          try {
            await deleteUser({ id: userId });
          } catch {
            /* Ignore errors */
          }
        if (departmentId > 0)
          try {
            await deleteDepartment({ id: departmentId });
          } catch {
            /* Ignore errors */
          }
        if (tenantId > 0)
          try {
            await deleteTenant({ id: tenantId });
          } catch {
            /* Ignore errors */
          }
      } catch {
        // Ignore errors
      }
    });

    it('should refresh a valid token', async () => {
      // Skip if no refresh token from login test
      if (!refreshTokenString) {
        return;
      }

      // Add a small delay to ensure token is ready for refresh
      await new Promise((resolve) => setTimeout(resolve, 500));

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

      // Add a small delay before the test completes
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    it('should fail with invalid refresh token', async () => {
      const refreshData: RefreshTokenPayload = {
        refreshToken: 'invalid-token',
      };

      await expect(refreshToken(refreshData)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    // Setup for logout tests
    let tenantId = 0;
    let departmentId = 0;
    let userId = 0;
    let refreshTokenString = '';

    beforeAll(async () => {
      // Create tenant
      const tenant = await createTenant({
        ...testTenant,
        code: `${testTenant.code}-LOGOUT`,
      });
      tenantId = tenant.id;

      // Create department
      const department = await createDepartment({
        ...testDepartment,
        code: `${testDepartment.code}-LOGOUT`,
        tenantId,
      });
      departmentId = department.id;

      // Create test user
      const user = await createUser({
        ...testUser,
        username: `${testUser.username}_logout`,
        email: `logout.${testUser.email}`,
        tenantId,
        departmentId,
      });
      userId = user.id;

      // Login to get refresh token
      const result = await login({
        username: `${testUser.username}_logout`,
        password: testUser.password,
      });

      refreshTokenString = result.refreshToken;
    });

    afterAll(async () => {
      try {
        // Clean up in the correct order
        if (userId > 0) {
          try {
            await revokeAllTokens({ userId });
            const tokens = await authRepository.findAllBy('userId', userId, {
              orderBy: [],
            });
            for (const token of tokens) {
              try {
                await authRepository.delete(token.id);
              } catch {
                // Ignore errors
              }
            }
          } catch {
            // Ignore errors
          }
        }

        if (userId > 0)
          try {
            await deleteUser({ id: userId });
          } catch {
            /* Ignore errors */
          }
        if (departmentId > 0)
          try {
            await deleteDepartment({ id: departmentId });
          } catch {
            /* Ignore errors */
          }
        if (tenantId > 0)
          try {
            await deleteTenant({ id: tenantId });
          } catch {
            /* Ignore errors */
          }
      } catch {
        // Ignore errors
      }
    });

    it('should log out a user with valid refresh token', async () => {
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

    it('should not fail with invalid refresh token', async () => {
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
    // Setup for revoke tokens tests
    let tenantId = 0;
    let departmentId = 0;
    let userId = 0;

    beforeAll(async () => {
      // Create tenant
      const tenant = await createTenant({
        ...testTenant,
        code: `${testTenant.code}-REVOKE`,
      });
      tenantId = tenant.id;

      // Create department
      const department = await createDepartment({
        ...testDepartment,
        code: `${testDepartment.code}-REVOKE`,
        tenantId,
      });
      departmentId = department.id;

      // Create test user
      const user = await createUser({
        ...testUser,
        username: `${testUser.username}_revoke`,
        email: `revoke.${testUser.email}`,
        tenantId,
        departmentId,
      });
      userId = user.id;
    });

    afterAll(async () => {
      try {
        // Clean up in the correct order
        if (userId > 0) {
          try {
            const tokens = await authRepository.findAllBy('userId', userId, {
              orderBy: [],
            });
            for (const token of tokens) {
              try {
                await authRepository.delete(token.id);
              } catch {
                // Ignore errors
              }
            }
          } catch {
            // Ignore errors
          }
        }

        if (userId > 0)
          try {
            await deleteUser({ id: userId });
          } catch {
            /* Ignore errors */
          }
        if (departmentId > 0)
          try {
            await deleteDepartment({ id: departmentId });
          } catch {
            /* Ignore errors */
          }
        if (tenantId > 0)
          try {
            await deleteTenant({ id: tenantId });
          } catch {
            /* Ignore errors */
          }
      } catch {
        // Ignore errors
      }
    });

    it('should revoke all tokens for a user', async () => {
      // First login to create a token
      await login({
        username: `${testUser.username}_revoke`,
        password: testUser.password,
      });

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
