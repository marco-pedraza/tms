import { describe, it, expect, afterAll } from 'vitest';
import {
  login,
  refreshToken,
  logout,
  revokeAllTokens
} from './auth.controller';
import type {
  LoginPayload,
  RefreshTokenPayload,
  LogoutPayload
} from './auth.types';
import { createTenant, deleteTenant } from '../tenants/tenants.controller';
import type { CreateTenantPayload } from '../tenants/tenants.types';
import {
  createDepartment,
  deleteDepartment
} from '../departments/departments.controller';
import type { CreateDepartmentPayload } from '../departments/departments.types';
import {
  createUser,
  deleteUser
} from '../users/users.controller';
import type { CreateUserPayload } from '../users/users.types';

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
    username: 'authuser',
    email: 'auth.user@test.com',
    password: 'SecurePassword123',
    firstName: 'Auth',
    lastName: 'User',
    phone: '+1234567890',
    position: 'Auth Test User',
    employeeId: 'AUTH001',
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

    it('should create test user', async () => {
      const result = await createUser({
        ...testUser,
        tenantId,
        departmentId,
      });
      userId = result.id;
      expect(userId).toBeGreaterThan(0);
    });
  });

  describe('login', () => {
    it('should authenticate a user with valid credentials', async () => {
      const loginPayload: LoginPayload = {
        username: testUser.username,
        password: testUser.password,
      };

      const result = await login(loginPayload);

      // Store tokens for later tests
      accessToken = result.accessToken;
      refreshTokenString = result.refreshToken;

      // Verify response
      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
      expect(result.accessToken.length).toBeGreaterThan(0);
      
      expect(result.refreshToken).toBeDefined();
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken.length).toBeGreaterThan(0);
      
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(userId);
      expect(result.user.username).toBe(testUser.username);
      expect(result.user.firstName).toBe(testUser.firstName);
      expect(result.user.lastName).toBe(testUser.lastName);
      expect(result.user.email).toBe(testUser.email);
      expect(result.user.tenantId).toBe(tenantId);
      expect(result.user.isActive).toBe(true);
      // Verify passwordHash is not returned
      expect(result.user.passwordHash).toBeUndefined();
      // Verify lastLogin field is updated
      expect(result.user.lastLogin).toBeDefined();
    });

    it('should fail to authenticate with invalid username', async () => {
      const loginPayload: LoginPayload = {
        username: 'nonexistentuser',
        password: testUser.password,
      };

      await expect(login(loginPayload)).rejects.toThrow();
    });

    it('should fail to authenticate with invalid password', async () => {
      const loginPayload: LoginPayload = {
        username: testUser.username,
        password: 'wrongpassword',
      };

      await expect(login(loginPayload)).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens with a valid refresh token', async () => {
      const refreshPayload: RefreshTokenPayload = {
        refreshToken: refreshTokenString,
      };

      const result = await refreshToken(refreshPayload);

      // Update tokens for later tests
      accessToken = result.accessToken;
      refreshTokenString = result.refreshToken;

      // Verify response
      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
      expect(result.accessToken.length).toBeGreaterThan(0);
      
      expect(result.refreshToken).toBeDefined();
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken.length).toBeGreaterThan(0);
      
      // User data should not be returned from refresh
      expect(result.user).toBeUndefined();
    });

    it('should fail to refresh with an invalid refresh token', async () => {
      const refreshPayload: RefreshTokenPayload = {
        refreshToken: 'invalid.refresh.token',
      };

      await expect(refreshToken(refreshPayload)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should successfully logout with a valid refresh token', async () => {
      const logoutPayload: LogoutPayload = {
        refreshToken: refreshTokenString,
      };

      const result = await logout(logoutPayload);

      // Verify response
      expect(result.message).toBeDefined();
      expect(result.message).toBe('Logged out successfully');
    });

    it('should return success response even with invalid token', async () => {
      const logoutPayload: LogoutPayload = {
        refreshToken: 'invalid.token',
      };

      const result = await logout(logoutPayload);

      // Should still return success to prevent user enumeration
      expect(result.message).toBeDefined();
      expect(result.message).toBe('Logged out successfully');
    });

    it('should fail to use a revoked refresh token', async () => {
      const refreshPayload: RefreshTokenPayload = {
        refreshToken: refreshTokenString,
      };

      // Try to use the already revoked token
      await expect(refreshToken(refreshPayload)).rejects.toThrow();
    });
  });

  describe('revokeAllTokens', () => {
    // First log in again to get a valid token
    let newRefreshToken = '';
    
    it('should login to get a new token', async () => {
      const loginPayload: LoginPayload = {
        username: testUser.username,
        password: testUser.password,
      };

      const result = await login(loginPayload);
      newRefreshToken = result.refreshToken;
      expect(newRefreshToken.length).toBeGreaterThan(0);
    });

    it('should revoke all tokens for a user', async () => {
      const result = await revokeAllTokens({ userId });

      // Verify response
      expect(result.count).toBeDefined();
      expect(typeof result.count).toBe('number');
      expect(result.count).toBeGreaterThan(0); // At least one token should be revoked
    });

    it('should fail to use tokens after revocation', async () => {
      const refreshPayload: RefreshTokenPayload = {
        refreshToken: newRefreshToken,
      };

      // Try to use the revoked token
      await expect(refreshToken(refreshPayload)).rejects.toThrow();
    });

    it('should fail to revoke tokens for non-existent user', async () => {
      await expect(revokeAllTokens({ userId: 999999 })).rejects.toThrow();
    });
  });
}); 