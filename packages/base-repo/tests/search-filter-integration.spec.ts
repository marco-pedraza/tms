import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db, closePool } from './helpers/db';
import { users, User, CreateUser, UpdateUser } from './schemas/test-tables';
import { cleanDatabase, createSchema } from './helpers/reset-db';
import { createBaseRepository } from '../src/base-repository';
import { BaseRepository } from '../src/types';

describe('Search and Filter Integration', () => {
  // Create a repository with searchable fields for testing combined search and filters
  const searchableUserRepository = createBaseRepository<
    User,
    CreateUser,
    UpdateUser,
    typeof users
  >(db, users, 'User', {
    searchableFields: [users.name, users.email],
  }) as BaseRepository<User, CreateUser, UpdateUser, typeof users>;

  // Global setup for the test suite
  beforeAll(async () => {
    // Create schema if it doesn't exist
    await createSchema();
  });

  // Global cleanup after all tests
  afterAll(async () => {
    await closePool();
  });

  // Reset data before each test and setup test data
  beforeEach(async () => {
    await cleanDatabase();

    // Create test users with different attributes for combined search and filter testing
    await searchableUserRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      active: true,
    });
    await searchableUserRepository.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      active: true,
    });
    await searchableUserRepository.create({
      name: 'John Smith',
      email: 'johnsmith@example.com',
      active: false,
    });
    await searchableUserRepository.create({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      active: true,
    });
    await searchableUserRepository.create({
      name: 'Bob Johnson',
      email: 'bob@inactive.com',
      active: false,
    });
  });

  describe('findAll with searchTerm', () => {
    it('should find users by search term only', async () => {
      const results = await searchableUserRepository.findAll({
        searchTerm: 'john',
      });

      expect(results).toHaveLength(4);
      expect(results.map((user) => user.name)).toContain('John Doe');
      expect(results.map((user) => user.name)).toContain('John Smith');
      expect(results.map((user) => user.name)).toContain('Alice Johnson');
      expect(results.map((user) => user.name)).toContain('Bob Johnson');
    });

    it('should combine search term with filters', async () => {
      const results = await searchableUserRepository.findAll({
        searchTerm: 'john',
        filters: { active: true },
      });

      expect(results).toHaveLength(2);
      expect(results.map((user) => user.name)).toContain('John Doe');
      expect(results.map((user) => user.name)).toContain('Alice Johnson');
      expect(results.every((user) => user.active)).toBe(true);
    });

    it('should combine search term with filters and ordering', async () => {
      const results = await searchableUserRepository.findAll({
        searchTerm: 'johnson',
        filters: { active: true },
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice Johnson');
      expect(results[0].active).toBe(true);
    });

    it('should return empty array when search term and filters have no matches', async () => {
      const results = await searchableUserRepository.findAll({
        searchTerm: 'nonexistent',
        filters: { active: true },
      });

      expect(results).toHaveLength(0);
    });

    it('should work with search term matching email and name filters', async () => {
      const results = await searchableUserRepository.findAll({
        searchTerm: 'example.com',
        filters: { active: false },
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('John Smith');
      expect(results[0].email).toBe('johnsmith@example.com');
      expect(results[0].active).toBe(false);
    });

    it('should throw error when searching without searchable fields configured', async () => {
      const nonSearchableRepo = createBaseRepository<
        User,
        CreateUser,
        UpdateUser,
        typeof users
      >(db, users, 'User');

      await expect(
        nonSearchableRepo.findAll({ searchTerm: 'test' }),
      ).rejects.toThrow('Searchable fields not defined for User');
    });
  });

  describe('findAllPaginated with searchTerm', () => {
    it('should find users by search term only with pagination', async () => {
      const results = await searchableUserRepository.findAllPaginated({
        searchTerm: 'john',
        page: 1,
        pageSize: 2,
      });

      expect(results.data).toHaveLength(2);
      expect(results.pagination.totalCount).toBe(4);
      expect(results.pagination.totalPages).toBe(2);
      expect(results.pagination.hasNextPage).toBe(true);
    });

    it('should combine search term with filters in pagination', async () => {
      const results = await searchableUserRepository.findAllPaginated({
        searchTerm: 'john',
        filters: { active: true },
        page: 1,
        pageSize: 10,
      });

      expect(results.data).toHaveLength(2);
      expect(results.pagination.totalCount).toBe(2);
      expect(results.pagination.totalPages).toBe(1);
      expect(results.data.every((user) => user.active)).toBe(true);
      expect(results.data.map((user) => user.name)).toContain('John Doe');
      expect(results.data.map((user) => user.name)).toContain('Alice Johnson');
    });

    it('should combine search term, filters, and ordering in pagination', async () => {
      const results = await searchableUserRepository.findAllPaginated({
        searchTerm: 'john',
        filters: { active: true },
        orderBy: [{ field: 'name', direction: 'desc' }],
        page: 1,
        pageSize: 10,
      });

      expect(results.data).toHaveLength(2);
      expect(results.data[0].name).toBe('John Doe'); // 'John Doe' comes after 'Alice Johnson' in desc order
      expect(results.data[1].name).toBe('Alice Johnson');
      expect(results.data.every((user) => user.active)).toBe(true);
    });

    it('should handle empty results with search term and filters', async () => {
      const results = await searchableUserRepository.findAllPaginated({
        searchTerm: 'nonexistent',
        filters: { active: true },
        page: 1,
        pageSize: 10,
      });

      expect(results.data).toHaveLength(0);
      expect(results.pagination.totalCount).toBe(0);
      expect(results.pagination.totalPages).toBe(0);
      expect(results.pagination.hasNextPage).toBe(false);
      expect(results.pagination.hasPreviousPage).toBe(false);
    });

    it('should work with complex search and filter combinations', async () => {
      // Search for users with 'john' in name/email but only inactive ones
      const results = await searchableUserRepository.findAllPaginated({
        searchTerm: 'john',
        filters: { active: false },
        orderBy: [{ field: 'email', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      expect(results.data).toHaveLength(2);
      expect(results.data.every((user) => user.active === false)).toBe(true);
      expect(results.data.map((user) => user.name)).toContain('John Smith');
      expect(results.data.map((user) => user.name)).toContain('Bob Johnson');
      expect(results.pagination.totalCount).toBe(2);
    });

    it('should throw error when searching without searchable fields configured', async () => {
      const nonSearchableRepo = createBaseRepository<
        User,
        CreateUser,
        UpdateUser,
        typeof users
      >(db, users, 'User');

      await expect(
        nonSearchableRepo.findAllPaginated({ searchTerm: 'test' }),
      ).rejects.toThrow('Searchable fields not defined for User');
    });
  });

  describe('countAll with searchTerm', () => {
    it('should count users by search term only', async () => {
      const count = await searchableUserRepository.countAll({
        searchTerm: 'john',
      });

      expect(count).toBe(4);
    });

    it('should combine search term with filters for counting', async () => {
      const count = await searchableUserRepository.countAll({
        searchTerm: 'john',
        filters: { active: true },
      });

      expect(count).toBe(2);
    });

    it('should return zero when search term and filters have no matches', async () => {
      const count = await searchableUserRepository.countAll({
        searchTerm: 'nonexistent',
        filters: { active: true },
      });

      expect(count).toBe(0);
    });

    it('should throw error when searching without searchable fields configured', async () => {
      const nonSearchableRepo = createBaseRepository<
        User,
        CreateUser,
        UpdateUser,
        typeof users
      >(db, users, 'User');

      await expect(
        nonSearchableRepo.countAll({ searchTerm: 'test' }),
      ).rejects.toThrow('Searchable fields not defined for User');
    });
  });

  describe('Backward compatibility with legacy search methods', () => {
    it('should still work with legacy search method', async () => {
      const results = await searchableUserRepository.search('john');

      expect(results).toHaveLength(4);
      expect(results.map((user) => user.name)).toContain('John Doe');
      expect(results.map((user) => user.name)).toContain('John Smith');
      expect(results.map((user) => user.name)).toContain('Alice Johnson');
      expect(results.map((user) => user.name)).toContain('Bob Johnson');
    });

    it('should still work with legacy searchPaginated method', async () => {
      const results = await searchableUserRepository.searchPaginated('john', {
        page: 1,
        pageSize: 2,
        filters: { active: true },
      });

      expect(results.data).toHaveLength(2);
      expect(results.pagination.totalCount).toBe(2);
      expect(results.data.every((user) => user.active)).toBe(true);
    });

    it('should produce same results with new findAll vs legacy search', async () => {
      const newResults = await searchableUserRepository.findAll({
        searchTerm: 'johnson',
      });
      const legacyResults = await searchableUserRepository.search('johnson');

      expect(newResults.map((u) => u.id).sort()).toEqual(
        legacyResults.map((u) => u.id).sort(),
      );
    });

    it('should produce same results with new findAllPaginated vs legacy searchPaginated', async () => {
      const newResults = await searchableUserRepository.findAllPaginated({
        searchTerm: 'john',
        page: 1,
        pageSize: 10,
        orderBy: [{ field: 'name', direction: 'asc' }],
      });
      const legacyResults = await searchableUserRepository.searchPaginated(
        'john',
        {
          page: 1,
          pageSize: 10,
          orderBy: [{ field: 'name', direction: 'asc' }],
        },
      );

      expect(newResults.data.map((u) => u.id).sort()).toEqual(
        legacyResults.data.map((u) => u.id).sort(),
      );
      expect(newResults.pagination.totalCount).toBe(
        legacyResults.pagination.totalCount,
      );
    });
  });

  describe('Case sensitivity and special characters', () => {
    it('should perform case-insensitive search with filters', async () => {
      const lowerResults = await searchableUserRepository.findAll({
        searchTerm: 'john',
        filters: { active: true },
      });
      const upperResults = await searchableUserRepository.findAll({
        searchTerm: 'JOHN',
        filters: { active: true },
      });
      const mixedResults = await searchableUserRepository.findAll({
        searchTerm: 'JoHn',
        filters: { active: true },
      });

      // All searches should return the same number of results
      expect(lowerResults).toHaveLength(2);
      expect(upperResults).toHaveLength(2);
      expect(mixedResults).toHaveLength(2);

      // Verify the same results are returned regardless of case
      expect(lowerResults.map((u) => u.id).sort()).toEqual(
        upperResults.map((u) => u.id).sort(),
      );
      expect(lowerResults.map((u) => u.id).sort()).toEqual(
        mixedResults.map((u) => u.id).sort(),
      );
    });

    it('should handle special characters in search with filters', async () => {
      // Create a user with special characters
      await searchableUserRepository.create({
        name: 'José María',
        email: 'jose.maria@test.com',
        active: true,
      });

      const results = await searchableUserRepository.findAll({
        searchTerm: 'josé',
        filters: { active: true },
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('José María');
    });

    it('should handle domain search with filters', async () => {
      const results = await searchableUserRepository.findAll({
        searchTerm: 'inactive.com',
        filters: { active: false },
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Bob Johnson');
      expect(results[0].email).toBe('bob@inactive.com');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty search term with filters', async () => {
      const results = await searchableUserRepository.findAll({
        searchTerm: '',
        filters: { active: true },
      });

      // Empty search term should fall back to filter-only behavior
      expect(results).toHaveLength(3);
      expect(results.every((user) => user.active)).toBe(true);
    });

    it('should handle whitespace-only search term with filters', async () => {
      const results = await searchableUserRepository.findAll({
        searchTerm: '   ',
        filters: { active: true },
      });

      // Whitespace-only search term should fall back to filter-only behavior
      expect(results).toHaveLength(3);
      expect(results.every((user) => user.active)).toBe(true);
    });

    it('should handle search with multiple filters', async () => {
      // Create additional test data
      await searchableUserRepository.create({
        name: 'John Active',
        email: 'john.active@example.com',
        active: true,
      });

      const results = await searchableUserRepository.findAll({
        searchTerm: 'john',
        filters: {
          active: true,
          email: 'john@example.com',
        },
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('John Doe');
      expect(results[0].email).toBe('john@example.com');
    });
  });
});
