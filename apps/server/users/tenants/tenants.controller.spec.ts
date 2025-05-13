import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type {
  CreateTenantPayload,
  Tenant,
  UpdateTenantPayload,
} from './tenants.types';
import {
  createTenant,
  deleteTenant,
  getTenant,
  listTenants,
  listTenantsWithPagination,
  searchTenants,
  searchTenantsPaginated,
  updateTenant,
} from './tenants.controller';

describe('Tenants Controller', () => {
  // Test data and IDs array for cleanup
  const testIds: number[] = [];

  let tenantId = 0;
  const testTenant: CreateTenantPayload = {
    name: 'Test Tenant',
    code: 'TEST-TENANT',
    description: 'A test tenant for automated testing',
  };

  // Clean up after all tests
  afterAll(async () => {
    // Delete all test tenants
    for (const id of testIds) {
      try {
        await deleteTenant({ id });
      } catch {
        // Ignore errors from already deleted tenants
      }
    }
  });

  describe('createTenant', () => {
    it('should create a new tenant', async () => {
      const result = await createTenant(testTenant);

      // Save ID for other tests and cleanup
      tenantId = result.id;
      testIds.push(tenantId);

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
    it('should list tenants without query options', async () => {
      const result = await listTenants({});

      expect(Array.isArray(result.tenants)).toBe(true);
      expect(result.tenants.length).toBeGreaterThan(0);

      const foundTenant = result.tenants.find((t) => t.id === tenantId);
      expect(foundTenant).toBeDefined();
      expect(foundTenant?.name).toBe(testTenant.name);
      expect(foundTenant?.code).toBe(testTenant.code);
    });

    it('should list tenants with orderBy option', async () => {
      // Create additional test tenants
      const tenantB: Tenant = await createTenant({
        name: 'B Test Tenant',
        code: 'B-TEST-TENANT',
        description: 'B test description',
      });
      testIds.push(tenantB.id);

      const tenantC: Tenant = await createTenant({
        name: 'C Test Tenant',
        code: 'C-TEST-TENANT',
        description: 'C test description',
      });
      testIds.push(tenantC.id);

      // Test ordering by name descending
      const resultDesc = await listTenants({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      // Verify order is descending by name - filter to test tenants for consistent results
      const testTenantIds = [tenantId, tenantB.id, tenantC.id];
      const namesDesc = resultDesc.tenants
        .filter((t) => testTenantIds.includes(t.id))
        .map((t) => t.name);

      // Verify we have all our test tenants in the results
      expect(namesDesc.length).toBe(testTenantIds.length);

      // Verify correct descending order
      expect(namesDesc).toEqual(
        [...namesDesc].sort((a, b) => a.localeCompare(b)).reverse(),
      );

      // Test ordering by name ascending
      const resultAsc = await listTenants({
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      // Verify order is ascending by name - filter to test tenants for consistent results
      const namesAsc = resultAsc.tenants
        .filter((t) => testTenantIds.includes(t.id))
        .map((t) => t.name);

      // Verify we have all our test tenants in the results
      expect(namesAsc.length).toBe(testTenantIds.length);

      // Verify correct ascending order
      expect(namesAsc).toEqual(
        [...namesAsc].sort((a, b) => a.localeCompare(b)),
      );
    });

    it('should list tenants with filters option', async () => {
      // Test filtering by name
      const result = await listTenants({
        filters: { name: 'B Test Tenant' },
      });

      expect(result.tenants.length).toBeGreaterThan(0);
      expect(result.tenants.every((t) => t.name === 'B Test Tenant')).toBe(
        true,
      );
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
      // Create a tenant specifically for deletion test
      const deleteTestTenant = await createTenant({
        name: 'Delete Test',
        code: 'DELETE-TEST',
        description: 'Tenant to be deleted',
      });

      const deleteId = deleteTestTenant.id;

      const result = await deleteTenant({ id: deleteId });

      expect(result.id).toBe(deleteId);
      expect(result.name).toBe('Delete Test');
      expect(result.code).toBe('DELETE-TEST');

      // Remove from testIds as it's already deleted
      const index = testIds.indexOf(deleteId);
      if (index > -1) {
        testIds.splice(index, 1);
      }
    });
  });

  describe('pagination and ordering', () => {
    let tenantA: Tenant;
    let tenantZ: Tenant;

    beforeAll(async () => {
      // Create test tenants with different names for verification of sorting
      tenantA = await createTenant({
        name: 'AAA Test Tenant',
        code: 'AAA-TEST-PAGINATION',
        description: 'AAA description',
      });
      testIds.push(tenantA.id);

      tenantZ = await createTenant({
        name: 'ZZZ Test Tenant',
        code: 'ZZZ-TEST-PAGINATION',
        description: 'ZZZ description',
      });
      testIds.push(tenantZ.id);
    });

    it('should return paginated tenants with default parameters', async () => {
      const response = await listTenantsWithPagination({});

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

    it('should honor page and pageSize parameters', async () => {
      const response = await listTenantsWithPagination({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    it('should sort by specified field and direction', async () => {
      // Test ascending sort with increased page size to ensure all fixtures are included
      const responseAsc = await listTenantsWithPagination({
        pageSize: 100, // Increased from 50 to ensure all fixtures are included
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      // Find indices of test tenants
      const indexAAsc = responseAsc.data.findIndex((t) => t.id === tenantA.id);
      const indexZAsc = responseAsc.data.findIndex((t) => t.id === tenantZ.id);

      // Assert both test tenants are found before checking order
      expect(indexAAsc).not.toBe(-1);
      expect(indexZAsc).not.toBe(-1);
      expect(indexAAsc).toBeLessThan(indexZAsc);

      // Test descending sort with increased page size
      const responseDesc = await listTenantsWithPagination({
        pageSize: 100, // Increased from 50 to ensure all fixtures are included
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      // Find indices of test tenants
      const indexADesc = responseDesc.data.findIndex(
        (t) => t.id === tenantA.id,
      );
      const indexZDesc = responseDesc.data.findIndex(
        (t) => t.id === tenantZ.id,
      );

      // Assert both test tenants are found before checking order
      expect(indexADesc).not.toBe(-1);
      expect(indexZDesc).not.toBe(-1);
      expect(indexZDesc).toBeLessThan(indexADesc);
    });

    it('should filter by specified criteria', async () => {
      // Test filtering by name
      const responseFilter = await listTenantsWithPagination({
        filters: { name: 'AAA Test Tenant' },
      });

      expect(responseFilter.data.length).toBeGreaterThan(0);
      expect(
        responseFilter.data.every((t) => t.name === 'AAA Test Tenant'),
      ).toBe(true);
    });
  });

  describe('search functionality', () => {
    beforeAll(async () => {
      // Helper function to check if a tenant with a specific code exists
      const tenantWithCodeExists = async (code: string): Promise<boolean> => {
        try {
          const result = await listTenants({
            filters: { code },
          });
          return result.tenants.length > 0;
        } catch {
          return false;
        }
      };

      // Ensure the Corporate HQ tenant exists
      if (!(await tenantWithCodeExists('CORP-HQ'))) {
        const searchTestTenant1 = await createTenant({
          name: 'Corporate HQ',
          code: 'CORP-HQ',
          description: 'Main headquarters for corporate operations',
        });
        testIds.push(searchTestTenant1.id);
      }

      // Ensure the Regional Office tenant exists
      if (!(await tenantWithCodeExists('REG-OFFICE'))) {
        const searchTestTenant2 = await createTenant({
          name: 'Regional Office',
          code: 'REG-OFFICE',
          description: 'Regional office for business operations',
        });
        testIds.push(searchTestTenant2.id);
      }

      // Ensure the Test Search tenant exists
      if (!(await tenantWithCodeExists('TEST-SEARCH'))) {
        const searchTestTenant3 = await createTenant({
          name: 'Test Search Tenant',
          code: 'TEST-SEARCH',
          description: 'A tenant created specifically for search testing',
        });
        testIds.push(searchTestTenant3.id);
      }
    });

    it('should search tenants by term', async () => {
      const result = await searchTenants({ term: 'Test' });

      expect(Array.isArray(result.tenants)).toBe(true);
      expect(result.tenants.length).toBeGreaterThan(0);

      // Verify that at least one of our specific search test tenants is found
      const hasTestSearchTenant = result.tenants.some(
        (t) => t.code === 'TEST-SEARCH',
      );
      expect(hasTestSearchTenant).toBe(true);
    });

    it('should search tenants with pagination', async () => {
      const result = await searchTenantsPaginated({
        term: 'corp',
        page: 1,
        pageSize: 10,
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);

      // Verify that our specific Corporate HQ tenant is found
      const hasCorpTenant = result.data.some((t) => t.code === 'CORP-HQ');
      expect(hasCorpTenant).toBe(true);
    });

    it('should search with pagination and ordering', async () => {
      let result = await searchTenantsPaginated({
        term: 'test',
        orderBy: [{ field: 'name', direction: 'desc' }],
        page: 1,
        pageSize: 20,
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Verify our specific Test Search tenant is found
      const hasTestSearchTenant = result.data.some(
        (t) => t.code === 'TEST-SEARCH',
      );
      expect(hasTestSearchTenant).toBe(true);

      // Create an additional test tenant if needed to ensure we have multiple results
      let additionalTenantCreated = false;
      if (result.data.length === 1) {
        await createTenant({
          name: 'Additional Test Tenant',
          code: 'ADDITIONAL-TEST',
          description: 'Additional tenant to test ordering',
        });
        additionalTenantCreated = true;

        // Re-run the search to get both tenants
        result = await searchTenantsPaginated({
          term: 'test',
          orderBy: [{ field: 'name', direction: 'desc' }],
          page: 1,
          pageSize: 20,
        });

        // Clean up after the test
        if (additionalTenantCreated) {
          const additionalTenant = result.data.find(
            (t) => t.code === 'ADDITIONAL-TEST',
          );
          if (additionalTenant) {
            testIds.push(additionalTenant.id);
          }
        }
      }

      // Now we can be sure we have at least 2 results
      expect(result.data.length).toBeGreaterThanOrEqual(2);

      // Verify search results are ordered correctly
      const names = result.data.map((t) => t.name);
      expect(names).toEqual(
        [...names].sort((a, b) => a.localeCompare(b)).reverse(),
      );
    });
  });
});
