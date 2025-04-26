import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db, closePool } from './helpers/db';
import {
  users,
  User,
  CreateUser,
  posts,
  Post,
  CreatePost,
} from './schemas/test-tables';
import { cleanDatabase, createSchema } from './helpers/reset-db';
import { createBaseRepository } from '../src/base-repository';

describe('Transactions with BaseRepository', () => {
  // Create repositories for testing
  const userRepository = createBaseRepository<
    User,
    CreateUser,
    Partial<CreateUser>,
    typeof users
  >(db, users, 'User');

  const postRepository = createBaseRepository<
    Post,
    CreatePost,
    Partial<CreatePost>,
    typeof posts
  >(db, posts, 'Post');

  // Global setup for the test suite
  beforeAll(async () => {
    await createSchema();
  });

  // Global cleanup after all tests
  afterAll(async () => {
    await closePool();
  });

  // Reset data before each test
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Basic transaction support', () => {
    it('should commit changes when transaction succeeds', async () => {
      await userRepository.transaction(async (txUserRepo) => {
        // Create a user within the transaction
        const user = await txUserRepo.create({
          name: 'Transaction User',
          email: 'tx_user@example.com',
        });

        // Create a post for that user within the same transaction
        if (!txUserRepo.__internal?.db) {
          throw new Error('Transaction database connection not available');
        }

        const txPostRepo = createBaseRepository<
          Post,
          CreatePost,
          Partial<CreatePost>,
          typeof posts
        >(txUserRepo.__internal.db, posts, 'Post');

        await txPostRepo.create({
          title: 'Transaction Post',
          content: 'This post was created in a transaction',
          userId: user.id,
        });
      });

      // Verify both entities were created (transaction was committed)
      const allUsers = await userRepository.findAll();
      const allPosts = await postRepository.findAll();

      expect(allUsers).toHaveLength(1);
      expect(allUsers[0].name).toBe('Transaction User');
      expect(allPosts).toHaveLength(1);
      expect(allPosts[0].title).toBe('Transaction Post');
    });

    it('should rollback changes when transaction throws an error', async () => {
      try {
        await userRepository.transaction(async (txRepo) => {
          // Create a user within the transaction
          await txRepo.create({
            name: 'Will Rollback User',
            email: 'rollback@example.com',
          });

          // Throw an error to cause a rollback
          throw new Error('Test error to trigger rollback');
        });

        // If we reach here, the test should fail
        expect('Transaction should have failed').toBe(false);
      } catch (error) {
        // Expected error, continue with test
        expect((error as Error).message).toBe('Test error to trigger rollback');
      }

      // Verify that no entities were created (transaction was rolled back)
      const allUsers = await userRepository.findAll();
      expect(allUsers).toHaveLength(0);
    });
  });

  describe('Complex transaction scenarios', () => {
    it('should handle nested transactions', async () => {
      await userRepository.transaction(async (txRepo) => {
        // Create first user in outer transaction
        await txRepo.create({
          name: 'Outer Transaction',
          email: 'outer@example.com',
        });

        // Start a nested transaction
        await txRepo.transaction(async (innerTxRepo) => {
          // Create second user in inner transaction
          await innerTxRepo.create({
            name: 'Inner Transaction',
            email: 'inner@example.com',
          });
        });

        // Create third user after inner transaction
        await txRepo.create({
          name: 'After Inner',
          email: 'after@example.com',
        });
      });

      // Verify all three users were created
      const allUsers = await userRepository.findAll();
      expect(allUsers).toHaveLength(3);
      expect(allUsers.map((u) => u.name)).toContain('Outer Transaction');
      expect(allUsers.map((u) => u.name)).toContain('Inner Transaction');
      expect(allUsers.map((u) => u.name)).toContain('After Inner');
    });

    it('should handle rollback of inner transaction without affecting outer transaction', async () => {
      await userRepository.transaction(async (txRepo) => {
        // Create first user in outer transaction
        await txRepo.create({
          name: 'Before Inner Rollback',
          email: 'before@example.com',
        });
        // Start a nested transaction that will rollback
        try {
          await txRepo.transaction(async (innerTxRepo) => {
            // Create user in inner transaction
            await innerTxRepo.create({
              name: 'Will Rollback',
              email: 'willrollback@example.com',
            });

            // Throw error to rollback inner transaction
            throw new Error('Inner transaction error');
          });
        } catch (error) {
          // Expected error, continue with test
          expect((error as Error).message).toBe('Inner transaction error');
        }

        // Create another user after inner transaction failed
        await txRepo.create({
          name: 'After Inner Rollback',
          email: 'after@example.com',
        });
      });

      // Verify only the outer transaction users were created
      const allUsers = await userRepository.findAll();
      expect(allUsers).toHaveLength(2);
      expect(allUsers.map((u) => u.name)).toContain('Before Inner Rollback');
      expect(allUsers.map((u) => u.name)).toContain('After Inner Rollback');
      expect(allUsers.map((u) => u.name)).not.toContain('Will Rollback');
    });
  });

  describe('Repository operations in transactions', () => {
    it('should perform all repository operations within a transaction', async () => {
      const result = await userRepository.transaction(async (txRepo) => {
        // Create
        const user = await txRepo.create({
          name: 'Transaction CRUD',
          email: 'crud@example.com',
        });

        // Find
        const found = await txRepo.findOne(user.id);
        expect(found.id).toBe(user.id);

        // Update
        const updated = await txRepo.update(user.id, {
          name: 'Updated in Transaction',
        });
        expect(updated.name).toBe('Updated in Transaction');

        // FindAll
        const all = await txRepo.findAll();
        expect(all).toHaveLength(1);

        // FindAllBy
        const byEmail = await txRepo.findAllBy(users.email, 'crud@example.com');
        expect(byEmail).toHaveLength(1);

        // ExistsBy
        const exists = await txRepo.existsBy(users.email, 'crud@example.com');
        expect(exists).toBe(true);

        // Delete
        await txRepo.delete(user.id);

        // Verify deletion within transaction
        const afterDelete = await txRepo.findAll();
        expect(afterDelete).toHaveLength(0);

        return { success: true };
      });

      expect(result).toEqual({ success: true });

      // Verify user was deleted (transaction was committed)
      const allUsers = await userRepository.findAll();
      expect(allUsers).toHaveLength(0);
    });
  });
});
