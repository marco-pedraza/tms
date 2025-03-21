import { describe, it, expect, afterAll, vi } from 'vitest';
import { randomUUID } from 'crypto';
import {
  createTenant,
  getTenant,
  listTenants,
  updateTenant,
  deleteTenant,
} from './tenants.controller';
import type { CreateTenantPayload, UpdateTenantPayload } from './tenants.types';

describe('Tenants Controller', () => {
  // Test data
  const testTenant: CreateTenantPayload = {
    name: 'Test Tenant',
    code: 'TEST-TENANT',
    description: 'Test tenant for testing',
  };

  let tenantId = '';

  // Cleanup
  afterAll(async () => {
    // Clean up created tenant
    if (tenantId) {
      try {
        await deleteTenant({ id: tenantId });
      } catch (error) {
        console.error('Failed to clean up test tenant:', error);
      }
    }
  });

  describe('Success scenarios', () => {
    it('should create a new tenant', async () => {
      const response = await createTenant(testTenant);
      
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testTenant.name);
      expect(response.code).toBe(testTenant.code);
      expect(response.description).toBe(testTenant.description);
      
      // Save ID for later tests
      tenantId = response.id;
    });

    it('should get a tenant by ID', async () => {
      const response = await getTenant({ id: tenantId });
      
      expect(response).toBeDefined();
      expect(response.id).toBe(tenantId);
      expect(response.name).toBe(testTenant.name);
      expect(response.code).toBe(testTenant.code);
    });

    it('should list all tenants', async () => {
      const response = await listTenants();
      
      expect(response).toBeDefined();
      expect(response.tenants).toBeInstanceOf(Array);
      expect(response.tenants.length).toBeGreaterThan(0);
      
      const foundTenant = response.tenants.find(t => t.id === tenantId);
      expect(foundTenant).toBeDefined();
    });

    it('should update a tenant', async () => {
      const updateData: UpdateTenantPayload = {
        name: 'Updated Tenant Name',
        description: 'Updated tenant description',
      };
      
      const response = await updateTenant({ id: tenantId, ...updateData });
      
      expect(response).toBeDefined();
      expect(response.id).toBe(tenantId);
      expect(response.name).toBe(updateData.name);
      expect(response.description).toBe(updateData.description);
      expect(response.code).toBe(testTenant.code); // Code should remain unchanged
    });

    it('should delete a tenant', async () => {
      const response = await deleteTenant({ id: tenantId });
      
      expect(response).toBeDefined();
      expect(response.id).toBe(tenantId);
      
      // Reset ID since we've deleted the tenant
      tenantId = '';
    });
  });

  describe('Error scenarios', () => {
    it('should throw error when retrieving non-existent tenant', async () => {
      const nonExistentId = randomUUID();
      
      await expect(getTenant({ id: nonExistentId })).rejects.toThrow();
    });

    it('should throw error when creating tenant with duplicate code', async () => {
      // First create a tenant
      const response = await createTenant(testTenant);
      tenantId = response.id;
      
      // Try to create another tenant with the same code
      await expect(createTenant(testTenant)).rejects.toThrow();
    });

    it('should throw error when updating tenant to have a duplicate code', async () => {
      // Create another tenant with a different code
      const anotherTenant = await createTenant({
        name: 'Another Tenant',
        code: 'ANOTHER-TENANT',
        description: 'Another test tenant',
      });
      
      // Try to update second tenant to have the same code as the first
      await expect(
        updateTenant({
          id: anotherTenant.id,
          code: testTenant.code,
        })
      ).rejects.toThrow();
      
      // Clean up the second tenant
      await deleteTenant({ id: anotherTenant.id });
    });

    it('should throw error when deleting non-existent tenant', async () => {
      const nonExistentId = randomUUID();
      
      await expect(deleteTenant({ id: nonExistentId })).rejects.toThrow();
    });
  });
}); 