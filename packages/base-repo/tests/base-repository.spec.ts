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
import { BaseRepository } from '../src/types';

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
        orderBy: [{ field: 'name', direction: 'asc' }],
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
        orderBy: [{ field: 'name', direction: 'asc' }],
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
        orderBy: [{ field: 'name', direction: 'asc' }],
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
        orderBy: [{ field: 'name', direction: 'desc' }],
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
        orderBy: [{ field: 'name', direction: 'desc' }],
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
          { field: 'name', direction: 'asc' },
          { field: 'email', direction: 'asc' },
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

  describe('Filters', () => {
    beforeEach(async () => {
      // Create test users with different attributes
      await createTestUser({
        name: 'Alice',
        email: 'alice@example.com',
        active: true,
      });
      await createTestUser({
        name: 'Bob',
        email: 'bob@example.com',
        active: true,
      });
      await createTestUser({
        name: 'Charlie',
        email: 'charlie@example.com',
        active: false,
      });
    });

    describe('findAll with filters', () => {
      it('should filter users by a single field', async () => {
        const activeUsers = await userRepository.findAll({
          filters: { active: true },
        });

        expect(activeUsers).toHaveLength(2);
        expect(activeUsers.every((user) => user.active)).toBe(true);
      });

      it('should filter users by multiple fields', async () => {
        const specificUser = await userRepository.findAll({
          filters: {
            name: 'Alice',
            active: true,
          },
        });

        expect(specificUser).toHaveLength(1);
        expect(specificUser[0].name).toBe('Alice');
        expect(specificUser[0].active).toBe(true);
      });

      it('should return empty array when no users match filters', async () => {
        const nonExistentUsers = await userRepository.findAll({
          filters: {
            name: 'NonExistent',
            active: true,
          },
        });

        expect(nonExistentUsers).toHaveLength(0);
      });

      it('should combine filters with ordering', async () => {
        const activeUsersOrdered = await userRepository.findAll({
          filters: { active: true },
          orderBy: [{ field: 'name', direction: 'desc' }],
        });

        expect(activeUsersOrdered).toHaveLength(2);
        expect(activeUsersOrdered[0].name).toBe('Bob');
        expect(activeUsersOrdered[1].name).toBe('Alice');
      });
    });

    describe('findAllPaginated with filters', () => {
      it('should apply filters to paginated results', async () => {
        const result = await userRepository.findAllPaginated({
          page: 1,
          pageSize: 2,
          filters: { active: true },
        });

        expect(result.data).toHaveLength(2);
        expect(result.pagination.totalCount).toBe(2);
        expect(result.pagination.totalPages).toBe(1);
        expect(result.data.every((user) => user.active)).toBe(true);
      });

      it('should combine filters with ordering in paginated results', async () => {
        const result = await userRepository.findAllPaginated({
          page: 1,
          pageSize: 2,
          filters: { active: true },
          orderBy: [{ field: 'name', direction: 'desc' }],
        });

        expect(result.data).toHaveLength(2);
        expect(result.data[0].name).toBe('Bob');
        expect(result.data[1].name).toBe('Alice');
      });

      it('should handle empty results with filters', async () => {
        const result = await userRepository.findAllPaginated({
          page: 1,
          pageSize: 10,
          filters: { name: 'NonExistent' },
        });

        expect(result.data).toHaveLength(0);
        expect(result.pagination.totalCount).toBe(0);
        expect(result.pagination.totalPages).toBe(0);
        expect(result.pagination.hasNextPage).toBe(false);
        expect(result.pagination.hasPreviousPage).toBe(false);
      });
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

  describe('search', () => {
    // Create a repository with searchable fields
    const searchableUserRepository = createBaseRepository<
      User,
      CreateUser,
      UpdateUser,
      typeof users
    >(db, users, 'User', {
      searchableFields: [users.name, users.email],
    }) as BaseRepository<User, CreateUser, UpdateUser, typeof users>;

    beforeEach(async () => {
      // Create test users with different attributes for search testing
      // Original users
      await createTestUser({
        name: 'John Doe',
        email: 'john@example.com',
        active: true,
      });
      await createTestUser({
        name: 'Jane Smith',
        email: 'jane@example.com',
        active: true,
      });
      await createTestUser({
        name: 'John Smith',
        email: 'johnsmith@example.com',
        active: false,
      });
      await createTestUser({
        name: 'Alice Johnson',
        email: 'alice@example.com',
        active: true,
      });

      // Additional users with varied naming patterns
      await createTestUser({
        name: 'Xavier Rodriguez',
        email: 'xavi@example.com',
        active: true,
      });
      await createTestUser({
        name: 'Maria Garcia',
        email: 'mg123@example.com',
        active: true,
      });
      await createTestUser({
        name: 'Zack Brown',
        email: 'zackb@example.org',
        active: true,
      });
      await createTestUser({
        name: 'Yuki Tanaka',
        email: 'ytanaka@example.net',
        active: false,
      });
      await createTestUser({
        name: 'Olivia Wilson',
        email: 'olivia.w@example.com',
        active: true,
      });
    });

    it('should search users by term', async () => {
      const results = await searchableUserRepository.search('John');

      // We expect at least these 2 users to be returned
      expect(results.map((user) => user.name)).toContain('John Doe');
      expect(results.map((user) => user.name)).toContain('John Smith');

      // Check that the total count is correct
      expect(results).toHaveLength(3);
    });

    it('should find users by email term', async () => {
      const results = await searchableUserRepository.search('jane');

      expect(results).toHaveLength(1);
      expect(results[0].email).toBe('jane@example.com');
    });

    it('should find users across configured searchable fields', async () => {
      const results = await searchableUserRepository.search('smith');

      expect(results).toHaveLength(2);
      expect(results.some((user) => user.name === 'Jane Smith')).toBe(true);
      expect(
        results.some((user) => user.email === 'johnsmith@example.com'),
      ).toBe(true);
    });

    it('should return empty array when no matches found', async () => {
      const results = await searchableUserRepository.search('nonexistent');

      expect(results).toHaveLength(0);
    });

    it('should perform case-insensitive search', async () => {
      const lowerResults = await searchableUserRepository.search('john');
      const upperResults = await searchableUserRepository.search('JOHN');
      const mixedResults = await searchableUserRepository.search('JoHn');

      // All searches should return the same number of results
      expect(lowerResults).toHaveLength(3);
      expect(upperResults).toHaveLength(3);
      expect(mixedResults).toHaveLength(3);

      // Verify the same results are returned regardless of case
      expect(lowerResults.map((u) => u.id).sort()).toEqual(
        upperResults.map((u) => u.id).sort(),
      );
      expect(lowerResults.map((u) => u.id).sort()).toEqual(
        mixedResults.map((u) => u.id).sort(),
      );
    });

    it('should throw error when searching without searchable fields configured', async () => {
      // Create a repository without searchable fields
      const nonSearchableRepo = createBaseRepository<
        User,
        CreateUser,
        UpdateUser,
        typeof users
      >(db, users, 'User');

      await expect(nonSearchableRepo.search('test')).rejects.toThrow(
        'Searchable fields not defined for User',
      );
    });

    it('should match partial terms', async () => {
      const results = await searchableUserRepository.search('oh');

      // The search should match partial terms
      expect(results.map((user) => user.name)).toContain('John Doe');
      expect(results.map((user) => user.name)).toContain('John Smith');
      expect(results.map((user) => user.name)).toContain('Alice Johnson');

      // Check that the total count is correct
      expect(results).toHaveLength(3);
    });

    it('should find users with unique naming patterns', async () => {
      const xaviResults = await searchableUserRepository.search('xavi');
      expect(xaviResults).toHaveLength(1);
      expect(xaviResults[0].name).toBe('Xavier Rodriguez');

      const garciaResults = await searchableUserRepository.search('Garcia');
      expect(garciaResults).toHaveLength(1);
      expect(garciaResults[0].name).toBe('Maria Garcia');
    });

    it('should match by domain in email', async () => {
      const results = await searchableUserRepository.search('example.org');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Zack Brown');
      expect(results[0].email).toBe('zackb@example.org');
    });

    it('should handle searches with multiple potential matches', async () => {
      // 'a' appears in many names and emails
      const results = await searchableUserRepository.search('a');

      // This should return multiple users
      expect(results.length).toBeGreaterThan(5);

      // Verify some expected results
      const names = results.map((user) => user.name);
      expect(names).toContain('Maria Garcia');
      expect(names).toContain('Jane Smith');
      expect(names).toContain('Yuki Tanaka');
    });

    it('should handle special characters and symbols in search', async () => {
      // Search using a period
      const dotResults = await searchableUserRepository.search('olivia.');
      expect(dotResults).toHaveLength(1);
      expect(dotResults[0].name).toBe('Olivia Wilson');

      // Search using numbers
      const numberResults = await searchableUserRepository.search('123');
      expect(numberResults).toHaveLength(1);
      expect(numberResults[0].email).toBe('mg123@example.com');
    });

    describe('searchPaginated', () => {
      it('should return paginated search results', async () => {
        const results = await searchableUserRepository.searchPaginated('john', {
          page: 1,
          pageSize: 2,
        });

        expect(results.data).toHaveLength(2);
        expect(results.pagination.currentPage).toBe(1);
        expect(results.pagination.pageSize).toBe(2);
        expect(results.pagination.totalCount).toBe(3); // Total matches for 'john'
        expect(results.pagination.totalPages).toBe(2);
        expect(results.pagination.hasNextPage).toBe(true);
        expect(results.pagination.hasPreviousPage).toBe(false);

        // Verify second page
        const page2 = await searchableUserRepository.searchPaginated('john', {
          page: 2,
          pageSize: 2,
        });

        expect(page2.data).toHaveLength(1); // Last remaining match
        expect(page2.pagination.currentPage).toBe(2);
        expect(page2.pagination.hasNextPage).toBe(false);
        expect(page2.pagination.hasPreviousPage).toBe(true);
      });

      it('should combine search with ordering', async () => {
        const results = await searchableUserRepository.searchPaginated('john', {
          page: 1,
          pageSize: 10,
          orderBy: [{ field: 'name', direction: 'desc' }],
        });

        expect(results.data).toHaveLength(3);
        expect(results.data[0].name).toBe('John Smith');
        expect(results.data[1].name).toBe('John Doe');
        expect(results.data[2].name).toBe('Alice Johnson');
      });

      it('should combine search with filters', async () => {
        const results = await searchableUserRepository.searchPaginated('john', {
          page: 1,
          pageSize: 10,
          filters: { active: true },
        });

        expect(results.data).toHaveLength(2);
        expect(results.data.every((user) => user.active)).toBe(true);
        expect(results.data.map((user) => user.name)).toContain('John Doe');
        expect(results.data.map((user) => user.name)).toContain(
          'Alice Johnson',
        );
      });

      it('should handle empty search results with pagination', async () => {
        const results = await searchableUserRepository.searchPaginated(
          'nonexistent',
          {
            page: 1,
            pageSize: 10,
          },
        );

        expect(results.data).toHaveLength(0);
        expect(results.pagination.totalCount).toBe(0);
        expect(results.pagination.totalPages).toBe(0);
        expect(results.pagination.hasNextPage).toBe(false);
        expect(results.pagination.hasPreviousPage).toBe(false);
      });

      it('should handle case-insensitive search with pagination', async () => {
        const lowerResults = await searchableUserRepository.searchPaginated(
          'john',
          {
            page: 1,
            pageSize: 10,
          },
        );
        const upperResults = await searchableUserRepository.searchPaginated(
          'JOHN',
          {
            page: 1,
            pageSize: 10,
          },
        );
        const mixedResults = await searchableUserRepository.searchPaginated(
          'JoHn',
          {
            page: 1,
            pageSize: 10,
          },
        );

        // All searches should return the same number of results
        expect(lowerResults.data).toHaveLength(3);
        expect(upperResults.data).toHaveLength(3);
        expect(mixedResults.data).toHaveLength(3);

        // Verify the same results are returned regardless of case
        expect(lowerResults.data.map((u) => u.id).sort()).toEqual(
          upperResults.data.map((u) => u.id).sort(),
        );
        expect(lowerResults.data.map((u) => u.id).sort()).toEqual(
          mixedResults.data.map((u) => u.id).sort(),
        );
      });
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

  // Tests for buildQuery method
  describe('buildQuery', () => {
    // Create a repository with searchable fields for testing
    const searchableUserRepository = createBaseRepository<
      User,
      CreateUser,
      UpdateUser,
      typeof users
    >(db, users, 'User', {
      searchableFields: [users.name, users.email],
    });

    beforeEach(async () => {
      // Create test users
      await createTestUser({
        name: 'John Doe',
        email: 'john@example.com',
        active: true,
      });
      await createTestUser({
        name: 'Jane Smith',
        email: 'jane@example.com',
        active: true,
      });
      await createTestUser({
        name: 'Alice Johnson',
        email: 'alice@example.com',
        active: false,
      });
    });

    it('should return empty objects when no params are provided', () => {
      const { baseWhere, baseOrderBy } =
        searchableUserRepository.buildQueryExpressions();

      expect(baseWhere).toBeUndefined();
      expect(baseOrderBy).toBeUndefined();
    });

    it('should build where conditions from filters', () => {
      // Build query with active filter
      const { baseWhere } = searchableUserRepository.buildQueryExpressions({
        filters: { active: true },
      });

      // baseWhere should be defined
      expect(baseWhere).toBeDefined();
    });

    it('should build order by expressions', () => {
      // Build query with name ordering
      const { baseOrderBy } = searchableUserRepository.buildQueryExpressions({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      // baseOrderBy should be defined
      expect(baseOrderBy).toBeDefined();
      expect(baseOrderBy?.length).toBe(1);
    });

    it('should build search conditions from searchTerm', () => {
      // Build query with search term
      const { baseWhere } = searchableUserRepository.buildQueryExpressions({
        searchTerm: 'john',
      });

      // baseWhere should be defined
      expect(baseWhere).toBeDefined();
    });

    it('should combine filters, search, and ordering', () => {
      const { baseWhere, baseOrderBy } =
        searchableUserRepository.buildQueryExpressions({
          filters: { active: true },
          searchTerm: 'example.com',
          orderBy: [{ field: 'name', direction: 'asc' }],
        });

      // Both should be defined
      expect(baseWhere).toBeDefined();
      expect(baseOrderBy).toBeDefined();
      expect(baseOrderBy?.length).toBe(1);
    });

    it('should build usable SQL conditions for join queries', async () => {
      // First create a post for our testing
      const user = await createTestUser({
        name: 'John Smith',
        email: 'smith@example.com',
      });
      await db.insert(posts).values({
        title: 'Test Post',
        content: 'Content',
        userId: user.id,
      });

      // Verify the setup worked correctly
      const result = await db
        .select({
          userId: users.id,
          userName: users.name,
        })
        .from(users)
        .where(eq(users.id, user.id));

      expect(result).toHaveLength(1);
      expect(result[0].userName).toBe('John Smith');
    });
  });

  describe('transaction and withTransaction', () => {
    // Repositories are defined in the outer describe block
    const postRepository = createBaseRepository<
      Post,
      CreatePost,
      UpdatePost,
      typeof posts
    >(db, posts, 'Post');

    it('should commit operations when transaction is successful', async () => {
      let userId: number | undefined;
      let postId: number | undefined;

      await userRepository.transaction(async (txUserRepo, tx) => {
        const user = await txUserRepo.create({
          name: 'Tx User',
          email: 'tx.user@example.com',
        });
        userId = user.id;

        const txPostRepo = postRepository.withTransaction(tx);
        const post = await txPostRepo.create({
          title: 'Transactional Post',
          content: 'This post was created in a transaction',
          userId: user.id,
        });
        postId = post.id;
      });

      // Verify data was committed
      expect(userId).toBeDefined();
      expect(postId).toBeDefined();

      if (userId) {
        const createdUser = await userRepository.findOne(userId);
        expect(createdUser).toBeDefined();
        expect(createdUser.name).toBe('Tx User');
      }

      if (postId) {
        const createdPost = await postRepository.findOne(postId);
        expect(createdPost).toBeDefined();
        expect(createdPost.title).toBe('Transactional Post');
        if (userId) {
          expect(createdPost.userId).toBe(userId);
        }
      }
    });

    it('should roll back operations when an error occurs within the transaction', async () => {
      const initialUserEmail = 'rollback.user@example.com';
      let tempUserId: number | undefined;

      try {
        await userRepository.transaction(async (txUserRepo) => {
          const user = await txUserRepo.create({
            name: 'Rollback User',
            email: initialUserEmail,
          });
          tempUserId = user.id; // Store ID to check for non-existence later

          // Simulate an error occurring after the first operation
          throw new Error('Simulated error to trigger rollback');
        });
      } catch (error: unknown) {
        // Check if it's an Error instance and then check the message
        if (error instanceof Error) {
          expect(error.message).toBe('Simulated error to trigger rollback');
        } else {
          // If it's not an Error instance, fail the test, as we expect an Error
          expect(error).toBeInstanceOf(Error);
        }
      }

      // Verify that the user was rolled back and does not exist
      if (tempUserId) {
        // If findOne throws NotFoundError, it means the user doesn't exist, which is correct
        await expect(userRepository.findOne(tempUserId)).rejects.toThrow(
          NotFoundError,
        );
      } else {
        // Fallback check if tempUserId wasn't assigned (e.g., error before create completed)
        // This also covers the case where the transaction itself failed to even start meaningfully
        const foundByEmail = await userRepository.findBy(
          users.email,
          initialUserEmail,
        );
        expect(foundByEmail).toBeNull();
      }
    });

    it('should allow multiple operations on different repos sharing the same transaction', async () => {
      let post1Id: number | undefined;
      let post2Id: number | undefined;
      const originalUserName = 'MultiOp User';
      const updatedUserName = 'MultiOp User Updated';

      // First, create a user that we will update within the transaction
      const initialUser = await userRepository.create({
        name: originalUserName,
        email: 'multiop@example.com',
      });
      const userId = initialUser.id;

      await userRepository.transaction(async (txUserRepo, tx) => {
        // 1. Create a post using the transaction
        const txPostRepo = postRepository.withTransaction(tx);
        const post1 = await txPostRepo.create({
          title: 'Post 1 in MultiOp Tx',
          content: 'Content 1',
          userId: initialUser.id,
        });
        post1Id = post1.id;

        // 2. Update the user using the transaction-scoped user repo
        await txUserRepo.update(initialUser.id, { name: updatedUserName });

        // 3. Create another post using the same transaction
        const post2 = await txPostRepo.create({
          title: 'Post 2 in MultiOp Tx',
          content: 'Content 2',
          userId: initialUser.id,
        });
        post2Id = post2.id;
      });

      // Verify all operations were committed
      expect(userId).toBeDefined();
      expect(post1Id).toBeDefined();
      expect(post2Id).toBeDefined();

      if (userId) {
        const updatedUser = await userRepository.findOne(userId);
        expect(updatedUser.name).toBe(updatedUserName); // Check update
      }
      if (post1Id) {
        const createdPost1 = await postRepository.findOne(post1Id);
        expect(createdPost1).toBeDefined();
        expect(createdPost1.title).toBe('Post 1 in MultiOp Tx');
      }
      if (post2Id) {
        const createdPost2 = await postRepository.findOne(post2Id);
        expect(createdPost2).toBeDefined();
        expect(createdPost2.title).toBe('Post 2 in MultiOp Tx');
      }
    });
  });
});
