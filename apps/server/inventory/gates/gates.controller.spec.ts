import { expect, describe, test, afterAll, beforeAll } from 'vitest';
import {
  createGate,
  getGate,
  updateGate,
  deleteGate,
  listGates,
  listGatesPaginated,
} from './gates.controller';
import type { Gate } from './gates.types';
import {
  createTerminal,
  deleteTerminal,
} from '../terminals/terminals.controller';
import { createCity, deleteCity } from '../cities/cities.controller';
import { createState, deleteState } from '../states/states.controller';
import {
  createCountry,
  deleteCountry,
} from '../countries/countries.controller';

describe('Gates Controller', () => {
  // Test data and setup
  const testGate = {
    terminalId: 0, // Will be set in beforeAll
    active: true,
  };

  let countryId: number;
  let stateId: number;
  let cityId: number;
  let terminalId: number;
  let createdGateId: number;
  let additionalGateIds: number[] = [];

  beforeAll(async () => {
    // Create dependencies: country, state, city, terminal
    const country = await createCountry({
      name: 'Test Country for Gates',
      code: 'TCG',
      active: true,
    });
    countryId = country.id;

    const state = await createState({
      name: 'Test State for Gates',
      code: 'TSG',
      countryId,
      active: true,
    });
    stateId = state.id;

    const city = await createCity({
      name: 'Test City for Gates',
      stateId,
      latitude: 19.4326,
      longitude: -99.1332,
      timezone: 'America/Mexico_City',
      active: true,
    });
    cityId = city.id;

    const terminal = await createTerminal({
      name: 'Test Terminal for Gates',
      address: '123 Test Street',
      cityId,
      latitude: 19.4326,
      longitude: -99.1332,
      code: 'TEST-TERM-GATES',
      active: true,
    });
    terminalId = terminal.id;
    testGate.terminalId = terminalId;
  });

  afterAll(async () => {
    // Clean up additional gates
    for (const id of additionalGateIds) {
      try {
        await deleteGate({ id });
        // eslint-disable-next-line
      } catch (error: any) {
        if (
          error?.name === 'NotFoundError' ||
          (typeof error?.message === 'string' &&
            error.message.toLowerCase().includes('not found'))
        ) {
          continue;
        }
        // Silent error handling for cleanup
      }
    }

    // Clean up main gate
    if (createdGateId) {
      try {
        await deleteGate({ id: createdGateId });
      } catch {
        // Silent error handling for cleanup
      }
    }

    // Clean up dependencies
    try {
      await deleteTerminal({ id: terminalId });
    } catch {
      // Silent error handling for cleanup
    }

    try {
      await deleteCity({ id: cityId });
    } catch {
      // Silent error handling for cleanup
    }

    try {
      await deleteState({ id: stateId });
    } catch {
      // Silent error handling for cleanup
    }

    try {
      await deleteCountry({ id: countryId });
    } catch {
      // Silent error handling for cleanup
    }
  });

  describe('success scenarios', () => {
    test('should create a new gate', async () => {
      const response = await createGate(testGate);
      createdGateId = response.id;

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.terminalId).toBe(testGate.terminalId);
      expect(response.active).toBe(testGate.active);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a gate by ID', async () => {
      const response = await getGate({ id: createdGateId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdGateId);
      expect(response.terminalId).toBe(testGate.terminalId);
      expect(response.active).toBe(testGate.active);
    });

    test('should update a gate', async () => {
      const updatedActive = false;
      const response = await updateGate({
        id: createdGateId,
        active: updatedActive,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdGateId);
      expect(response.active).toBe(updatedActive);
      expect(response.terminalId).toBe(testGate.terminalId);
    });

    test('should delete a gate', async () => {
      const gateToDelete = await createGate({ terminalId, active: true });
      additionalGateIds.push(gateToDelete.id);

      const response = await deleteGate({ id: gateToDelete.id });

      expect(response).toBeDefined();
      expect(response.id).toBe(gateToDelete.id);
      expect(response.terminalId).toBe(terminalId);

      // Remove from cleanup
      additionalGateIds = additionalGateIds.filter(
        (id) => id !== gateToDelete.id,
      );

      // Should not be found after deletion
      await expect(getGate({ id: gateToDelete.id })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should fail to create gate with invalid terminal ID', async () => {
      await expect(
        createGate({ terminalId: 999999, active: true }),
      ).rejects.toThrow();
    });

    test('should fail to retrieve non-existent gate', async () => {
      await expect(getGate({ id: 9999999 })).rejects.toThrow();
    });

    test('should fail to update non-existent gate', async () => {
      await expect(
        updateGate({ id: 9999999, active: false }),
      ).rejects.toThrow();
    });

    test('should fail to update gate with invalid terminal ID', async () => {
      await expect(
        updateGate({ id: createdGateId, terminalId: 999999 }),
      ).rejects.toThrow();
    });

    test('should fail to delete non-existent gate', async () => {
      await expect(deleteGate({ id: 9999999 })).rejects.toThrow();
    });
  });

  describe('pagination', () => {
    test('should return paginated gates with default parameters', async () => {
      const response = await listGatesPaginated({});

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
      const response = await listGatesPaginated({ page: 1, pageSize: 5 });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listGates({});

      expect(response.gates).toBeDefined();
      expect(Array.isArray(response.gates)).toBe(true);
      expect(response.gates.length).toBeGreaterThan(0);
      expect(response).not.toHaveProperty('pagination');
    });
  });

  describe('ordering and filtering', () => {
    const testGates: Gate[] = [];

    beforeAll(async () => {
      const gatesToCreate = [
        { terminalId, active: true },
        { terminalId, active: false },
      ];

      for (const gate of gatesToCreate) {
        const created = await createGate(gate);
        testGates.push(created);
        additionalGateIds.push(created.id);
      }
    });

    afterAll(async () => {
      for (const gate of testGates) {
        try {
          await deleteGate({ id: gate.id });
        } catch {
          // Silent error handling for cleanup
        }
      }
    });

    test('should order gates by id descending', async () => {
      const response = await listGates({
        orderBy: [{ field: 'id', direction: 'desc' }],
      });

      const ids = response.gates.map((g) => g.id);
      for (let i = 0; i < ids.length - 1; i++) {
        expect(ids[i]).toBeGreaterThanOrEqual(ids[i + 1]);
      }
    });

    test('should filter gates by active status', async () => {
      const response = await listGates({ filters: { active: true } });

      expect(response.gates.every((g) => g.active === true)).toBe(true);
    });

    test('should filter gates by terminalId', async () => {
      const response = await listGates({ filters: { terminalId } });

      expect(response.gates.every((g) => g.terminalId === terminalId)).toBe(
        true,
      );
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const response = await listGatesPaginated({
        filters: { active: true },
        orderBy: [{ field: 'id', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      expect(response.data.every((g) => g.active === true)).toBe(true);

      const ids = response.data.map((g) => g.id);
      for (let i = 0; i < ids.length - 1; i++) {
        expect(ids[i]).toBeLessThanOrEqual(ids[i + 1]);
      }

      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });
  });
});
