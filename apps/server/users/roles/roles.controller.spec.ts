import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createRole,
  getRole,
  getRoleWithPermissions,
  listRoles,
  listRolesWithPermissions,
  listRolesByTenant,
  listRolesByTenantWithPermissions,
  listRolesWithPagination,
  listRolesWithPermissionsAndPagination,
  updateRole,
  assignPermissionsToRole,
  deleteRole,
} from './roles.controller';
import { roleHandler } from './roles.handler';
import { APIError } from 'encore.dev/api';
import { NotFoundError, DuplicateError } from '../../shared/errors';

// Mock the role handler
vi.mock('./roles.handler', () => {
  return {
    roleHandler: {
      create: vi.fn(),
      findOne: vi.fn(),
      findOneWithPermissions: vi.fn(),
      findAll: vi.fn(),
      findAllByTenant: vi.fn(),
      findAllPaginated: vi.fn(),
      update: vi.fn(),
      assignPermissions: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe('Role Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRole', () => {
    it('should create a role successfully', async () => {
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

      const payload = {
        name: 'Test Role',
        description: 'A test role',
        tenantId: 1,
        permissionIds: [1],
      };

      vi.mocked(roleHandler.create).mockResolvedValue(mockRole);

      const result = await createRole(payload);

      expect(roleHandler.create).toHaveBeenCalledWith(payload);
      expect(result).toEqual(mockRole);
    });

    it('should handle duplicate error', async () => {
      const payload = {
        name: 'Test Role',
        description: 'A test role',
        tenantId: 1,
        permissionIds: [1],
      };

      vi.mocked(roleHandler.create).mockRejectedValue(
        new DuplicateError('Role with name Test Role already exists in this tenant'),
      );

      await expect(createRole(payload)).rejects.toThrow(APIError);
      expect(roleHandler.create).toHaveBeenCalledWith(payload);
    });
  });

  describe('getRole', () => {
    it('should get a role by ID', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        description: 'A test role',
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(roleHandler.findOne).mockResolvedValue(mockRole);

      const result = await getRole({ id: 1 });

      expect(roleHandler.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRole);
    });

    it('should handle not found error', async () => {
      vi.mocked(roleHandler.findOne).mockRejectedValue(
        new NotFoundError('Role with id 1 not found'),
      );

      await expect(getRole({ id: 1 })).rejects.toThrow(APIError);
      expect(roleHandler.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('getRoleWithPermissions', () => {
    it('should get a role with permissions by ID', async () => {
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

      vi.mocked(roleHandler.findOneWithPermissions).mockResolvedValue(mockRole);

      const result = await getRoleWithPermissions({ id: 1 });

      expect(roleHandler.findOneWithPermissions).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRole);
    });

    it('should handle not found error', async () => {
      vi.mocked(roleHandler.findOneWithPermissions).mockRejectedValue(
        new NotFoundError('Role with id 1 not found'),
      );

      await expect(getRoleWithPermissions({ id: 1 })).rejects.toThrow(APIError);
      expect(roleHandler.findOneWithPermissions).toHaveBeenCalledWith(1);
    });
  });

  describe('listRoles', () => {
    it('should list all roles', async () => {
      const mockRoles = {
        roles: [
          {
            id: 1,
            name: 'Test Role 1',
            description: 'A test role 1',
            tenantId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 2,
            name: 'Test Role 2',
            description: 'A test role 2',
            tenantId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      vi.mocked(roleHandler.findAll).mockResolvedValue(mockRoles);

      const result = await listRoles();

      expect(roleHandler.findAll).toHaveBeenCalledWith(false);
      expect(result).toEqual(mockRoles);
    });
  });

  describe('listRolesWithPermissions', () => {
    it('should list all roles with permissions', async () => {
      const mockPermission = {
        id: 1,
        code: 'TEST_PERMISSION',
        name: 'Test Permission',
        description: 'A test permission',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRolesWithPermissions = {
        roles: [
          {
            id: 1,
            name: 'Test Role 1',
            description: 'A test role 1',
            tenantId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            permissions: [mockPermission],
          },
          {
            id: 2,
            name: 'Test Role 2',
            description: 'A test role 2',
            tenantId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            permissions: [mockPermission],
          },
        ],
      };

      vi.mocked(roleHandler.findAll).mockResolvedValue(mockRolesWithPermissions);

      const result = await listRolesWithPermissions();

      expect(roleHandler.findAll).toHaveBeenCalledWith(true);
      expect(result).toEqual(mockRolesWithPermissions);
    });
  });

  describe('listRolesByTenant', () => {
    it('should list roles by tenant', async () => {
      const mockRoles = {
        roles: [
          {
            id: 1,
            name: 'Test Role 1',
            description: 'A test role 1',
            tenantId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 2,
            name: 'Test Role 2',
            description: 'A test role 2',
            tenantId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      vi.mocked(roleHandler.findAllByTenant).mockResolvedValue(mockRoles);

      const result = await listRolesByTenant({ tenantId: 1 });

      expect(roleHandler.findAllByTenant).toHaveBeenCalledWith(1, false);
      expect(result).toEqual(mockRoles);
    });
  });

  describe('listRolesByTenantWithPermissions', () => {
    it('should list roles with permissions by tenant', async () => {
      const mockPermission = {
        id: 1,
        code: 'TEST_PERMISSION',
        name: 'Test Permission',
        description: 'A test permission',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRolesWithPermissions = {
        roles: [
          {
            id: 1,
            name: 'Test Role 1',
            description: 'A test role 1',
            tenantId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            permissions: [mockPermission],
          },
          {
            id: 2,
            name: 'Test Role 2',
            description: 'A test role 2',
            tenantId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            permissions: [mockPermission],
          },
        ],
      };

      vi.mocked(roleHandler.findAllByTenant).mockResolvedValue(mockRolesWithPermissions);

      const result = await listRolesByTenantWithPermissions({ tenantId: 1 });

      expect(roleHandler.findAllByTenant).toHaveBeenCalledWith(1, true);
      expect(result).toEqual(mockRolesWithPermissions);
    });
  });

  describe('listRolesWithPagination', () => {
    it('should list roles with pagination', async () => {
      const mockPaginatedRoles = {
        data: [
          {
            id: 1,
            name: 'Test Role 1',
            description: 'A test role 1',
            tenantId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 2,
            name: 'Test Role 2',
            description: 'A test role 2',
            tenantId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1,
        },
      };

      const paginationParams = { page: 1, pageSize: 10 };

      vi.mocked(roleHandler.findAllPaginated).mockResolvedValue(mockPaginatedRoles);

      const result = await listRolesWithPagination(paginationParams);

      expect(roleHandler.findAllPaginated).toHaveBeenCalledWith(paginationParams, false);
      expect(result).toEqual(mockPaginatedRoles);
    });
  });

  describe('listRolesWithPermissionsAndPagination', () => {
    it('should list roles with permissions and pagination', async () => {
      const mockPermission = {
        id: 1,
        code: 'TEST_PERMISSION',
        name: 'Test Permission',
        description: 'A test permission',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPaginatedRolesWithPermissions = {
        data: [
          {
            id: 1,
            name: 'Test Role 1',
            description: 'A test role 1',
            tenantId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            permissions: [mockPermission],
          },
          {
            id: 2,
            name: 'Test Role 2',
            description: 'A test role 2',
            tenantId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            permissions: [mockPermission],
          },
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1,
        },
      };

      const paginationParams = { page: 1, pageSize: 10 };

      vi.mocked(roleHandler.findAllPaginated).mockResolvedValue(
        mockPaginatedRolesWithPermissions,
      );

      const result = await listRolesWithPermissionsAndPagination(paginationParams);

      expect(roleHandler.findAllPaginated).toHaveBeenCalledWith(paginationParams, true);
      expect(result).toEqual(mockPaginatedRolesWithPermissions);
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      const mockPermission = {
        id: 1,
        code: 'TEST_PERMISSION',
        name: 'Test Permission',
        description: 'A test permission',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedRole = {
        id: 1,
        name: 'Updated Role Name',
        description: 'Updated description',
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [mockPermission],
      };

      const updatePayload = {
        id: 1,
        name: 'Updated Role Name',
        description: 'Updated description',
      };

      vi.mocked(roleHandler.update).mockResolvedValue(mockUpdatedRole);

      const result = await updateRole(updatePayload);

      expect(roleHandler.update).toHaveBeenCalledWith(1, {
        name: 'Updated Role Name',
        description: 'Updated description',
      });
      expect(result).toEqual(mockUpdatedRole);
    });

    it('should handle not found error', async () => {
      const updatePayload = {
        id: 1,
        name: 'Updated Role Name',
        description: 'Updated description',
      };

      vi.mocked(roleHandler.update).mockRejectedValue(
        new NotFoundError('Role with id 1 not found'),
      );

      await expect(updateRole(updatePayload)).rejects.toThrow(APIError);
      expect(roleHandler.update).toHaveBeenCalledWith(1, {
        name: 'Updated Role Name',
        description: 'Updated description',
      });
    });
  });

  describe('assignPermissionsToRole', () => {
    it('should assign permissions to a role', async () => {
      const mockPermission = {
        id: 1,
        code: 'TEST_PERMISSION',
        name: 'Test Permission',
        description: 'A test permission',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRoleWithPermissions = {
        id: 1,
        name: 'Test Role',
        description: 'A test role',
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [mockPermission],
      };

      const payload = {
        id: 1,
        permissionIds: [1],
      };

      vi.mocked(roleHandler.assignPermissions).mockResolvedValue(mockRoleWithPermissions);

      const result = await assignPermissionsToRole(payload);

      expect(roleHandler.assignPermissions).toHaveBeenCalledWith(1, { permissionIds: [1] });
      expect(result).toEqual(mockRoleWithPermissions);
    });

    it('should handle not found error', async () => {
      const payload = {
        id: 1,
        permissionIds: [1],
      };

      vi.mocked(roleHandler.assignPermissions).mockRejectedValue(
        new NotFoundError('Role with id 1 not found'),
      );

      await expect(assignPermissionsToRole(payload)).rejects.toThrow(APIError);
      expect(roleHandler.assignPermissions).toHaveBeenCalledWith(1, { permissionIds: [1] });
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        description: 'A test role',
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(roleHandler.delete).mockResolvedValue(mockRole);

      const result = await deleteRole({ id: 1 });

      expect(roleHandler.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRole);
    });

    it('should handle not found error', async () => {
      vi.mocked(roleHandler.delete).mockRejectedValue(
        new NotFoundError('Role with id 1 not found'),
      );

      await expect(deleteRole({ id: 1 })).rejects.toThrow(APIError);
      expect(roleHandler.delete).toHaveBeenCalledWith(1);
    });
  });
}); 