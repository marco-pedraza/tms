import { describe, it, expect, beforeEach } from 'vitest';
import { createBaseRepository } from '../src/base-repository';
import { db } from './helpers/db';
import {
  softDeleteUsers,
  softDeletePosts,
  SoftDeleteUser,
  CreateSoftDeleteUser,
  SoftDeletePost,
  CreateSoftDeletePost,
} from './schemas/soft-delete-tables';
import { DependencyExistsError } from '../src/errors';

describe('Dependency Validation', () => {
  // Repository with dependency validation enabled
  const softDeleteUserRepository = createBaseRepository<
    SoftDeleteUser,
    CreateSoftDeleteUser,
    Partial<CreateSoftDeleteUser>,
    typeof softDeleteUsers
  >(db, softDeleteUsers, 'SoftDeleteUser', {
    softDeleteEnabled: true,
    checkDependenciesOnSoftDelete: true, // Enable dependency validation
  });

  // Repository for posts (without dependency validation)
  const softDeletePostRepository = createBaseRepository<
    SoftDeletePost,
    CreateSoftDeletePost,
    Partial<CreateSoftDeletePost>,
    typeof softDeletePosts
  >(db, softDeletePosts, 'SoftDeletePost', {
    softDeleteEnabled: true,
  });

  beforeEach(async () => {
    // Clean up any existing data
    await db.delete(softDeletePosts);
    await db.delete(softDeleteUsers);
  });

  async function createTestUser(
    data: Partial<CreateSoftDeleteUser> = {},
  ): Promise<SoftDeleteUser> {
    const userData: CreateSoftDeleteUser = {
      name: 'Test User',
      email: 'test@example.com',
      ...data,
    };
    return await softDeleteUserRepository.create(userData);
  }

  async function createTestPost(
    userId: number,
    data: Partial<CreateSoftDeletePost> = {},
  ): Promise<SoftDeletePost> {
    const postData: CreateSoftDeletePost = {
      title: 'Test Post',
      content: 'Test content',
      userId,
      ...data,
    };
    return await softDeletePostRepository.create(postData);
  }

  describe('When dependency validation is enabled', () => {
    it('should prevent soft delete when there are active dependencies', async () => {
      // Create a user and a post that depends on it
      const user = await createTestUser({
        name: 'User with Posts',
        email: 'user.with.posts@example.com',
      });

      const post = await createTestPost(user.id, {
        title: 'Dependent Post',
        content: 'This post depends on the user',
      });

      // Try to soft delete the user - should fail because of the active post
      await expect(softDeleteUserRepository.delete(user.id)).rejects.toThrow(
        DependencyExistsError,
      );

      // Verify the user is still active
      const stillActiveUser = await softDeleteUserRepository.findOne(user.id);
      expect(stillActiveUser.deletedAt).toBeNull();

      // Verify the post is still active
      const stillActivePost = await softDeletePostRepository.findOne(post.id);
      expect(stillActivePost.userId).toBe(user.id);
    });

    it('should allow soft delete when dependencies are also soft deleted', async () => {
      // Create a user and a post that depends on it
      const user = await createTestUser({
        name: 'User with Posts',
        email: 'user.with.posts@example.com',
      });

      const post = await createTestPost(user.id, {
        title: 'Dependent Post',
        content: 'This post depends on the user',
      });

      // First soft delete the post (dependency)
      await softDeletePostRepository.delete(post.id);

      // Now soft delete the user should succeed
      const deletedUser = await softDeleteUserRepository.delete(user.id);
      expect(deletedUser.deletedAt).not.toBeNull();

      // Verify the user is soft deleted
      await expect(softDeleteUserRepository.findOne(user.id)).rejects.toThrow();
    });

    it('should allow soft delete when there are no dependencies', async () => {
      // Create a user without any posts
      const user = await createTestUser({
        name: 'User without Posts',
        email: 'user.without.posts@example.com',
      });

      // Soft delete should succeed
      const deletedUser = await softDeleteUserRepository.delete(user.id);
      expect(deletedUser.deletedAt).not.toBeNull();

      // Verify the user is soft deleted
      await expect(softDeleteUserRepository.findOne(user.id)).rejects.toThrow();
    });

    it('should work with deleteMany when there are no dependencies', async () => {
      // Create multiple users without dependencies
      const user1 = await createTestUser({
        name: 'User 1',
        email: 'user1@example.com',
      });

      const user2 = await createTestUser({
        name: 'User 2',
        email: 'user2@example.com',
      });

      // Soft delete multiple users should succeed
      const deletedUsers = await softDeleteUserRepository.deleteMany([
        user1.id,
        user2.id,
      ]);
      expect(deletedUsers).toHaveLength(2);
      expect(deletedUsers[0].deletedAt).not.toBeNull();
      expect(deletedUsers[1].deletedAt).not.toBeNull();
    });

    it('should prevent deleteMany when any user has dependencies', async () => {
      // Create users, one with dependencies and one without
      const user1 = await createTestUser({
        name: 'User 1',
        email: 'user1@example.com',
      });

      const user2 = await createTestUser({
        name: 'User 2',
        email: 'user2@example.com',
      });

      // Create a post for user2
      await createTestPost(user2.id, {
        title: 'Post for User 2',
        content: 'This post depends on user2',
      });

      // Try to delete both users - should fail because user2 has dependencies
      await expect(
        softDeleteUserRepository.deleteMany([user1.id, user2.id]),
      ).rejects.toThrow(DependencyExistsError);

      // Verify both users are still active
      const stillActiveUser1 = await softDeleteUserRepository.findOne(user1.id);
      expect(stillActiveUser1.deletedAt).toBeNull();

      const stillActiveUser2 = await softDeleteUserRepository.findOne(user2.id);
      expect(stillActiveUser2.deletedAt).toBeNull();
    });
  });

  describe('When dependency validation is disabled (default behavior)', () => {
    // Repository without dependency validation (default behavior)
    const regularUserRepository = createBaseRepository<
      SoftDeleteUser,
      CreateSoftDeleteUser,
      Partial<CreateSoftDeleteUser>,
      typeof softDeleteUsers
    >(db, softDeleteUsers, 'SoftDeleteUser', {
      softDeleteEnabled: true,
      // checkDependenciesOnSoftDelete: false (default)
    });

    it('should allow soft delete even when there are active dependencies', async () => {
      // Create a user and a post that depends on it
      const user = await regularUserRepository.create({
        name: 'User with Posts',
        email: 'user.with.posts@example.com',
      });

      const post = await softDeletePostRepository.create({
        title: 'Dependent Post',
        content: 'This post depends on the user',
        userId: user.id,
      });

      // Soft delete the user - should succeed even with active dependencies
      const deletedUser = await regularUserRepository.delete(user.id);
      expect(deletedUser.deletedAt).not.toBeNull();

      // Verify the user is soft deleted
      await expect(regularUserRepository.findOne(user.id)).rejects.toThrow();

      // Verify the post is still active and references the soft-deleted user
      const stillActivePost = await softDeletePostRepository.findOne(post.id);
      expect(stillActivePost.userId).toBe(user.id);
    });
  });
});
