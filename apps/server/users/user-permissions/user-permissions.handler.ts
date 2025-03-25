import { db } from '../../db';
import { NotFoundError, UnauthorizedError } from '../../shared/errors';
import { userRoles, userPermissions } from './user-permissions.schema';
import { roles } from '../roles/roles.schema';
import { permissions } from '../permissions/permissions.schema';
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
    // Validate user exists
    await userHandler.findOne(userId);

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
    // Validate user exists
    await userHandler.findOne(userId);

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
    
    // Create a safe user object without sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    
    // Create a safe user object without sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
   * @throws {UnauthorizedError} If the user doesn't have the required permission
   */
  async hasPermission(userId: number, permissionCode: string): Promise<void> {
    try {
      const user = await this.getUserWithPermissions(userId);
      
      const hasPermission = user.effectivePermissions.some((p) => p.code === permissionCode);
      
      if (!hasPermission) {
        throw new UnauthorizedError(`User lacks required permission: ${permissionCode}`);
      }
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new NotFoundError(`User with id ${userId} not found`);
    }
  }

  /**
   * Checks if a user has a role
   * @param userId - ID of the user
   * @param roleId - Role ID to check
   * @throws {UnauthorizedError} If the user doesn't have the required role
   */
  async hasRole(userId: number, roleId: number): Promise<void> {
    try {
      const user = await this.getUserWithRoles(userId);
      
      const hasRole = user.roles.some((r) => r.id === roleId);
      
      if (!hasRole) {
        throw new UnauthorizedError(`User lacks required role with ID: ${roleId}`);
      }
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new NotFoundError(`User with id ${userId} not found`);
    }
  }
}

export const userPermissionsHandler = new UserPermissionsHandler(); 