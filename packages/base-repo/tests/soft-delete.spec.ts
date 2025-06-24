import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db, closePool } from './helpers/db';
import {
  softDeleteUsers,
  regularUsers,
  softDeletePosts,
  SoftDeleteUser,
  CreateSoftDeleteUser,
  UpdateSoftDeleteUser,
  RegularUser,
  CreateRegularUser,
  UpdateRegularUser,
  SoftDeletePost,
  CreateSoftDeletePost,
} from './schemas/soft-delete-tables';
import { cleanDatabase, createSchema } from './helpers/reset-db';
import { createBaseRepository } from '../src/base-repository';
import { NotFoundError, SoftDeleteNotConfiguredError } from '../src/errors';
import { sql } from 'drizzle-orm';

describe('Soft Delete Functionality', () => {
  // Repository with soft delete enabled
  const softDeleteUserRepository = createBaseRepository<
    SoftDeleteUser,
    CreateSoftDeleteUser,
    UpdateSoftDeleteUser,
    typeof softDeleteUsers
  >(db, softDeleteUsers, 'SoftDeleteUser', {
    softDeleteEnabled: true,
    searchableFields: [softDeleteUsers.name, softDeleteUsers.email],
  });

  // Repository without soft delete for comparison
  const regularUserRepository = createBaseRepository<
    RegularUser,
    CreateRegularUser,
    UpdateRegularUser,
    typeof regularUsers
  >(db, regularUsers, 'RegularUser', {
    searchableFields: [regularUsers.name, regularUsers.email],
  });

  // Repository with soft delete for posts
  const softDeletePostRepository = createBaseRepository<
    SoftDeletePost,
    CreateSoftDeletePost,
    Partial<CreateSoftDeletePost>,
    typeof softDeletePosts
  >(db, softDeletePosts, 'SoftDeletePost', {
    softDeleteEnabled: true,
    searchableFields: [softDeletePosts.title],
  });

  // Global setup
  beforeAll(async () => {
    await createSchema();
  });

  afterAll(async () => {
    await closePool();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  // Helper functions
  async function createTestSoftDeleteUser(
    data: Partial<CreateSoftDeleteUser> = {},
  ): Promise<SoftDeleteUser> {
    const userData: CreateSoftDeleteUser = {
      name: 'Test User',
      email: 'test@example.com',
      ...data,
    };
    return await softDeleteUserRepository.create(userData);
  }

  async function createTestRegularUser(
    data: Partial<CreateRegularUser> = {},
  ): Promise<RegularUser> {
    const userData: CreateRegularUser = {
      name: 'Regular User',
      email: 'regular@example.com',
      ...data,
    };
    return await regularUserRepository.create(userData);
  }

  describe('Configuration Validation', () => {
    it('should throw error when calling forceDelete on repository without soft delete', async () => {
      await expect(regularUserRepository.forceDelete(1)).rejects.toThrow(
        SoftDeleteNotConfiguredError,
      );
    });

    it('should throw error when calling restore on repository without soft delete', async () => {
      await expect(regularUserRepository.restore(1)).rejects.toThrow(
        SoftDeleteNotConfiguredError,
      );
    });

    it('should include correct error message for forceDelete', async () => {
      await expect(regularUserRepository.forceDelete(1)).rejects.toThrow(
        'forceDelete operation requires softDeleteEnabled: true in repository config',
      );
    });

    it('should include correct error message for restore', async () => {
      await expect(regularUserRepository.restore(1)).rejects.toThrow(
        'restore operation requires softDeleteEnabled: true in repository config',
      );
    });
  });

  describe('Soft Delete Behavior', () => {
    describe('delete() method', () => {
      it('should soft delete when soft delete is enabled', async () => {
        const user = await createTestSoftDeleteUser();

        const deletedUser = await softDeleteUserRepository.delete(user.id);

        expect(deletedUser.id).toBe(user.id);
        expect(deletedUser.deletedAt).toBeInstanceOf(Date);
        expect(deletedUser.deletedAt).not.toBeNull();
      });

      it('should hard delete when soft delete is disabled', async () => {
        const user = await createTestRegularUser();

        const deletedUser = await regularUserRepository.delete(user.id);

        expect(deletedUser.id).toBe(user.id);

        // Verify user is completely removed from database
        await expect(regularUserRepository.findOne(user.id)).rejects.toThrow(
          NotFoundError,
        );
      });

      it('should not find soft deleted users in subsequent queries', async () => {
        const user = await createTestSoftDeleteUser();

        await softDeleteUserRepository.delete(user.id);

        // Should not find the soft deleted user
        await expect(softDeleteUserRepository.findOne(user.id)).rejects.toThrow(
          NotFoundError,
        );
      });
    });

    describe('deleteMany() method', () => {
      it('should soft delete multiple users when soft delete is enabled', async () => {
        const user1 = await createTestSoftDeleteUser({
          email: 'user1@test.com',
        });
        const user2 = await createTestSoftDeleteUser({
          email: 'user2@test.com',
        });
        const user3 = await createTestSoftDeleteUser({
          email: 'user3@test.com',
        });

        const deletedUsers = await softDeleteUserRepository.deleteMany([
          user1.id,
          user2.id,
          user3.id,
        ]);

        expect(deletedUsers).toHaveLength(3);
        deletedUsers.forEach((user) => {
          expect(user.deletedAt).toBeInstanceOf(Date);
          expect(user.deletedAt).not.toBeNull();
        });

        // Verify users are not found in queries
        await expect(
          softDeleteUserRepository.findOne(user1.id),
        ).rejects.toThrow(NotFoundError);
        await expect(
          softDeleteUserRepository.findOne(user2.id),
        ).rejects.toThrow(NotFoundError);
        await expect(
          softDeleteUserRepository.findOne(user3.id),
        ).rejects.toThrow(NotFoundError);
      });

      it('should hard delete multiple users when soft delete is disabled', async () => {
        const user1 = await createTestRegularUser({ email: 'reg1@test.com' });
        const user2 = await createTestRegularUser({ email: 'reg2@test.com' });

        const deletedUsers = await regularUserRepository.deleteMany([
          user1.id,
          user2.id,
        ]);

        expect(deletedUsers).toHaveLength(2);

        // Verify users are completely removed
        await expect(regularUserRepository.findOne(user1.id)).rejects.toThrow(
          NotFoundError,
        );
        await expect(regularUserRepository.findOne(user2.id)).rejects.toThrow(
          NotFoundError,
        );
      });

      it('should throw error if trying to soft delete already soft deleted users', async () => {
        const user1 = await createTestSoftDeleteUser({
          email: 'user1@test.com',
        });
        const user2 = await createTestSoftDeleteUser({
          email: 'user2@test.com',
        });

        // Soft delete user1
        await softDeleteUserRepository.delete(user1.id);

        // Try to delete both users (one already deleted)
        await expect(
          softDeleteUserRepository.deleteMany([user1.id, user2.id]),
        ).rejects.toThrow(NotFoundError);

        // Verify user2 is still active (transaction rollback)
        const stillExists = await softDeleteUserRepository.findOne(user2.id);
        expect(stillExists.deletedAt).toBeNull();
      });
    });
  });

  describe('Query Filtering', () => {
    let activeUser: SoftDeleteUser;
    let deletedUser: SoftDeleteUser;

    beforeEach(async () => {
      // Create users
      activeUser = await createTestSoftDeleteUser({
        name: 'Active User',
        email: 'active@test.com',
      });
      deletedUser = await createTestSoftDeleteUser({
        name: 'Deleted User',
        email: 'deleted@test.com',
      });

      // Soft delete one user
      await softDeleteUserRepository.delete(deletedUser.id);
    });

    describe('findAll()', () => {
      it('should only return active users', async () => {
        const users = await softDeleteUserRepository.findAll();

        expect(users).toHaveLength(1);
        expect(users[0].id).toBe(activeUser.id);
        expect(users[0].deletedAt).toBeNull();
      });

      it('should work with filters', async () => {
        const users = await softDeleteUserRepository.findAll({
          filters: { active: true },
        });

        expect(users).toHaveLength(1);
        expect(users[0].id).toBe(activeUser.id);
      });

      it('should work with search', async () => {
        const users = await softDeleteUserRepository.findAll({
          searchTerm: 'Active',
        });

        expect(users).toHaveLength(1);
        expect(users[0].id).toBe(activeUser.id);
      });
    });

    describe('findAllPaginated()', () => {
      it('should only return active users in pagination', async () => {
        const result = await softDeleteUserRepository.findAllPaginated({
          page: 1,
          pageSize: 10,
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe(activeUser.id);
        expect(result.pagination.totalCount).toBe(1);
      });
    });

    describe('findBy()', () => {
      it('should only find active users', async () => {
        const foundActive = await softDeleteUserRepository.findBy(
          softDeleteUsers.email,
          'active@test.com',
        );
        const foundDeleted = await softDeleteUserRepository.findBy(
          softDeleteUsers.email,
          'deleted@test.com',
        );

        expect(foundActive).not.toBeNull();
        expect(foundActive!.id).toBe(activeUser.id);
        expect(foundDeleted).toBeNull();
      });
    });

    describe('countAll()', () => {
      it('should only count active users', async () => {
        const count = await softDeleteUserRepository.countAll();
        expect(count).toBe(1);
      });

      it('should count with filters', async () => {
        const count = await softDeleteUserRepository.countAll({
          filters: { active: true },
        });
        expect(count).toBe(1);
      });
    });

    describe('existsBy()', () => {
      it('should only check existence for active users', async () => {
        const activeExists = await softDeleteUserRepository.existsBy(
          softDeleteUsers.email,
          'active@test.com',
        );
        const deletedExists = await softDeleteUserRepository.existsBy(
          softDeleteUsers.email,
          'deleted@test.com',
        );

        expect(activeExists).toBe(true);
        expect(deletedExists).toBe(false);
      });
    });

    describe('findByPaginated()', () => {
      it('should only return active users', async () => {
        const activeUser = await createTestSoftDeleteUser({
          email: 'findby-active@test.com',
          active: false, // Use false to make it unique
        });
        const userToDelete = await createTestSoftDeleteUser({
          email: 'findby-deleted@test.com',
          active: false, // Use false to make it unique
        });

        // Soft delete one user
        await softDeleteUserRepository.delete(userToDelete.id);

        const result = await softDeleteUserRepository.findByPaginated(
          softDeleteUsers.active,
          false, // Search for active: false
          { page: 1, pageSize: 10 },
        );

        // Should only find the active user (not the soft deleted one)
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe(activeUser.id);
        expect(result.data[0].email).toBe('findby-active@test.com');
        expect(result.pagination.totalCount).toBe(1);
      });

      it('should respect filters with soft delete', async () => {
        // Create two users with same active status but different emails
        const activeUser1 = await createTestSoftDeleteUser({
          email: `findby-filter-active-${Date.now()}-1@test.com`,
          active: false, // Use false to be different from other tests
        });
        const activeUser2 = await createTestSoftDeleteUser({
          email: `findby-filter-active-${Date.now()}-2@test.com`,
          active: false, // Same active status
        });

        // Soft delete the second user
        await softDeleteUserRepository.delete(activeUser2.id);

        // Search for users with active: false (should only find the first one)
        const result = await softDeleteUserRepository.findByPaginated(
          softDeleteUsers.active,
          false,
          {
            page: 1,
            pageSize: 10,
          },
        );

        // Should only find the non-deleted user with active: false
        const foundUser = result.data.find((u) => u.id === activeUser1.id);
        const deletedUser = result.data.find((u) => u.id === activeUser2.id);

        expect(foundUser).toBeDefined();
        expect(deletedUser).toBeUndefined(); // Should not find the soft deleted user
        expect(result.data.every((u) => u.active === false)).toBe(true);
      });
    });
  });

  describe('forceDelete() method', () => {
    it('should permanently delete an active user', async () => {
      const user = await createTestSoftDeleteUser();

      const deletedUser = await softDeleteUserRepository.forceDelete(user.id);

      expect(deletedUser.id).toBe(user.id);

      // Verify user is completely removed from database
      const result = await db
        .select()
        .from(softDeleteUsers)
        .where(sql`id = ${user.id}`);
      expect(result).toHaveLength(0);
    });

    it('should permanently delete a soft deleted user', async () => {
      const user = await createTestSoftDeleteUser();

      // First soft delete
      await softDeleteUserRepository.delete(user.id);

      // Then force delete
      const deletedUser = await softDeleteUserRepository.forceDelete(user.id);

      expect(deletedUser.id).toBe(user.id);

      // Verify user is completely removed from database
      const result = await db
        .select()
        .from(softDeleteUsers)
        .where(sql`id = ${user.id}`);
      expect(result).toHaveLength(0);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      await expect(softDeleteUserRepository.forceDelete(999)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('restore() method', () => {
    it('should restore a soft deleted user', async () => {
      const user = await createTestSoftDeleteUser();

      // Soft delete the user
      await softDeleteUserRepository.delete(user.id);

      // Restore the user
      const restoredUser = await softDeleteUserRepository.restore(user.id);

      expect(restoredUser.id).toBe(user.id);
      expect(restoredUser.deletedAt).toBeNull();

      // Verify user can be found again
      const foundUser = await softDeleteUserRepository.findOne(user.id);
      expect(foundUser.id).toBe(user.id);
      expect(foundUser.deletedAt).toBeNull();
    });

    it('should work for non-existent user (sets deletedAt to null)', async () => {
      // This tests the current implementation behavior
      // You might want to change this to throw NotFoundError if preferred
      await expect(softDeleteUserRepository.restore(999)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should restore already active user (idempotent)', async () => {
      const user = await createTestSoftDeleteUser();

      // Restore an already active user
      const restoredUser = await softDeleteUserRepository.restore(user.id);

      expect(restoredUser.id).toBe(user.id);
      expect(restoredUser.deletedAt).toBeNull();
    });
  });

  describe('Transaction Support', () => {
    it('should support soft delete in transactions', async () => {
      const user1 = await createTestSoftDeleteUser({ email: 'tx1@test.com' });
      const user2 = await createTestSoftDeleteUser({ email: 'tx2@test.com' });

      await softDeleteUserRepository.transaction(async (txRepo) => {
        await txRepo.delete(user1.id);
        await txRepo.delete(user2.id);
      });

      // Both users should be soft deleted
      await expect(softDeleteUserRepository.findOne(user1.id)).rejects.toThrow(
        NotFoundError,
      );
      await expect(softDeleteUserRepository.findOne(user2.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should support restore in transactions', async () => {
      const user = await createTestSoftDeleteUser();

      // Soft delete first
      await softDeleteUserRepository.delete(user.id);

      // Restore in transaction
      await softDeleteUserRepository.transaction(async (txRepo) => {
        await txRepo.restore(user.id);
      });

      // User should be active again
      const foundUser = await softDeleteUserRepository.findOne(user.id);
      expect(foundUser.deletedAt).toBeNull();
    });

    it('should rollback soft delete on transaction failure', async () => {
      const user = await createTestSoftDeleteUser();

      try {
        await softDeleteUserRepository.transaction(async (txRepo) => {
          await txRepo.delete(user.id);
          throw new Error('Simulated error');
        });
      } catch {
        // Expected error - ignore
      }

      // User should still be active due to rollback
      const foundUser = await softDeleteUserRepository.findOne(user.id);
      expect(foundUser.deletedAt).toBeNull();
    });
  });

  describe('Relationships with Soft Delete', () => {
    it('should handle relationships when parent is soft deleted', async () => {
      const user = await createTestSoftDeleteUser();
      const post = await softDeletePostRepository.create({
        title: 'Test Post',
        content: 'Test content',
        userId: user.id,
      });

      // Soft delete the user
      await softDeleteUserRepository.delete(user.id);

      // Post should still exist and be findable
      const foundPost = await softDeletePostRepository.findOne(post.id);
      expect(foundPost.userId).toBe(user.id);

      // But user should not be findable
      await expect(softDeleteUserRepository.findOne(user.id)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle table without deletedAt column gracefully', async () => {
      // This tests the error handling in applySoftDeleteFilter
      const badRepository = createBaseRepository(
        db,
        regularUsers, // Table without deletedAt column
        'BadUser',
        { softDeleteEnabled: true }, // But soft delete enabled
      );

      await expect(badRepository.findAll()).rejects.toThrow(
        'deletedAt column not found in table',
      );
    });

    it('should work correctly when softDeleteEnabled is false', async () => {
      const user = await createTestRegularUser();

      // Regular delete should work normally
      const deletedUser = await regularUserRepository.delete(user.id);
      expect(deletedUser.id).toBe(user.id);

      // User should be completely removed
      await expect(regularUserRepository.findOne(user.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should handle empty arrays in deleteMany', async () => {
      const result = await softDeleteUserRepository.deleteMany([]);
      expect(result).toEqual([]);
    });
  });

  describe('buildQueryExpressions with Soft Delete', () => {
    it('should include soft delete filter when no other conditions are provided', () => {
      const { baseWhere } = softDeleteUserRepository.buildQueryExpressions();

      // Should have soft delete filter even with no params
      expect(baseWhere).toBeDefined();
    });

    it('should include soft delete filter with simple filters', () => {
      const { baseWhere } = softDeleteUserRepository.buildQueryExpressions({
        filters: { active: true },
      });

      expect(baseWhere).toBeDefined();
    });

    it('should include soft delete filter with search term', () => {
      const { baseWhere } = softDeleteUserRepository.buildQueryExpressions({
        searchTerm: 'test',
      });

      expect(baseWhere).toBeDefined();
    });

    it('should include soft delete filter with combined filters and search', () => {
      const { baseWhere } = softDeleteUserRepository.buildQueryExpressions({
        filters: { active: true },
        searchTerm: 'test',
      });

      expect(baseWhere).toBeDefined();
    });

    it('should not include soft delete filter when soft delete is disabled', () => {
      const { baseWhere } = regularUserRepository.buildQueryExpressions();

      // Should be undefined when no filters and soft delete disabled
      expect(baseWhere).toBeUndefined();
    });

    it('should work correctly in custom queries with soft delete', async () => {
      // Create active and soft deleted users
      const activeUser = await createTestSoftDeleteUser({
        name: 'Active User',
        email: 'active@test.com',
      });
      const deletedUser = await createTestSoftDeleteUser({
        name: 'Deleted User',
        email: 'deleted@test.com',
      });

      // Soft delete one user
      await softDeleteUserRepository.delete(deletedUser.id);

      // Build query expressions
      const { baseWhere } = softDeleteUserRepository.buildQueryExpressions({
        filters: { active: true },
      });

      // Use in custom query
      const results = await db.select().from(softDeleteUsers).where(baseWhere);

      // Should only return active, non-deleted users
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(activeUser.id);
      expect(results[0].deletedAt).toBeNull();
    });
  });

  describe('Validators with Soft Delete', () => {
    describe('checkUniqueness()', () => {
      it('should not consider soft deleted records as conflicts', async () => {
        const user = await createTestSoftDeleteUser({
          name: 'Unique User',
          email: 'unique@test.com',
        });

        // Soft delete the user
        await softDeleteUserRepository.delete(user.id);

        // Check uniqueness for the same email - should not find conflict
        const conflicts = await softDeleteUserRepository.checkUniqueness([
          { field: softDeleteUsers.email, value: 'unique@test.com' },
        ]);

        expect(conflicts).toHaveLength(0);
      });

      it('should find conflicts with active records only', async () => {
        await createTestSoftDeleteUser({
          name: 'Active User',
          email: 'active@test.com',
        });

        // Check uniqueness for the same email - should find conflict
        const conflicts = await softDeleteUserRepository.checkUniqueness([
          { field: softDeleteUsers.email, value: 'active@test.com' },
        ]);

        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].field).toBe('email');
        expect(conflicts[0].value).toBe('active@test.com');
      });
    });

    describe('validateRelationExists()', () => {
      it('should validate relation with active records when soft delete enabled', async () => {
        const user = await createTestSoftDeleteUser({
          name: 'Related User',
          email: 'related@test.com',
        });

        // Should not throw for active user
        await expect(
          softDeleteUserRepository.validateRelationExists(
            softDeleteUsers,
            user.id,
            'User',
            true, // Related table has soft delete
          ),
        ).resolves.not.toThrow();
      });

      it('should fail validation for soft deleted records when soft delete enabled', async () => {
        const user = await createTestSoftDeleteUser({
          name: 'Deleted Related User',
          email: 'deleted.related@test.com',
        });

        // Soft delete the user
        await softDeleteUserRepository.delete(user.id);

        // Should throw for soft deleted user when checking with soft delete enabled
        await expect(
          softDeleteUserRepository.validateRelationExists(
            softDeleteUsers,
            user.id,
            'User',
            true, // Related table has soft delete
          ),
        ).rejects.toThrow('User with id');
      });

      it('should validate relation with soft deleted records when soft delete disabled', async () => {
        const user = await createTestSoftDeleteUser({
          name: 'Soft Deleted User',
          email: 'soft.deleted@test.com',
        });

        // Soft delete the user
        await softDeleteUserRepository.delete(user.id);

        // Should not throw for soft deleted user when checking without soft delete
        await expect(
          softDeleteUserRepository.validateRelationExists(
            softDeleteUsers,
            user.id,
            'User',
            false, // Related table does NOT have soft delete
          ),
        ).resolves.not.toThrow();
      });
    });
  });
});
