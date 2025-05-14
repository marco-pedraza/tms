import { desc, eq, inArray } from 'drizzle-orm';
import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { permissions } from '../permissions/permissions.schema';
import { permissionGroups } from './permission-groups.schema';
import type {
  CreatePermissionGroupPayload,
  PermissionGroup,
  PermissionGroups,
  UpdatePermissionGroupPayload,
} from './permission-groups.types';

export const createPermissionGroupRepository = () => {
  const baseRepository = createBaseRepository<
    PermissionGroup,
    CreatePermissionGroupPayload,
    UpdatePermissionGroupPayload,
    typeof permissionGroups
  >(db, permissionGroups, 'PermissionGroup');

  const create = async (
    data: CreatePermissionGroupPayload,
  ): Promise<PermissionGroup> => {
    const { permissionIds, ...groupData } = data;

    // If there are no permission IDs, just create the group
    if (!permissionIds || permissionIds.length === 0) {
      return await baseRepository.create(groupData);
    }

    // Use a transaction to create the group and assign permissions
    return await baseRepository.transaction(async (txRepo, tx) => {
      // Create the permission group
      const createdGroup = await txRepo.create(groupData);

      // Update permissions to be associated with this group using inArray for better performance
      if (permissionIds.length > 0) {
        await tx
          .update(permissions)
          .set({ permissionGroupId: createdGroup.id })
          .where(inArray(permissions.id, permissionIds));
      }

      return createdGroup;
    });
  };

  const update = async (
    id: number,
    data: UpdatePermissionGroupPayload,
  ): Promise<PermissionGroup> => {
    const { permissionIds, ...groupData } = data;

    // If there are no permission IDs, just update the group data
    if (!permissionIds) {
      return await baseRepository.update(id, groupData);
    }

    // Use a transaction to update the group and reassign permissions
    return await baseRepository.transaction(async (txRepo, tx) => {
      // First check if the group exists

      // Update the group data
      const updatedGroup = await txRepo.update(id, groupData);

      // Remove this group ID from any permissions currently assigned to it
      await tx
        .update(permissions)
        .set({ permissionGroupId: null })
        .where(eq(permissions.permissionGroupId, id));

      // Assign the specified permissions to this group using inArray for better performance
      if (permissionIds.length > 0) {
        await tx
          .update(permissions)
          .set({ permissionGroupId: id })
          .where(inArray(permissions.id, permissionIds));
      }

      return updatedGroup;
    });
  };

  const findAll = async (): Promise<PermissionGroups> => {
    const allPermissionGroups = await db.query.permissionGroups.findMany({
      orderBy: [desc(permissionGroups.createdAt)],
      with: {
        permissions: true,
      },
    });

    return { permissionGroups: allPermissionGroups };
  };

  return {
    ...baseRepository,
    create,
    update,
    findAll,
  };
};

export const permissionGroupRepository = createPermissionGroupRepository();
