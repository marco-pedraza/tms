import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUserWithRoles,
  getUserWithPermissions,
  assignRolesToUser,
  assignPermissionsToUser,
  checkUserPermission,
  checkUserRole,
} from './user-permissions.controller';
import { userPermissionsHandler } from './user-permissions.handler';
import { APIError } from 'encore.dev/api';
import { NotFoundError, UnauthorizedError } from '../../shared/errors';

// Mock the user permissions handler
vi.mock('./user-permissions.handler', () => {
  return {
    userPermissionsHandler: {
      getUserWithRoles: vi.fn(),
      getUserWithPermissions: vi.fn(),
      assignRoles: vi.fn(),
      assignPermissions: vi.fn(),
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
    },
  };
});

describe('User Permissions Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserWithRoles', () => {
    it('should get a user with roles by ID', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        description: 'A test role',
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUserWithRoles = {
        id: 1,
        tenantId: 1,
        departmentId: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '123456789',
        position: 'Developer',
        employeeId: 'EMP001',
        mfaSettings: null,
        lastLogin: null,
        isActive: true,
        isSystemAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [mockRole],
      };

      vi.mocked(userPermissionsHandler.getUserWithRoles).mockResolvedValue(
        mockUserWithRoles,
      );

      const result = await getUserWithRoles({ userId: 1 });

      expect(userPermissionsHandler.getUserWithRoles).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUserWithRoles);
    });

    it('should handle not found error', async () => {
      vi.mocked(userPermissionsHandler.getUserWithRoles).mockRejectedValue(
        new NotFoundError('User with id 1 not found'),
      );

      await expect(getUserWithRoles({ userId: 1 })).rejects.toThrow(APIError);
      expect(userPermissionsHandler.getUserWithRoles).toHaveBeenCalledWith(1);
    });
  });

  describe('getUserWithPermissions', () => {
    it('should get a user with permissions by ID', async () => {
      const mockPermission = {
        id: 1,
        code: 'TEST_PERMISSION',
        name: 'Test Permission',
        description: 'A test permission',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRole = {
        id: 1,
        name: 'Test Role',
        description: 'A test role',
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [mockPermission],
      };

      const mockUserWithPermissions = {
        id: 1,
        tenantId: 1,
        departmentId: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '123456789',
        position: 'Developer',
        employeeId: 'EMP001',
        mfaSettings: null,
        lastLogin: null,
        isActive: true,
        isSystemAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        directPermissions: [],
        roles: [mockRole],
        effectivePermissions: [mockPermission],
      };

      vi.mocked(
        userPermissionsHandler.getUserWithPermissions,
      ).mockResolvedValue(mockUserWithPermissions);

      const result = await getUserWithPermissions({ userId: 1 });

      expect(
        userPermissionsHandler.getUserWithPermissions,
      ).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUserWithPermissions);
    });

    it('should handle not found error', async () => {
      vi.mocked(
        userPermissionsHandler.getUserWithPermissions,
      ).mockRejectedValue(new NotFoundError('User with id 1 not found'));

      await expect(getUserWithPermissions({ userId: 1 })).rejects.toThrow(
        APIError,
      );
      expect(
        userPermissionsHandler.getUserWithPermissions,
      ).toHaveBeenCalledWith(1);
    });
  });

  describe('assignRolesToUser', () => {
    it('should assign roles to a user', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        description: 'A test role',
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUserWithRoles = {
        id: 1,
        tenantId: 1,
        departmentId: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '123456789',
        position: 'Developer',
        employeeId: 'EMP001',
        mfaSettings: null,
        lastLogin: null,
        isActive: true,
        isSystemAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [mockRole],
      };

      const payload = {
        userId: 1,
        roleIds: [1],
      };

      vi.mocked(userPermissionsHandler.assignRoles).mockResolvedValue(
        mockUserWithRoles,
      );

      const result = await assignRolesToUser(payload);

      expect(userPermissionsHandler.assignRoles).toHaveBeenCalledWith(1, {
        roleIds: [1],
      });
      expect(result).toEqual(mockUserWithRoles);
    });

    it('should handle not found error', async () => {
      const payload = {
        userId: 1,
        roleIds: [1],
      };

      vi.mocked(userPermissionsHandler.assignRoles).mockRejectedValue(
        new NotFoundError('User with id 1 not found'),
      );

      await expect(assignRolesToUser(payload)).rejects.toThrow(APIError);
      expect(userPermissionsHandler.assignRoles).toHaveBeenCalledWith(1, {
        roleIds: [1],
      });
    });
  });

  describe('assignPermissionsToUser', () => {
    it('should assign permissions to a user', async () => {
      const mockPermission = {
        id: 1,
        code: 'TEST_PERMISSION',
        name: 'Test Permission',
        description: 'A test permission',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRole = {
        id: 1,
        name: 'Test Role',
        description: 'A test role',
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [mockPermission],
      };

      const mockUserWithPermissions = {
        id: 1,
        tenantId: 1,
        departmentId: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '123456789',
        position: 'Developer',
        employeeId: 'EMP001',
        mfaSettings: null,
        lastLogin: null,
        isActive: true,
        isSystemAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        directPermissions: [mockPermission],
        roles: [mockRole],
        effectivePermissions: [mockPermission],
      };

      const payload = {
        userId: 1,
        permissionIds: [1],
      };

      vi.mocked(userPermissionsHandler.assignPermissions).mockResolvedValue(
        mockUserWithPermissions,
      );

      const result = await assignPermissionsToUser(payload);

      expect(userPermissionsHandler.assignPermissions).toHaveBeenCalledWith(1, {
        permissionIds: [1],
      });
      expect(result).toEqual(mockUserWithPermissions);
    });

    it('should handle not found error', async () => {
      const payload = {
        userId: 1,
        permissionIds: [1],
      };

      vi.mocked(userPermissionsHandler.assignPermissions).mockRejectedValue(
        new NotFoundError('User with id 1 not found'),
      );

      await expect(assignPermissionsToUser(payload)).rejects.toThrow(APIError);
      expect(userPermissionsHandler.assignPermissions).toHaveBeenCalledWith(1, {
        permissionIds: [1],
      });
    });
  });

  describe('checkUserPermission', () => {
    it('should return true if a user has a permission', async () => {
      vi.mocked(userPermissionsHandler.hasPermission).mockResolvedValue(
        undefined,
      );

      const result = await checkUserPermission({
        userId: 1,
        permissionCode: 'TEST_PERMISSION',
      });

      expect(userPermissionsHandler.hasPermission).toHaveBeenCalledWith(
        1,
        'TEST_PERMISSION',
      );
      expect(result).toEqual({ hasPermission: true });
    });

    it('should return false if a user does not have a permission', async () => {
      vi.mocked(userPermissionsHandler.hasPermission).mockRejectedValue(
        new UnauthorizedError(
          'User lacks required permission: TEST_PERMISSION',
        ),
      );

      const result = await checkUserPermission({
        userId: 1,
        permissionCode: 'TEST_PERMISSION',
      });

      expect(userPermissionsHandler.hasPermission).toHaveBeenCalledWith(
        1,
        'TEST_PERMISSION',
      );
      expect(result).toEqual({ hasPermission: false });
    });

    it('should return false if the user is not found', async () => {
      vi.mocked(userPermissionsHandler.hasPermission).mockRejectedValue(
        new NotFoundError('User with id 1 not found'),
      );

      const result = await checkUserPermission({
        userId: 1,
        permissionCode: 'TEST_PERMISSION',
      });

      expect(userPermissionsHandler.hasPermission).toHaveBeenCalledWith(
        1,
        'TEST_PERMISSION',
      );
      expect(result).toEqual({ hasPermission: false });
    });

    it('should handle other errors gracefully', async () => {
      vi.mocked(userPermissionsHandler.hasPermission).mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(
        checkUserPermission({ userId: 1, permissionCode: 'TEST_PERMISSION' }),
      ).rejects.toThrow(APIError);
      expect(userPermissionsHandler.hasPermission).toHaveBeenCalledWith(
        1,
        'TEST_PERMISSION',
      );
    });
  });

  describe('checkUserRole', () => {
    it('should return true if a user has a role', async () => {
      vi.mocked(userPermissionsHandler.hasRole).mockResolvedValue(undefined);

      const result = await checkUserRole({ userId: 1, roleId: 1 });

      expect(userPermissionsHandler.hasRole).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual({ hasRole: true });
    });

    it('should return false if a user does not have a role', async () => {
      vi.mocked(userPermissionsHandler.hasRole).mockRejectedValue(
        new UnauthorizedError('User lacks required role with ID: 1'),
      );

      const result = await checkUserRole({ userId: 1, roleId: 1 });

      expect(userPermissionsHandler.hasRole).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual({ hasRole: false });
    });

    it('should return false if the user is not found', async () => {
      vi.mocked(userPermissionsHandler.hasRole).mockRejectedValue(
        new NotFoundError('User with id 1 not found'),
      );

      const result = await checkUserRole({ userId: 1, roleId: 1 });

      expect(userPermissionsHandler.hasRole).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual({ hasRole: false });
    });

    it('should handle other errors gracefully', async () => {
      vi.mocked(userPermissionsHandler.hasRole).mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(checkUserRole({ userId: 1, roleId: 1 })).rejects.toThrow(
        APIError,
      );
      expect(userPermissionsHandler.hasRole).toHaveBeenCalledWith(1, 1);
    });
  });
});
