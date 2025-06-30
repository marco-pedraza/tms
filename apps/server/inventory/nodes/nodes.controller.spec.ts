import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import {
  cityFactory,
  installationFactory,
  populationFactory,
} from '../../tests/factories';
import { getFactoryDb } from '../../tests/factories/factory-utils';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueCode,
  createUniqueName,
} from '../../tests/shared/test-utils';
import { cityRepository } from '../cities/cities.repository';
import { db } from '../db-service';
import { installationRepository } from '../installations/installations.repository';
import { populationRepository } from '../populations/populations.repository';
import type { CreateNodePayload, Node, UpdateNodePayload } from './nodes.types';
import { nodeRepository } from './nodes.repository';
import {
  createNode,
  deleteNode,
  getNode,
  listNodes,
  listNodesPaginated,
  updateNode,
} from './nodes.controller';

describe('Nodes Controller', () => {
  const testSuiteId = createTestSuiteId('nodes');
  const factoryDb = getFactoryDb(db);
  let createdNodeId: number;
  let testCityId: number;
  let testPopulationId: number;
  let testInstallationId: number;

  const nodeCleanup = createCleanupHelper(
    ({ id }) => nodeRepository.forceDelete(id),
    'node',
  );

  beforeAll(async () => {
    // Create test dependencies using factories
    const testCity = await cityFactory(factoryDb).create({
      name: createUniqueName('Test City', testSuiteId),
      latitude: 19.4326,
      longitude: -99.1332,
      timezone: 'America/Mexico_City',
    });
    testCityId = testCity.id;

    const testPopulation = await populationFactory(factoryDb).create({
      code: createUniqueCode('TPOP', 3),
      description: 'Test population for nodes',
      active: true,
    });
    testPopulationId = testPopulation.id;

    const testInstallation = await installationFactory(factoryDb).create({
      name: createUniqueName('Test Installation', testSuiteId),
      address: '123 Test Street',
      description: 'Test installation for nodes',
    });
    testInstallationId = testInstallation.id;

    // Create test node using controller (to test the full flow)
    const nodeData: CreateNodePayload = {
      code: createUniqueCode('TN', 3),
      name: 'Test Node',
      latitude: 19.4326,
      longitude: -99.1332,
      radius: 1000,
      cityId: testCityId,
      populationId: testPopulationId,
    };
    const createdNode = await createNode(nodeData);
    createdNodeId = nodeCleanup.track(createdNode.id);
  });

  afterAll(async () => {
    // Clean up all created nodes first
    await nodeCleanup.cleanupAll();

    // Clean up factory-created entities by specific IDs to avoid affecting other tests
    if (testInstallationId) {
      try {
        await installationRepository.forceDelete(testInstallationId);
      } catch (error) {
        console.log('Error cleaning up test installation:', error);
      }
    }
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
    test('should create a node successfully', async () => {
      const nodeData: CreateNodePayload = {
        code: createUniqueCode('CN', 3),
        name: createUniqueName('Create Node Test', testSuiteId),
        latitude: 19.5326,
        longitude: -99.2332,
        radius: 500,
        cityId: testCityId,
        populationId: testPopulationId,
      };

      const result = await createNode(nodeData);
      nodeCleanup.track(result.id);

      expect(result).toBeDefined();
      expect(result.id).toBeTypeOf('number');
      expect(result.code).toBe(nodeData.code);
      expect(result.name).toBe(nodeData.name);
      expect(result.latitude).toBe(nodeData.latitude);
      expect(result.longitude).toBe(nodeData.longitude);
      expect(result.radius).toBe(nodeData.radius);
      expect(result.cityId).toBe(nodeData.cityId);
      expect(result.populationId).toBe(nodeData.populationId);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    test('should create a node without installation', async () => {
      const nodeData: CreateNodePayload = {
        code: createUniqueCode('CNI', 3),
        name: createUniqueName('Create Node No Installation', testSuiteId),
        latitude: 19.6326,
        longitude: -99.3332,
        radius: 750,
        cityId: testCityId,
        populationId: testPopulationId,
      };

      const result = await createNode(nodeData);
      nodeCleanup.track(result.id);

      expect(result).toBeDefined();
      expect(result.id).toBeTypeOf('number');
      expect(result.code).toBe(nodeData.code);
      expect(result.name).toBe(nodeData.name);
      expect(result.installationId).toBeNull();
    });

    test('should retrieve a node by ID with relations', async () => {
      const result = await getNode({ id: createdNodeId });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdNodeId);
      expect(result.city).toBeDefined();
      expect(result.population).toBeDefined();
      expect(result.installation).toBeDefined();
      expect(result.city.id).toBe(testCityId);
      expect(result.population.id).toBe(testPopulationId);
    });

    test('should update a node successfully', async () => {
      const updateData: UpdateNodePayload = {
        name: createUniqueName('Updated Node', testSuiteId),
        radius: 1500,
      };

      const result = await updateNode({
        id: createdNodeId,
        ...updateData,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdNodeId);
      expect(result.name).toBe(updateData.name);
      expect(result.radius).toBe(updateData.radius);
      expect(result.updatedAt).toBeDefined();
    });

    test('should delete a node successfully', async () => {
      // Create a node specifically for deletion test
      const nodeData: CreateNodePayload = {
        code: createUniqueCode('DN', 3),
        name: createUniqueName('Delete Node Test', testSuiteId),
        latitude: 19.7326,
        longitude: -99.4332,
        radius: 250,
        cityId: testCityId,
        populationId: testPopulationId,
      };

      const createdNode = await createNode(nodeData);

      // Track the node for proper cleanup (needed because of foreign key constraints)
      nodeCleanup.track(createdNode.id);

      const result = await deleteNode({ id: createdNode.id });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdNode.id);

      // Verify node is deleted
      await expect(getNode({ id: createdNode.id })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getNode({ id: 999999 })).rejects.toThrow();
    });

    test('should throw error for non-existent node on update', async () => {
      const updateData: UpdateNodePayload = {
        name: 'Non-existent Node',
      };

      await expect(updateNode({ id: 999999, ...updateData })).rejects.toThrow();
    });

    test('should throw error for non-existent node on delete', async () => {
      await expect(deleteNode({ id: 999999 })).rejects.toThrow();
    });

    describe('field validation errors', () => {
      test('should throw detailed field validation error for duplicate code', async () => {
        const existingNode = await getNode({ id: createdNodeId });

        const duplicateCodePayload: CreateNodePayload = {
          code: existingNode.code,
          name: existingNode.name,
          latitude: 19.8326,
          longitude: -99.5332,
          radius: 800,
          cityId: testCityId,
          populationId: testPopulationId,
        };

        await expect(createNode(duplicateCodePayload)).rejects.toThrow();

        let validationError: FieldValidationError | undefined;
        try {
          await createNode(duplicateCodePayload);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');

        expect(typedValidationError.fieldErrors).toBeDefined();
        expect(Array.isArray(typedValidationError.fieldErrors)).toBe(true);
        expect(typedValidationError.fieldErrors).toHaveLength(1);
        expect(typedValidationError.fieldErrors[0].field).toBe('code');
        expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
        expect(typedValidationError.fieldErrors[0].message).toContain(
          'already exists',
        );
        expect(typedValidationError.fieldErrors[0].value).toBe(
          existingNode.code,
        );
      });
    });
  });

  describe('pagination', () => {
    test('should return paginated nodes with relations', async () => {
      const result = await listNodesPaginated({
        page: 1,
        pageSize: 10,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBeGreaterThan(0);
      expect(result.pagination.totalPages).toBeGreaterThan(0);

      // Check that relations are included
      if (result.data.length > 0) {
        const firstNode = result.data[0];
        expect(firstNode.city).toBeDefined();
        expect(firstNode.population).toBeDefined();
        // installation can be null
      }
    });

    test('should handle pagination correctly', async () => {
      const firstPage = await listNodesPaginated({
        page: 1,
        pageSize: 1,
      });

      expect(firstPage.data.length).toBeLessThanOrEqual(1);
      expect(firstPage.pagination.currentPage).toBe(1);
      expect(firstPage.pagination.pageSize).toBe(1);

      if (firstPage.pagination.totalCount > 1) {
        const secondPage = await listNodesPaginated({
          page: 2,
          pageSize: 1,
        });

        expect(secondPage.data.length).toBeLessThanOrEqual(1);
        expect(secondPage.pagination.currentPage).toBe(2);

        if (firstPage.data.length > 0 && secondPage.data.length > 0) {
          expect(firstPage.data[0].id).not.toBe(secondPage.data[0].id);
        }
      }
    });

    test('should return non-paginated list for dropdowns', async () => {
      const result = await listNodes({});

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result).not.toHaveProperty('pagination');

      const testNode = result.data.find(
        (node: Node) => node.id === createdNodeId,
      );
      expect(testNode).toBeDefined();
    });
  });

  describe('search functionality', () => {
    test('should filter nodes by search term', async () => {
      const result = await listNodes({
        searchTerm: testSuiteId,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // All returned nodes should match the search term
      for (const node of result.data) {
        const matchesSearch =
          node.name.includes(testSuiteId) || node.code.includes(testSuiteId);
        expect(matchesSearch).toBe(true);
      }
    });

    test('should search nodes with pagination using searchTerm', async () => {
      const result = await listNodesPaginated({
        searchTerm: testSuiteId,
        page: 1,
        pageSize: 5,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(5);
    });
  });

  describe('ordering and filtering', () => {
    beforeAll(async () => {
      // Create test nodes with different properties
      const nodeDatasets = [
        {
          code: createUniqueCode('AN', 3),
          name: 'Alpha Node',
          latitude: 19.4326,
          longitude: -99.1332,
          radius: 1000,
          cityId: testCityId,
          populationId: testPopulationId,
        },
        {
          code: createUniqueCode('BN', 3),
          name: 'Beta Node',
          latitude: 19.5326,
          longitude: -99.2332,
          radius: 1500,
          cityId: testCityId,
          populationId: testPopulationId,
        },
        {
          code: createUniqueCode('GN', 3),
          name: 'Gamma Node',
          latitude: 19.6326,
          longitude: -99.3332,
          radius: 2000,
          cityId: testCityId,
          populationId: testPopulationId,
        },
      ];

      for (const nodeData of nodeDatasets) {
        const created = await createNode(nodeData);
        nodeCleanup.track(created.id);
      }
    });

    test('should order nodes by name descending', async () => {
      const result = await listNodes({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      const names = result.data.map((n) => n.name);
      // Check if names are in descending order
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should order nodes by radius ascending', async () => {
      const result = await listNodes({
        orderBy: [{ field: 'radius', direction: 'asc' }],
      });

      const radii = result.data.map((n) => n.radius);
      // Check if radii are in ascending order
      for (let i = 0; i < radii.length - 1; i++) {
        expect(radii[i] <= radii[i + 1]).toBe(true);
      }
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const result = await listNodesPaginated({
        searchTerm: testSuiteId,
        orderBy: [{ field: 'name', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      // Check search filtering
      for (const node of result.data) {
        const matchesSearch =
          node.name.includes(testSuiteId) || node.code.includes(testSuiteId);
        expect(matchesSearch).toBe(true);
      }

      // Check ordering (ascending)
      const names = result.data.map((n) => n.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }

      // Check pagination properties
      expect(result.pagination).toBeDefined();
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
    });

    test('should allow multi-field ordering', async () => {
      // Create nodes with same radius but different names
      const sameRadiusNodes = [
        {
          code: createUniqueCode('SRA', 3),
          name: 'Same Radius A',
          latitude: 19.7326,
          longitude: -99.4332,
          radius: 3000,
          cityId: testCityId,
          populationId: testPopulationId,
        },
        {
          code: createUniqueCode('SRB', 3),
          name: 'Same Radius B',
          latitude: 19.8326,
          longitude: -99.5332,
          radius: 3000,
          cityId: testCityId,
          populationId: testPopulationId,
        },
      ];

      for (const nodeData of sameRadiusNodes) {
        const created = await createNode(nodeData);
        nodeCleanup.track(created.id);
      }

      // Order by radius first, then by name
      const result = await listNodes({
        orderBy: [
          { field: 'radius', direction: 'desc' },
          { field: 'name', direction: 'asc' },
        ],
      });

      // Get all nodes with radius 3000 and verify they're ordered by name
      const radius3000Nodes = result.data.filter((n) => n.radius === 3000);
      const radius3000Names = radius3000Nodes.map((n) => n.name);

      for (let i = 0; i < radius3000Names.length - 1; i++) {
        if (radius3000Nodes[i].radius === radius3000Nodes[i + 1].radius) {
          // If radius is the same, names should be in ascending order
          expect(radius3000Names[i] <= radius3000Names[i + 1]).toBe(true);
        }
      }
    });
  });
});
