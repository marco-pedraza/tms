import { describe, it, expect, afterAll } from 'vitest';
import {
  createTenant,
  getTenant,
  listTenants,
  updateTenant,
  deleteTenant,
} from './tenants.controller';
import type {
  CreateTenantPayload,
  UpdateTenantPayload,
  Tenant,
} from './tenants.types';

describe('Tenants Controller', () => {
  // Test data
  let tenantId = 0;
  const testTenant: CreateTenantPayload = {
    name: 'Test Tenant',
    code: 'TEST-TENANT',
    description: 'A test tenant for automated testing',
  };

  // Clean up after all tests
  afterAll(async () => {
    if (tenantId > 0) {
      try {
        await deleteTenant({ id: tenantId });
      } catch (error) {
        console.log('Error cleaning up test tenant:', error);
      }
    }
  });

  describe('createTenant', () => {
    it('should create a new tenant', async () => {
      const result = await createTenant(testTenant);

      // Save ID for other tests
      tenantId = result.id;

      // Verify response
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('number');
      expect(result.name).toBe(testTenant.name);
      expect(result.code).toBe(testTenant.code);
      expect(result.description).toBe(testTenant.description);
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should fail to create tenant with duplicate code', async () => {
      await expect(createTenant(testTenant)).rejects.toThrow();
    });
  });

  describe('getTenant', () => {
    it('should get an existing tenant', async () => {
      const result = await getTenant({ id: tenantId });

      expect(result.id).toBe(tenantId);
      expect(result.name).toBe(testTenant.name);
      expect(result.code).toBe(testTenant.code);
      expect(result.description).toBe(testTenant.description);
    });

    it('should fail to get non-existent tenant', async () => {
      await expect(getTenant({ id: 999999 })).rejects.toThrow();
    });
  });

  describe('listTenants', () => {
    it('should list tenants with default pagination', async () => {
      const result = await listTenants({});

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBeDefined();
      expect(result.pagination.totalCount).toBeDefined();
      expect(result.pagination.totalPages).toBeDefined();

      const foundTenant = result.data.find((t: Tenant) => t.id === tenantId);
      expect(foundTenant).toBeDefined();
      expect(foundTenant?.name).toBe(testTenant.name);
      expect(foundTenant?.code).toBe(testTenant.code);
    });

    it('should honor page and pageSize parameters', async () => {
      const response = await listTenants({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('updateTenant', () => {
    const updateData: UpdateTenantPayload = {
      name: 'Updated Tenant',
      description: 'Updated description for testing',
    };

    it('should update an existing tenant', async () => {
      const result = await updateTenant({ id: tenantId, ...updateData });

      expect(result.id).toBe(tenantId);
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      expect(result.code).toBe(testTenant.code);
      expect(result.updatedAt).toBeDefined();
    });

    it('should fail to update non-existent tenant', async () => {
      await expect(
        updateTenant({ id: 999999, ...updateData }),
      ).rejects.toThrow();
    });
  });

  describe('deleteTenant', () => {
    it('should fail to delete non-existent tenant', async () => {
      await expect(deleteTenant({ id: 999999 })).rejects.toThrow();
    });

    it('should delete an existing tenant', async () => {
      const result = await deleteTenant({ id: tenantId });

      expect(result.id).toBe(tenantId);
      expect(result.name).toBe('Updated Tenant');
      expect(result.code).toBe(testTenant.code);

      // Mark as deleted so afterAll doesn't try to delete again
      tenantId = 0;
    });
  });

  describe('sorting', () => {
    it('should return tenants sorted by name in ascending order', async () => {
      // Create test tenants with different names for verification of default sorting
      const tenantA = await createTenant({
        ...testTenant,
        name: 'AAA Test Tenant',
        code: 'AAA-TEST',
      });
      const tenantZ = await createTenant({
        ...testTenant,
        name: 'ZZZ Test Tenant',
        code: 'ZZZ-TEST',
      });

      try {
        // Get tenants with large enough page size to include test tenants
        const response = await listTenants({
          pageSize: 50,
        });

        // Find the indices of our test tenants
        const indexA = response.data.findIndex(
          (t: Tenant) => t.id === tenantA.id,
        );
        const indexZ = response.data.findIndex(
          (t: Tenant) => t.id === tenantZ.id,
        );

        // Verify that tenantA (AAA) comes before tenantZ (ZZZ) in the results
        if (indexA !== -1 && indexZ !== -1) {
          expect(indexA).toBeLessThan(indexZ);
        }
      } finally {
        // Clean up test tenants
        await deleteTenant({ id: tenantA.id });
        await deleteTenant({ id: tenantZ.id });
      }
    });
  });
});
