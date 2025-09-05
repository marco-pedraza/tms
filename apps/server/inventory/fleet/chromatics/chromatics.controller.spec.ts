import { afterAll, describe, expect, test } from 'vitest';
import {
  createChromatic,
  deleteChromatic,
  getChromatic,
  listChromatics,
  listChromaticsPaginated,
  updateChromatic,
} from './chromatics.controller';

describe('Chromatics Controller', () => {
  // Test data
  const testChromatic = {
    name: 'Test Chromatic',
    imageUrl: 'https://example.com/image.jpg',
    description: 'Test chromatic',
    active: true,
  };

  // Variable to store created IDs for cleanup
  let createdChromaticId: number;

  afterAll(async () => {
    // Clean up test data
    if (createdChromaticId) {
      try {
        await deleteChromatic({ id: createdChromaticId });
      } catch (error) {
        console.log('Error cleaning up test chromatic:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new chromatic', async () => {
      const response = await createChromatic(testChromatic);

      // Store the ID for later cleanup
      createdChromaticId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testChromatic.name);
      expect(response.imageUrl).toBe(testChromatic.imageUrl);
      expect(response.description).toBe(testChromatic.description);
      expect(response.active).toBe(testChromatic.active);
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();
      expect(response.deletedAt).toBeNull();
    });

    test('should retrieve a chromatic by ID', async () => {
      const response = await getChromatic({ id: createdChromaticId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdChromaticId);
      expect(response.name).toBe(testChromatic.name);
      expect(response.imageUrl).toBe(testChromatic.imageUrl);
      expect(response.description).toBe(testChromatic.description);
      expect(response.active).toBe(testChromatic.active);
    });

    test('should list all chromatics (non-paginated)', async () => {
      const response = await listChromatics({
        filters: { active: true },
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      // Find our test chromatic in the results
      const foundChromatic = response.data.find(
        (chromatic) => chromatic.id === createdChromaticId,
      );
      expect(foundChromatic).toBeDefined();
      expect(foundChromatic?.name).toBe(testChromatic.name);
    });

    test('should list chromatics with pagination', async () => {
      const response = await listChromaticsPaginated({
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

    test('should search chromatics by term', async () => {
      const response = await listChromatics({
        searchTerm: 'Test',
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // Should find our test chromatic
      const foundChromatic = response.data.find(
        (chromatic) => chromatic.id === createdChromaticId,
      );
      expect(foundChromatic).toBeDefined();
    });

    test('should update a chromatic', async () => {
      const updatedData = {
        name: 'Updated Test Chromatic',
        description: 'Updated description',
        active: false,
      };

      const response = await updateChromatic({
        id: createdChromaticId,
        ...updatedData,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdChromaticId);
      expect(response.name).toBe(updatedData.name);
      expect(response.description).toBe(updatedData.description);
      expect(response.active).toBe(updatedData.active);
      // Original fields should remain unchanged
      expect(response.imageUrl).toBe(testChromatic.imageUrl);
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors when getting chromatic', async () => {
      await expect(getChromatic({ id: 99999 })).rejects.toThrow();
    });

    test('should handle not found errors when updating chromatic', async () => {
      await expect(
        updateChromatic({
          id: 99999,
          name: 'Non-existent chromatic',
        }),
      ).rejects.toThrow();
    });

    test('should handle not found errors when deleting chromatic', async () => {
      await expect(deleteChromatic({ id: 99999 })).rejects.toThrow();
    });

    test('should handle validation errors for duplicate names', async () => {
      // Try to create another chromatic with the same name
      await expect(
        createChromatic({
          name: 'Updated Test Chromatic', // This name was used in the update test
          imageUrl: 'https://example.com/image2.jpg',
        }),
      ).rejects.toThrow();
    });
  });

  describe('domain validation', () => {
    test('should accept valid imageUrl and active', async () => {
      const validImageUrl = 'https://example.com/image.jpg';
      const validActive = true;

      const chromatic = await createChromatic({
        name: 'Domain Validation Test Chromatic',
        imageUrl: validImageUrl,
        active: validActive,
      });
      expect(chromatic.imageUrl).toBe(validImageUrl);
      expect(chromatic.active).toBe(validActive);

      // Clean up
      await deleteChromatic({ id: chromatic.id });
    });
  });
});
