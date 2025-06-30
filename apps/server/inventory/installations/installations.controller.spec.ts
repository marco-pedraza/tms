import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueCode,
  createUniqueName,
} from '../../tests/shared/test-utils';
import type { CreateInstallationPayload } from './installations.types';
import { installationRepository } from './installations.repository';
import {
  deleteInstallation,
  getInstallation,
  listInstallations,
  listInstallationsPaginated,
  updateInstallation,
} from './installations.controller';

describe('Installations Controller', () => {
  const testSuiteId = createTestSuiteId('installations-controller');

  // Cleanup helper using test-utils
  const installationCleanup = createCleanupHelper(
    deleteInstallation,
    'installation',
  );

  // Test data and setup
  const testInstallation = {
    name: createUniqueName('Test Installation', testSuiteId),
    address: 'Test Address 123',
    description: 'Test installation description',
  };

  // Variable to store created IDs for cleanup
  let createdInstallationId: number;

  /**
   * Helper function to create a test installation using repository
   * Since there's no public create endpoint, we use the repository directly
   */
  async function createTestInstallation(
    baseName = 'Test Installation',
    options: Partial<CreateInstallationPayload> = {},
  ) {
    const uniqueName = createUniqueName(baseName, testSuiteId);
    const data = {
      name: uniqueName,
      address: 'Test Address 123',
      description: 'Test installation description',
      ...options,
    };

    // Since we can't create installations through the controller,
    // we'll use the repository directly for test setup
    const installation = await installationRepository.create(data);
    return installationCleanup.track(installation.id);
  }

  afterAll(async () => {
    // Clean up all tracked installations using test-utils
    await installationCleanup.cleanupAll();

    // Also clean up the main test installation if it exists
    if (createdInstallationId) {
      try {
        await deleteInstallation({ id: createdInstallationId });
      } catch (error) {
        console.log('Error cleaning up main test installation:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a test installation for testing purposes', async () => {
      // Since there's no public create endpoint, we create using repository
      const response = await installationRepository.create(testInstallation);

      // Store the ID for later cleanup
      createdInstallationId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testInstallation.name);
      expect(response.address).toBe(testInstallation.address);
      expect(response.description).toBe(testInstallation.description);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve an installation by ID', async () => {
      const response = await getInstallation({ id: createdInstallationId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdInstallationId);
      expect(response.name).toBe(testInstallation.name);
    });

    test('should update an installation', async () => {
      const updatedName = createUniqueName(
        'Updated Test Installation',
        testSuiteId,
      );
      const response = await updateInstallation({
        id: createdInstallationId,
        name: updatedName,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdInstallationId);
      expect(response.name).toBe(updatedName);
    });

    test('should delete an installation', async () => {
      // Create an installation specifically for deletion test
      const installationToDeleteId = await createTestInstallation(
        'Installation To Delete',
        {
          address: 'Delete Address 456',
          description: 'Installation to be deleted',
        },
      );

      // Delete should not throw an error
      await expect(
        deleteInstallation({ id: installationToDeleteId }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(
        getInstallation({ id: installationToDeleteId }),
      ).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getInstallation({ id: 9999 })).rejects.toThrow();
    });

    test('should handle not found errors for update', async () => {
      await expect(
        updateInstallation({
          id: 9999,
          name: 'Non-existent Installation',
        }),
      ).rejects.toThrow();
    });

    test('should handle not found errors for delete', async () => {
      await expect(deleteInstallation({ id: 9999 })).rejects.toThrow();
    });
  });

  describe('pagination', () => {
    test('should return paginated installations with default parameters', async () => {
      const response = await listInstallationsPaginated({});

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
      const response = await listInstallationsPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listInstallations({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      // No pagination info should be present
      expect(response).not.toHaveProperty('pagination');
    });
  });

  describe('search functionality', () => {
    test('should search installations using searchTerm in list endpoint', async () => {
      // Create a unique installation for search testing
      const searchableInstallationId = await createTestInstallation(
        'Searchable Test Installation',
        {
          address: 'Searchable Address',
          description: 'Searchable description',
        },
      );

      // Search for the installation using searchTerm in listInstallations
      const response = await listInstallations({ searchTerm: 'Searchable' });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.some((i) => i.id === searchableInstallationId)).toBe(
        true,
      );
    });

    test('should search installations with pagination using searchTerm', async () => {
      const response = await listInstallationsPaginated({
        searchTerm: 'Test',
        page: 1,
        pageSize: 5,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
    });

    test('should search by address as well as name', async () => {
      // Create installation with unique address for search testing
      const addressCode = createUniqueCode('USAddr');
      const addressSearchInstallationId = await createTestInstallation(
        'Regular Installation Name',
        {
          address: `UniqueSearchableAddress-${addressCode}`,
          description: 'Regular description',
        },
      );

      // Search for the installation using address term
      const response = await listInstallations({
        searchTerm: `UniqueSearchableAddress-${addressCode}`,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(
        response.data.some((i) => i.id === addressSearchInstallationId),
      ).toBe(true);
    });
  });

  describe('ordering and filtering', () => {
    beforeAll(async () => {
      // Create test installations with different properties
      const installations = [
        {
          name: 'Alpha Installation',
          address: 'Alpha Address',
          description: 'Alpha desc',
        },
        {
          name: 'Beta Installation',
          address: 'Beta Address',
          description: 'Beta desc',
        },
        {
          name: 'Gamma Installation',
          address: 'Gamma Address',
          description: 'Gamma desc',
        },
      ];

      // Create installations - they're automatically tracked by createTestInstallation
      for (const installation of installations) {
        await createTestInstallation(installation.name, {
          address: installation.address,
          description: installation.description,
        });
      }
    });

    test('should order installations by name descending', async () => {
      const response = await listInstallations({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      const names = response.data.map((i) => i.name);
      // Check if names are in descending order
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should order installations by address ascending', async () => {
      const response = await listInstallations({
        orderBy: [{ field: 'address', direction: 'asc' }],
      });

      const addresses = response.data.map((i) => i.address);
      // Check if addresses are in ascending order
      for (let i = 0; i < addresses.length - 1; i++) {
        expect(addresses[i] <= addresses[i + 1]).toBe(true);
      }
    });

    test('should combine ordering and searching in paginated results', async () => {
      const response = await listInstallationsPaginated({
        searchTerm: 'Installation',
        orderBy: [{ field: 'name', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      // Check ordering (ascending)
      const names = response.data.map((i) => i.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }

      // Check pagination properties
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });

    test('should allow multi-field ordering', async () => {
      // Create installations with same address but different names
      const sameAddressCode = createUniqueCode('SameAddr');
      const sameAddressInstallations = [
        {
          name: 'Same Address A',
          address: `Same Street-${sameAddressCode}`,
          description: 'Same A',
        },
        {
          name: 'Same Address B',
          address: `Same Street-${sameAddressCode}`,
          description: 'Same B',
        },
      ];

      // Create installations
      for (const installation of sameAddressInstallations) {
        await createTestInstallation(installation.name, {
          address: installation.address,
          description: installation.description,
        });
      }

      // Order by address first, then by name
      const response = await listInstallations({
        orderBy: [
          { field: 'address', direction: 'asc' },
          { field: 'name', direction: 'asc' },
        ],
      });

      // Get installations with same address and verify they're ordered by name
      const sameAddressResults = response.data.filter(
        (i) => i.address === `Same Street-${sameAddressCode}`,
      );
      const sameAddressNames = sameAddressResults.map((i) => i.name);

      for (let i = 0; i < sameAddressNames.length - 1; i++) {
        expect(sameAddressNames[i] <= sameAddressNames[i + 1]).toBe(true);
      }
    });
  });
});
