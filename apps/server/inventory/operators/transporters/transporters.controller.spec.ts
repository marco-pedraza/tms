import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createCity } from '@/inventory/locations/cities/cities.controller';
import { cityRepository } from '@/inventory/locations/cities/cities.repository';
import { createCountry } from '@/inventory/locations/countries/countries.controller';
import { countryRepository } from '@/inventory/locations/countries/countries.repository';
import { createState } from '@/inventory/locations/states/states.controller';
import { stateRepository } from '@/inventory/locations/states/states.repository';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueEntity,
} from '@/tests/shared/test-utils';
import type { Transporter, TransporterWithCity } from './transporters.types';
import { transporterRepository } from './transporters.repository';
import {
  createTransporter,
  deleteTransporter,
  getTransporter,
  listTransporters,
  listTransportersPaginated,
  updateTransporter,
} from './transporters.controller';

/**
 * Test data interface for consistent test setup
 */
interface TestData {
  countryId: number;
  stateId: number;
  cityId: number;
  suiteId: string;
  transporterCleanup: ReturnType<typeof createCleanupHelper>;
}

describe('Transporters Controller', () => {
  let testData: TestData;

  /**
   * Creates fresh test data for each test to ensure isolation
   */
  async function createTestData(): Promise<TestData> {
    const suiteId = createTestSuiteId('transporters');

    const countryEntity = createUniqueEntity({
      baseName: 'Test Country',
      baseCode: 'TC',
      suiteId,
    });

    const country = await createCountry({
      name: countryEntity.name,
      code: countryEntity.code || 'TC001',
      active: true,
    });

    const stateEntity = createUniqueEntity({
      baseName: 'Test State',
      baseCode: 'TS',
      suiteId,
    });

    const state = await createState({
      name: stateEntity.name,
      code: stateEntity.code || 'TS001',
      countryId: country.id,
      active: true,
    });

    const cityEntity = createUniqueEntity({
      baseName: 'Test City',
      suiteId,
    });

    const city = await createCity({
      name: cityEntity.name,
      stateId: state.id,
      latitude: 19.4326 + Math.random() * 0.01, // Small variation to avoid conflicts
      longitude: -99.1332 + Math.random() * 0.01,
      timezone: 'America/Mexico_City',
      active: true,
    });

    const transporterCleanup = createCleanupHelper(
      ({ id }: { id: number }) => transporterRepository.forceDelete(id),
      'transporter',
    );

    return {
      countryId: country.id,
      stateId: state.id,
      cityId: city.id,
      suiteId,
      transporterCleanup,
    };
  }

  /**
   * Cleans up test data after each test
   */
  async function cleanupTestData(data: TestData): Promise<void> {
    // Delete transporters first (they reference cities)
    await data.transporterCleanup.cleanupAll();

    // Delete geographic entities in correct dependency order using forceDelete
    // Wrap in try-catch to handle cases where entities were already deleted
    try {
      await cityRepository.forceDelete(data.cityId);
    } catch (error) {
      console.log(`Error cleaning up city (ID: ${data.cityId}):`, error);
    }

    try {
      await stateRepository.forceDelete(data.stateId);
    } catch (error) {
      console.log(`Error cleaning up state (ID: ${data.stateId}):`, error);
    }

    try {
      await countryRepository.forceDelete(data.countryId);
    } catch (error) {
      console.log(`Error cleaning up country (ID: ${data.countryId}):`, error);
    }
  }

  /**
   * Creates a test transporter with unique data
   */
  async function createTestTransporter(
    data: TestData,
    overrides: Partial<Parameters<typeof createTransporter>[0]> = {},
  ): Promise<Transporter> {
    const transporterEntity = createUniqueEntity({
      baseName: 'Test Transporter',
      baseCode: 'TST',
      suiteId: data.suiteId,
    });

    const transporter = await createTransporter({
      name: transporterEntity.name,
      code: transporterEntity.code || 'TST001',
      description: 'Test transporter description',
      website: 'https://testtransporter.com',
      email: 'contact@testtransporter.com',
      phone: '+1234567890',
      contactInfo: 'Additional contact information',
      licenseNumber: `LIC-${Date.now()}`,
      active: true,
      ...overrides,
    });

    // Track for cleanup using the cleanup helper
    data.transporterCleanup.track(transporter.id);
    return transporter;
  }

  beforeEach(async () => {
    testData = await createTestData();
  });

  afterEach(async () => {
    await cleanupTestData(testData);
  });

  describe('success scenarios', () => {
    test('should create a new transporter', async () => {
      const response = await createTestTransporter(testData);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toContain('Test Transporter');
      expect(response.code).toContain('TST');
      expect(response.description).toBe('Test transporter description');
      expect(response.website).toBe('https://testtransporter.com');
      expect(response.email).toBe('contact@testtransporter.com');
      expect(response.phone).toBe('+1234567890');
      expect(response.contactInfo).toBe('Additional contact information');
      expect(response.licenseNumber).toContain('LIC-');
      expect(response.active).toBe(true);
      expect(response.createdAt).toBeDefined();
    });

    test('should create a transporter with headquarter city', async () => {
      const transporterWithHeadquarter = await createTestTransporter(testData, {
        headquarterCityId: testData.cityId,
      });

      expect(transporterWithHeadquarter).toBeDefined();
      expect(transporterWithHeadquarter.headquarterCityId).toBe(
        testData.cityId,
      );
    });

    test('should retrieve a transporter by ID', async () => {
      const createdTransporter = await createTestTransporter(testData);

      const response = await getTransporter({ id: createdTransporter.id });
      expect(response).toBeDefined();
      expect(response.id).toBe(createdTransporter.id);
      expect(response.name).toBe(createdTransporter.name);
      expect(response.code).toBe(createdTransporter.code);
    });

    test('should list all transporters (non-paginated)', async () => {
      const createdTransporter = await createTestTransporter(testData);

      const result = await listTransporters({});
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(
        result.data.some(
          (t: TransporterWithCity) => t.id === createdTransporter.id,
        ),
      ).toBe(true);
      expect(result).not.toHaveProperty('pagination');
    });

    test('should retrieve paginated transporters', async () => {
      const createdTransporter = await createTestTransporter(testData);

      const result = await listTransportersPaginated({ page: 1, pageSize: 10 });
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(typeof result.pagination.currentPage).toBe('number');
      expect(typeof result.pagination.pageSize).toBe('number');
      expect(typeof result.pagination.totalCount).toBe('number');
      expect(typeof result.pagination.totalPages).toBe('number');
      expect(typeof result.pagination.hasNextPage).toBe('boolean');
      expect(typeof result.pagination.hasPreviousPage).toBe('boolean');
      expect(
        result.data.some(
          (t: TransporterWithCity) => t.id === createdTransporter.id,
        ),
      ).toBe(true);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(1);
    });

    test('pagination should respect pageSize parameter for transporters', async () => {
      // Create a transporter to ensure we have at least one
      await createTestTransporter(testData);

      const result = await listTransportersPaginated({ page: 1, pageSize: 1 });
      expect(result.data.length).toBeLessThanOrEqual(1);
      expect(result.pagination.pageSize).toBe(1);
    });

    test('should update a transporter', async () => {
      const createdTransporter = await createTestTransporter(testData);
      const updatedName = 'Updated Test Transporter';
      const updatedPhone = '+9876543210';

      const response = await updateTransporter({
        id: createdTransporter.id,
        name: updatedName,
        phone: updatedPhone,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdTransporter.id);
      expect(response.name).toBe(updatedName);
      expect(response.phone).toBe(updatedPhone);
      expect(response.code).toBe(createdTransporter.code);
      expect(response.description).toBe(createdTransporter.description);
    });

    test('should update transporter with headquarter city', async () => {
      const createdTransporter = await createTestTransporter(testData);

      const response = await updateTransporter({
        id: createdTransporter.id,
        headquarterCityId: testData.cityId,
      });

      expect(response).toBeDefined();
      expect(response.headquarterCityId).toBe(testData.cityId);
    });

    test('should delete a transporter', async () => {
      const transporterToDelete = await createTestTransporter(testData);

      await expect(
        deleteTransporter({ id: transporterToDelete.id }),
      ).resolves.not.toThrow();

      await expect(
        getTransporter({ id: transporterToDelete.id }),
      ).rejects.toThrow();
    });
  });

  describe('city association tests', () => {
    test('should retrieve a transporter with its associated headquarter city', async () => {
      const createdTransporter = await createTestTransporter(testData, {
        headquarterCityId: testData.cityId,
      });

      const transporterWithCity = await getTransporter({
        id: createdTransporter.id,
      });

      expect(transporterWithCity).toBeDefined();
      expect(transporterWithCity.id).toBe(createdTransporter.id);
      expect(transporterWithCity.headquarterCity).toBeDefined();
      expect(transporterWithCity.headquarterCity?.id).toBe(testData.cityId);
      expect(transporterWithCity.headquarterCity?.name).toContain('Test City');
      expect(transporterWithCity.headquarterCity?.stateId).toBe(
        testData.stateId,
      );
    });

    test('should retrieve transporters with headquarter cities using listTransporters', async () => {
      const createdTransporter = await createTestTransporter(testData, {
        headquarterCityId: testData.cityId,
      });

      const response = await listTransporters({});
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.length).toBeGreaterThan(0);

      const foundTransporter = response.data.find(
        (t: TransporterWithCity) => t.id === createdTransporter.id,
      );
      expect(foundTransporter).toBeDefined();

      if (foundTransporter) {
        const transporterWithCity = foundTransporter as TransporterWithCity;
        expect(transporterWithCity.headquarterCity).toBeDefined();
        expect(transporterWithCity.headquarterCity?.id).toBe(testData.cityId);
        expect(transporterWithCity.headquarterCity?.name).toContain(
          'Test City',
        );
      }
    });

    test('should retrieve transporters with headquarter cities using listTransportersPaginated', async () => {
      const createdTransporter = await createTestTransporter(testData, {
        headquarterCityId: testData.cityId,
      });

      const paginatedResponse = await listTransportersPaginated({
        page: 1,
        pageSize: 10,
        searchTerm: createdTransporter.name, // Filter by the unique name to ensure it appears on page 1
      });

      expect(paginatedResponse).toBeDefined();
      expect(paginatedResponse.data).toBeDefined();
      expect(paginatedResponse.pagination).toBeDefined();
      expect(paginatedResponse.data.length).toBeGreaterThan(0);

      const foundTransporter = paginatedResponse.data.find(
        (t: TransporterWithCity) => t.id === createdTransporter.id,
      );
      expect(foundTransporter).toBeDefined();

      if (foundTransporter) {
        expect(foundTransporter.headquarterCity).toBeDefined();
        expect(foundTransporter.headquarterCity?.id).toBe(testData.cityId);
        expect(foundTransporter.headquarterCity?.name).toContain('Test City');
      }
    });
  });

  describe('error scenarios', () => {
    test('should handle non-existent transporter', async () => {
      await expect(getTransporter({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate errors', async () => {
      const firstTransporter = await createTestTransporter(testData);

      await expect(
        createTransporter({
          name: 'Another Test Transporter',
          code: firstTransporter.code, // Use the same code to trigger duplicate error
          active: true,
        }),
      ).rejects.toThrow();
    });

    test('should handle invalid headquarter city ID', async () => {
      await expect(
        createTestTransporter(testData, {
          headquarterCityId: 9999, // Invalid city ID
        }),
      ).rejects.toThrow();
    });
  });

  describe('pagination, ordering, and filtering', () => {
    test('should order transporters by name in descending order', async () => {
      // Create multiple transporters with predictable names for ordering test
      const alphaEntity = createUniqueEntity({
        baseName: 'Alpha Transporter',
        baseCode: 'ALPHA',
        suiteId: testData.suiteId,
      });
      const betaEntity = createUniqueEntity({
        baseName: 'Beta Transporter',
        baseCode: 'BETA',
        suiteId: testData.suiteId,
      });
      const gammaEntity = createUniqueEntity({
        baseName: 'Gamma Transporter',
        baseCode: 'GAMMA',
        suiteId: testData.suiteId,
      });

      await createTestTransporter(testData, {
        name: alphaEntity.name,
        code: alphaEntity.code || 'ALPHA001',
      });
      await createTestTransporter(testData, {
        name: betaEntity.name,
        code: betaEntity.code || 'BETA001',
      });
      await createTestTransporter(testData, {
        name: gammaEntity.name,
        code: gammaEntity.code || 'GAMMA001',
      });

      const response = await listTransporters({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      const names = response.data.map((t: TransporterWithCity) => t.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should filter transporters by active status', async () => {
      // Create both active and inactive transporters with unique names
      const activeEntity = createUniqueEntity({
        baseName: 'Active Transporter',
        baseCode: 'ACTV',
        suiteId: testData.suiteId,
      });
      const inactiveEntity = createUniqueEntity({
        baseName: 'Inactive Transporter',
        baseCode: 'INAC',
        suiteId: testData.suiteId,
      });

      await createTestTransporter(testData, {
        name: activeEntity.name,
        code: activeEntity.code || 'ACTV001',
        active: true,
      });
      await createTestTransporter(testData, {
        name: inactiveEntity.name,
        code: inactiveEntity.code || 'INAC001',
        active: false,
      });

      const response = await listTransporters({ filters: { active: true } });
      expect(response.data.every((t: TransporterWithCity) => t.active)).toBe(
        true,
      );
    });

    test('should filter transporters by code', async () => {
      const specificCodeEntity = createUniqueEntity({
        baseName: 'Specific Transporter',
        baseCode: 'ALPHA',
        suiteId: testData.suiteId,
      });

      await createTestTransporter(testData, {
        name: specificCodeEntity.name,
        code: specificCodeEntity.code || 'ALPHA001',
      });
      await createTestTransporter(testData); // Create another with different code

      const expectedCode = specificCodeEntity.code || 'ALPHA001';
      const response = await listTransporters({
        filters: { code: expectedCode },
      });
      expect(
        response.data.every(
          (t: TransporterWithCity) => t.code === expectedCode,
        ),
      ).toBe(true);
      expect(response.data.length).toBe(1);
    });

    test('should combine ordering and filtering in paginated results', async () => {
      // Create multiple active transporters with predictable names
      const alphaActiveEntity = createUniqueEntity({
        baseName: 'Alpha Active Transporter',
        baseCode: 'ALPA',
        suiteId: testData.suiteId,
      });
      const betaActiveEntity = createUniqueEntity({
        baseName: 'Beta Active Transporter',
        baseCode: 'BETA',
        suiteId: testData.suiteId,
      });
      const gammaInactiveEntity = createUniqueEntity({
        baseName: 'Gamma Inactive Transporter',
        baseCode: 'GAMA',
        suiteId: testData.suiteId,
      });

      await createTestTransporter(testData, {
        name: alphaActiveEntity.name,
        code: alphaActiveEntity.code || 'ALPA001',
        active: true,
      });
      await createTestTransporter(testData, {
        name: betaActiveEntity.name,
        code: betaActiveEntity.code || 'BETA001',
        active: true,
      });
      await createTestTransporter(testData, {
        name: gammaInactiveEntity.name,
        code: gammaInactiveEntity.code || 'GAMA001',
        active: false,
      });

      const response = await listTransportersPaginated({
        filters: { active: true },
        orderBy: [{ field: 'name', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      expect(response.data.every((t: TransporterWithCity) => t.active)).toBe(
        true,
      );

      const names = response.data.map((t: TransporterWithCity) => t.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }

      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });
  });
});
