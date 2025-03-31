import { expect, describe, test, beforeAll, afterAll } from 'vitest';
import {
  createTransporter,
  getTransporter,
  listTransporters,
  updateTransporter,
  deleteTransporter,
} from './transporters.controller';
import { createCity, deleteCity } from '../cities/cities.controller';
import { createState, deleteState } from '../states/states.controller';
import {
  createCountry,
  deleteCountry,
} from '../countries/countries.controller';

describe('Transporters Controller', () => {
  // Test data and setup
  let countryId: number;
  let stateId: number;
  let cityId: number; // We need a valid city ID for headquarter

  const testTransporter = {
    name: 'Test Transporter',
    code: 'TST-TRNSP',
    description: 'Test transporter description',
    website: 'https://testtransporter.com',
    email: 'contact@testtransporter.com',
    phone: '+1234567890',
    contactInfo: 'Additional contact information',
    licenseNumber: 'LIC-12345',
    active: true,
  };

  // Variable to store created IDs for cleanup
  let createdTransporterId: number;
  // Array to track additional transporters created in tests
  let additionalTransporterIds: number[] = [];

  // Setup test dependencies - create country, state, and city
  beforeAll(async () => {
    // Create a temporary country
    const country = await createCountry({
      name: 'Test Country for Transporters',
      code: 'TCT',
      active: true,
    });
    countryId = country.id;

    // Create a temporary state using the country
    const state = await createState({
      name: 'Test State for Transporters',
      code: 'TST',
      countryId: countryId,
      active: true,
    });
    stateId = state.id;

    // Create a temporary city using the state
    const city = await createCity({
      name: 'Test City for Transporters',
      stateId: stateId,
      latitude: 19.4326,
      longitude: -99.1332,
      timezone: 'America/Mexico_City',
      slug: 'test-city-transporters',
      active: true,
    });
    cityId = city.id;
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up any additional transporters created during tests
    for (const id of additionalTransporterIds) {
      try {
        await deleteTransporter({ id });
      } catch (error) {
        console.log(`Error cleaning up additional transporter ${id}:`, error);
      }
    }

    // Clean up the main created transporter if any
    if (createdTransporterId) {
      try {
        await deleteTransporter({ id: createdTransporterId });
      } catch (error) {
        console.log('Error cleaning up test transporter:', error);
      }
    }

    // Clean up the created city
    if (cityId) {
      try {
        await deleteCity({ id: cityId });
      } catch (error) {
        console.log('Error cleaning up test city:', error);
      }
    }

    // Clean up the created state
    if (stateId) {
      try {
        await deleteState({ id: stateId });
      } catch (error) {
        console.log('Error cleaning up test state:', error);
      }
    }

    // Clean up the created country
    if (countryId) {
      try {
        await deleteCountry({ id: countryId });
      } catch (error) {
        console.log('Error cleaning up test country:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new transporter', async () => {
      // Create a transporter without headquarter city
      const response = await createTransporter(testTransporter);

      // Store the ID for later cleanup
      createdTransporterId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testTransporter.name);
      expect(response.code).toBe(testTransporter.code);
      expect(response.description).toBe(testTransporter.description);
      expect(response.website).toBe(testTransporter.website);
      expect(response.email).toBe(testTransporter.email);
      expect(response.phone).toBe(testTransporter.phone);
      expect(response.contactInfo).toBe(testTransporter.contactInfo);
      expect(response.licenseNumber).toBe(testTransporter.licenseNumber);
      expect(response.active).toBe(testTransporter.active);
      expect(response.createdAt).toBeDefined();
    });

    test('should create a transporter with headquarter city', async () => {
      // Create a transporter with headquarter city
      const transporterWithHeadquarter = await createTransporter({
        name: 'Transporter With Headquarter',
        code: 'TRN-HQ',
        description: 'This transporter has a headquarter city',
        headquarterCityId: cityId,
        active: true,
      });

      // Add to list of transporters to clean up
      additionalTransporterIds.push(transporterWithHeadquarter.id);

      // Assertions
      expect(transporterWithHeadquarter).toBeDefined();
      expect(transporterWithHeadquarter.headquarterCityId).toBe(cityId);

      // Clean up
      await deleteTransporter({ id: transporterWithHeadquarter.id });
      // Remove from cleanup list since we just deleted it
      additionalTransporterIds = additionalTransporterIds.filter(
        (id) => id !== transporterWithHeadquarter.id,
      );
    });

    test('should retrieve a transporter by ID', async () => {
      const response = await getTransporter({ id: createdTransporterId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdTransporterId);
      expect(response.name).toBe(testTransporter.name);
      expect(response.code).toBe(testTransporter.code);
    });

    test('should list all transporters', async () => {
      const result = await listTransporters({});

      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // Verify our test transporter is in the list
      expect(
        result.data.some(
          (transporter) => transporter.id === createdTransporterId,
        ),
      ).toBe(true);
    });

    test('should retrieve paginated transporters', async () => {
      const result = await listTransporters({ page: 1, pageSize: 10 });

      // Check the structure of the response
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(typeof result.pagination.currentPage).toBe('number');
      expect(typeof result.pagination.pageSize).toBe('number');
      expect(typeof result.pagination.totalCount).toBe('number');
      expect(typeof result.pagination.totalPages).toBe('number');
      expect(typeof result.pagination.hasNextPage).toBe('boolean');
      expect(typeof result.pagination.hasPreviousPage).toBe('boolean');

      // We should at least find our test transporter
      expect(
        result.data.some(
          (transporter) => transporter.id === createdTransporterId,
        ),
      ).toBe(true);

      // Pagination values should make sense
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(1);
    });

    test('pagination should respect pageSize parameter for transporters', async () => {
      // Request with a small page size
      const result = await listTransporters({ page: 1, pageSize: 1 });

      expect(result.data.length).toBeLessThanOrEqual(1);
      expect(result.pagination.pageSize).toBe(1);
    });

    test('should update a transporter', async () => {
      const updatedName = 'Updated Test Transporter';
      const updatedPhone = '+9876543210';

      const response = await updateTransporter({
        id: createdTransporterId,
        name: updatedName,
        phone: updatedPhone,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdTransporterId);
      expect(response.name).toBe(updatedName);
      expect(response.phone).toBe(updatedPhone);
      // Other fields should remain unchanged
      expect(response.code).toBe(testTransporter.code);
      expect(response.description).toBe(testTransporter.description);
    });

    test('should update transporter with headquarter city', async () => {
      const response = await updateTransporter({
        id: createdTransporterId,
        headquarterCityId: cityId,
      });

      expect(response).toBeDefined();
      expect(response.headquarterCityId).toBe(cityId);
    });

    test('should delete a transporter', async () => {
      // Create a transporter specifically for deletion test
      const transporterToDelete = await createTransporter({
        name: 'Transporter To Delete',
        code: 'DEL-TRP',
        active: true,
      });

      // Delete should not throw an error
      await expect(
        deleteTransporter({ id: transporterToDelete.id }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(
        getTransporter({ id: transporterToDelete.id }),
      ).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    // NOTE: We are not testing the validation errors because it's handled by Encore rust runtime and they are not thrown in the controller

    test('should handle not found errors', async () => {
      await expect(getTransporter({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate errors', async () => {
      // Try to create transporter with same code as existing one
      await expect(
        createTransporter({
          name: 'Another Test Transporter',
          code: testTransporter.code, // Using the same code as our main test transporter
          active: true,
        }),
      ).rejects.toThrow();
    });

    test('should handle invalid headquarter city ID', async () => {
      // Try to create a transporter with a non-existent city ID
      await expect(
        createTransporter({
          name: 'Invalid Headquarter Transporter',
          code: 'INV-HDQT',
          headquarterCityId: 9999, // Non-existent city ID
          active: true,
        }),
      ).rejects.toThrow();
    });
  });
});
