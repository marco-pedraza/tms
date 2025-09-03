import { afterAll, describe, expect, test } from 'vitest';
import {
  createTechnology,
  deleteTechnology,
  getTechnology,
  listTechnologies,
  listTechnologiesPaginated,
  updateTechnology,
} from './technologies.controller';

describe('Technologies Controller', () => {
  // Test data
  const testTechnology = {
    name: 'Test Technology',
    provider: 'Test Provider',
    version: '1.0.0',
    description: 'Test technology',
    active: true,
  };

  // Variable to store created IDs for cleanup
  let createdTechnologyId: number;

  afterAll(async () => {
    // Clean up test data
    if (createdTechnologyId) {
      try {
        await deleteTechnology({ id: createdTechnologyId });
      } catch (error) {
        console.log('Error cleaning up test technology:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new technology', async () => {
      const response = await createTechnology(testTechnology);

      // Store the ID for later cleanup
      createdTechnologyId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testTechnology.name);
      expect(response.provider).toBe(testTechnology.provider);
      expect(response.version).toBe(testTechnology.version);
      expect(response.description).toBe(testTechnology.description);
      expect(response.active).toBe(testTechnology.active);
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();
      expect(response.deletedAt).toBeNull();
    });

    test('should retrieve a technology by ID', async () => {
      const response = await getTechnology({ id: createdTechnologyId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdTechnologyId);
      expect(response.name).toBe(testTechnology.name);
      expect(response.provider).toBe(testTechnology.provider);
      expect(response.version).toBe(testTechnology.version);
    });

    test('should list all technologies (non-paginated)', async () => {
      const response = await listTechnologies({
        filters: { active: true },
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      // Find our test technology in the results
      const foundTechnology = response.data.find(
        (technology) => technology.id === createdTechnologyId,
      );
      expect(foundTechnology).toBeDefined();
      expect(foundTechnology?.name).toBe(testTechnology.name);
    });

    test('should list technologies with pagination', async () => {
      const response = await listTechnologiesPaginated({
        page: 1,
        pageSize: 10,
        filters: { active: true },
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
      expect(response.pagination.totalCount).toBeGreaterThan(0);
    });

    test('should search technologies by term', async () => {
      const response = await listTechnologies({
        searchTerm: 'Test',
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // Should find our test technology
      const foundTechnology = response.data.find(
        (technology) => technology.id === createdTechnologyId,
      );
      expect(foundTechnology).toBeDefined();
    });

    test('should update a technology', async () => {
      const updatedData = {
        name: 'Updated Test Technology',
        description: 'Updated description',
        active: false,
      };

      const response = await updateTechnology({
        id: createdTechnologyId,
        ...updatedData,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdTechnologyId);
      expect(response.name).toBe(updatedData.name);
      expect(response.description).toBe(updatedData.description);
      expect(response.active).toBe(updatedData.active);
      // Original fields should remain unchanged
      expect(response.provider).toBe(testTechnology.provider);
      expect(response.version).toBe(testTechnology.version);
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors when getting technology', async () => {
      await expect(getTechnology({ id: 99999 })).rejects.toThrow();
    });

    test('should handle not found errors when updating technology', async () => {
      await expect(
        updateTechnology({
          id: 99999,
          name: 'Non-existent technology',
        }),
      ).rejects.toThrow();
    });

    test('should handle not found errors when deleting technology', async () => {
      await expect(deleteTechnology({ id: 99999 })).rejects.toThrow();
    });

    test('should handle validation errors for duplicate names', async () => {
      // Try to create another technology with the same name
      await expect(
        createTechnology({
          name: 'Updated Test Technology', // This name was used in the update test
          provider: 'Test Provider',
          version: '1.0.0',
        }),
      ).rejects.toThrow();
    });
  });

  describe('domain validation', () => {
    test('should accept valid provider and version', async () => {
      const validProvider = 'Test Provider';
      const validVersion = '1.0.0';

      const technology = await createTechnology({
        name: 'Domain Validation Test Technology',
        provider: validProvider,
        version: validVersion,
      });
      expect(technology.provider).toBe(validProvider);
      expect(technology.version).toBe(validVersion);

      // Clean up
      await deleteTechnology({ id: technology.id });
    });
  });
});
