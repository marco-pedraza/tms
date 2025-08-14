import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  createCity,
  deleteCity,
} from '@/inventory/locations/cities/cities.controller';
import {
  createCountry,
  deleteCountry,
} from '@/inventory/locations/countries/countries.controller';
import {
  createState,
  deleteState,
} from '@/inventory/locations/states/states.controller';
import type { Transporter, TransporterWithCity } from './transporters.types';
import {
  createTransporter,
  deleteTransporter,
  getTransporter,
  listTransporters,
  listTransportersPaginated,
  updateTransporter,
} from './transporters.controller';

describe('Transporters Controller', () => {
  let countryId: number;
  let stateId: number;
  let cityId: number;
  let createdTransporterId: number;
  let additionalTransporterIds: number[] = [];

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

  beforeAll(async () => {
    const country = await createCountry({
      name: 'Test Country for Transporters',
      code: 'TCT',
      active: true,
    });
    countryId = country.id;
    const state = await createState({
      name: 'Test State for Transporters',
      code: 'TST',
      countryId,
      active: true,
    });
    stateId = state.id;
    const city = await createCity({
      name: 'Test City for Transporters',
      stateId,
      latitude: 19.4326,
      longitude: -99.1332,
      timezone: 'America/Mexico_City',
      active: true,
    });
    cityId = city.id;
  });

  afterAll(async () => {
    for (const id of additionalTransporterIds) {
      try {
        await deleteTransporter({ id });
        // eslint-disable-next-line
      } catch (error: any) {
        if (
          error?.name === 'NotFoundError' ||
          (typeof error?.message === 'string' &&
            error.message.toLowerCase().includes('not found'))
        ) {
          continue;
        }

        console.error(`Error deleting additional transporter ${id}:`, error);
      }
    }
    if (createdTransporterId) {
      try {
        await deleteTransporter({ id: createdTransporterId });
      } catch (error) {
        console.error('Error deleting main test transporter:', error);
      }
    }
    try {
      await deleteCity({ id: cityId });
    } catch (error) {
      console.error('Error deleting city:', error);
    }
    try {
      await deleteState({ id: stateId });
    } catch (error) {
      console.error('Error deleting state:', error);
    }
    try {
      await deleteCountry({ id: countryId });
    } catch (error) {
      console.error('Error deleting country:', error);
    }
  });

  describe('success scenarios', () => {
    test('should create a new transporter', async () => {
      const response = await createTransporter(testTransporter);
      createdTransporterId = response.id;
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
      const transporterWithHeadquarter = await createTransporter({
        name: 'Transporter With Headquarter',
        code: 'TRN-HQ',
        description: 'This transporter has a headquarter city',
        headquarterCityId: cityId,
        active: true,
      });
      additionalTransporterIds.push(transporterWithHeadquarter.id);
      expect(transporterWithHeadquarter).toBeDefined();
      expect(transporterWithHeadquarter.headquarterCityId).toBe(cityId);
      await deleteTransporter({ id: transporterWithHeadquarter.id });
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

    test('should list all transporters (non-paginated)', async () => {
      const result = await listTransporters({});
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(
        result.data.some(
          (t: TransporterWithCity) => t.id === createdTransporterId,
        ),
      ).toBe(true);
      expect(result).not.toHaveProperty('pagination');
    });

    test('should retrieve paginated transporters', async () => {
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
          (t: TransporterWithCity) => t.id === createdTransporterId,
        ),
      ).toBe(true);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(1);
    });

    test('pagination should respect pageSize parameter for transporters', async () => {
      const result = await listTransportersPaginated({ page: 1, pageSize: 1 });
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
      const transporterToDelete = await createTransporter({
        name: 'Transporter To Delete',
        code: 'DEL-TRP',
        active: true,
      });
      additionalTransporterIds.push(transporterToDelete.id);
      await expect(
        deleteTransporter({ id: transporterToDelete.id }),
      ).resolves.not.toThrow();
      additionalTransporterIds = additionalTransporterIds.filter(
        (id) => id !== transporterToDelete.id,
      );
      await expect(
        getTransporter({ id: transporterToDelete.id }),
      ).rejects.toThrow();
    });
  });

  describe('city association tests', () => {
    test('should retrieve a transporter with its associated headquarter city', async () => {
      const transporterWithCity = await getTransporter({
        id: createdTransporterId,
      });
      expect(transporterWithCity).toBeDefined();
      expect(transporterWithCity.id).toBe(createdTransporterId);
      expect(transporterWithCity.headquarterCity).toBeDefined();
      expect(transporterWithCity.headquarterCity?.id).toBe(cityId);
      expect(transporterWithCity.headquarterCity?.name).toBe(
        'Test City for Transporters',
      );
      expect(transporterWithCity.headquarterCity?.stateId).toBe(stateId);
    });

    test('should retrieve transporters with headquarter cities using listTransporters', async () => {
      const response = await listTransporters({});
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.length).toBeGreaterThan(0);
      const foundTransporter = response.data.find(
        (t: TransporterWithCity) => t.id === createdTransporterId,
      );
      expect(foundTransporter).toBeDefined();
      if (foundTransporter) {
        const transporterWithCity = foundTransporter as TransporterWithCity;
        expect(transporterWithCity.headquarterCity).toBeDefined();
        expect(transporterWithCity.headquarterCity?.id).toBe(cityId);
        expect(transporterWithCity.headquarterCity?.name).toBe(
          'Test City for Transporters',
        );
      }
    });

    test('should retrieve transporters with headquarter cities using listTransportersPaginated', async () => {
      const paginatedResponse = await listTransportersPaginated({
        page: 1,
        pageSize: 10,
      });
      expect(paginatedResponse).toBeDefined();
      expect(paginatedResponse.data).toBeDefined();
      expect(paginatedResponse.pagination).toBeDefined();
      expect(paginatedResponse.data.length).toBeGreaterThan(0);
      const foundTransporter = paginatedResponse.data.find(
        (t: TransporterWithCity) => t.id === createdTransporterId,
      );
      expect(foundTransporter).toBeDefined();
      if (foundTransporter) {
        expect(foundTransporter.headquarterCity).toBeDefined();
        expect(foundTransporter.headquarterCity?.id).toBe(cityId);
        expect(foundTransporter.headquarterCity?.name).toBe(
          'Test City for Transporters',
        );
      }
    });
  });

  describe('error scenarios', () => {
    test('should handle non-existent transporter', async () => {
      await expect(getTransporter({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate errors', async () => {
      await expect(
        createTransporter({
          name: 'Another Test Transporter',
          code: testTransporter.code,
          active: true,
        }),
      ).rejects.toThrow();
    });

    test('should handle invalid headquarter city ID', async () => {
      await expect(
        createTransporter({
          name: 'Invalid Headquarter Transporter',
          code: 'INV-HDQT',
          headquarterCityId: 9999,
          active: true,
        }),
      ).rejects.toThrow();
    });
  });

  describe('pagination, ordering, and filtering', () => {
    const testTransporters: Transporter[] = [];
    beforeAll(async () => {
      const transportersToCreate = [
        { name: 'Alpha Transporter', code: 'ALPHA', active: true },
        { name: 'Beta Transporter', code: 'BETA', active: false },
        { name: 'Gamma Transporter', code: 'GAMMA', active: true },
      ];
      for (const t of transportersToCreate) {
        const created = await createTransporter(t);
        testTransporters.push(created);
        additionalTransporterIds.push(created.id);
      }
    });
    afterAll(async () => {
      for (const t of testTransporters) {
        try {
          await deleteTransporter({ id: t.id });
        } catch (error) {
          console.error(`Error deleting test transporter ${t.id}:`, error);
        }
      }
    });

    test('should order transporters by name in descending order', async () => {
      const response = await listTransporters({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });
      const names = response.data.map((t: TransporterWithCity) => t.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should filter transporters by active status', async () => {
      const response = await listTransporters({ filters: { active: true } });
      expect(response.data.every((t: TransporterWithCity) => t.active)).toBe(
        true,
      );
    });

    test('should filter transporters by code', async () => {
      const response = await listTransporters({ filters: { code: 'ALPHA' } });
      expect(
        response.data.every((t: TransporterWithCity) => t.code === 'ALPHA'),
      ).toBe(true);
    });

    test('should combine ordering and filtering in paginated results', async () => {
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
