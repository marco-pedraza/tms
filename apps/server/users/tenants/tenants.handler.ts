import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { tenants } from './tenants.schema';
import type { 
  Tenant, 
  CreateTenantPayload, 
  UpdateTenantPayload, 
  Tenants 
} from './tenants.types';
import { NotFoundError, DuplicateError } from '../../shared/errors';

/**
 * Handler for tenant operations
 */
class TenantHandler {
  /**
   * Find a tenant by ID
   * @param id - The ID of the tenant to find
   * @returns The found tenant
   * @throws {NotFoundError} If the tenant is not found
   */
  async findOne(id: number): Promise<Tenant> {
    const result = await db.select().from(tenants).where(eq(tenants.id, id));
    
    if (result.length === 0) {
      throw new NotFoundError(`Tenant with ID ${id} not found`);
    }
    
    return result[0];
  }

  /**
   * Find all tenants
   * @returns All tenants
   */
  async findAll(): Promise<Tenants> {
    const result = await db.select().from(tenants);
    return { tenants: result };
  }

  /**
   * Find a tenant by code
   * @param code - The code of the tenant to find
   * @returns The found tenant or null if not found
   */
  async findByCode(code: string): Promise<Tenant | null> {
    const result = await db.select().from(tenants).where(eq(tenants.code, code));
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  }

  /**
   * Create a new tenant
   * @param data - The tenant data
   * @returns The created tenant
   * @throws {DuplicateError} If a tenant with the same code already exists
   */
  async create(data: CreateTenantPayload): Promise<Tenant> {
    // Check if tenant with the same code already exists
    await this.validateUniqueCode(data.code);
    
    const now = new Date();
    
    const newTenant = {
      ...data,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    
    const [tenant] = await db
      .insert(tenants)
      .values(newTenant)
      .returning();
    
    return tenant;
  }

  /**
   * Update a tenant
   * @param id - The ID of the tenant to update
   * @param data - The updated tenant data
   * @returns The updated tenant
   * @throws {NotFoundError} If the tenant is not found
   * @throws {DuplicateError} If updating the code to one that already exists
   */
  async update(id: number, data: UpdateTenantPayload): Promise<Tenant> {
    // Check if tenant exists
    const existingTenant = await this.findOne(id);
    
    // Check if updating code and if it's already in use
    if (data.code && data.code !== existingTenant.code) {
      await this.validateUniqueCode(data.code);
    }
    
    const updatedData = {
      ...data,
      updatedAt: new Date(),
    };
    
    const [updatedTenant] = await db
      .update(tenants)
      .set(updatedData)
      .where(eq(tenants.id, id))
      .returning();
    
    return updatedTenant;
  }

  /**
   * Delete a tenant
   * @param id - The ID of the tenant to delete
   * @returns The deleted tenant
   * @throws {NotFoundError} If the tenant is not found
   */
  async delete(id: number): Promise<Tenant> {
    // Check if tenant exists
    const existingTenant = await this.findOne(id);
    
    await db.delete(tenants).where(eq(tenants.id, id));
    
    return existingTenant;
  }

  /**
   * Validate that the tenant code is unique
   * @param code - The code to validate
   * @throws {DuplicateError} If a tenant with the same code already exists
   */
  private async validateUniqueCode(code: string): Promise<void> {
    const existingTenant = await this.findByCode(code);
    
    if (existingTenant) {
      throw new DuplicateError(`Tenant with code ${code} already exists`);
    }
  }
}

export const tenantHandler = new TenantHandler(); 