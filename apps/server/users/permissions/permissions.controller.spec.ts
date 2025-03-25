import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPermission,
  getPermission,
  listPermissions,
  listPermissionsWithPagination,
  updatePermission,
  deletePermission,
} from './permissions.controller';
import { permissionHandler } from './permissions.handler';
import { APIError } from 'encore.dev/api';
import { NotFoundError, DuplicateError } from '../../shared/errors';

// Mock the permission handler
vi.mock('./permissions.handler', () => {
  return {
    permissionHandler: {
      create: vi.fn(),
      findOne: vi.fn(),
      findAll: vi.fn(),
      findAllPaginated: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe('Permission Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPermission', () => {
    it('should create a permission successfully', async () => {
      const mockPermission = {
        id: 1,
        code: 'TEST_PERMISSION',
        name: 'Test Permission',
        description: 'A test permission',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const payload = {
        code: 'TEST_PERMISSION',
        name: 'Test Permission',
        description: 'A test permission',
      };

      vi.mocked(permissionHandler.create).mockResolvedValue(mockPermission);

      const result = await createPermission(payload);

      expect(permissionHandler.create).toHaveBeenCalledWith(payload);
      expect(result).toEqual(mockPermission);
    });

    it('should handle duplicate error', async () => {
      const payload = {
        code: 'TEST_PERMISSION',
        name: 'Test Permission',
        description: 'A test permission',
      };

      vi.mocked(permissionHandler.create).mockRejectedValue(
        new DuplicateError(
          'Permission with code TEST_PERMISSION already exists',
        ),
      );

      await expect(createPermission(payload)).rejects.toThrow(APIError);
      expect(permissionHandler.create).toHaveBeenCalledWith(payload);
    });
  });

  describe('getPermission', () => {
    it('should get a permission by ID', async () => {
      const mockPermission = {
        id: 1,
        code: 'TEST_PERMISSION',
        name: 'Test Permission',
        description: 'A test permission',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(permissionHandler.findOne).mockResolvedValue(mockPermission);

      const result = await getPermission({ id: 1 });

      expect(permissionHandler.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPermission);
    });

    it('should handle not found error', async () => {
      vi.mocked(permissionHandler.findOne).mockRejectedValue(
        new NotFoundError('Permission with id 1 not found'),
      );

      await expect(getPermission({ id: 1 })).rejects.toThrow(APIError);
      expect(permissionHandler.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('listPermissions', () => {
    it('should list all permissions', async () => {
      const mockPermissions = {
        permissions: [
          {
            id: 1,
            code: 'TEST_PERMISSION_1',
            name: 'Test Permission 1',
            description: 'A test permission 1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 2,
            code: 'TEST_PERMISSION_2',
            name: 'Test Permission 2',
            description: 'A test permission 2',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      vi.mocked(permissionHandler.findAll).mockResolvedValue(mockPermissions);

      const result = await listPermissions();

      expect(permissionHandler.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockPermissions);
    });
  });

  describe('listPermissionsWithPagination', () => {
    it('should list permissions with pagination', async () => {
      const mockPaginatedPermissions = {
        data: [
          {
            id: 1,
            code: 'TEST_PERMISSION_1',
            name: 'Test Permission 1',
            description: 'A test permission 1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 2,
            code: 'TEST_PERMISSION_2',
            name: 'Test Permission 2',
            description: 'A test permission 2',
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

      vi.mocked(permissionHandler.findAllPaginated).mockResolvedValue(
        mockPaginatedPermissions,
      );

      const result = await listPermissionsWithPagination(paginationParams);

      expect(permissionHandler.findAllPaginated).toHaveBeenCalledWith(
        paginationParams,
      );
      expect(result).toEqual(mockPaginatedPermissions);
    });
  });

  describe('updatePermission', () => {
    it('should update a permission', async () => {
      const mockPermission = {
        id: 1,
        code: 'TEST_PERMISSION',
        name: 'Updated Permission Name',
        description: 'Updated description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatePayload = {
        id: 1,
        name: 'Updated Permission Name',
        description: 'Updated description',
      };

      vi.mocked(permissionHandler.update).mockResolvedValue(mockPermission);

      const result = await updatePermission(updatePayload);

      expect(permissionHandler.update).toHaveBeenCalledWith(1, {
        name: 'Updated Permission Name',
        description: 'Updated description',
      });
      expect(result).toEqual(mockPermission);
    });

    it('should handle not found error', async () => {
      const updatePayload = {
        id: 1,
        name: 'Updated Permission Name',
        description: 'Updated description',
      };

      vi.mocked(permissionHandler.update).mockRejectedValue(
        new NotFoundError('Permission with id 1 not found'),
      );

      await expect(updatePermission(updatePayload)).rejects.toThrow(APIError);
      expect(permissionHandler.update).toHaveBeenCalledWith(1, {
        name: 'Updated Permission Name',
        description: 'Updated description',
      });
    });
  });

  describe('deletePermission', () => {
    it('should delete a permission', async () => {
      const mockPermission = {
        id: 1,
        code: 'TEST_PERMISSION',
        name: 'Test Permission',
        description: 'A test permission',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(permissionHandler.delete).mockResolvedValue(mockPermission);

      const result = await deletePermission({ id: 1 });

      expect(permissionHandler.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPermission);
    });

    it('should handle not found error', async () => {
      vi.mocked(permissionHandler.delete).mockRejectedValue(
        new NotFoundError('Permission with id 1 not found'),
      );

      await expect(deletePermission({ id: 1 })).rejects.toThrow(APIError);
      expect(permissionHandler.delete).toHaveBeenCalledWith(1);
    });
  });
});
