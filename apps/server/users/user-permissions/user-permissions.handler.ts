import { db } from '../../db';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { userRoles, userPermissions } from './user-permissions.schema';
import { roles, rolePermissions } from '../roles/roles.schema';
import { permissions } from '../permissions/permissions.schema';
import { users } from '../users/users.schema';
import { eq, inArray } from 'drizzle-orm';
import type {
  AssignPermissionsToUserPayload,
  AssignRolesToUserPayload,
  UserWithPermissions,
  UserWithRoles,
} from './user-permissions.types';
import { Permission } from '../permissions/permissions.types';
import { Role, RoleWithPermissions } from '../roles/roles.types';
import { permissionHandler } from '../permissions/permissions.handler';
import { roleHandler } from '../roles/roles.handler';
import { userHandler } from '../users/users.handler';

/**
 * Handler for user permissions operations
 */
class UserPermissionsHandler {
  /**
   * Assigns roles to a user
   * @param userId - ID of the user
   * @param data - Role IDs to assign
   * @returns User with roles
   * @throws {NotFoundError} If the user or any role is not found
   */
  async assignRoles(
    userId: number,
    data: AssignRolesToUserPayload,
  ): Promise<UserWithRoles> {
    const user = await userHandler.findOne(userId);

    // Validate all roles exist
    await Promise.all(
      data.roleIds.map(async (roleId) => {
        await roleHandler.findOne(roleId);
      }),
    );

    // Delete existing roles
    await db.delete(userRoles).where(eq(userRoles.userId, userId));

    // Add new roles
    if (data.roleIds.length > 0) {
      await db.insert(userRoles).values(
        data.roleIds.map((roleId) => ({
          userId,
          roleId,
        })),
      );
    }

    return await this.getUserWithRoles(userId);
  }

  /**
   * Assigns permissions directly to a user
   * @param userId - ID of the user
   * @param data - Permission IDs to assign
   * @returns User with permissions
   * @throws {NotFoundError} If the user or any permission is not found
   */
  async assignPermissions(
    userId: number,
    data: AssignPermissionsToUserPayload,
  ): Promise<UserWithPermissions> {
    const user = await userHandler.findOne(userId);

    // Validate all permissions exist
    await Promise.all(
      data.permissionIds.map(async (permissionId) => {
        await permissionHandler.findOne(permissionId);
      }),
    );

    // Delete existing direct permissions
    await db.delete(userPermissions).where(eq(userPermissions.userId, userId));

    // Add new direct permissions
    if (data.permissionIds.length > 0) {
      await db.insert(userPermissions).values(
        data.permissionIds.map((permissionId) => ({
          userId,
          permissionId,
        })),
      );
    }

    return await this.getUserWithPermissions(userId);
  }

  /**
   * Gets a user with their assigned roles
   * @param userId - ID of the user
   * @returns User with roles
   * @throws {NotFoundError} If the user is not found
   */
  async getUserWithRoles(userId: number): Promise<UserWithRoles> {
    const user = await userHandler.findOne(userId);
    const { passwordHash, ...safeUser } = user;

    const userRolesList = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId));

    let rolesList: Role[] = [];
    
    if (userRolesList.length > 0) {
      const roleIds = userRolesList.map((ur) => ur.roleId);
      rolesList = await db
        .select()
        .from(roles)
        .where(inArray(roles.id, roleIds));
    }

    return {
      ...safeUser,
      roles: rolesList,
    };
  }

  /**
   * Gets a user with their assigned permissions
   * @param userId - ID of the user
   * @returns User with permissions
   * @throws {NotFoundError} If the user is not found
   */
  async getUserWithPermissions(userId: number): Promise<UserWithPermissions> {
    const user = await userHandler.findOne(userId);
    const { passwordHash, ...safeUser } = user;

    // Get direct permissions
    const userPermissionsList = await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    let directPermissionsList: Permission[] = [];
    
    if (userPermissionsList.length > 0) {
      const permissionIds = userPermissionsList.map((up) => up.permissionId);
      directPermissionsList = await db
        .select()
        .from(permissions)
        .where(inArray(permissions.id, permissionIds));
    }

    // Get roles with permissions
    const userRolesList = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId));

    let rolesWithPermissions: RoleWithPermissions[] = [];
    
    if (userRolesList.length > 0) {
      const roleIds = userRolesList.map((ur) => ur.roleId);
      rolesWithPermissions = await Promise.all(
        roleIds.map(async (roleId) => {
          return await roleHandler.findOneWithPermissions(roleId);
        }),
      );
    }

    // Calculate effective permissions (direct + from roles, removing duplicates)
    const allPermissions = [
      ...directPermissionsList,
      ...rolesWithPermissions.flatMap((role) => role.permissions),
    ];

    // Remove duplicates by ID
    const uniquePermissions = [...new Map(allPermissions.map((p) => [p.id, p])).values()];

    return {
      ...safeUser,
      directPermissions: directPermissionsList,
      roles: rolesWithPermissions,
      effectivePermissions: uniquePermissions,
    };
  }

  /**
   * Checks if a user has a specific permission
   * @param userId - ID of the user
   * @param permissionCode - Permission code to check
   * @returns Whether the user has the permission
   */
  async hasPermission(userId: number, permissionCode: string): Promise<boolean> {
    try {
      const user = await this.getUserWithPermissions(userId);
      
      return user.effectivePermissions.some((p) => p.code === permissionCode);
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if a user has a role
   * @param userId - ID of the user
   * @param roleId - Role ID to check
   * @returns Whether the user has the role
   */
  async hasRole(userId: number, roleId: number): Promise<boolean> {
    try {
      const user = await this.getUserWithRoles(userId);
      
      return user.roles.some((r) => r.id === roleId);
    } catch (error) {
      return false;
    }
  }
}

export const userPermissionsHandler = new UserPermissionsHandler(); 