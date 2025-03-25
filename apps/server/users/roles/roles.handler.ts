import { db } from '../../db';
import { DuplicateError } from '../../shared/errors';
import { roles, rolePermissions } from './roles.schema';
import { permissions } from '../permissions/permissions.schema';
import { eq, and } from 'drizzle-orm';
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
import { BaseHandler } from '../../shared/base-handler';
import {
  getRelatedEntities,
  updateManyToManyRelation,
} from '../../shared/db-utils';

/**
 * Handler for role operations
 */
class RoleHandler extends BaseHandler<
  Role,
  CreateRolePayload,
  UpdateRolePayload
> {
  constructor() {
    super(roles, 'Role');
  }

  /**
   * Creates a new role
   * @param data - Role data to create
   * @returns Created role with permissions
   */
  async create(data: CreateRolePayload): Promise<RoleWithPermissions> {
    const { permissionIds, ...roleData } = data;

    await this.validateUniqueName(roleData.name, roleData.tenantId);
    const role = await super.create(roleData);

    if (permissionIds && permissionIds.length > 0) {
      await this.assignPermissions(role.id, { permissionIds });
    }

    return await this.findOneWithPermissions(role.id);
  }

  /**
   * Finds a role by ID with its permissions
   * @param id - ID of the role to find
   * @returns Found role with permissions
   * @throws {NotFoundError} If the role is not found
   */
  async findOneWithPermissions(id: number): Promise<RoleWithPermissions> {
    const role = await this.findOne(id);
    const permissionList = await getRelatedEntities<Permission>(
      permissions,
      rolePermissions,
      rolePermissions.roleId,
      id,
      rolePermissions.permissionId,
    );

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
  async findAll(
    includePermissions = false,
  ): Promise<Roles | RolesWithPermissions> {
    const rolesList = await super.findAll();

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
    const result = await super.findAllPaginated(params);

    if (!includePermissions) {
      return result as PaginatedRoles;
    }

    const rolesWithPermissions = await Promise.all(
      result.data.map(async (role) => {
        return await this.findOneWithPermissions(role.id);
      }),
    );

    return {
      data: rolesWithPermissions,
      pagination: result.pagination,
    };
  }

  /**
   * Updates a role
   * @param id - ID of the role to update
   * @param data - Role data to update
   * @returns Updated role with permissions
   * @throws {NotFoundError} If the role is not found
   */
  async update(
    id: number,
    data: UpdateRolePayload,
  ): Promise<RoleWithPermissions> {
    const role = await this.findOne(id);

    if (data.name && data.name !== role.name) {
      await this.validateUniqueName(data.name, role.tenantId, id);
    }

    await super.update(id, data);
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

    await updateManyToManyRelation(
      rolePermissions,
      rolePermissions.roleId,
      id,
      rolePermissions.permissionId,
      data.permissionIds,
    );

    return await this.findOneWithPermissions(id);
  }

  /**
   * Validates that a role name is unique within a tenant
   * @param name - Name to validate
   * @param tenantId - ID of the tenant
   * @param excludeId - Optional ID to exclude from the check
   * @throws {DuplicateError} If a role with the same name already exists
   */
  private async validateUniqueName(
    name: string,
    tenantId: number,
    excludeId?: number,
  ): Promise<void> {
    const query = excludeId
      ? and(
          eq(roles.name, name),
          eq(roles.tenantId, tenantId),
          eq(roles.id, excludeId).not(),
        )
      : and(eq(roles.name, name), eq(roles.tenantId, tenantId));

    const [result] = await db
      .select({ count: db.fn.count(roles.id) })
      .from(roles)
      .where(query);

    if (Number(result.count) > 0) {
      throw new DuplicateError(
        `Role with name ${name} already exists in this tenant`,
      );
    }
  }
}

export const roleHandler = new RoleHandler();
