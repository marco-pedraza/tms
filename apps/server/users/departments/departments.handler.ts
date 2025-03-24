import { db } from '../../db';
import { departments } from './departments.schema';
import { tenants } from '../tenants/tenants.schema';
import { eq, and, not, asc, count } from 'drizzle-orm';
import type {
  Department,
  Departments,
  TenantDepartments,
  PaginatedDepartments,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from './departments.types';
import {
  NotFoundError,
  ValidationError,
  DuplicateError,
} from '../../shared/errors';
import { PaginationParams } from '../../shared/types';
import { withPagination } from '../../shared/bd-utils';

export class DepartmentHandler {
  /**
   * Finds a department by ID
   * @param id - The department ID to find
   * @returns The found department
   * @throws {NotFoundError} If department is not found
   */
  async findOne(id: number): Promise<Department> {
    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    return department;
  }

  /**
   * Finds all departments
   * @deprecated Use findAllPaginated instead
   * @returns An object containing an array of all departments
   */
  async findAll(): Promise<Departments> {
    const departmentsList = await db
      .select()
      .from(departments)
      .orderBy(departments.name);

    return {
      departments: departmentsList,
    };
  }

  /**
   * Finds all departments with pagination
   * @param params Pagination parameters
   * @returns Paginated departments with metadata
   */
  async findAllPaginated(params: PaginationParams = {}): Promise<PaginatedDepartments> {
    // Create base query with sorting
    const query = db
      .select()
      .from(departments)
      .orderBy(asc(departments.name))
      .$dynamic();

    // Pagination needs a count query
    const countQuery = db.select({ count: count() }).from(departments);

    // Apply pagination and get results with metadata
    return withPagination<typeof query, Department>(query, countQuery, params);
  }

  /**
   * Finds all departments for a specific tenant
   * @deprecated Use findByTenantPaginated instead
   * @param tenantId - The tenant ID to filter departments by
   * @returns An object containing an array of tenant departments
   */
  async findByTenant(tenantId: number): Promise<TenantDepartments> {
    const departmentsList = await db
      .select()
      .from(departments)
      .where(eq(departments.tenantId, tenantId))
      .orderBy(departments.name);

    return {
      departments: departmentsList,
    };
  }

  /**
   * Finds all departments for a specific tenant with pagination
   * @param tenantId - The tenant ID to filter departments by
   * @param params - Pagination parameters
   * @returns Paginated departments with metadata
   */
  async findByTenantPaginated(
    tenantId: number,
    params: PaginationParams = {},
  ): Promise<PaginatedDepartments> {
    // Create base query with sorting and tenant filter
    const query = db
      .select()
      .from(departments)
      .where(eq(departments.tenantId, tenantId))
      .orderBy(asc(departments.name))
      .$dynamic();

    // Pagination needs a count query
    const countQuery = db
      .select({ count: count() })
      .from(departments)
      .where(eq(departments.tenantId, tenantId));

    // Apply pagination and get results with metadata
    return withPagination<typeof query, Department>(query, countQuery, params);
  }

  /**
   * Creates a new department
   * @param data - The department data to create
   * @returns The created department
   * @throws {ValidationError} If the department data is invalid
   * @throws {DuplicateError} If a department with the same code already exists for the tenant
   * @throws {NotFoundError} If the tenant does not exist
   */
  async create(data: CreateDepartmentPayload): Promise<Department> {
    try {
      // Validate tenant exists
      await this.validateTenantExists(data.tenantId);

      // Check if department code already exists for this tenant
      await this.validateUniqueDepartmentCode(data.tenantId, data.code);

      const departmentData = {
        tenantId: data.tenantId,
        name: data.name,
        code: data.code,
        description: data.description || null,
        isActive: data.isActive ?? true,
      };

      const [department] = await db
        .insert(departments)
        .values(departmentData)
        .returning();

      return department;
    } catch (error) {
      if (error instanceof DuplicateError || error instanceof NotFoundError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  /**
   * Updates a department
   * @param id - The department ID to update
   * @param data - The department data to update
   * @returns The updated department
   * @throws {NotFoundError} If the department is not found
   * @throws {ValidationError} If the department data is invalid
   * @throws {DuplicateError} If updating would create a duplicate code within the tenant
   */
  async update(id: number, data: UpdateDepartmentPayload): Promise<Department> {
    try {
      // Verify department exists and get its tenant
      const existingDepartment = await this.findOne(id);

      // If updating code, check for duplicates within the same tenant
      if (data.code) {
        await this.validateUniqueDepartmentCode(
          existingDepartment.tenantId,
          data.code,
          id,
        );
      }

      // If updating tenant, validate it exists
      if (data.tenantId) {
        await this.validateTenantExists(data.tenantId);

        // If changing tenant AND keeping same code, make sure it doesn't conflict in new tenant
        if (data.tenantId !== existingDepartment.tenantId && !data.code) {
          await this.validateUniqueDepartmentCode(
            data.tenantId,
            existingDepartment.code,
            id,
          );
        }
      }

      const [updated] = await db
        .update(departments)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(departments.id, id))
        .returning();

      return updated;
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
   * Deletes a department
   * @param id - The department ID to delete
   * @returns The deleted department
   * @throws {NotFoundError} If the department is not found
   */
  async delete(id: number): Promise<Department> {
    // Verify department exists
    await this.findOne(id);

    // Note: This might fail if there are users assigned to this department
    // depending on your foreign key constraints
    const [deletedDepartment] = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning();

    return deletedDepartment;
  }

  /**
   * Validates that the department code is unique within the tenant
   * @param tenantId - The tenant ID
   * @param code - The department code to check
   * @param excludeId - Optional ID to exclude from the check (for updates)
   * @throws {DuplicateError} If a department with the same code already exists for the tenant
   * @private
   */
  private async validateUniqueDepartmentCode(
    tenantId: number,
    code: string,
    excludeId?: number,
  ): Promise<void> {
    const whereCondition = excludeId
      ? and(
          eq(departments.tenantId, tenantId),
          eq(departments.code, code),
          not(eq(departments.id, excludeId)),
        )
      : and(eq(departments.tenantId, tenantId), eq(departments.code, code));

    const [existing] = await db
      .select()
      .from(departments)
      .where(whereCondition)
      .limit(1);

    if (existing) {
      throw new DuplicateError(
        'A department with this code already exists for this tenant',
      );
    }
  }

  /**
   * Validates that a tenant exists
   * @private
   * @param tenantId - The tenant ID to validate
   * @throws {NotFoundError} If the tenant does not exist
   */
  private async validateTenantExists(tenantId: number): Promise<void> {
    const result = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundError('Tenant not found');
    }
  }
}

export const departmentHandler = new DepartmentHandler();
