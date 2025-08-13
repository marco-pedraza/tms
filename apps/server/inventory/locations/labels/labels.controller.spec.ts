import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { assignLabelsToNode } from '@/inventory/locations/nodes/nodes.controller';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import {
  createCleanupHelper,
  createTestSuiteId,
} from '@/tests/shared/test-utils';
import { nodeFactory } from '@/factories';
import { getFactoryDb } from '@/factories/factory-utils';
import type { Label, LabelWithNodeCount } from './labels.types';
import {
  createLabel,
  deleteLabel,
  getLabel,
  getLabelsMetrics,
  listLabels,
  listLabelsPaginated,
  updateLabel,
} from './labels.controller';

describe('Labels Controller', () => {
  // Test configuration
  const testSuiteId = createTestSuiteId('labels');
  const factoryDb = getFactoryDb(db);

  // Test data and setup
  const testLabel = {
    name: 'Test Label',
    description: 'A test label for categorizing nodes',
    color: '#FF0000',
  };

  // Variable to store created IDs for cleanup
  let createdLabelId: number;

  afterAll(async () => {
    if (createdLabelId) {
      try {
        await deleteLabel({ id: createdLabelId });
      } catch (error) {
        console.log('Error cleaning up test label:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new label', async () => {
      // Create a new label
      const response = await createLabel(testLabel);

      // Store the ID for later cleanup
      createdLabelId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testLabel.name);
      expect(response.description).toBe(testLabel.description);
      expect(response.color).toBe(testLabel.color);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a label by ID', async () => {
      const response = await getLabel({ id: createdLabelId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdLabelId);
      expect(response.name).toBe(testLabel.name);
      // Verify nodeCount is present and is a number
      expect(response.nodeCount).toBeDefined();
      expect(typeof response.nodeCount).toBe('number');
      expect(response.nodeCount).toBeGreaterThanOrEqual(0);
    });

    test('should update a label', async () => {
      const updatedName = 'Updated Test Label';
      const response = await updateLabel({
        id: createdLabelId,
        name: updatedName,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdLabelId);
      expect(response.name).toBe(updatedName);
    });

    test('should delete a label', async () => {
      // Create a label specifically for deletion test
      const labelToDelete = await createLabel({
        name: 'Label To Delete',
        description: 'A label to be deleted',
        color: '#FFFF00',
      });

      // Delete should not throw an error
      await expect(
        deleteLabel({ id: labelToDelete.id }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(getLabel({ id: labelToDelete.id })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getLabel({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate errors', async () => {
      // Ensure the test label exists and get fresh data
      const existingLabel = await getLabel({ id: createdLabelId });

      // Try to create label with same name as existing one
      await expect(
        createLabel({
          name: existingLabel.name,
          color: '#00FF00',
        }),
      ).rejects.toThrow();
    });

    describe('field validation errors', () => {
      test('should throw detailed field validation error for duplicate name', async () => {
        // Ensure the test label exists and get fresh data
        const existingLabel = await getLabel({ id: createdLabelId });

        const duplicateNamePayload = {
          name: existingLabel.name, // Same name as existing label
          color: '#00FF00', // Different color
        };

        // Verify that the function rejects
        await expect(createLabel(duplicateNamePayload)).rejects.toThrow();

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await createLabel(duplicateNamePayload);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        // Verify that validation error is thrown (middleware transformation happens at HTTP level)
        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');

        // The error should have fieldErrors array
        expect(typedValidationError.fieldErrors).toBeDefined();
        expect(Array.isArray(typedValidationError.fieldErrors)).toBe(true);
        expect(typedValidationError.fieldErrors).toHaveLength(1);
        expect(typedValidationError.fieldErrors[0].field).toBe('name');
        expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
        expect(typedValidationError.fieldErrors[0].message).toContain(
          'already exists',
        );
        expect(typedValidationError.fieldErrors[0].value).toBe(
          existingLabel.name,
        );
      });

      test('should handle update validation errors correctly', async () => {
        // Create another label to test duplicate on update
        const anotherLabel = await createLabel({
          name: 'Another Test Label',
          color: '#00FF00',
        });

        // Ensure the test label exists and get fresh data
        const existingLabel = await getLabel({ id: createdLabelId });

        const updatePayload = {
          id: anotherLabel.id,
          name: existingLabel.name, // This should trigger duplicate validation
        };

        try {
          // Verify that the function rejects
          await expect(updateLabel(updatePayload)).rejects.toThrow();

          // Capture the error to make specific assertions
          let validationError: FieldValidationError | undefined;
          try {
            await updateLabel(updatePayload);
          } catch (error) {
            validationError = error as FieldValidationError;
          }

          expect(validationError).toBeDefined();
          const typedValidationError = validationError as FieldValidationError;
          expect(typedValidationError.name).toBe('FieldValidationError');
          expect(typedValidationError.message).toContain('Validation failed');
          expect(typedValidationError.fieldErrors).toBeDefined();
          expect(typedValidationError.fieldErrors[0].field).toBe('name');
          expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
        } finally {
          // Clean up the additional label
          await deleteLabel({ id: anotherLabel.id });
        }
      });
    });
  });

  describe('pagination', () => {
    test('should return paginated labels with default parameters', async () => {
      const response = await listLabelsPaginated({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBeDefined();
      expect(response.pagination.totalCount).toBeDefined();
      expect(response.pagination.totalPages).toBeDefined();
      expect(typeof response.pagination.hasNextPage).toBe('boolean');
      expect(typeof response.pagination.hasPreviousPage).toBe('boolean');

      // Verify every label has nodeCount
      response.data.forEach((label: LabelWithNodeCount) => {
        expect(label.nodeCount).toBeDefined();
        expect(typeof label.nodeCount).toBe('number');
      });
    });

    test('should honor page and pageSize parameters', async () => {
      const response = await listLabelsPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);

      // Verify nodeCount is present in paginated results
      response.data.forEach((label: LabelWithNodeCount) => {
        expect(label.nodeCount).toBeDefined();
        expect(typeof label.nodeCount).toBe('number');
      });
    });

    test('should default sort by name in ascending order', async () => {
      // Create test labels with different names for verification of default sorting
      const labelA = await createLabel({
        name: 'AAA Test Label',
        color: '#111111',
      });
      const labelZ = await createLabel({
        name: 'ZZZ Test Label',
        color: '#222222',
      });

      try {
        // Get labels with large enough page size to include test labels
        const response = await listLabelsPaginated({
          pageSize: 50,
        });

        // Find the indices of our test labels
        const indexA = response.data.findIndex((l) => l.id === labelA.id);
        const indexZ = response.data.findIndex((l) => l.id === labelZ.id);

        // Verify that labelA (AAA) comes before labelZ (ZZZ) in the results
        // This assumes they both appear in the results (which they should with pageSize: 50)
        if (indexA !== -1 && indexZ !== -1) {
          expect(indexA).toBeLessThan(indexZ);
        }
      } finally {
        // Clean up test labels
        await deleteLabel({ id: labelA.id });
        await deleteLabel({ id: labelZ.id });
      }
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listLabels({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      // No pagination info should be present
      expect(response).not.toHaveProperty('pagination');

      // Verify every label has nodeCount
      response.data.forEach((label: LabelWithNodeCount) => {
        expect(label.nodeCount).toBeDefined();
        expect(typeof label.nodeCount).toBe('number');
      });
    });
  });

  describe('search functionality', () => {
    test('should search labels using searchTerm in list endpoint', async () => {
      // Create a unique label for search testing
      const searchableLabel = await createLabel({
        name: 'Searchable Test Label',
        description: 'A searchable label for testing',
        color: '#333333',
      });

      try {
        // Search for the label using searchTerm in listLabels
        const response = await listLabels({ searchTerm: 'Searchable' });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.some((l) => l.id === searchableLabel.id)).toBe(
          true,
        );

        // Verify nodeCount in search results
        response.data.forEach((label: LabelWithNodeCount) => {
          expect(label.nodeCount).toBeDefined();
          expect(typeof label.nodeCount).toBe('number');
        });
      } finally {
        // Clean up
        await deleteLabel({ id: searchableLabel.id });
      }
    });

    test('should search labels with pagination using searchTerm', async () => {
      const response = await listLabelsPaginated({
        searchTerm: 'Test',
        page: 1,
        pageSize: 5,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);

      // Verify nodeCount in paginated search results
      response.data.forEach((label: LabelWithNodeCount) => {
        expect(label.nodeCount).toBeDefined();
        expect(typeof label.nodeCount).toBe('number');
      });
    });

    test('should search in both name and description', async () => {
      // Create a label with searchable description
      const descriptionSearchableLabel = await createLabel({
        name: 'Normal Label Name',
        description: 'Contains SearchableKeyword in description',
        color: '#444444',
      });

      try {
        // Search for the keyword that's only in description
        const response = await listLabels({ searchTerm: 'SearchableKeyword' });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(
          response.data.some((l) => l.id === descriptionSearchableLabel.id),
        ).toBe(true);
      } finally {
        // Clean up
        await deleteLabel({ id: descriptionSearchableLabel.id });
      }
    });
  });

  describe('ordering and filtering', () => {
    // Test labels for ordering and filtering tests
    const testLabels: Label[] = [];

    beforeAll(async () => {
      // Create test labels with different properties
      const labels = [
        { name: 'Alpha Label', color: '#FF0000', description: 'First label' },
        { name: 'Beta Label', color: '#00FF00', description: 'Second label' },
        { name: 'Gamma Label', color: '#0000FF', description: 'Third label' },
      ];

      for (const label of labels) {
        const created = await createLabel(label);
        testLabels.push(created);
      }
    });

    afterAll(async () => {
      // Clean up test labels
      for (const label of testLabels) {
        try {
          await deleteLabel({ id: label.id });
        } catch (error) {
          console.log(`Error cleaning up test label ${label.id}:`, error);
        }
      }
    });

    test('should order labels by name descending', async () => {
      const response = await listLabels({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      const names = response.data.map((l) => l.name);
      // Check if names are in descending order
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should order labels by color in ascending order', async () => {
      const response = await listLabels({
        orderBy: [{ field: 'color', direction: 'asc' }],
      });

      const colors = response.data.map((l) => l.color);
      // Check if colors are in ascending order
      for (let i = 0; i < colors.length - 1; i++) {
        expect(colors[i] <= colors[i + 1]).toBe(true);
      }
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const response = await listLabelsPaginated({
        orderBy: [{ field: 'name', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      // Check ordering (ascending)
      const names = response.data.map((l) => l.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }

      // Check pagination properties
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });

    test('should allow multi-field ordering', async () => {
      // Create labels with same color but different names
      const sameColorLabels = [
        { name: 'Same Color A', color: '#FFFFFF', description: 'First' },
        { name: 'Same Color B', color: '#FFFFFF', description: 'Second' },
      ];

      const createdLabels: Label[] = [];

      try {
        for (const label of sameColorLabels) {
          const created = await createLabel(label);
          createdLabels.push(created);
        }

        // Order by color first, then by name
        const response = await listLabels({
          orderBy: [
            { field: 'color', direction: 'asc' },
            { field: 'name', direction: 'asc' },
          ],
        });

        // Get all labels with the same color and verify they're ordered by name
        const sameColorResults = response.data.filter(
          (l) => l.color === '#FFFFFF',
        );
        const names = sameColorResults.map((l) => l.name);

        for (let i = 0; i < names.length - 1; i++) {
          // Names should be in ascending order for same color
          expect(names[i] <= names[i + 1]).toBe(true);
        }
      } finally {
        // Clean up
        for (const label of createdLabels) {
          await deleteLabel({ id: label.id });
        }
      }
    });
  });

  describe('metrics', () => {
    // Cleanup helper for metrics tests
    const labelsCleanup = createCleanupHelper(
      ({ id }) => deleteLabel({ id }),
      'label',
    );

    // Cleanup helpers
    const nodeCleanup = createCleanupHelper(
      ({ id }) => nodeRepository.forceDelete(id),
      'node',
    );

    afterAll(async () => {
      await labelsCleanup.cleanupAll();
      await nodeCleanup.cleanupAll();
    });

    test('should return metrics with correct structure and data types', async () => {
      const response = await getLabelsMetrics();

      // Verify basic structure and data types
      expect(response).toBeDefined();
      expect(typeof response.totalLabels).toBe('number');
      expect(typeof response.labelsInUse).toBe('number');
      expect(Array.isArray(response.mostUsedLabels)).toBe(true);

      // Verify logical constraints
      expect(response.totalLabels).toBeGreaterThanOrEqual(0);
      expect(response.labelsInUse).toBeGreaterThanOrEqual(0);
      expect(response.labelsInUse).toBeLessThanOrEqual(response.totalLabels);

      // Verify structure of mostUsedLabels array
      for (const label of response.mostUsedLabels) {
        expect(typeof label.nodeCount).toBe('number');
        expect(label.nodeCount).toBeGreaterThanOrEqual(0);
        expect(typeof label.name).toBe('string');
        expect(typeof label.color).toBe('string');
      }
    });

    test('should handle case when no labels are in use', async () => {
      // Create a label without assigning it to any nodes
      const unusedLabel = await createLabel({
        name: `Unused Metrics Test ${testSuiteId}`,
        color: '#FEDCBA',
      });
      labelsCleanup.track(unusedLabel.id);

      const response = await getLabelsMetrics();

      // Should have labels but potentially none in use
      expect(response.totalLabels).toBeGreaterThan(0);

      // mostUsedLabels array should always be defined
      expect(Array.isArray(response.mostUsedLabels)).toBe(true);

      // If no labels are in use, mostUsedLabels should be empty
      if (response.labelsInUse === 0) {
        expect(response.mostUsedLabels).toHaveLength(0);
      }
    });

    test('should return consistent results when called multiple times', async () => {
      // Get metrics twice in succession without any data changes
      const firstResponse = await getLabelsMetrics();
      const secondResponse = await getLabelsMetrics();

      // Results should be identical
      expect(secondResponse.totalLabels).toBe(firstResponse.totalLabels);
      expect(secondResponse.labelsInUse).toBe(firstResponse.labelsInUse);
      expect(secondResponse.mostUsedLabels).toEqual(
        firstResponse.mostUsedLabels,
      );
    });

    test('should accurately count labels and usage', async () => {
      // Create test labels with unique names
      const label1 = await createLabel({
        name: `Metrics Count Test 1 ${testSuiteId}`,
        color: '#FF0000',
      });
      const label2 = await createLabel({
        name: `Metrics Count Test 2 ${testSuiteId}`,
        color: '#00FF00',
      });
      labelsCleanup.track(label1.id);
      labelsCleanup.track(label2.id);

      // Create nodes with shared dependencies to avoid conflicts
      const node1 = await nodeFactory(factoryDb).create({
        installationId: null,
        deletedAt: null,
      });
      nodeCleanup.track(node1.id);

      // Reuse dependencies from node1 for node2
      const node2 = await nodeFactory(factoryDb).create({
        installationId: null,
        deletedAt: null,
        cityId: node1.cityId,
        populationId: node1.populationId,
      });
      nodeCleanup.track(node2.id);

      // Assign only label1 to nodes (label2 remains unused)
      await assignLabelsToNode({
        id: node1.id,
        labelIds: [label1.id],
      });
      await assignLabelsToNode({
        id: node2.id,
        labelIds: [label1.id],
      });

      const response = await getLabelsMetrics();

      // Should include our created labels in total count
      expect(response.totalLabels).toBeGreaterThanOrEqual(2);

      // Should have at least 1 label in use (label1)
      expect(response.labelsInUse).toBeGreaterThanOrEqual(1);

      // Verify consistency
      expect(response.labelsInUse).toBeLessThanOrEqual(response.totalLabels);

      // Clean up label assignments before test ends
      await assignLabelsToNode({
        id: node1.id,
        labelIds: [], // Remove all assignments
      });
      await assignLabelsToNode({
        id: node2.id,
        labelIds: [], // Remove all assignments
      });
    });

    test('should correctly identify most used labels', async () => {
      // Create test labels
      const lightlyUsedLabel = await createLabel({
        name: `Lightly Used ${testSuiteId}`,
        color: '#FFE4E1',
      });
      const heavilyUsedLabel = await createLabel({
        name: `Heavily Used ${testSuiteId}`,
        color: '#8B0000',
      });
      labelsCleanup.track(lightlyUsedLabel.id);
      labelsCleanup.track(heavilyUsedLabel.id);

      // Create test nodes with shared dependencies to avoid conflicts
      const nodes = [];

      // Create first node (this will create the dependencies)
      const firstNode = await nodeFactory(factoryDb).create({
        installationId: null,
        deletedAt: null,
      });
      nodes.push(firstNode);
      nodeCleanup.track(firstNode.id);

      // Create additional nodes reusing the same dependencies
      for (let i = 1; i < 4; i++) {
        const node = await nodeFactory(factoryDb).create({
          installationId: null,
          deletedAt: null,
          cityId: firstNode.cityId,
          populationId: firstNode.populationId,
        });
        nodes.push(node);
        nodeCleanup.track(node.id);
      }

      // Assign heavily used label to 3 nodes, lightly used to 1
      await assignLabelsToNode({
        id: nodes[0].id,
        labelIds: [heavilyUsedLabel.id],
      });
      await assignLabelsToNode({
        id: nodes[1].id,
        labelIds: [heavilyUsedLabel.id],
      });
      await assignLabelsToNode({
        id: nodes[2].id,
        labelIds: [heavilyUsedLabel.id],
      });
      await assignLabelsToNode({
        id: nodes[3].id,
        labelIds: [lightlyUsedLabel.id],
      });

      const response = await getLabelsMetrics();

      // Should show 2 labels in use
      expect(response.labelsInUse).toBeGreaterThanOrEqual(2);

      // Should have at least one most used label
      expect(response.mostUsedLabels.length).toBeGreaterThan(0);

      // The most used label should have 3 nodes and be the heavily used one
      const topMostUsed = response.mostUsedLabels[0];
      expect(topMostUsed.nodeCount).toBeGreaterThanOrEqual(3);
      expect(topMostUsed.name).toBe(heavilyUsedLabel.name);
      expect(topMostUsed.color).toBe(heavilyUsedLabel.color);

      // Clean up label assignments before test ends
      for (const node of nodes) {
        await assignLabelsToNode({
          id: node.id,
          labelIds: [], // Remove all assignments
        });
      }
    });

    test('should handle mixed label usage scenarios', async () => {
      // Create multiple labels with different usage patterns
      const usedLabel = await createLabel({
        name: `Used Label ${testSuiteId}`,
        color: '#00AAAA',
      });
      const unusedLabel = await createLabel({
        name: `Unused Label ${testSuiteId}`,
        color: '#AA0000',
      });
      labelsCleanup.track(usedLabel.id);
      labelsCleanup.track(unusedLabel.id);

      // Create node
      const node = await nodeFactory(factoryDb).create({
        installationId: null,
        deletedAt: null,
      });
      nodeCleanup.track(node.id);

      await assignLabelsToNode({
        id: node.id,
        labelIds: [usedLabel.id], // Only assign one label
      });

      const response = await getLabelsMetrics();

      // Should include both labels in total count
      expect(response.totalLabels).toBeGreaterThanOrEqual(2);

      // Only one label should be in use
      expect(response.labelsInUse).toBeGreaterThanOrEqual(1);

      // Should have at least one most used label with at least 1 node
      expect(response.mostUsedLabels.length).toBeGreaterThan(0);
      expect(response.mostUsedLabels[0].nodeCount).toBeGreaterThanOrEqual(1);
      expect(typeof response.mostUsedLabels[0].name).toBe('string');
      expect(typeof response.mostUsedLabels[0].color).toBe('string');

      // Verify consistency
      expect(response.labelsInUse).toBeLessThanOrEqual(response.totalLabels);

      // Clean up label assignments before test ends
      await assignLabelsToNode({
        id: node.id,
        labelIds: [], // Remove all assignments
      });
    });
  });
});
