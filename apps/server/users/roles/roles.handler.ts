import { db } from '../../db';
import { NotFoundError, ValidationError, DuplicateError } from '../../shared/errors';
import { roles, rolePermissions } from './roles.schema';
import { permissions } from '../permissions/permissions.schema';
import { eq, and, inArray } from 'drizzle-orm';
import type {
  Role,
  RoleWithPermissions,
  CreateRolePayload,
  UpdateRolePayload,
  Roles,
  RolesWithPermissions,
  PaginatedRoles,
  PaginatedRolesWithPermissions,
  AssignPermissionsToRolePayload,
} from './roles.types';
import { PaginationParams } from '../../shared/types';
import { Permission } from '../permissions/permissions.types';
import { permissionHandler } from '../permissions/permissions.handler';

/**
 * Handler for role operations
 */
class RoleHandler {
  /**
   * Creates a new role
   * @param data - Role data to create
   * @returns Created role with permissions
   */
  async create(data: CreateRolePayload): Promise<RoleWithPermissions> {
    const { permissionIds, ...roleData } = data;

    try {
      await this.validateUniqueName(roleData.name, roleData.tenantId);

      const [role] = await db.insert(roles).values(roleData).returning();

      if (permissionIds && permissionIds.length > 0) {
        await this.assignPermissions(role.id, { permissionIds });
      }

      return await this.findOneWithPermissions(role.id);
    } catch (error) {
      if (error instanceof DuplicateError) {
        throw error;
      }

      throw new ValidationError(
        `Failed to create role: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Finds a role by ID
   * @param id - ID of the role to find
   * @returns Found role
   * @throws {NotFoundError} If the role is not found
   */
  async findOne(id: number): Promise<Role> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);

    if (!role) {
      throw new NotFoundError(`Role with id ${id} not found`);
    }

    return role;
  }

  /**
   * Finds a role by ID with its permissions
   * @param id - ID of the role to find
   * @returns Found role with permissions
   * @throws {NotFoundError} If the role is not found
   */
  async findOneWithPermissions(id: number): Promise<RoleWithPermissions> {
    const role = await this.findOne(id);
    const rolePermissionsList = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, id));

    let permissionList: Permission[] = [];
    
    if (rolePermissionsList.length > 0) {
      const permissionIds = rolePermissionsList.map((rp) => rp.permissionId);
      permissionList = await db
        .select()
        .from(permissions)
        .where(inArray(permissions.id, permissionIds));
    }

    return {
      ...role,
      permissions: permissionList,
    };
  }

  /**
   * Finds all roles with optional permissions
   * @param includePermissions - Whether to include permissions in the result
   * @returns All roles
   */
  async findAll(includePermissions = false): Promise<Roles | RolesWithPermissions> {
    const rolesList = await db.select().from(roles);

    if (!includePermissions) {
      return { roles: rolesList };
    }

    const rolesWithPermissions = await Promise.all(
      rolesList.map(async (role) => {
        return await this.findOneWithPermissions(role.id);
      }),
    );

    return { roles: rolesWithPermissions };
  }

  /**
   * Finds all roles for a tenant
   * @param tenantId - ID of the tenant
   * @param includePermissions - Whether to include permissions in the result
   * @returns All roles for the tenant
   */
  async findAllByTenant(
    tenantId: number,
    includePermissions = false,
  ): Promise<Roles | RolesWithPermissions> {
    const rolesList = await db
      .select()
      .from(roles)
      .where(eq(roles.tenantId, tenantId));

    if (!includePermissions) {
      return { roles: rolesList };
    }

    const rolesWithPermissions = await Promise.all(
      rolesList.map(async (role) => {
        return await this.findOneWithPermissions(role.id);
      }),
    );

    return { roles: rolesWithPermissions };
  }

  /**
   * Finds all roles with pagination
   * @param params - Pagination parameters
   * @param includePermissions - Whether to include permissions in the result
   * @returns Paginated roles
   */
  async findAllPaginated(
    params: PaginationParams,
    includePermissions = false,
  ): Promise<PaginatedRoles | PaginatedRolesWithPermissions> {
    const { page = 1, pageSize = 10 } = params;
    const offset = (page - 1) * pageSize;

    const [{ count }] = await db
      .select({ count: db.fn.count(roles.id) })
      .from(roles);

    const result = await db.select().from(roles).limit(pageSize).offset(offset);

    if (!includePermissions) {
      return {
        data: result,
        pagination: {
          page,
          pageSize,
          totalItems: Number(count),
          totalPages: Math.ceil(Number(count) / pageSize),
        },
      };
    }

    const rolesWithPermissions = await Promise.all(
      result.map(async (role) => {
        return await this.findOneWithPermissions(role.id);
      }),
    );

    return {
      data: rolesWithPermissions,
      pagination: {
        page,
        pageSize,
        totalItems: Number(count),
        totalPages: Math.ceil(Number(count) / pageSize),
      },
    };
  }

  /**
   * Updates a role
   * @param id - ID of the role to update
   * @param data - Role data to update
   * @returns Updated role with permissions
   * @throws {NotFoundError} If the role is not found
   */
  async update(id: number, data: UpdateRolePayload): Promise<RoleWithPermissions> {
    const role = await this.findOne(id);

    if (data.name && data.name !== role.name) {
      await this.validateUniqueName(data.name, role.tenantId, id);
    }

    await db
      .update(roles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(roles.id, id));

    return await this.findOneWithPermissions(id);
  }

  /**
   * Deletes a role
   * @param id - ID of the role to delete
   * @returns Deleted role
   * @throws {NotFoundError} If the role is not found
   */
  async delete(id: number): Promise<Role> {
    const role = await this.findOne(id);

    // Role permissions will be automatically deleted due to CASCADE

    await db.delete(roles).where(eq(roles.id, id));

    return role;
  }

  /**
   * Assigns permissions to a role
   * @param id - ID of the role
   * @param data - Permission IDs to assign
   * @returns Role with updated permissions
   * @throws {NotFoundError} If the role or any permission is not found
   */
  async assignPermissions(
    id: number,
    data: AssignPermissionsToRolePayload,
  ): Promise<RoleWithPermissions> {
    await this.findOne(id);

    // Validate all permissions exist
    await Promise.all(
      data.permissionIds.map(async (permissionId) => {
        await permissionHandler.findOne(permissionId);
      }),
    );

    // Delete existing permissions
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));

    // Add new permissions
    if (data.permissionIds.length > 0) {
      await db.insert(rolePermissions).values(
        data.permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
      );
    }

    return await this.findOneWithPermissions(id);
  }

  /**
   * Validates that a role name is unique within a tenant
   * @param name - Name to validate
   * @param tenantId - Tenant ID
   * @param excludeId - Role ID to exclude from validation
   * @throws {DuplicateError} If a role with the same name already exists in the tenant
   */
  private async validateUniqueName(
    name: string,
    tenantId: number,
    excludeId?: number,
  ): Promise<void> {
    let query = db
      .select()
      .from(roles)
      .where(and(eq(roles.name, name), eq(roles.tenantId, tenantId)));

    if (excludeId) {
      query = query.where(eq(roles.id, excludeId).invert());
    }

    const [existing] = await query.limit(1);

    if (existing) {
      throw new DuplicateError(
        `Role with name ${name} already exists in this tenant`,
      );
    }
  }
}

export const roleHandler = new RoleHandler(); 