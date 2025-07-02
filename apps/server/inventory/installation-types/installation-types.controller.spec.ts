import { afterAll, describe, expect, test } from 'vitest';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueName,
} from '../../tests/shared/test-utils';
import type { CreateInstallationTypePayload } from './installation-types.types';
import {
  createInstallationType,
  deleteInstallationType,
  getInstallationType,
  listInstallationTypes,
  listInstallationTypesPaginated,
  updateInstallationType,
} from './installation-types.controller';

describe('Installation Types Controller', () => {
  const testSuiteId = createTestSuiteId('installation-types-controller');

  // Cleanup helper using test-utils
  const installationTypeCleanup = createCleanupHelper(
    deleteInstallationType,
    'installation type',
  );

  // Test data and setup
  const testInstallationType = {
    name: createUniqueName('Test Installation Type', testSuiteId),
    description: 'Test installation type description',
  };

  // Variable to store created IDs for cleanup
  let createdInstallationTypeId: number;

  /**
   * Helper function to create a test installation type
   */
  async function createTestInstallationType(
    baseName = 'Test Installation Type',
    options: Partial<CreateInstallationTypePayload> = {},
  ) {
    const uniqueName = createUniqueName(baseName, testSuiteId);
    const data = {
      name: uniqueName,
      description: 'Test installation type description',
      ...options,
    };

    const installationType = await createInstallationType(data);
    return installationTypeCleanup.track(installationType.id);
  }

  afterAll(async () => {
    // Clean up all tracked installation types using test-utils
    await installationTypeCleanup.cleanupAll();

    // Also clean up the main test installation type if it exists
    if (createdInstallationTypeId) {
      try {
        await deleteInstallationType({ id: createdInstallationTypeId });
      } catch (error) {
        console.log('Error cleaning up main test installation type:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new installation type', async () => {
      const response = await createInstallationType(testInstallationType);

      // Store the ID for later cleanup
      createdInstallationTypeId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testInstallationType.name);
      expect(response.description).toBe(testInstallationType.description);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve an installation type by ID', async () => {
      const response = await getInstallationType({
        id: createdInstallationTypeId,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdInstallationTypeId);
      expect(response.name).toBe(testInstallationType.name);
    });

    test('should update an installation type', async () => {
      const updatedName = createUniqueName(
        'Updated Test Installation Type',
        testSuiteId,
      );
      const response = await updateInstallationType({
        id: createdInstallationTypeId,
        name: updatedName,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdInstallationTypeId);
      expect(response.name).toBe(updatedName);
    });

    test('should delete an installation type', async () => {
      // Create an installation type specifically for deletion test
      const installationTypeToDeleteId = await createTestInstallationType(
        'Installation Type To Delete',
        {
          description: 'Installation type to be deleted',
        },
      );

      // Delete should not throw an error
      await expect(
        deleteInstallationType({ id: installationTypeToDeleteId }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(
        getInstallationType({ id: installationTypeToDeleteId }),
      ).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getInstallationType({ id: 9999 })).rejects.toThrow();
    });

    test('should handle not found errors for update', async () => {
      await expect(
        updateInstallationType({
          id: 9999,
          name: 'Non-existent Installation Type',
        }),
      ).rejects.toThrow();
    });

    test('should handle not found errors for delete', async () => {
      await expect(deleteInstallationType({ id: 9999 })).rejects.toThrow();
    });
  });

  describe('pagination', () => {
    test('should return paginated installation types with default parameters', async () => {
      const response = await listInstallationTypesPaginated({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBeDefined();
      expect(response.pagination.totalCount).toBeDefined();
      expect(response.pagination.totalPages).toBeDefined();
      expect(typeof response.pagination.hasNextPage).toBe('boolean');
      expect(typeof response.pagination.hasPreviousPage).toBe('boolean');
    });

    test('should honor page and pageSize parameters', async () => {
      const response = await listInstallationTypesPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listInstallationTypes({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      // No pagination info should be present
      expect(response).not.toHaveProperty('pagination');
    });
  });

  describe('search functionality', () => {
    test('should search installation types using searchTerm in list endpoint', async () => {
      // Create a unique installation type for search testing
      const searchableInstallationTypeId = await createTestInstallationType(
        'Searchable Test Installation Type',
        {
          description: 'Searchable description',
        },
      );

      // Search for the installation type
      const response = await listInstallationTypes({
        searchTerm: 'Searchable',
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      // Check if our test installation type is in the results
      const foundInstallationType = response.data.find(
        (it) => it.id === searchableInstallationTypeId,
      );
      expect(foundInstallationType).toBeDefined();
    });

    test('should search installation types using searchTerm in paginated endpoint', async () => {
      // Search for installation types containing "Test"
      const response = await listInstallationTypesPaginated({
        searchTerm: 'Test',
        page: 1,
        pageSize: 10,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();

      // All results should contain "Test" in name or description
      response.data.forEach((installationType) => {
        const nameContainsTest = installationType.name
          .toLowerCase()
          .includes('test');
        const descriptionContainsTest = installationType.description
          ?.toLowerCase()
          .includes('test');
        expect(nameContainsTest || descriptionContainsTest).toBe(true);
      });
    });

    test('should return empty results for non-matching search', async () => {
      const response = await listInstallationTypes({
        searchTerm: 'NonExistentSearchTerm12345',
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0);
    });
  });

  describe('ordering', () => {
    test('should order installation types by name ascending', async () => {
      const response = await listInstallationTypes({
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      if (response.data.length > 1) {
        for (let i = 1; i < response.data.length; i++) {
          expect(response.data[i - 1].name <= response.data[i].name).toBe(true);
        }
      }
    });

    test('should order installation types by name descending', async () => {
      const response = await listInstallationTypes({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      if (response.data.length > 1) {
        for (let i = 1; i < response.data.length; i++) {
          expect(response.data[i - 1].name >= response.data[i].name).toBe(true);
        }
      }
    });
  });
});
