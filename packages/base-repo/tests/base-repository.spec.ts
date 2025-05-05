import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db, closePool } from './helpers/db';
import {
  users,
  User,
  CreateUser,
  UpdateUser,
  posts,
  Post,
  CreatePost,
  UpdatePost,
} from './schemas/test-tables';
import { cleanDatabase, createSchema } from './helpers/reset-db';
import { createBaseRepository } from '../src/base-repository';
import { NotFoundError, DuplicateError, ForeignKeyError } from '../src/errors';
import { eq } from 'drizzle-orm';

describe('BaseRepository', () => {
  // Create a repository instance for testing
  const userRepository = createBaseRepository<
    User,
    CreateUser,
    UpdateUser,
    typeof users
  >(db, users, 'User');

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

  // Helper function to create a test user
  async function createTestUser(data: Partial<CreateUser> = {}): Promise<User> {
    const userData: CreateUser = {
      name: 'Test User',
      email: 'test@example.com',
      ...data,
    };
    return await userRepository.create(userData);
  }

  describe('create', () => {
    it('should create a user successfully', async () => {
      const userData: CreateUser = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const user = await userRepository.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBe(1);
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.active).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should find a user by id', async () => {
      const created = await createTestUser();
      const found = await userRepository.findOne(created.id);

      expect(found).toEqual(created);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(userRepository.findOne(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const created = await createTestUser();
      const updateData: UpdateUser = {
        name: 'Updated Name',
      };

      const updated = await userRepository.update(created.id, updateData);

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(updateData.name);
      expect(updated.email).toBe(created.email); // Should remain unchanged
    });

    it('should throw NotFoundError when updating non-existent user', async () => {
      await expect(
        userRepository.update(999, { name: 'Test' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete a user successfully', async () => {
      const created = await createTestUser();
      const deleted = await userRepository.delete(created.id);

      expect(deleted).toEqual(created);

      // Verify user no longer exists
      await expect(userRepository.findOne(created.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw NotFoundError when deleting non-existent user', async () => {
      await expect(userRepository.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      // Create multiple users
      await createTestUser({ email: 'user1@example.com' });
      await createTestUser({ email: 'user2@example.com' });
      await createTestUser({ email: 'user3@example.com' });

      const allUsers = await userRepository.findAll();
      expect(allUsers).toHaveLength(3);
    });

    it('should return users in specified order', async () => {
      // Create users with different names to test ordering
      await createTestUser({ name: 'Charlie', email: 'charlie@example.com' });
      await createTestUser({ name: 'Alice', email: 'alice@example.com' });
      await createTestUser({ name: 'Bob', email: 'bob@example.com' });

      const orderedUsers = await userRepository.findAll({
        orderBy: [{ field: users.name, direction: 'asc' }],
      });

      expect(orderedUsers).toHaveLength(3);
      expect(orderedUsers[0].name).toBe('Alice');
      expect(orderedUsers[1].name).toBe('Bob');
      expect(orderedUsers[2].name).toBe('Charlie');
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated results', async () => {
      // Create 12 users
      for (let i = 1; i <= 12; i++) {
        await createTestUser({
          name: `User ${i}`,
          email: `user${i}@example.com`,
        });
      }

      // Test first page with 5 items per page
      const page1 = await userRepository.findAllPaginated({
        page: 1,
        pageSize: 5,
      });
      expect(page1.data).toHaveLength(5);
      expect(page1.pagination.currentPage).toBe(1);
      expect(page1.pagination.pageSize).toBe(5);
      expect(page1.pagination.totalCount).toBe(12);
      expect(page1.pagination.totalPages).toBe(3);
      expect(page1.pagination.hasNextPage).toBe(true);
      expect(page1.pagination.hasPreviousPage).toBe(false);

      // Test second page
      const page2 = await userRepository.findAllPaginated({
        page: 2,
        pageSize: 5,
      });
      expect(page2.data).toHaveLength(5);
      expect(page2.pagination.currentPage).toBe(2);
      expect(page2.pagination.hasNextPage).toBe(true);
      expect(page2.pagination.hasPreviousPage).toBe(true);

      // Test last page
      const page3 = await userRepository.findAllPaginated({
        page: 3,
        pageSize: 5,
      });
      expect(page3.data).toHaveLength(2); // Only 2 items on the last page
      expect(page3.pagination.hasNextPage).toBe(false);
      expect(page3.pagination.hasPreviousPage).toBe(true);
    });

    it('should return paginated results with ascending order', async () => {
      // Create users with different names to test ordering
      await createTestUser({ name: 'Charlie', email: 'charlie@example.com' });
      await createTestUser({ name: 'Alice', email: 'alice@example.com' });
      await createTestUser({ name: 'Bob', email: 'bob@example.com' });
      await createTestUser({ name: 'David', email: 'david@example.com' });
      await createTestUser({ name: 'Eve', email: 'eve@example.com' });

      const result = await userRepository.findAllPaginated({
        page: 1,
        pageSize: 3,
        orderBy: [{ field: users.name, direction: 'asc' }],
      });

      expect(result.data).toHaveLength(3);
      expect(result.data[0].name).toBe('Alice');
      expect(result.data[1].name).toBe('Bob');
      expect(result.data[2].name).toBe('Charlie');
      expect(result.pagination.totalCount).toBe(5);
      expect(result.pagination.hasNextPage).toBe(true);

      // Verify second page
      const page2 = await userRepository.findAllPaginated({
        page: 2,
        pageSize: 3,
        orderBy: [{ field: users.name, direction: 'asc' }],
      });

      expect(page2.data).toHaveLength(2);
      expect(page2.data[0].name).toBe('David');
      expect(page2.data[1].name).toBe('Eve');
      expect(page2.pagination.hasNextPage).toBe(false);
    });

    it('should return paginated results with descending order', async () => {
      // Create users with different names to test ordering
      await createTestUser({ name: 'Charlie', email: 'charlie@example.com' });
      await createTestUser({ name: 'Alice', email: 'alice@example.com' });
      await createTestUser({ name: 'Bob', email: 'bob@example.com' });
      await createTestUser({ name: 'David', email: 'david@example.com' });
      await createTestUser({ name: 'Eve', email: 'eve@example.com' });

      const result = await userRepository.findAllPaginated({
        page: 1,
        pageSize: 3,
        orderBy: [{ field: users.name, direction: 'desc' }],
      });

      expect(result.data).toHaveLength(3);
      expect(result.data[0].name).toBe('Eve');
      expect(result.data[1].name).toBe('David');
      expect(result.data[2].name).toBe('Charlie');
      expect(result.pagination.totalCount).toBe(5);
      expect(result.pagination.hasNextPage).toBe(true);

      // Verify second page
      const page2 = await userRepository.findAllPaginated({
        page: 2,
        pageSize: 3,
        orderBy: [{ field: users.name, direction: 'desc' }],
      });

      expect(page2.data).toHaveLength(2);
      expect(page2.data[0].name).toBe('Bob');
      expect(page2.data[1].name).toBe('Alice');
      expect(page2.pagination.hasNextPage).toBe(false);
    });

    it('should handle multiple ordering criteria', async () => {
      // Create users with same names but different emails to test multiple ordering
      await createTestUser({ name: 'Alice', email: 'alice2@example.com' });
      await createTestUser({ name: 'Alice', email: 'alice1@example.com' });
      await createTestUser({ name: 'Bob', email: 'bob2@example.com' });
      await createTestUser({ name: 'Bob', email: 'bob1@example.com' });

      const result = await userRepository.findAllPaginated({
        page: 1,
        pageSize: 4,
        orderBy: [
          { field: users.name, direction: 'asc' },
          { field: users.email, direction: 'asc' },
        ],
      });

      expect(result.data).toHaveLength(4);
      expect(result.data[0].name).toBe('Alice');
      expect(result.data[0].email).toBe('alice1@example.com');
      expect(result.data[1].name).toBe('Alice');
      expect(result.data[1].email).toBe('alice2@example.com');
      expect(result.data[2].name).toBe('Bob');
      expect(result.data[2].email).toBe('bob1@example.com');
      expect(result.data[3].name).toBe('Bob');
      expect(result.data[3].email).toBe('bob2@example.com');
    });
  });

  describe('existsBy', () => {
    it('should return true when user exists with specific field value', async () => {
      const email = 'unique@example.com';
      await createTestUser({ email });

      const exists = await userRepository.existsBy(users.email, email);
      expect(exists).toBe(true);
    });

    it('should return false when no user exists with specific field value', async () => {
      const exists = await userRepository.existsBy(
        users.email,
        'nonexistent@example.com',
      );
      expect(exists).toBe(false);
    });

    it('should exclude specified ID when checking existence', async () => {
      const user = await createTestUser({ email: 'test@example.com' });

      // Should return false when excluding the ID of the user with that email
      const exists = await userRepository.existsBy(
        users.email,
        'test@example.com',
        user.id,
      );
      expect(exists).toBe(false);

      // Should return true when not excluding the ID
      const existsWithoutExclusion = await userRepository.existsBy(
        users.email,
        'test@example.com',
      );
      expect(existsWithoutExclusion).toBe(true);
    });
  });

  describe('validateUniqueness', () => {
    it('should not throw when field is unique', async () => {
      await createTestUser({ email: 'existing@example.com' });

      // Validate a different email - should not throw
      await expect(
        userRepository.validateUniqueness([
          { field: users.email, value: 'new@example.com' },
        ]),
      ).resolves.not.toThrow();
    });

    it('should throw DuplicateError when field is not unique', async () => {
      const email = 'duplicate@example.com';
      await createTestUser({ email });

      // Try to validate the same email
      await expect(
        userRepository.validateUniqueness([
          { field: users.email, value: email },
        ]),
      ).rejects.toThrow(DuplicateError);
    });

    it('should not throw when checking same record (with excludeId)', async () => {
      const user = await createTestUser({ email: 'myemail@example.com' });

      // Validate the same email but exclude the user's ID
      await expect(
        userRepository.validateUniqueness(
          [{ field: users.email, value: 'myemail@example.com' }],
          user.id,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('validateRelationExists', () => {
    it('should not throw when relation exists', async () => {
      const user = await createTestUser();

      await expect(
        userRepository.validateRelationExists(users, user.id, 'User'),
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundError when relation does not exist', async () => {
      await expect(
        userRepository.validateRelationExists(users, 999, 'User'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Relation tests', () => {
    // Create a repository instance for posts
    const postRepository = createBaseRepository<
      Post,
      CreatePost,
      UpdatePost,
      typeof posts
    >(db, posts, 'Post');

    it('should create posts with valid user relation', async () => {
      // First create a user
      const user = await createTestUser();

      // Then create a post linked to that user
      const postData: CreatePost = {
        title: 'Test Post',
        content: 'This is a test post content',
        userId: user.id,
      };

      const post = await postRepository.create(postData);

      expect(post).toBeDefined();
      expect(post.id).toBe(1);
      expect(post.userId).toBe(user.id);
    });

    it('should fail when creating a post with non-existent user', async () => {
      const postData: CreatePost = {
        title: 'Invalid Post',
        content: 'This post has an invalid user ID',
        userId: 999, // This user doesn't exist
      };

      // This should fail due to foreign key constraint
      await expect(postRepository.create(postData)).rejects.toThrow();
    });

    it('should delete posts when user is deleted (cascade)', async () => {
      // Create a user
      const user = await createTestUser();

      // Create posts for that user
      await postRepository.create({
        title: 'Post 1',
        content: 'Content 1',
        userId: user.id,
      });

      await postRepository.create({
        title: 'Post 2',
        content: 'Content 2',
        userId: user.id,
      });

      // Verify posts exist
      const postsBefore = await postRepository.findAllBy(posts.userId, user.id);
      expect(postsBefore.length).toBe(2);

      // Delete the user
      await userRepository.delete(user.id);

      // Verify posts were deleted (cascade)
      const postsAfter = await db
        .select()
        .from(posts)
        .where(eq(posts.userId, user.id));
      expect(postsAfter.length).toBe(0);
    });
  });

  // Tests for PostgreSQL error handling
  describe('PostgreSQL error handling', () => {
    // Create a repository instance for posts
    const postRepository = createBaseRepository<
      Post,
      CreatePost,
      UpdatePost,
      typeof posts
    >(db, posts, 'Post');

    it('should transform foreign key violation into ForeignKeyError', async () => {
      const postData: CreatePost = {
        title: 'Invalid Post',
        content: 'This post has an invalid user ID',
        userId: 999, // This user doesn't exist
      };

      try {
        await postRepository.create(postData);
        // If we get here, the test should fail
        expect(true).toBe(false); // This line should not be reached
      } catch (error) {
        expect(error).toBeInstanceOf(ForeignKeyError);
        if (error instanceof ForeignKeyError) {
          expect(error.field).toBe('user_id'); // Nombre de la columna en la BD
          expect(error.referenceTable).toBe('users');
        }
      }
    });

    it('should transform unique constraint violation into DuplicateError', async () => {
      // Create a user first
      const email = 'duplicate@example.com';
      await createTestUser({ email });

      // Try to create another user with the same email
      try {
        await createTestUser({ email });
        // If we get here, the test should fail
        expect(true).toBe(false); // This line should not be reached
      } catch (error) {
        expect(error).toBeInstanceOf(DuplicateError);
        expect(error.message).toContain(email);
      }
    });
  });
});
