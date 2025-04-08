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
    // Create schema if it doesn't exist
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
      // Execute a transaction that creates a user and a related post
      await db.transaction(async (tx) => {
        const txUserRepo = createBaseRepository<
          User,
          CreateUser,
          Partial<CreateUser>,
          typeof users
        >(tx, users, 'User');

        const txPostRepo = createBaseRepository<
          Post,
          CreatePost,
          Partial<CreatePost>,
          typeof posts
        >(tx, posts, 'Post');

        // Create a user within the transaction
        const user = await txUserRepo.create({
          name: 'Transaction User',
          email: 'tx_user@example.com',
        });

        // Create a post for that user within the transaction
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
      // Start a transaction but throw an error in the middle
      try {
        await db.transaction(async (tx) => {
          const txUserRepo = createBaseRepository<
            User,
            CreateUser,
            Partial<CreateUser>,
            typeof users
          >(tx, users, 'User');

          // Create a user within the transaction
          await txUserRepo.create({
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

  describe('Manual transaction control', () => {
    it('should support explicit rollback', async () => {
      // Transaction with explicit rollback
      try {
        await db.transaction(async (tx) => {
          const txUserRepo = createBaseRepository<
            User,
            CreateUser,
            Partial<CreateUser>,
            typeof users
          >(tx, users, 'User');

          await txUserRepo.create({
            name: 'Explicit Rollback User',
            email: 'explicit_rollback@example.com',
          });

          // Explicitly request a rollback
          tx.rollback();

          // We shouldn't reach here
          expect('Transaction should continue after rollback').toBe(false);
        });
      } catch (error) {
        // Expected error, transaction was rolled back
        expect((error as Error).message).toBe('Rollback');
      }

      // Verify that no entities were created
      const allUsers = await userRepository.findAll();
      expect(allUsers).toHaveLength(0);
    });

    it('should return values from transaction', async () => {
      // Execute a transaction that returns a value
      const result = await db.transaction(async (tx) => {
        const txUserRepo = createBaseRepository<
          User,
          CreateUser,
          Partial<CreateUser>,
          typeof users
        >(tx, users, 'User');

        const user = await txUserRepo.create({
          name: 'Return Value User',
          email: 'returns@example.com',
        });

        // Return a value from the transaction
        return {
          userId: user.id,
          message: 'Transaction completed',
        };
      });

      // Verify the returned value
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('message', 'Transaction completed');

      // Verify the user was created
      const user = await userRepository.findOne(result.userId);
      expect(user).toBeDefined();
      expect(user.email).toBe('returns@example.com');
    });
  });

  describe('Complex transaction scenarios', () => {
    it('should handle nested transactions (savepoints)', async () => {
      // Execute a nested transaction
      await db.transaction(async (tx) => {
        const txUserRepo = createBaseRepository<
          User,
          CreateUser,
          Partial<CreateUser>,
          typeof users
        >(tx, users, 'User');

        // Create first user in outer transaction
        await txUserRepo.create({
          name: 'Outer Transaction',
          email: 'outer@example.com',
        });

        // Start a nested transaction
        await tx.transaction(async (innerTx) => {
          const innerUserRepo = createBaseRepository<
            User,
            CreateUser,
            Partial<CreateUser>,
            typeof users
          >(innerTx, users, 'User');

          // Create second user in inner transaction
          await innerUserRepo.create({
            name: 'Inner Transaction',
            email: 'inner@example.com',
          });
        });

        // Create third user after inner transaction
        await txUserRepo.create({
          name: 'After Inner',
          email: 'after@example.com',
        });
      });

      // Verify all three users were created
      const allUsers = await userRepository.findAll();
      expect(allUsers).toHaveLength(3);
    });

    it('should handle rollback of inner transaction without affecting outer transaction', async () => {
      // Execute a nested transaction with inner rollback
      await db.transaction(async (tx) => {
        const txUserRepo = createBaseRepository<
          User,
          CreateUser,
          Partial<CreateUser>,
          typeof users
        >(tx, users, 'User');

        // Create first user in outer transaction
        await txUserRepo.create({
          name: 'Before Inner Rollback',
          email: 'before@example.com',
        });

        // Start a nested transaction that will rollback
        try {
          await tx.transaction(async (innerTx) => {
            const innerUserRepo = createBaseRepository<
              User,
              CreateUser,
              Partial<CreateUser>,
              typeof users
            >(innerTx, users, 'User');

            // Create user in inner transaction
            await innerUserRepo.create({
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
        await txUserRepo.create({
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

  describe('BaseRepository operations in transactions', () => {
    it('should perform all repository operations within a transaction', async () => {
      const result = await db.transaction(async (tx) => {
        const txUserRepo = createBaseRepository<
          User,
          CreateUser,
          Partial<CreateUser>,
          typeof users
        >(tx, users, 'User');

        // Create
        const user = await txUserRepo.create({
          name: 'Transaction CRUD',
          email: 'crud@example.com',
        });

        // Find
        const found = await txUserRepo.findOne(user.id);
        expect(found.id).toBe(user.id);

        // Update
        const updated = await txUserRepo.update(user.id, {
          name: 'Updated in Transaction',
        });
        expect(updated.name).toBe('Updated in Transaction');

        // FindAll
        const all = await txUserRepo.findAll();
        expect(all).toHaveLength(1);

        // FindAllBy
        const byEmail = await txUserRepo.findAllBy(
          users.email,
          'crud@example.com',
        );
        expect(byEmail).toHaveLength(1);

        // ExistsBy
        const exists = await txUserRepo.existsBy(
          users.email,
          'crud@example.com',
        );
        expect(exists).toBe(true);

        // Delete
        await txUserRepo.delete(user.id);

        // Verify deletion within transaction
        const afterDelete = await tx.select().from(users);
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
