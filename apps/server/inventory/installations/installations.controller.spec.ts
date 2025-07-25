import { eq } from 'drizzle-orm';
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
import {
  createAmenity,
  deleteAmenity,
} from '../amenities/amenities.controller';
import { AmenityCategory, AmenityType } from '../amenities/amenities.types';
import { cityRepository } from '../cities/cities.repository';
import { db } from '../db-service';
import { installationPropertyRepository } from '../installation-properties/installation-properties.repository';
import { createInstallationSchema } from '../installation-schemas/installation-schemas.controller';
import { installationSchemaRepository } from '../installation-schemas/installation-schemas.repository';
import { InstallationSchemaFieldType } from '../installation-schemas/installation-schemas.types';
import {
  createInstallationType,
  deleteInstallationType,
} from '../installation-types/installation-types.controller';
import { createNode } from '../nodes/nodes.controller';
import { nodeRepository } from '../nodes/nodes.repository';
import { nodes } from '../nodes/nodes.schema';
import { populationRepository } from '../populations/populations.repository';
import type { CreateNodeInstallationPayload } from './installations.types';
import { installationRepository } from './installations.repository';
import {
  assignAmenitiesToInstallation,
  createInstallation,
  deleteInstallation,
  getInstallation,
  listInstallations,
  listInstallationsPaginated,
  updateInstallation,
  updateInstallationProperties,
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

  // Variables to store created IDs for cleanup
  let createdInstallationId: number;
  let testCityId: number;
  let testPopulationId: number;
  let testNodeId: number;
  let testInstallationTypeId: number;

  beforeAll(async () => {
    // Create test installation type first
    const testInstallationType = await createInstallationType({
      name: createUniqueName('Test Installation Type', testSuiteId),
      code: createUniqueCode('TIT', 3),
      description: 'Test installation type for installations tests',
    });
    testInstallationTypeId = testInstallationType.id;

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

    // Create a test node for installation creation
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
   * Helper function to create a test installation using the controller
   * Uses the public createInstallation endpoint with a node association
   */
  async function createTestInstallation(
    baseName = 'Test Installation',
    options: Partial<CreateNodeInstallationPayload> = {},
  ) {
    // Create a dedicated node for this installation if not provided
    let nodeId = options.nodeId;
    if (!nodeId) {
      const nodeData = {
        code: createUniqueCode('TN', 3),
        name: createUniqueName('Helper Node', testSuiteId),
        latitude: 19.4326 + Math.random() * 0.1, // Slight variation to avoid conflicts
        longitude: -99.1332 + Math.random() * 0.1,
        radius: 1000,
        cityId: testCityId,
        populationId: testPopulationId,
      };
      const node = await createNode(nodeData);
      nodeId = nodeCleanup.track(node.id);
    }

    const uniqueName = createUniqueName(baseName, testSuiteId);
    const data: CreateNodeInstallationPayload = {
      nodeId,
      name: uniqueName,
      address: 'Test Address 123',
      description: 'Test installation description',
      installationTypeId: testInstallationTypeId,
      ...options,
    };

    const installation = await createInstallation(data);
    return installationCleanup.track(installation.id);
  }

  afterAll(async () => {
    // Clean up installation properties first to avoid foreign key errors
    try {
      await installationPropertyRepository.deleteAll();
    } catch (error) {
      console.log('Error cleaning up installation properties:', error);
    }

    // Clean up all tracked nodes and installations
    await nodeCleanup.cleanupAll();
    await installationCleanup.cleanupAll();

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

    // Clean up the test installation type
    if (testInstallationTypeId) {
      try {
        await deleteInstallationType({ id: testInstallationTypeId });
      } catch (error) {
        console.log('Error cleaning up test installation type:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create an installation associated with a node and retrieve it with location information', async () => {
      const installationData: CreateNodeInstallationPayload = {
        nodeId: testNodeId,
        name: createUniqueName('Main Test Installation', testSuiteId),
        address: 'Test Installation Address',
        description: 'Installation created through node association',
        installationTypeId: testInstallationTypeId,
      };

      const response = await createInstallation(installationData);

      // Store the ID for later cleanup and use in other tests
      createdInstallationId = installationCleanup.track(response.id);

      // Verify creation
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(installationData.name);
      expect(response.description).toBe(installationData.description);
      expect(response.address).toBe(installationData.address);
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();

      // Verify location information is included directly in creation response
      expect(response.location).toBeDefined();
      expect(response.location).not.toBeNull();
      expect(response.location?.latitude).toBe(19.4326); // From test node data
      expect(response.location?.longitude).toBe(-99.1332); // From test node data
      expect(response.location?.radius).toBe(1000); // From test node data

      // Verify properties are included in the creation response
      expect(response.properties).toBeDefined();
      expect(Array.isArray(response.properties)).toBe(true);
      // Since this installation has an installation type, properties should be included
      if (response.installationTypeId) {
        response.properties.forEach((property) => {
          expect(property.name).toBeDefined();
          expect(property.type).toBeDefined();
          expect(typeof property.required).toBe('boolean');
          expect(property.schemaId).toBeDefined();
          // Value should be null for newly created installations with no properties set
          expect(property.value).toBeNull();
        });
      }

      // Verify the node was updated with the installation ID
      const updatedNode = await nodeRepository.findOne(testNodeId);
      expect(updatedNode?.installationId).toBe(response.id);

      // Additional verification: retrieve it separately and verify consistency
      const retrievedInstallation = await getInstallation({ id: response.id });

      expect(retrievedInstallation).toBeDefined();
      expect(retrievedInstallation.id).toBe(response.id);
      expect(retrievedInstallation.name).toBe(installationData.name);
      expect(retrievedInstallation.address).toBe(installationData.address);
      expect(retrievedInstallation.description).toBe(
        installationData.description,
      );

      // Verify location information consistency between create and get responses
      expect(retrievedInstallation.location).toBeDefined();
      expect(retrievedInstallation.location).not.toBeNull();
      expect(retrievedInstallation.location?.latitude).toBe(
        response.location?.latitude,
      );
      expect(retrievedInstallation.location?.longitude).toBe(
        response.location?.longitude,
      );
      expect(retrievedInstallation.location?.radius).toBe(
        response.location?.radius,
      );
    });

    test('should retrieve an installation by ID', async () => {
      const response = await getInstallation({ id: createdInstallationId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdInstallationId);
      expect(response.name).toContain('Main Test Installation');

      // Since this installation was created with a node association,
      // the location should be present
      expect(response.location).not.toBeNull();
      expect(response.location?.latitude).toBe(19.4326);
      expect(response.location?.longitude).toBe(-99.1332);
      expect(response.location?.radius).toBe(1000);

      // Verify properties are included in the response
      expect(response.properties).toBeDefined();
      expect(Array.isArray(response.properties)).toBe(true);
      // Properties should be empty since this installation has no properties set,
      // but should still include schema definitions with null values
      if (response.installationTypeId) {
        // Only validate properties if installation has a type
        response.properties.forEach((property) => {
          expect(property.name).toBeDefined();
          expect(property.type).toBeDefined();
          expect(typeof property.required).toBe('boolean');
          expect(property.schemaId).toBeDefined();
          // Value should be null for unset properties
          expect(property.value).toBeNull();
        });
      }
    });

    test('should retrieve an installation with location information when associated with a node', async () => {
      // Create a dedicated node for this test to avoid conflicts
      const nodeForLocationTest = {
        code: createUniqueCode('TNLOC', 3),
        name: createUniqueName('Location Test Node', testSuiteId),
        latitude: 20.5326,
        longitude: -100.2332,
        radius: 2000,
        cityId: testCityId,
        populationId: testPopulationId,
      };
      const locationTestNode = await createNode(nodeForLocationTest);
      const locationTestNodeId = nodeCleanup.track(locationTestNode.id);

      // Create an installation associated with this node
      const installationData: CreateNodeInstallationPayload = {
        nodeId: locationTestNodeId,
        name: createUniqueName('Installation with Location', testSuiteId),
        address: 'Test Installation with Location Address',
        description: 'Installation with node location data',
        installationTypeId: testInstallationTypeId,
      };

      const createdInstallation = await createInstallation(installationData);
      const installationWithLocationId = installationCleanup.track(
        createdInstallation.id,
      );

      // Now retrieve it and verify location information
      const response = await getInstallation({
        id: installationWithLocationId,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(installationWithLocationId);
      expect(response.name).toBe(installationData.name);
      expect(response.address).toBe(installationData.address);
      expect(response.description).toBe(installationData.description);

      // Verify location information from the associated node
      expect(response.location).toBeDefined();
      expect(response.location).not.toBeNull();
      expect(response.location?.latitude).toBe(20.5326); // From our test node data
      expect(response.location?.longitude).toBe(-100.2332); // From our test node data
      expect(response.location?.radius).toBe(2000); // From our test node data
    });

    test('should update an installation', async () => {
      const updatedName = createUniqueName(
        'Updated Test Installation',
        testSuiteId,
      );
      const response = await updateInstallation({
        id: createdInstallationId,
        name: updatedName,
        installationTypeId: testInstallationTypeId,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdInstallationId);
      expect(response.name).toBe(updatedName);
      expect(response.installationTypeId).toBe(testInstallationTypeId);

      // Verify properties are included in the response
      expect(response.properties).toBeDefined();
      expect(Array.isArray(response.properties)).toBe(true);
      // Since this installation has an installation type, properties should be included
      if (response.installationTypeId) {
        response.properties.forEach((property) => {
          expect(property.name).toBeDefined();
          expect(property.type).toBeDefined();
          expect(typeof property.required).toBe('boolean');
          expect(property.schemaId).toBeDefined();
          expect(property.value !== undefined).toBe(true); // value should be defined (even if null)
        });
      }
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

      // Find the node associated with this installation
      const associatedNode = await db.query.nodes.findFirst({
        where: eq(nodes.installationId, installationToDeleteId),
      });

      // Delete the node first to remove the foreign key reference
      if (associatedNode) {
        await nodeRepository.delete(associatedNode.id);
      }

      // Now delete the installation should not throw an error
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

    test('should handle node not found error when creating installation', async () => {
      const installationData: CreateNodeInstallationPayload = {
        nodeId: 9999, // Non-existent node
        name: createUniqueName('Non-existent Node Installation', testSuiteId),
        address: 'Non-existent Node Address',
        description: 'Installation for non-existent node',
        installationTypeId: testInstallationTypeId,
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
        installationTypeId: testInstallationTypeId,
      };

      const firstInstallation = await createInstallation(firstInstallationData);
      installationCleanup.track(firstInstallation.id);

      // Try to create a second installation for the same node
      const secondInstallationData: CreateNodeInstallationPayload = {
        nodeId: newNodeId,
        name: createUniqueName('Second Installation', testSuiteId),
        address: 'Second Installation Address',
        description: 'Second installation for same node',
        installationTypeId: testInstallationTypeId,
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

  describe('installation properties', () => {
    const schemaCleanup = createCleanupHelper(
      ({ id }) => installationSchemaRepository.delete(id),
      'installation schema',
    );

    beforeAll(async () => {
      // Create various types of schemas for testing
      const schemas = [
        {
          name: 'price_per_booth',
          description: 'Price charged per booth in pesos',
          type: InstallationSchemaFieldType.NUMBER,
          required: true,
          installationTypeId: testInstallationTypeId,
        },
        {
          name: 'is_affiliated',
          description: 'Whether the installation is affiliated',
          type: InstallationSchemaFieldType.BOOLEAN,
          required: false,
          installationTypeId: testInstallationTypeId,
        },
        {
          name: 'opening_date',
          description: 'Date when the installation opened',
          type: InstallationSchemaFieldType.DATE,
          required: false,
          installationTypeId: testInstallationTypeId,
        },
        {
          name: 'installation_size',
          description: 'Size category of the installation',
          type: InstallationSchemaFieldType.ENUM,
          options: {
            enumValues: ['small', 'medium', 'large'],
          },
          required: true,
          installationTypeId: testInstallationTypeId,
        },
        {
          name: 'description_text',
          description: 'Detailed description of the installation',
          type: InstallationSchemaFieldType.STRING,
          required: false,
          installationTypeId: testInstallationTypeId,
        },
      ];

      // Create all schemas
      for (const schema of schemas) {
        const createdSchema = await createInstallationSchema(schema);
        schemaCleanup.track(createdSchema.id);
      }
    });

    afterAll(async () => {
      try {
        await installationPropertyRepository.deleteAll();
      } catch (error) {
        console.log('Error cleaning up installation properties:', error);
      }

      await schemaCleanup.cleanupAll();
    });

    describe('success scenarios', () => {
      test('should update installation properties with all field types and return installation with location', async () => {
        // Create a test installation with installation type
        const installationId = await createTestInstallation(
          'Properties Test Installation',
          {
            address: 'Properties Test Address',
            description: 'Installation for properties testing',
            installationTypeId: testInstallationTypeId,
          },
        );

        // Valid properties data covering all field types
        const propertiesData = [
          { name: 'price_per_booth', value: '45.50' }, // number
          { name: 'is_affiliated', value: 'true' }, // boolean
          { name: 'opening_date', value: '2024-01-15' }, // date
          { name: 'installation_size', value: 'medium' }, // enum
          { name: 'description_text', value: 'A well-maintained installation' }, // string
        ];

        const response = await updateInstallationProperties({
          id: installationId,
          properties: propertiesData,
        });

        // Verify response structure
        expect(response).toBeDefined();
        expect(response.id).toBe(installationId);
        expect(response.name).toContain('Properties Test Installation');
        expect(response.location).toBeDefined(); // Should include location info
        expect(response.installationTypeId).toBe(testInstallationTypeId);

        // Verify properties are included in the response
        expect(response.properties).toBeDefined();
        expect(Array.isArray(response.properties)).toBe(true);
        expect(response.properties).toHaveLength(5); // All 5 schemas should be returned

        // Verify specific property values and types
        const priceProperty = response.properties.find(
          (p) => p.name === 'price_per_booth',
        );
        expect(priceProperty).toBeDefined();
        expect(priceProperty?.value).toBe(45.5); // Should be cast to number
        expect(priceProperty?.type).toBe('number');

        const affiliatedProperty = response.properties.find(
          (p) => p.name === 'is_affiliated',
        );
        expect(affiliatedProperty).toBeDefined();
        expect(affiliatedProperty?.value).toBe(true); // Should be cast to boolean
        expect(affiliatedProperty?.type).toBe('boolean');

        const dateProperty = response.properties.find(
          (p) => p.name === 'opening_date',
        );
        expect(dateProperty).toBeDefined();
        expect(dateProperty?.value).toBe('2024-01-15'); // Should remain as string
        expect(dateProperty?.type).toBe('date');

        const enumProperty = response.properties.find(
          (p) => p.name === 'installation_size',
        );
        expect(enumProperty).toBeDefined();
        expect(enumProperty?.value).toBe('medium');
        expect(enumProperty?.type).toBe('enum');
        expect(enumProperty?.options).toEqual({
          enumValues: ['small', 'medium', 'large'],
        });

        const stringProperty = response.properties.find(
          (p) => p.name === 'description_text',
        );
        expect(stringProperty).toBeDefined();
        expect(stringProperty?.value).toBe('A well-maintained installation');
        expect(stringProperty?.type).toBe('string');

        // Verify properties without values have null values but complete schema info
        // (Since we're setting all properties, let's verify structure consistency)
        response.properties.forEach((property) => {
          expect(property.name).toBeDefined();
          expect(property.type).toBeDefined();
          expect(typeof property.required).toBe('boolean');
          expect(property.schemaId).toBeDefined();
          expect(property.value !== undefined).toBe(true); // value should be defined (even if null)
        });
      });

      test('should handle partial updates and different boolean formats', async () => {
        const installationId = await createTestInstallation(
          'Partial Properties Test',
          {
            installationTypeId: testInstallationTypeId,
          },
        );

        // Update only some properties, test boolean format conversion
        const partialPropertiesData = [
          { name: 'price_per_booth', value: '60.00' },
          { name: 'is_affiliated', value: '1' }, // Should be converted to 'true'
          { name: 'installation_size', value: 'large' }, // Required enum
        ];

        const response = await updateInstallationProperties({
          id: installationId,
          properties: partialPropertiesData,
        });

        // Verify the response structure and data
        expect(response).toBeDefined();
        expect(response.id).toBe(installationId);
        expect(response.location).toBeDefined();
        expect(response.installationTypeId).toBe(testInstallationTypeId);

        // Verify the installation was returned with location info (not just properties)
        expect(response.name).toContain('Partial Properties Test');
        expect(response.address).toBeDefined();

        // Verify properties are included in the response
        expect(response.properties).toBeDefined();
        expect(Array.isArray(response.properties)).toBe(true);
        expect(response.properties).toHaveLength(5); // All 5 schemas should be returned

        // Verify the properties we set
        const priceProperty = response.properties.find(
          (p) => p.name === 'price_per_booth',
        );
        expect(priceProperty).toBeDefined();
        expect(priceProperty?.value).toBe(60); // Should be cast to number
        expect(priceProperty?.type).toBe('number');

        const affiliatedProperty = response.properties.find(
          (p) => p.name === 'is_affiliated',
        );
        expect(affiliatedProperty).toBeDefined();
        expect(affiliatedProperty?.value).toBe(true); // '1' should be converted to true
        expect(affiliatedProperty?.type).toBe('boolean');

        const sizeProperty = response.properties.find(
          (p) => p.name === 'installation_size',
        );
        expect(sizeProperty).toBeDefined();
        expect(sizeProperty?.value).toBe('large');
        expect(sizeProperty?.type).toBe('enum');

        // Verify properties we didn't set have null values but complete schema info
        const dateProperty = response.properties.find(
          (p) => p.name === 'opening_date',
        );
        expect(dateProperty).toBeDefined();
        expect(dateProperty?.value).toBeNull(); // Not set
        expect(dateProperty?.type).toBe('date');

        const descriptionProperty = response.properties.find(
          (p) => p.name === 'description_text',
        );
        expect(descriptionProperty).toBeDefined();
        expect(descriptionProperty?.value).toBeNull(); // Not set
        expect(descriptionProperty?.type).toBe('string');
      });
    });

    describe('error scenarios', () => {
      test('should handle installation not found error', async () => {
        const propertiesData = [{ name: 'price_per_booth', value: '45.50' }];

        await expect(
          updateInstallationProperties({
            id: 9999, // Non-existent installation
            properties: propertiesData,
          }),
        ).rejects.toThrow('Installation with id 9999 not found');
      });

      test('should handle installation without installation type', async () => {
        // Create installation with null installation type
        const installationData = {
          name: createUniqueName('No Type Installation', testSuiteId),
          address: 'No Type Address',
          description: 'Installation without type',
          installationTypeId: null,
        };

        const installation =
          await installationRepository.create(installationData);
        const installationId = installationCleanup.track(installation.id);

        const propertiesData = [{ name: 'price_per_booth', value: '45.50' }];

        await expect(
          updateInstallationProperties({
            id: installationId,
            properties: propertiesData,
          }),
        ).rejects.toThrow(
          'Installation must have an installation type to manage properties',
        );
      });

      test('should handle property schema not found error', async () => {
        const installationId = await createTestInstallation(
          'Schema Not Found Test',
          {
            installationTypeId: testInstallationTypeId,
          },
        );

        const invalidPropertiesData = [
          { name: 'non_existent_property', value: 'some_value' },
        ];

        await expect(
          updateInstallationProperties({
            id: installationId,
            properties: invalidPropertiesData,
          }),
        ).rejects.toThrow('Schema with name non_existent_property not found');
      });

      test('should handle validation errors for invalid field values', async () => {
        const installationId = await createTestInstallation(
          'Validation Error Test',
          {
            installationTypeId: testInstallationTypeId,
          },
        );

        // Test invalid number format
        const invalidNumberData = [
          { name: 'price_per_booth', value: 'not_a_number' }, // Invalid number
          { name: 'installation_size', value: 'medium' }, // Required enum
        ];

        await expect(
          updateInstallationProperties({
            id: installationId,
            properties: invalidNumberData,
          }),
        ).rejects.toThrow("Validation failed for field 'price_per_booth'");

        // Test invalid boolean format
        const invalidBooleanData = [
          { name: 'is_affiliated', value: 'maybe' }, // Invalid boolean
          { name: 'price_per_booth', value: '50.00' }, // Required field
          { name: 'installation_size', value: 'medium' }, // Required enum
        ];

        await expect(
          updateInstallationProperties({
            id: installationId,
            properties: invalidBooleanData,
          }),
        ).rejects.toThrow("Validation failed for field 'is_affiliated'");

        // Test invalid enum value
        const invalidEnumData = [
          { name: 'installation_size', value: 'extra_large' }, // Invalid enum value
          { name: 'price_per_booth', value: '50.00' }, // Required field
        ];

        await expect(
          updateInstallationProperties({
            id: installationId,
            properties: invalidEnumData,
          }),
        ).rejects.toThrow("Validation failed for field 'installation_size'");
      });
    });

    describe('upsert behavior', () => {
      test('should create new properties and update existing ones', async () => {
        const installationId = await createTestInstallation(
          'Upsert Test Installation',
          {
            installationTypeId: testInstallationTypeId,
          },
        );

        // First, create some properties
        const initialProperties = [
          { name: 'price_per_booth', value: '30.00' },
          { name: 'installation_size', value: 'small' },
        ];

        const firstResponse = await updateInstallationProperties({
          id: installationId,
          properties: initialProperties,
        });

        // Verify first update worked
        expect(firstResponse).toBeDefined();
        expect(firstResponse.id).toBe(installationId);

        // Now update existing and add new properties
        const updatedProperties = [
          { name: 'price_per_booth', value: '35.00' }, // Update existing
          { name: 'installation_size', value: 'medium' }, // Update existing
          { name: 'is_affiliated', value: 'true' }, // Create new
          { name: 'description_text', value: 'Updated description' }, // Create new
        ];

        const secondResponse = await updateInstallationProperties({
          id: installationId,
          properties: updatedProperties,
        });

        // Verify upsert behavior - installation returned with complete data
        expect(secondResponse).toBeDefined();
        expect(secondResponse.id).toBe(installationId);
        expect(secondResponse.installationTypeId).toBe(testInstallationTypeId);
        expect(secondResponse.name).toContain('Upsert Test Installation');
        expect(secondResponse.location).toBeDefined();

        // Verify this is the same installation but with updated properties
        expect(secondResponse.name).toBe(firstResponse.name);
        expect(secondResponse.address).toBe(firstResponse.address);
      });
    });
  });

  describe('amenity assignment', () => {
    let testInstallationAmenityId: number;
    let testBusAmenityId: number;

    beforeAll(async () => {
      // Create installation amenities for testing
      const installationAmenity = await createAmenity({
        name: createUniqueName('WiFi Service', testSuiteId),
        category: AmenityCategory.TECHNOLOGY,
        amenityType: AmenityType.INSTALLATION,
        description: 'High-speed internet access',
        iconName: 'wifi',
        active: true,
      });
      testInstallationAmenityId = installationAmenity.id;

      // Create a bus amenity to test type validation
      const busAmenity = await createAmenity({
        name: createUniqueName('Bus AC', testSuiteId),
        category: AmenityCategory.COMFORT,
        amenityType: AmenityType.BUS,
        description: 'Air conditioning',
        iconName: 'air-vent',
        active: true,
      });
      testBusAmenityId = busAmenity.id;
    });

    afterAll(async () => {
      // Clean up amenities
      if (testInstallationAmenityId || testBusAmenityId) {
        try {
          if (testInstallationAmenityId) {
            await deleteAmenity({ id: testInstallationAmenityId });
          }
          if (testBusAmenityId) {
            await deleteAmenity({ id: testBusAmenityId });
          }
        } catch (error) {
          console.log('Error cleaning up test amenities:', error);
        }
      }
    });

    describe('success scenarios', () => {
      test('should assign amenities to installation and return installation with amenities', async () => {
        const response = await assignAmenitiesToInstallation({
          id: createdInstallationId,
          amenityIds: [testInstallationAmenityId],
        });

        expect(response).toBeDefined();
        expect(response.id).toBe(createdInstallationId);
        expect(response.amenities).toBeDefined();
        expect(Array.isArray(response.amenities)).toBe(true);
        expect(response.amenities).toHaveLength(1);
        expect(response.amenities[0].id).toBe(testInstallationAmenityId);
        expect(response.amenities[0].name).toContain('WiFi Service');
        expect(response.amenities[0].amenityType).toBe('installation');
      });

      test('should replace existing amenities (destructive operation)', async () => {
        // First assign multiple amenities
        const amenity2 = await createAmenity({
          name: createUniqueName('Parking Space', testSuiteId),
          category: AmenityCategory.BASIC,
          amenityType: AmenityType.INSTALLATION,
          description: 'Secure parking',
          iconName: 'car',
          active: true,
        });

        await assignAmenitiesToInstallation({
          id: createdInstallationId,
          amenityIds: [testInstallationAmenityId, amenity2.id],
        });

        // Verify both amenities are assigned
        let installation = await getInstallation({ id: createdInstallationId });
        expect(installation.amenities).toHaveLength(2);

        // Now replace with just one amenity
        await assignAmenitiesToInstallation({
          id: createdInstallationId,
          amenityIds: [amenity2.id],
        });

        // Verify only the new amenity is assigned
        installation = await getInstallation({ id: createdInstallationId });
        expect(installation.amenities).toHaveLength(1);
        expect(installation.amenities[0].id).toBe(amenity2.id);

        // Clean up - first clear amenity assignments, then delete
        await assignAmenitiesToInstallation({
          id: createdInstallationId,
          amenityIds: [],
        });
        await deleteAmenity({ id: amenity2.id });
      });

      test('should allow empty amenity list (removes all amenities)', async () => {
        // First assign an amenity
        await assignAmenitiesToInstallation({
          id: createdInstallationId,
          amenityIds: [testInstallationAmenityId],
        });

        // Verify amenity is assigned
        let installation = await getInstallation({ id: createdInstallationId });
        expect(installation.amenities).toHaveLength(1);

        // Now remove all amenities
        await assignAmenitiesToInstallation({
          id: createdInstallationId,
          amenityIds: [],
        });

        // Verify no amenities are assigned
        installation = await getInstallation({ id: createdInstallationId });
        expect(installation.amenities).toHaveLength(0);
      });
    });

    describe('error scenarios', () => {
      test('should handle installation not found', async () => {
        await expect(
          assignAmenitiesToInstallation({
            id: 99999,
            amenityIds: [testInstallationAmenityId],
          }),
        ).rejects.toThrow();
      });

      test('should reject bus amenities (wrong type)', async () => {
        await expect(
          assignAmenitiesToInstallation({
            id: createdInstallationId,
            amenityIds: [testBusAmenityId],
          }),
        ).rejects.toThrow();
      });

      test('should reject non-existent amenity IDs', async () => {
        await expect(
          assignAmenitiesToInstallation({
            id: createdInstallationId,
            amenityIds: [99999],
          }),
        ).rejects.toThrow();
      });

      test('should reject duplicate amenity IDs', async () => {
        try {
          await assignAmenitiesToInstallation({
            id: createdInstallationId,
            amenityIds: [testInstallationAmenityId, testInstallationAmenityId],
          });
          expect.fail('Expected function to throw');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          const fieldError = error as {
            name: string;
            fieldErrors: { message: string }[];
          };
          expect(fieldError.name).toBe('FieldValidationError');
          expect(fieldError.fieldErrors).toBeDefined();
          expect(fieldError.fieldErrors[0].message).toContain(
            'Duplicate amenity IDs are not allowed',
          );
        }
      });
    });
  });
});
