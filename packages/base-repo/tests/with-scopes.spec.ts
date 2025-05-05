import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db, closePool } from './helpers/db';
import { cleanDatabase, createSchema } from './helpers/reset-db';
import { createBaseRepository } from '../src/base-repository';
import { withScopes, ScopeNotFoundError } from '../src/with-scopes';
import { eq } from 'drizzle-orm';
import { users, User, CreateUser, UpdateUser } from './schemas/test-tables';

describe('withScopes', () => {
  // Create repositories for testing
  const baseRepo = createBaseRepository<
    User,
    CreateUser,
    UpdateUser,
    typeof users
  >(db, users, 'User');

  // Helper functions to create scopes
  const createNameScope = (name: string) => (table: typeof users) =>
    eq(table.name, name);

  const createEmailScope = (email: string) => (table: typeof users) =>
    eq(table.email, email);

  const scopes = {
    active: (table: typeof users) => eq(table.active, true),
    withName: createNameScope('John Doe'),
    withEmail: createEmailScope('test@example.com'),
  };

  const scopedRepo = withScopes(baseRepo, scopes);

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

  // Helper function to create test users
  let emailCounter = 1;
  async function createTestUser(data: Partial<CreateUser> = {}): Promise<User> {
    const userData: CreateUser = {
      name: 'Test User',
      email: `test${emailCounter++}@example.com`,
      ...data,
    };
    return await baseRepo.create(userData);
  }

  describe('scope application', () => {
    it('should apply active scope correctly', async () => {
      // Create test users
      await createTestUser({ active: true, name: 'Active User' });
      await createTestUser({ active: false, name: 'Inactive User' });

      const activeUsers = await scopedRepo.scope('active').findAll();

      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].name).toBe('Active User');
    });

    it('should apply name scope correctly', async () => {
      // Create test users with different names
      const name = 'John Doe';
      const scopes = {
        active: (table: typeof users) => eq(table.active, true),
        withName: createNameScope(name),
      };
      const localScopedRepo = withScopes(baseRepo, scopes);

      await createTestUser({ name });
      await createTestUser({ name: 'Jane Doe' });

      const johnUsers = await localScopedRepo.scope('withName').findAll();

      expect(johnUsers).toHaveLength(1);
      expect(johnUsers[0].name).toBe(name);
    });

    it('should combine multiple scopes correctly', async () => {
      const name = 'John';
      const scopes = {
        active: (table: typeof users) => eq(table.active, true),
        withName: createNameScope(name),
      };
      const localScopedRepo = withScopes(baseRepo, scopes);

      // Create various test users
      await createTestUser({ name, active: true });
      await createTestUser({ name, active: false });
      await createTestUser({ name: 'Jane', active: true });

      const activeJohns = await localScopedRepo
        .scope('active')
        .scope('withName')
        .findAll();

      expect(activeJohns).toHaveLength(1);
      expect(activeJohns[0].name).toBe(name);
      expect(activeJohns[0].active).toBe(true);
    });
  });

  describe('pagination with scopes', () => {
    it('should paginate results with active scope', async () => {
      // Create multiple active and inactive users
      for (let i = 1; i <= 5; i++) {
        await createTestUser({
          name: `Active User ${i}`,
          email: `active${i}@example.com`,
          active: true,
        });
      }
      for (let i = 1; i <= 3; i++) {
        await createTestUser({
          name: `Inactive User ${i}`,
          email: `inactive${i}@example.com`,
          active: false,
        });
      }

      const result = await scopedRepo
        .scope('active')
        .findAllPaginated({ page: 1, pageSize: 3 });

      expect(result.data).toHaveLength(3);
      expect(result.pagination.totalCount).toBe(5);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNextPage).toBe(true);
    });

    it('should paginate and order results with ascending order', async () => {
      // Create active users with different names
      await createTestUser({ name: 'Charlie', active: true });
      await createTestUser({ name: 'Alice', active: true });
      await createTestUser({ name: 'Bob', active: true });
      // Create inactive users that shouldn't appear in results
      await createTestUser({ name: 'David', active: false });
      await createTestUser({ name: 'Eve', active: false });

      const result = await scopedRepo.scope('active').findAllPaginated({
        page: 1,
        pageSize: 2,
        orderBy: [{ field: users.name, direction: 'asc' }],
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Alice');
      expect(result.data[1].name).toBe('Bob');
      expect(result.pagination.totalCount).toBe(3);
      expect(result.pagination.hasNextPage).toBe(true);

      // Verify second page
      const page2 = await scopedRepo.scope('active').findAllPaginated({
        page: 2,
        pageSize: 2,
        orderBy: [{ field: users.name, direction: 'asc' }],
      });

      expect(page2.data).toHaveLength(1);
      expect(page2.data[0].name).toBe('Charlie');
      expect(page2.pagination.hasNextPage).toBe(false);
    });

    it('should paginate and order results with descending order', async () => {
      // Create active users with different names
      await createTestUser({ name: 'Charlie', active: true });
      await createTestUser({ name: 'Alice', active: true });
      await createTestUser({ name: 'Bob', active: true });
      // Create inactive users that shouldn't appear in results
      await createTestUser({ name: 'David', active: false });
      await createTestUser({ name: 'Eve', active: false });

      const result = await scopedRepo.scope('active').findAllPaginated({
        page: 1,
        pageSize: 2,
        orderBy: [{ field: users.name, direction: 'desc' }],
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Charlie');
      expect(result.data[1].name).toBe('Bob');
      expect(result.pagination.totalCount).toBe(3);
      expect(result.pagination.hasNextPage).toBe(true);

      // Verify second page
      const page2 = await scopedRepo.scope('active').findAllPaginated({
        page: 2,
        pageSize: 2,
        orderBy: [{ field: users.name, direction: 'desc' }],
      });

      expect(page2.data).toHaveLength(1);
      expect(page2.data[0].name).toBe('Alice');
      expect(page2.pagination.hasNextPage).toBe(false);
    });

    it('should handle multiple ordering criteria with scopes', async () => {
      // Create active users with same names but different emails
      await createTestUser({
        name: 'Alice',
        email: 'alice2@example.com',
        active: true,
      });
      await createTestUser({
        name: 'Alice',
        email: 'alice1@example.com',
        active: true,
      });
      await createTestUser({
        name: 'Bob',
        email: 'bob2@example.com',
        active: true,
      });
      await createTestUser({
        name: 'Bob',
        email: 'bob1@example.com',
        active: true,
      });
      // Create inactive users that shouldn't appear in results
      await createTestUser({
        name: 'Alice',
        email: 'alice3@example.com',
        active: false,
      });
      await createTestUser({
        name: 'Bob',
        email: 'bob3@example.com',
        active: false,
      });

      const result = await scopedRepo.scope('active').findAllPaginated({
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
      expect(result.pagination.totalCount).toBe(4);
      expect(result.pagination.hasNextPage).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw ScopeNotFoundError for invalid scope', async () => {
      try {
        await scopedRepo.scope('nonexistent').findAll();
      } catch (error) {
        expect(error).toBeInstanceOf(ScopeNotFoundError);
        expect(error.message).toBe(
          'Scope "nonexistent" not found in scopesConfig',
        );
      }
    });

    it('should clear conditions after query execution', async () => {
      // First query with scope
      const activeUsers = await scopedRepo.scope('active').findAll();

      // Second query without scope should return all users
      await createTestUser({ active: false });
      const allUsers = await scopedRepo.findAll();

      expect(allUsers.length).toBe(activeUsers.length + 1);
    });
  });

  describe('integration with base repository methods', () => {
    it('should work with findOne', async () => {
      const inactiveUser = await createTestUser({ active: false });
      const activeUser = await createTestUser({ active: true });

      await expect(
        scopedRepo.scope('active').findOne(inactiveUser.id),
      ).rejects.toThrow();

      const found = await scopedRepo.scope('active').findOne(activeUser.id);
      expect(found.id).toBe(activeUser.id);
    });

    it('should work with findBy', async () => {
      const email = 'active@example.com';
      await createTestUser({ active: true, email });
      await createTestUser({ active: false, email: 'inactive@example.com' });

      const found = await scopedRepo.scope('active').findBy(users.email, email);

      expect(found?.email).toBe(email);
    });

    it('should work with findAllBy', async () => {
      const name = 'John';
      const scopes = {
        active: (table: typeof users) => eq(table.active, true),
        withName: createNameScope(name),
      };
      const localScopedRepo = withScopes(baseRepo, scopes);

      // Create multiple users with same name but different active states
      await createTestUser({ name, active: true });
      await createTestUser({ name, active: false });
      await createTestUser({ name, active: true });

      const activeJohns = await localScopedRepo
        .scope('active')
        .scope('withName')
        .findAll();

      expect(activeJohns).toHaveLength(2);
      expect(activeJohns.every((user) => user.active)).toBe(true);
      expect(activeJohns.every((user) => user.name === name)).toBe(true);
    });
  });

  describe('complex queries', () => {
    it('should handle multiple parameterized scopes', async () => {
      const name = 'John';
      const email = 'john@example.com';
      const scopes = {
        active: (table: typeof users) => eq(table.active, true),
        withName: createNameScope(name),
        withEmail: createEmailScope(email),
      };
      const localScopedRepo = withScopes(baseRepo, scopes);

      // Create test users
      await createTestUser({
        name,
        email,
        active: true,
      });
      await createTestUser({
        name,
        email: 'john2@example.com',
        active: true,
      });
      await createTestUser({
        name,
        email: 'john3@example.com',
        active: false,
      });

      const result = await localScopedRepo
        .scope('active')
        .scope('withName')
        .scope('withEmail')
        .findAll();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(name);
      expect(result[0].email).toBe(email);
      expect(result[0].active).toBe(true);
    });

    it('should maintain proper scope order', async () => {
      const name = 'John';
      const scopes = {
        active: (table: typeof users) => eq(table.active, true),
        withName: createNameScope(name),
      };
      const localScopedRepo = withScopes(baseRepo, scopes);

      // Create test users
      await createTestUser({ name, active: true });
      await createTestUser({ name, active: false });

      // Order shouldn't matter for AND conditions
      const result1 = await localScopedRepo
        .scope('active')
        .scope('withName')
        .findAll();

      const result2 = await localScopedRepo
        .scope('withName')
        .scope('active')
        .findAll();

      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(result1[0].id).toBe(result2[0].id);
    });
  });
});
