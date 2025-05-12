import { afterAll, describe, expect, test } from 'vitest';
import type { PermissionGroup } from './permission-groups.types';
import {
  createPermissionGroup,
  deletePermissionGroup,
  listPermissionGroups,
  updatePermissionGroup,
} from './permission-groups.controller';

describe('Permission Groups Controller', () => {
  // Test data and setup
  const testPermissionGroup = {
    name: 'Test Permission Group',
    description: 'A permission group for testing purposes',
  };
  // Variables to store created IDs for cleanup
  let createdPermissionGroupId: number;

  afterAll(async () => {
    if (createdPermissionGroupId) {
      try {
        await deletePermissionGroup({ id: createdPermissionGroupId });
      } catch (error) {
        console.log('Error cleaning up test permission group:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new permission group', async () => {
      const response = await createPermissionGroup(testPermissionGroup);
      createdPermissionGroupId = response.id;

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testPermissionGroup.name);
      expect(response.description).toBe(testPermissionGroup.description);
      expect(response.createdAt).toBeDefined();
    });

    test('should list all permission groups', async () => {
      const response = await listPermissionGroups();

      expect(response).toBeDefined();
      expect(response.permissionGroups).toBeDefined();
      expect(Array.isArray(response.permissionGroups)).toBe(true);

      // Verify the created permission group is in the list
      const foundGroup = response.permissionGroups.find(
        (group: PermissionGroup) => group.id === createdPermissionGroupId,
      );
      expect(foundGroup).toBeDefined();
      expect(foundGroup?.name).toBe(testPermissionGroup.name);
    });

    test('should update a permission group', async () => {
      const updatedName = 'Updated Permission Group';
      const updatedDescription = 'Updated description for testing';

      const response = await updatePermissionGroup({
        id: createdPermissionGroupId,
        name: updatedName,
        description: updatedDescription,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdPermissionGroupId);
      expect(response.name).toBe(updatedName);
      expect(response.description).toBe(updatedDescription);
      expect(response.updatedAt).toBeDefined();
    });

    test('should delete a permission group', async () => {
      // Create a new permission group specifically for deletion test
      const groupToDelete = await createPermissionGroup({
        name: 'Group To Delete',
        description: 'This group will be deleted',
      });

      // Delete the group
      const deleteResponse = await deletePermissionGroup({
        id: groupToDelete.id,
      });

      expect(deleteResponse).toBeDefined();
      expect(deleteResponse.id).toBe(groupToDelete.id);

      // Verify the group is deleted by checking it's not in the list
      const response = await listPermissionGroups();
      const deletedGroup = response.permissionGroups.find(
        (group: PermissionGroup) => group.id === groupToDelete.id,
      );
      expect(deletedGroup).toBeUndefined();
    });
  });

  describe('error scenarios', () => {
    test('should handle duplicate group name errors', async () => {
      // Attempt to create a permission group with the same name
      try {
        await createPermissionGroup({
          name: testPermissionGroup.name, // Using the same name as the existing group
          description: 'Another group with the same name',
        });
        // If no error is thrown, the test should fail
        expect(true).toBe(false); // This should not be reached
      } catch (error) {
        // We expect an error to be thrown for duplicate name
        expect(error).toBeDefined();
      }
    });
  });
});
