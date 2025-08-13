import { afterAll, describe, expect, test } from 'vitest';
import { AmenityCategory, AmenityType } from './amenities.types';
import {
  createAmenity,
  deleteAmenity,
  getAmenity,
  listAmenities,
  listAmenitiesPaginated,
  updateAmenity,
} from './amenities.controller';

describe('Amenities Controller', () => {
  // Test data
  const testAmenity = {
    name: 'Test Amenity',
    category: AmenityCategory.COMFORT,
    amenityType: AmenityType.BUS,
    description: 'Test bus amenity',
    iconName: 'bus-icon',
    active: true,
  };

  // Variable to store created IDs for cleanup
  let createdAmenityId: number;

  afterAll(async () => {
    // Clean up test data
    if (createdAmenityId) {
      try {
        await deleteAmenity({ id: createdAmenityId });
      } catch (error) {
        console.log('Error cleaning up test amenity:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new amenity', async () => {
      const response = await createAmenity(testAmenity);

      // Store the ID for later cleanup
      createdAmenityId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testAmenity.name);
      expect(response.category).toBe(testAmenity.category);
      expect(response.amenityType).toBe(testAmenity.amenityType);
      expect(response.description).toBe(testAmenity.description);
      expect(response.iconName).toBe(testAmenity.iconName);
      expect(response.active).toBe(testAmenity.active);
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();
      expect(response.deletedAt).toBeNull();
    });

    test('should retrieve an amenity by ID', async () => {
      const response = await getAmenity({ id: createdAmenityId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdAmenityId);
      expect(response.name).toBe(testAmenity.name);
      expect(response.category).toBe(testAmenity.category);
      expect(response.amenityType).toBe(testAmenity.amenityType);
    });

    test('should list all amenities (non-paginated)', async () => {
      const response = await listAmenities({
        filters: { active: true },
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      // Find our test amenity in the results
      const foundAmenity = response.data.find(
        (amenity) => amenity.id === createdAmenityId,
      );
      expect(foundAmenity).toBeDefined();
      expect(foundAmenity?.name).toBe(testAmenity.name);
    });

    test('should list amenities with pagination', async () => {
      const response = await listAmenitiesPaginated({
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

    test('should search amenities by term', async () => {
      const response = await listAmenities({
        searchTerm: 'Test',
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // Should find our test amenity
      const foundAmenity = response.data.find(
        (amenity) => amenity.id === createdAmenityId,
      );
      expect(foundAmenity).toBeDefined();
    });

    test('should update an amenity', async () => {
      const updatedData = {
        name: 'Updated Test Amenity',
        description: 'Updated description',
        active: false,
      };

      const response = await updateAmenity({
        id: createdAmenityId,
        ...updatedData,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdAmenityId);
      expect(response.name).toBe(updatedData.name);
      expect(response.description).toBe(updatedData.description);
      expect(response.active).toBe(updatedData.active);
      // Original fields should remain unchanged
      expect(response.category).toBe(testAmenity.category);
      expect(response.amenityType).toBe(testAmenity.amenityType);
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors when getting amenity', async () => {
      await expect(getAmenity({ id: 99999 })).rejects.toThrow();
    });

    test('should handle not found errors when updating amenity', async () => {
      await expect(
        updateAmenity({
          id: 99999,
          name: 'Non-existent amenity',
        }),
      ).rejects.toThrow();
    });

    test('should handle not found errors when deleting amenity', async () => {
      await expect(deleteAmenity({ id: 99999 })).rejects.toThrow();
    });

    test('should handle validation errors for duplicate names', async () => {
      // Try to create another amenity with the same name
      await expect(
        createAmenity({
          name: 'Updated Test Amenity', // This name was used in the update test
          category: AmenityCategory.SERVICES,
          amenityType: AmenityType.INSTALLATION,
        }),
      ).rejects.toThrow();
    });

    test('should create amenity with valid AmenityType.BUS', async () => {
      const busAmenity = await createAmenity({
        name: 'Test Bus Amenity',
        category: AmenityCategory.SERVICES,
        amenityType: AmenityType.BUS,
      });

      expect(busAmenity.amenityType).toBe(AmenityType.BUS);

      // Clean up
      await deleteAmenity({ id: busAmenity.id });
    });

    test('should create amenity with valid AmenityType.INSTALLATION', async () => {
      const installationAmenity = await createAmenity({
        name: 'Test Installation Amenity',
        category: AmenityCategory.BASIC,
        amenityType: AmenityType.INSTALLATION,
      });

      expect(installationAmenity.amenityType).toBe(AmenityType.INSTALLATION);

      // Clean up
      await deleteAmenity({ id: installationAmenity.id });
    });
  });

  describe('domain validation', () => {
    test('should validate amenityType in domain layer', async () => {
      // Test domain validation directly by calling it with invalid data
      const { amenityDomain } = await import('./amenities.domain');

      const invalidPayload = {
        name: 'Test Invalid Type',
        category: 'invalid-category',
        amenityType: 'invalid-type',
      };

      await expect(
        // @ts-expect-error Testing invalid amenityType and category values for domain validation
        amenityDomain.validateAmenity(invalidPayload),
      ).rejects.toThrow();
    });

    test('should validate category in domain layer', async () => {
      // Test domain validation for invalid category
      const { amenityDomain } = await import('./amenities.domain');

      const invalidCategoryPayload = {
        name: 'Test Invalid Category',
        category: 'invalid-category',
        amenityType: AmenityType.BUS,
      };

      await expect(
        // @ts-expect-error Testing invalid category value for domain validation
        amenityDomain.validateAmenity(invalidCategoryPayload),
      ).rejects.toThrow();
    });

    test('should validate iconName format in domain layer', async () => {
      const { amenityDomain } = await import('./amenities.domain');

      // Test invalid format (uppercase, spaces, special chars)
      const invalidIconPayload = {
        name: 'Test Invalid Icon',
        category: AmenityCategory.TECHNOLOGY,
        amenityType: AmenityType.BUS,
        iconName: 'Invalid Icon Name!',
      };
      await expect(
        amenityDomain.validateAmenity(invalidIconPayload),
      ).rejects.toThrow();
    });

    test('should accept valid kebab-case icon names', async () => {
      const validIconNames = [
        'wifi',
        'coffee-cup',
        'air-vent',
        'shield-check',
        'heart',
      ];

      for (const iconName of validIconNames) {
        const amenity = await createAmenity({
          name: `Test ${iconName} Amenity`,
          category: AmenityCategory.COMFORT,
          amenityType: AmenityType.BUS,
          iconName,
        });
        expect(amenity.iconName).toBe(iconName);
        await deleteAmenity({ id: amenity.id });
      }
    });
  });
});
