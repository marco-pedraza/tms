import { asc, count } from 'drizzle-orm';
import { db } from '../../db';
import { tenants } from './tenants.schema';
import type {
  Tenant,
  CreateTenantPayload,
  UpdateTenantPayload,
  Tenants,
  PaginatedTenants,
} from './tenants.types';
import {
  NotFoundError,
  DuplicateError,
  ValidationError,
} from '../../shared/errors';
import { PaginationParams } from '../../shared/types';
import { withPagination } from '../../shared/db-utils';
import { BaseHandler } from '../../shared/base-handler';

/**
 * Handler for tenant operations
 */
class TenantHandler extends BaseHandler<Tenant, CreateTenantPayload, UpdateTenantPayload> {
  constructor() {
    super(tenants, 'Tenant');
  }

  /**
   * Find all tenants
   * @returns All tenants
   */
  async findAll(): Promise<Tenants> {
    const result = await super.findAll();
    return { tenants: result };
  }

  /**
   * Find all tenants with pagination
   * @param params Pagination parameters
   * @returns Paginated tenants with metadata
   */
  async findAllPaginated(
    params: PaginationParams = {},
  ): Promise<PaginatedTenants> {
    return this.getPaginatedTenants(params);
  }

  /**
   * Find a tenant by code
   * @param code - The code of the tenant to find
   * @returns The found tenant or null if not found
   */
  async findByCode(code: string): Promise<Tenant | null> {
    return this.findByField(tenants.code, code);
  }

  /**
   * Create a new tenant
   * @param data - The tenant data
   * @returns The created tenant
   * @throws {DuplicateError} If a tenant with the same code already exists
   * @throws {ValidationError} If validation fails for any other reason
   */
  async create(data: CreateTenantPayload): Promise<Tenant> {
    try {
      // Check if tenant with the same code already exists
      await this.validateUniqueCode(data.code);

      const now = new Date();

      const newTenant = {
        ...data,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      return await super.create(newTenant);
    } catch (error) {
      if (error instanceof DuplicateError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  /**
   * Update a tenant
   * @param id - The ID of the tenant to update
   * @param data - The updated tenant data
   * @returns The updated tenant
   * @throws {NotFoundError} If the tenant is not found
   * @throws {DuplicateError} If updating the code to one that already exists
   * @throws {ValidationError} If validation fails for any other reason
   */
  async update(id: number, data: UpdateTenantPayload): Promise<Tenant> {
    try {
      // Check if tenant exists
      const existingTenant = await this.findOne(id);

      // Check if updating code and if it's already in use
      if (data.code && data.code !== existingTenant.code) {
        await this.validateUniqueCode(data.code);
      }

      return await super.update(id, data);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DuplicateError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  /**
   * Builds and executes paginated tenant queries
   * @param params - Pagination parameters
   * @returns Paginated tenants with metadata
   * @private
   */
  private async getPaginatedTenants(
    params: PaginationParams = {},
  ): Promise<PaginatedTenants> {
    // Create base query with sorting
    const query = db
      .select()
      .from(tenants)
      .orderBy(asc(tenants.name))
      .$dynamic();

    // Pagination needs a count query
    const countQuery = db.select({ count: count() }).from(tenants);

    // Apply pagination and get results with metadata
    return withPagination<typeof query, Tenant>(query, countQuery, params);
  }

  /**
   * Validate that the tenant code is unique
   * @param code - The code to validate
   * @throws {DuplicateError} If a tenant with the same code already exists
   * @private
   */
  private async validateUniqueCode(code: string): Promise<void> {
    const existingTenant = await this.findByCode(code);

    if (existingTenant) {
      throw new DuplicateError(`Tenant with code ${code} already exists`);
    }
  }
}

export const tenantHandler = new TenantHandler();
