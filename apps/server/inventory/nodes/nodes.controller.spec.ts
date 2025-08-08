import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import {
  amenityFactory,
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
import { eventTypeInstallationTypeRepository } from '../event-type-installation-types/event-type-installation-types.repository';
import { eventTypeRepository } from '../event-types/event-types.repository';
import { installationTypeRepository } from '../installation-types/installation-types.repository';
import { installationRepository } from '../installations/installations.repository';
import { installationUseCases } from '../installations/installations.use-cases';
import { labelRepository } from '../labels/labels.repository';
import { populationRepository } from '../populations/populations.repository';
import type { CreateNodePayload, Node, UpdateNodePayload } from './nodes.types';
import { nodeRepository } from './nodes.repository';
import {
  assignEventsToNode,
  assignLabelsToNode,
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

  const labelCleanup = createCleanupHelper(
    ({ id }) => labelRepository.forceDelete(id),
    'label',
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
    await labelCleanup.cleanupAll();

    // Clean up factory-created entities in dependency order (children before parents)
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
    test('should create a node successfully with generated slug', async () => {
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

      // Verify slug generation
      expect(result.slug).toBeDefined();
      expect(result.slug).toMatch(/^n-.*-[a-z0-9]+$/); // Should start with 'n-' and end with normalized code
      expect(result.slug).toContain(nodeData.code.toLowerCase());
    });

    test('should create a node without installation and generate correct slug', async () => {
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

      // Verify slug generation
      expect(result.slug).toBeDefined();
      expect(result.slug).toMatch(/^n-.*-[a-z0-9]+$/);
      expect(result.slug).toContain(nodeData.code.toLowerCase());
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

      // Verify slug exists
      expect(result.slug).toBeDefined();
      expect(typeof result.slug).toBe('string');
    });

    test('should update a node successfully and regenerate slug when name changes', async () => {
      const updateData: UpdateNodePayload = {
        name: createUniqueName('Updated Node', testSuiteId),
        radius: 1500,
      };

      const originalNode = await getNode({ id: createdNodeId });
      const result = await updateNode({
        id: createdNodeId,
        ...updateData,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdNodeId);
      expect(result.name).toBe(updateData.name);
      expect(result.radius).toBe(updateData.radius);
      expect(result.updatedAt).toBeDefined();

      // Verify slug was regenerated due to name change
      expect(result.slug).toBeDefined();
      expect(result.slug).not.toBe(originalNode.slug);
      expect(result.slug).toMatch(/^n-.*-[a-z0-9]+$/);
    });

    test('should update a node and regenerate slug when code changes', async () => {
      // Create a node specifically for this test
      const nodeData: CreateNodePayload = {
        code: createUniqueCode('USC', 3),
        name: createUniqueName('Update Slug Code Test', testSuiteId),
        latitude: 19.7326,
        longitude: -99.4332,
        radius: 250,
        cityId: testCityId,
        populationId: testPopulationId,
      };

      const createdNode = await createNode(nodeData);
      nodeCleanup.track(createdNode.id);

      const originalSlug = createdNode.slug;
      const newCode = createUniqueCode('NSC', 3);

      const updateData: UpdateNodePayload = {
        code: newCode,
      };

      const result = await updateNode({
        id: createdNode.id,
        ...updateData,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdNode.id);
      expect(result.code).toBe(newCode);

      // Verify slug was regenerated due to code change
      expect(result.slug).toBeDefined();
      expect(result.slug).not.toBe(originalSlug);
      expect(result.slug).toMatch(/^n-.*-[a-z0-9]+$/);
      expect(result.slug).toContain(newCode.toLowerCase());
    });

    test('should update a node without changing slug when neither name nor code changes', async () => {
      // Create a node specifically for this test
      const nodeData: CreateNodePayload = {
        code: createUniqueCode('NSU', 3),
        name: createUniqueName('No Slug Update Test', testSuiteId),
        latitude: 19.8326,
        longitude: -99.5332,
        radius: 800,
        cityId: testCityId,
        populationId: testPopulationId,
      };

      const createdNode = await createNode(nodeData);
      nodeCleanup.track(createdNode.id);

      const originalSlug = createdNode.slug;

      const updateData: UpdateNodePayload = {
        radius: 1200,
        latitude: 19.9326,
      };

      const result = await updateNode({
        id: createdNode.id,
        ...updateData,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdNode.id);
      expect(result.radius).toBe(updateData.radius);
      expect(result.latitude).toBe(updateData.latitude);

      // Verify slug was NOT regenerated since name and code didn't change
      expect(result.slug).toBe(originalSlug);
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

    test('should assign labels to a node', async () => {
      // Create test labels directly using repository
      const label1 = await labelRepository.create({
        name: createUniqueName('Test Label 1', testSuiteId),
        color: '#FF0000',
        description: 'First test label',
      });
      labelCleanup.track(label1.id);

      const label2 = await labelRepository.create({
        name: createUniqueName('Test Label 2', testSuiteId),
        color: '#00FF00',
        description: 'Second test label',
      });
      labelCleanup.track(label2.id);

      // Assign labels to the node
      const result = await assignLabelsToNode({
        id: createdNodeId,
        labelIds: [label1.id, label2.id],
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdNodeId);
      expect(result.labels).toHaveLength(2);
      expect(result.labels.map((l) => l.id)).toContain(label1.id);
      expect(result.labels.map((l) => l.id)).toContain(label2.id);
    });

    test('should include labels in getNode response', async () => {
      // Create and assign a label
      const label5 = await labelRepository.create({
        name: createUniqueName('Test Label 5', testSuiteId),
        color: '#FF00FF',
        description: 'Fifth test label',
      });
      labelCleanup.track(label5.id);

      await assignLabelsToNode({
        id: createdNodeId,
        labelIds: [label5.id],
      });

      // Get the node and verify labels are included
      const result = await getNode({ id: createdNodeId });

      expect(result).toBeDefined();
      expect(result.labels).toHaveLength(1);
      expect(result.labels[0].id).toBe(label5.id);
      expect(result.labels[0].name).toBe(label5.name);
      expect(result.labels[0].color).toBe(label5.color);
    });

    test('should replace existing labels when assigning new ones', async () => {
      // Create another test label
      const label3 = await labelRepository.create({
        name: createUniqueName('Test Label 3', testSuiteId),
        color: '#0000FF',
        description: 'Third test label',
      });
      labelCleanup.track(label3.id);

      // Assign only the new label (should replace previous ones)
      const result = await assignLabelsToNode({
        id: createdNodeId,
        labelIds: [label3.id],
      });

      expect(result).toBeDefined();
      expect(result.labels).toHaveLength(1);
      expect(result.labels[0].id).toBe(label3.id);
    });

    test('should handle empty label assignment', async () => {
      // Assign empty array (should remove all labels)
      const result = await assignLabelsToNode({
        id: createdNodeId,
        labelIds: [],
      });

      expect(result).toBeDefined();
      expect(result.labels).toHaveLength(0);
    });
  });

  describe('slug generation', () => {
    test('should generate slug with node name and code', async () => {
      const nodeData: CreateNodePayload = {
        code: 'ABC123',
        name: 'Test Node With Special Characters!',
        latitude: 19.4326,
        longitude: -99.1332,
        radius: 1000,
        cityId: testCityId,
        populationId: testPopulationId,
      };

      const result = await createNode(nodeData);
      nodeCleanup.track(result.id);

      // Verify slug follows expected pattern: n-{normalized-name}-{normalized-code}
      expect(result.slug).toBeDefined();
      expect(result.slug).toMatch(
        /^n-test-node-with-special-characters-abc123$/,
      );
    });

    test('should generate slug with accented characters normalized', async () => {
      const nodeData: CreateNodePayload = {
        code: 'ÑÓD',
        name: 'Nódulo Español',
        latitude: 19.4326,
        longitude: -99.1332,
        radius: 1000,
        cityId: testCityId,
        populationId: testPopulationId,
      };

      const result = await createNode(nodeData);
      nodeCleanup.track(result.id);

      // Verify accented characters are normalized
      expect(result.slug).toBeDefined();
      // The normalizeString function removes all non-alphanumeric characters, so ÑÓD becomes d
      expect(result.slug).toMatch(/^n-nodulo-espanol-d$/);
    });

    test('should generate slug without code when code is not provided', async () => {
      // This test assumes the schema allows optional code, but based on the types, code is required
      // So this test verifies the slug generation with minimal code
      const nodeData: CreateNodePayload = {
        code: 'X',
        name: 'Simple Node',
        latitude: 19.4326,
        longitude: -99.1332,
        radius: 1000,
        cityId: testCityId,
        populationId: testPopulationId,
      };

      const result = await createNode(nodeData);
      nodeCleanup.track(result.id);

      expect(result.slug).toBeDefined();
      expect(result.slug).toMatch(/^n-simple-node-x$/);
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
        expect(typedValidationError.fieldErrors.length).toBeGreaterThanOrEqual(
          1,
        );

        // Check for code duplicate error
        const codeError = typedValidationError.fieldErrors.find(
          (err) => err.field === 'code',
        );
        expect(codeError).toBeDefined();
        expect(codeError?.code).toBe('DUPLICATE');
        expect(codeError?.message).toContain('already exists');
        expect(codeError?.value).toBe(existingNode.code);

        // Check for slug duplicate error (since same name and code would generate same slug)
        const slugError = typedValidationError.fieldErrors.find(
          (err) => err.field === 'slug',
        );
        expect(slugError).toBeDefined();
        expect(slugError?.code).toBe('DUPLICATE');
        expect(slugError?.message).toContain('already exists');
      });

      test('should throw detailed field validation error for duplicate slug when different code but same generated slug', async () => {
        // Create a node with a specific name and code
        const baseNodeData: CreateNodePayload = {
          code: createUniqueCode('SLG', 3),
          name: 'Test Slug Uniqueness',
          latitude: 19.4326,
          longitude: -99.1332,
          radius: 1000,
          cityId: testCityId,
          populationId: testPopulationId,
        };

        const baseNode = await createNode(baseNodeData);
        nodeCleanup.track(baseNode.id);

        // Try to create another node that would generate the same slug
        // Using the same name and code should generate the same slug
        const duplicateSlugPayload: CreateNodePayload = {
          code: baseNodeData.code,
          name: baseNodeData.name,
          latitude: 19.5326,
          longitude: -99.2332,
          radius: 1500,
          cityId: testCityId,
          populationId: testPopulationId,
        };

        let validationError: FieldValidationError | undefined;
        try {
          await createNode(duplicateSlugPayload);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');

        // Should have errors for both code and slug
        expect(typedValidationError.fieldErrors.length).toBeGreaterThanOrEqual(
          2,
        );

        // Check for slug duplicate error
        const slugError = typedValidationError.fieldErrors.find(
          (err) => err.field === 'slug',
        );
        expect(slugError).toBeDefined();
        expect(slugError?.code).toBe('DUPLICATE');
        expect(slugError?.message).toContain('already exists');
      });
    });

    test('should handle assignment to non-existent node', async () => {
      try {
        await assignLabelsToNode({
          id: 99999,
          labelIds: [1],
        });
        expect.fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FieldValidationError);
        const fieldError = error as FieldValidationError;
        const nodeIdError = fieldError.fieldErrors.find(
          (err) => err.field === 'nodeId',
        );
        expect(nodeIdError).toBeDefined();
        expect(nodeIdError?.code).toBe('NOT_FOUND');
      }
    });

    test('should handle assignment of non-existent labels', async () => {
      try {
        await assignLabelsToNode({
          id: createdNodeId,
          labelIds: [99999],
        });
        expect.fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FieldValidationError);
        const fieldError = error as FieldValidationError;
        const labelIdsError = fieldError.fieldErrors.find(
          (err) => err.field === 'labelIds',
        );
        expect(labelIdsError).toBeDefined();
        expect(labelIdsError?.code).toBe('NOT_FOUND');
      }
    });

    test('should handle duplicate label IDs in assignment', async () => {
      // Create a test label with a more unique name
      const testLabel = await labelRepository.create({
        name: createUniqueName('Duplicate Validation Label', testSuiteId),
        color: '#ABCDEF',
        description: 'Test label for duplicate validation',
      });
      labelCleanup.track(testLabel.id);

      try {
        await assignLabelsToNode({
          id: createdNodeId,
          labelIds: [testLabel.id, testLabel.id, testLabel.id],
        });
        expect.fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FieldValidationError);
        const fieldError = error as FieldValidationError;
        const labelIdsError = fieldError.fieldErrors.find(
          (err) => err.field === 'labelIds',
        );
        expect(labelIdsError).toBeDefined();
        expect(labelIdsError?.code).toBe('DUPLICATE_INPUT');
        expect(labelIdsError?.message).toBe(
          'Duplicate label IDs are not allowed in the assignment',
        );
      }
    });

    test('should handle assignment with mixed valid and invalid labels', async () => {
      // Create a valid test label
      const validLabel = await labelRepository.create({
        name: createUniqueName('Valid Test Label', testSuiteId),
        color: '#123456',
        description: 'Valid test label',
      });
      labelCleanup.track(validLabel.id);

      try {
        await assignLabelsToNode({
          id: createdNodeId,
          labelIds: [validLabel.id, 99999, 99998],
        });
        expect.fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FieldValidationError);
        const fieldError = error as FieldValidationError;
        const labelIdsError = fieldError.fieldErrors.find(
          (err) => err.field === 'labelIds',
        );
        expect(labelIdsError).toBeDefined();
        expect(labelIdsError?.code).toBe('NOT_FOUND');
      }
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
      // Create specific test data for pagination
      const paginationTestNodes = [
        {
          code: createUniqueCode('P1', 3),
          name: createUniqueName('Pagination Test Node 1', testSuiteId),
          latitude: 19.4326,
          longitude: -99.1332,
          radius: 1000,
          cityId: testCityId,
          populationId: testPopulationId,
        },
        {
          code: createUniqueCode('P2', 3),
          name: createUniqueName('Pagination Test Node 2', testSuiteId),
          latitude: 19.5326,
          longitude: -99.2332,
          radius: 1000,
          cityId: testCityId,
          populationId: testPopulationId,
        },
      ];

      const createdNodes = [];
      for (const nodeData of paginationTestNodes) {
        const created = await createNode(nodeData);
        createdNodes.push(created);
        nodeCleanup.track(created.id);
      }

      // Test pagination with our specific test data
      const firstPage = await listNodesPaginated({
        page: 1,
        pageSize: 1,
        searchTerm: 'Pagination Test Node', // Filter to our test data
        orderBy: [{ field: 'name', direction: 'asc' }], // Ensure consistent ordering
      });

      expect(firstPage.data.length).toBe(1);
      expect(firstPage.pagination.currentPage).toBe(1);
      expect(firstPage.pagination.pageSize).toBe(1);
      expect(firstPage.pagination.totalCount).toBeGreaterThanOrEqual(2);

      const secondPage = await listNodesPaginated({
        page: 2,
        pageSize: 1,
        searchTerm: 'Pagination Test Node', // Filter to our test data
        orderBy: [{ field: 'name', direction: 'asc' }], // Ensure consistent ordering
      });

      expect(secondPage.data.length).toBe(1);
      expect(secondPage.pagination.currentPage).toBe(2);

      // The IDs should be different
      expect(firstPage.data[0].id).not.toBe(secondPage.data[0].id);
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
          node.name.includes(testSuiteId) ||
          node.code.includes(testSuiteId) ||
          node.slug.includes(testSuiteId);
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
      // Create specific test data for ordering
      const orderingTestNodes = [
        {
          code: createUniqueCode('OA', 3),
          name: 'A Node for Ordering Test',
          latitude: 19.4326,
          longitude: -99.1332,
          radius: 1000,
          cityId: testCityId,
          populationId: testPopulationId,
        },
        {
          code: createUniqueCode('OB', 3),
          name: 'B Node for Ordering Test',
          latitude: 19.5326,
          longitude: -99.2332,
          radius: 1000,
          cityId: testCityId,
          populationId: testPopulationId,
        },
        {
          code: createUniqueCode('OC', 3),
          name: 'C Node for Ordering Test',
          latitude: 19.6326,
          longitude: -99.3332,
          radius: 1000,
          cityId: testCityId,
          populationId: testPopulationId,
        },
      ];

      for (const nodeData of orderingTestNodes) {
        const created = await createNode(nodeData);
        nodeCleanup.track(created.id);
      }

      const result = await listNodes({
        orderBy: [{ field: 'name', direction: 'desc' }],
        searchTerm: 'Node for Ordering Test', // Filter to only our test data
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
        searchTerm: testSuiteId, // Filter to only our test data
      });

      const radii = result.data.map((n) => n.radius);
      // Check if radii are in ascending order
      for (let i = 0; i < radii.length - 1; i++) {
        expect(radii[i] <= radii[i + 1]).toBe(true);
      }
    });

    test('should combine ordering and filtering in paginated results', async () => {
      // Create specific test data for ordering and filtering
      const orderingFilteringTestNodes = [
        {
          code: createUniqueCode('OFA', 3),
          name: 'A Node for Ordering and Filtering Test',
          latitude: 19.4326,
          longitude: -99.1332,
          radius: 1000,
          cityId: testCityId,
          populationId: testPopulationId,
        },
        {
          code: createUniqueCode('OFB', 3),
          name: 'B Node for Ordering and Filtering Test',
          latitude: 19.5326,
          longitude: -99.2332,
          radius: 1000,
          cityId: testCityId,
          populationId: testPopulationId,
        },
        {
          code: createUniqueCode('OFC', 3),
          name: 'C Node for Ordering and Filtering Test',
          latitude: 19.6326,
          longitude: -99.3332,
          radius: 1000,
          cityId: testCityId,
          populationId: testPopulationId,
        },
      ];

      for (const nodeData of orderingFilteringTestNodes) {
        const created = await createNode(nodeData);
        nodeCleanup.track(created.id);
      }

      const result = await listNodesPaginated({
        searchTerm: 'Node for Ordering and Filtering Test',
        orderBy: [{ field: 'name', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      // Check search filtering
      for (const node of result.data) {
        const matchesSearch =
          node.name.includes('Node for Ordering and Filtering Test') ||
          node.code.includes('Node for Ordering and Filtering Test') ||
          node.slug.includes('Node for Ordering and Filtering Test');
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
          name: `Same Radius A ${testSuiteId}`,
          latitude: 19.7326,
          longitude: -99.4332,
          radius: 3000,
          cityId: testCityId,
          populationId: testPopulationId,
        },
        {
          code: createUniqueCode('SRB', 3),
          name: `Same Radius B ${testSuiteId}`,
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

      // Order by radius first, then by name, filtering to our test data
      const result = await listNodes({
        orderBy: [
          { field: 'radius', direction: 'desc' },
          { field: 'name', direction: 'asc' },
        ],
        searchTerm: testSuiteId, // Filter to only our test data
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

  describe('event assignment', () => {
    let testInstallationTypeId: number;
    let testEventType1Id: number;
    let testEventType2Id: number;
    let testNodeWithInstallationId: number;
    let testInstallationWithTypeId: number;

    // Setup cleanup helpers for event assignment tests
    const eventTypeCleanup = createCleanupHelper(
      ({ id }) => eventTypeRepository.forceDelete(id),
      'event type',
    );

    const installationTypeCleanup = createCleanupHelper(
      ({ id }) => installationTypeRepository.forceDelete(id),
      'installation type',
    );

    const installationCleanup = createCleanupHelper(
      ({ id }) => installationRepository.forceDelete(id),
      'installation',
    );

    beforeAll(async () => {
      // Create test installation type
      const testInstallationType = await installationTypeRepository.create({
        name: createUniqueName(
          'Test Installation Type for Events',
          testSuiteId,
        ),
        code: createUniqueCode('TITE', 3),
        description: 'Test installation type for event assignment',
      });
      testInstallationTypeId = installationTypeCleanup.track(
        testInstallationType.id,
      );

      // Create test event types
      const testEventType1 = await eventTypeRepository.create({
        name: createUniqueName('Test Event Type 1', testSuiteId),
        code: createUniqueCode('TET1', 3),
        description: 'Test event type 1',
        baseTime: 30,
        needsCost: false,
        needsQuantity: false,
        integration: false,
        active: true,
      });
      testEventType1Id = eventTypeCleanup.track(testEventType1.id);

      const testEventType2 = await eventTypeRepository.create({
        name: createUniqueName('Test Event Type 2', testSuiteId),
        code: createUniqueCode('TET2', 3),
        description: 'Test event type 2',
        baseTime: 45,
        needsCost: true,
        needsQuantity: false,
        integration: false,
        active: true,
      });
      testEventType2Id = eventTypeCleanup.track(testEventType2.id);

      // Assign event types to installation type
      await eventTypeInstallationTypeRepository.createMany([
        {
          eventTypeId: testEventType1Id,
          installationTypeId: testInstallationTypeId,
        },
        {
          eventTypeId: testEventType2Id,
          installationTypeId: testInstallationTypeId,
        },
      ]);

      // Create test installation with the installation type
      const testInstallationWithType = await installationRepository.create({
        name: createUniqueName('Test Installation with Type', testSuiteId),
        address: '123 Test Street',
        description: 'Test installation with type for event assignment',
        installationTypeId: testInstallationTypeId,
      });
      testInstallationWithTypeId = installationCleanup.track(
        testInstallationWithType.id,
      );

      // Create test node with installation
      const testNodeWithInstallation = await createNode({
        code: createUniqueCode('TNWI', 3),
        name: createUniqueName('Test Node with Installation', testSuiteId),
        latitude: 19.4326,
        longitude: -99.1332,
        radius: 1000,
        cityId: testCityId,
        populationId: testPopulationId,
        installationId: testInstallationWithTypeId,
      });
      testNodeWithInstallationId = nodeCleanup.track(
        testNodeWithInstallation.id,
      );
    });

    afterAll(async () => {
      // Clean up all tracked resources using cleanup helpers
      // Order matters: clean up dependencies first (children before parents)
      await nodeCleanup.cleanupAll(); // nodes depend on installations (and have node_events)
      await installationCleanup.cleanupAll(); // installations depend on installation_types
      await eventTypeCleanup.cleanupAll(); // event_types can be deleted after node_events (cascade)
      await installationTypeCleanup.cleanupAll(); // installation_types last (parent entity)
    });

    describe('success scenarios', () => {
      test('should assign events to node successfully', async () => {
        const eventsToAssign = [
          { eventTypeId: testEventType1Id, customTime: 30 },
          { eventTypeId: testEventType2Id },
        ];

        const response = await assignEventsToNode({
          id: testNodeWithInstallationId,
          events: eventsToAssign,
        });

        expect(response).toBeDefined();
        expect(response.nodeEvents).toBeDefined();
        expect(Array.isArray(response.nodeEvents)).toBe(true);
        expect(response.nodeEvents).toHaveLength(2);

        // Verify first event
        const event1 = response.nodeEvents.find(
          (e) => e.eventTypeId === testEventType1Id,
        );
        expect(event1).toBeDefined();
        expect(event1?.nodeId).toBe(testNodeWithInstallationId);
        expect(event1?.eventTypeId).toBe(testEventType1Id);
        expect(event1?.customTime).toBe(30);

        // Verify second event
        const event2 = response.nodeEvents.find(
          (e) => e.eventTypeId === testEventType2Id,
        );
        expect(event2).toBeDefined();
        expect(event2?.nodeId).toBe(testNodeWithInstallationId);
        expect(event2?.eventTypeId).toBe(testEventType2Id);
        expect(event2?.customTime).toBeNull();
      });

      test('should get events assigned to node', async () => {
        // First assign some events
        const eventsToAssign = [
          { eventTypeId: testEventType1Id, customTime: 25 },
          { eventTypeId: testEventType2Id, customTime: 40 },
        ];

        await assignEventsToNode({
          id: testNodeWithInstallationId,
          events: eventsToAssign,
        });

        // Now get the events via getNode
        const response = await getNode({
          id: testNodeWithInstallationId,
        });

        expect(response).toBeDefined();
        expect(response.nodeEvents).toBeDefined();
        expect(Array.isArray(response.nodeEvents)).toBe(true);
        expect(response.nodeEvents).toHaveLength(2);

        // Verify first event
        const event1 = response.nodeEvents.find(
          (e) => e.eventTypeId === testEventType1Id,
        );
        expect(event1).toBeDefined();
        expect(event1?.nodeId).toBe(testNodeWithInstallationId);
        expect(event1?.eventTypeId).toBe(testEventType1Id);
        expect(event1?.customTime).toBe(25);

        // Verify second event
        const event2 = response.nodeEvents.find(
          (e) => e.eventTypeId === testEventType2Id,
        );
        expect(event2).toBeDefined();
        expect(event2?.nodeId).toBe(testNodeWithInstallationId);
        expect(event2?.eventTypeId).toBe(testEventType2Id);
        expect(event2?.customTime).toBe(40);
      });

      test('should return empty array when node has no events', async () => {
        // First clear any existing events
        await assignEventsToNode({
          id: testNodeWithInstallationId,
          events: [],
        });

        // Now get the events via getNode
        const response = await getNode({
          id: testNodeWithInstallationId,
        });

        expect(response).toBeDefined();
        expect(response.nodeEvents).toBeDefined();
        expect(Array.isArray(response.nodeEvents)).toBe(true);
        expect(response.nodeEvents).toHaveLength(0);
      });

      test('should replace existing events (destructive behavior)', async () => {
        // First assignment
        const firstEvents = [
          { eventTypeId: testEventType1Id, customTime: 30 },
          { eventTypeId: testEventType2Id, customTime: 45 },
        ];

        const firstResponse = await assignEventsToNode({
          id: testNodeWithInstallationId,
          events: firstEvents,
        });

        expect(firstResponse.nodeEvents).toHaveLength(2);

        // Second assignment (should replace first)
        const secondEvents = [
          { eventTypeId: testEventType1Id, customTime: 60 },
        ];

        const secondResponse = await assignEventsToNode({
          id: testNodeWithInstallationId,
          events: secondEvents,
        });

        expect(secondResponse.nodeEvents).toHaveLength(1);
        expect(secondResponse.nodeEvents[0].eventTypeId).toBe(testEventType1Id);
        expect(secondResponse.nodeEvents[0].customTime).toBe(60);
      });

      test('should handle empty events array', async () => {
        // First assign some events
        await assignEventsToNode({
          id: testNodeWithInstallationId,
          events: [{ eventTypeId: testEventType1Id }],
        });

        // Then assign empty array (should remove all events)
        const response = await assignEventsToNode({
          id: testNodeWithInstallationId,
          events: [],
        });

        expect(response.nodeEvents).toHaveLength(0);
      });
    });

    describe('error scenarios', () => {
      test('should handle node not found', async () => {
        await expect(
          assignEventsToNode({
            id: 99999,
            events: [{ eventTypeId: testEventType1Id }],
          }),
        ).rejects.toThrow();
      });

      test('should handle node not found for get events', async () => {
        await expect(
          getNode({
            id: 99999,
          }),
        ).rejects.toThrow();
      });

      test('should handle node with no installation', async () => {
        // Create a node without installation
        const nodeWithoutInstallation = await createNode({
          code: createUniqueCode('TNWOI', 3),
          name: createUniqueName('Test Node without Installation', testSuiteId),
          latitude: 19.4326,
          longitude: -99.1332,
          radius: 1000,
          cityId: testCityId,
          populationId: testPopulationId,
        });
        const nodeWithoutInstallationId = nodeCleanup.track(
          nodeWithoutInstallation.id,
        );

        await expect(
          assignEventsToNode({
            id: nodeWithoutInstallationId,
            events: [{ eventTypeId: testEventType1Id }],
          }),
        ).rejects.toThrow();
      });

      test('should handle invalid event type IDs', async () => {
        await expect(
          assignEventsToNode({
            id: testNodeWithInstallationId,
            events: [{ eventTypeId: 99999 }],
          }),
        ).rejects.toThrow();
      });

      test('should handle event types not allowed for installation type', async () => {
        // Create an event type that's not assigned to our installation type
        const unassignedEventType = await eventTypeRepository.create({
          name: createUniqueName('Unassigned Event Type', testSuiteId),
          code: createUniqueCode('UET', 3),
          description: 'Event type not assigned to installation type',
          baseTime: 30,
          needsCost: false,
          needsQuantity: false,
          integration: false,
          active: true,
        });
        const unassignedEventTypeId = eventTypeCleanup.track(
          unassignedEventType.id,
        );

        await expect(
          assignEventsToNode({
            id: testNodeWithInstallationId,
            events: [{ eventTypeId: unassignedEventTypeId }],
          }),
        ).rejects.toThrow();
      });
    });
  });

  describe('installation relations', () => {
    let testInstallationWithAmenitiesId: number;
    let testNodeWithInstallationId: number;

    const installationCleanup = createCleanupHelper(
      ({ id }) => installationRepository.forceDelete(id),
      'installation',
    );

    beforeAll(async () => {
      // Create test installation with amenities using existing setup
      const testInstallation = await installationFactory(factoryDb).create({
        name: createUniqueName('Test Installation for Relations', testSuiteId),
        address: '456 Relations Street',
        description: 'Test installation for node relations',
      });
      testInstallationWithAmenitiesId = installationCleanup.track(
        testInstallation.id,
      );

      // Assign some amenities to test the relation loading
      const testAmenity = await amenityFactory(factoryDb).create({
        name: createUniqueName('Test Amenity for Node', testSuiteId),
        category: 'convenience',
        amenityType: 'installation',
        active: true,
        deletedAt: null,
      });

      await installationUseCases.assignAmenities(
        testInstallationWithAmenitiesId,
        [testAmenity.id],
      );

      // Create test node with installation
      const testNodeWithInstallation = await createNode({
        code: createUniqueCode('TNWR', 3),
        name: createUniqueName('Test Node with Relations', testSuiteId),
        latitude: 19.4326,
        longitude: -99.1332,
        radius: 1000,
        cityId: testCityId,
        populationId: testPopulationId,
        installationId: testInstallationWithAmenitiesId,
      });
      testNodeWithInstallationId = nodeCleanup.track(
        testNodeWithInstallation.id,
      );
    });

    afterAll(async () => {
      // Clean up amenity assignments first (before installations are affected)
      try {
        await installationUseCases.assignAmenities(
          testInstallationWithAmenitiesId,
          [],
        );
      } catch (error) {
        console.log('Error cleaning up amenity assignments:', error);
      }

      // Clean up nodes second (they depend on installations)
      await nodeCleanup.cleanupAll();

      // Clean up installations last
      await installationCleanup.cleanupAll();
    });

    test('should include installation with amenities in getNode', async () => {
      const result = await getNode({ id: testNodeWithInstallationId });

      expect(result.installation).toBeDefined();
      expect(result.installation).not.toBeNull();

      if (result.installation) {
        // Verify installation basic info
        expect(result.installation.id).toBe(testInstallationWithAmenitiesId);
        expect(result.installation.name).toContain(
          'Test Installation for Relations',
        );

        // Verify amenities are loaded
        expect(result.installation.amenities).toBeDefined();
        expect(Array.isArray(result.installation.amenities)).toBe(true);
        expect(result.installation.amenities.length).toBeGreaterThan(0);

        // Verify location is loaded
        expect(result.installation.location).toBeDefined();
        expect(result.installation.location).not.toBeNull();

        // Verify properties are loaded
        expect(result.installation.properties).toBeDefined();
        expect(Array.isArray(result.installation.properties)).toBe(true);
      }
    });

    test('should handle node without installation', async () => {
      const nodeWithoutInstallation = await createNode({
        code: createUniqueCode('TNWOI', 3),
        name: createUniqueName('Test Node without Installation', testSuiteId),
        latitude: 19.6326,
        longitude: -99.3332,
        radius: 800,
        cityId: testCityId,
        populationId: testPopulationId,
      });
      const nodeWithoutInstallationId = nodeCleanup.track(
        nodeWithoutInstallation.id,
      );

      const result = await getNode({ id: nodeWithoutInstallationId });

      expect(result.installation).toBeNull();
      // Verify other relations are still included
      expect(result.city).toBeDefined();
      expect(result.population).toBeDefined();
    });

    test('should not include amenities in paginated list for performance', async () => {
      const result = await listNodesPaginated({
        page: 1,
        pageSize: 10,
        searchTerm: testSuiteId,
      });

      const testNode = result.data.find(
        (node) => node.id === testNodeWithInstallationId,
      );

      if (testNode?.installation) {
        // Basic installation info should be included
        expect(testNode.installation.id).toBe(testInstallationWithAmenitiesId);

        // But amenities and location should not be loaded for performance
        expect(testNode.installation.amenities).toHaveLength(0);
        expect(testNode.installation.location).toBeNull();
        expect(testNode.installation.properties).toHaveLength(0);
      }
    });
  });
});
