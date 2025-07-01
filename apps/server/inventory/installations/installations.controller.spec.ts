import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import { cityFactory, populationFactory } from '../../tests/factories';
import { getFactoryDb } from '../../tests/factories/factory-utils';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueCode,
  createUniqueName,
} from '../../tests/shared/test-utils';
import { cityRepository } from '../cities/cities.repository';
import { db } from '../db-service';
import { createNode } from '../nodes/nodes.controller';
import { nodeRepository } from '../nodes/nodes.repository';
import { populationRepository } from '../populations/populations.repository';
import type {
  CreateInstallationPayload,
  CreateNodeInstallationPayload,
} from './installations.types';
import { installationRepository } from './installations.repository';
import {
  createInstallation,
  deleteInstallation,
  getInstallation,
  listInstallations,
  listInstallationsPaginated,
  updateInstallation,
} from './installations.controller';

describe('Installations Controller', () => {
  const testSuiteId = createTestSuiteId('installations-controller');
  const factoryDb = getFactoryDb(db);

  // Cleanup helper using test-utils
  const installationCleanup = createCleanupHelper(
    ({ id }) => installationRepository.forceDelete(id),
    'installation',
  );
  const nodeCleanup = createCleanupHelper(
    ({ id }) => nodeRepository.forceDelete(id),
    'node',
  );

  // Test data and setup
  const testInstallation = {
    name: createUniqueName('Test Installation', testSuiteId),
    address: 'Test Address 123',
    description: 'Test installation description',
  };

  // Variable to store created IDs for cleanup
  let createdInstallationId: number;
  let testCityId: number;
  let testPopulationId: number;
  let testNodeId: number;

  beforeAll(async () => {
    // Create test dependencies using factories for node installation tests
    const testCity = await cityFactory(factoryDb).create({
      name: createUniqueName('Test City', testSuiteId),
      latitude: 19.4326,
      longitude: -99.1332,
      timezone: 'America/Mexico_City',
    });
    testCityId = testCity.id;

    const testPopulation = await populationFactory(factoryDb).create({
      code: createUniqueCode('TPOP', 3),
      description: 'Test population for installation tests',
      active: true,
    });
    testPopulationId = testPopulation.id;

    // Create a test node without installation for testing installation creation
    const nodeData = {
      code: createUniqueCode('TN', 3),
      name: createUniqueName('Test Node', testSuiteId),
      latitude: 19.4326,
      longitude: -99.1332,
      radius: 1000,
      cityId: testCityId,
      populationId: testPopulationId,
    };
    const createdNode = await createNode(nodeData);
    testNodeId = nodeCleanup.track(createdNode.id);
  });

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
    // Clean up all tracked nodes and installations
    await nodeCleanup.cleanupAll();
    await installationCleanup.cleanupAll();

    // Also clean up the main test installation if it exists
    if (createdInstallationId) {
      try {
        await deleteInstallation({ id: createdInstallationId });
      } catch (error) {
        console.log('Error cleaning up main test installation:', error);
      }
    }

    // Clean up factory-created entities by specific IDs to avoid affecting other tests
    if (testPopulationId) {
      try {
        await populationRepository.forceDelete(testPopulationId);
      } catch (error) {
        console.log('Error cleaning up test population:', error);
      }
    }
    if (testCityId) {
      try {
        await cityRepository.forceDelete(testCityId);
      } catch (error) {
        console.log('Error cleaning up test city:', error);
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

    test('should create an installation associated with a node', async () => {
      const installationData: CreateNodeInstallationPayload = {
        nodeId: testNodeId,
        name: createUniqueName('Node Installation', testSuiteId),
        address: 'Test Node Installation Address',
        description: 'Installation created through node association',
      };

      const response = await createInstallation(installationData);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(installationData.name);
      expect(response.description).toBe(installationData.description);
      expect(response.address).toBe(installationData.address);
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();

      // Verify the node was updated with the installation ID
      const updatedNode = await nodeRepository.findOne(testNodeId);
      expect(updatedNode?.installationId).toBe(response.id);

      // Track for cleanup
      installationCleanup.track(response.id);
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

    test('should handle node not found error when creating installation', async () => {
      const installationData: CreateNodeInstallationPayload = {
        nodeId: 9999, // Non-existent node
        name: createUniqueName('Non-existent Node Installation', testSuiteId),
        address: 'Non-existent Node Address',
        description: 'Installation for non-existent node',
      };

      await expect(createInstallation(installationData)).rejects.toThrow();
    });

    test('should handle node already has installation error', async () => {
      // Create a new node specifically for this test
      const newNodeData = {
        code: createUniqueCode('TN2', 3),
        name: createUniqueName('Test Node 2', testSuiteId),
        latitude: 19.5326,
        longitude: -99.2332,
        radius: 1000,
        cityId: testCityId,
        populationId: testPopulationId,
      };
      const newNode = await createNode(newNodeData);
      const newNodeId = nodeCleanup.track(newNode.id);

      // First, create an installation for the new node
      const firstInstallationData: CreateNodeInstallationPayload = {
        nodeId: newNodeId,
        name: createUniqueName('First Installation', testSuiteId),
        address: 'First Installation Address',
        description: 'First installation for node',
      };

      const firstInstallation = await createInstallation(firstInstallationData);
      installationCleanup.track(firstInstallation.id);

      // Try to create a second installation for the same node
      const secondInstallationData: CreateNodeInstallationPayload = {
        nodeId: newNodeId,
        name: createUniqueName('Second Installation', testSuiteId),
        address: 'Second Installation Address',
        description: 'Second installation for same node',
      };

      // Capture the error to validate specific error code
      let validationError: FieldValidationError | undefined;
      try {
        await createInstallation(secondInstallationData);
      } catch (error) {
        validationError = error as FieldValidationError;
      }

      expect(validationError).toBeDefined();
      const typedValidationError = validationError as FieldValidationError;
      expect(typedValidationError.name).toBe('FieldValidationError');
      expect(typedValidationError.fieldErrors).toBeDefined();
      expect(typedValidationError.fieldErrors[0].field).toBe('nodeId');
      expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
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
