import { api } from 'encore.dev/api';
import type {
  CreateInstallationSchemaPayload,
  InstallationSchema,
  InstallationSchemaWithRelations,
  ListInstallationSchemasQueryParams,
  ListInstallationSchemasResult,
  PaginatedListInstallationSchemasQueryParams,
  PaginatedListInstallationSchemasResult,
  UpdateInstallationSchemaPayload,
} from './installation-schemas.types';
import { installationSchemaRepository } from './installation-schemas.repository';
import { validateInstallationSchema } from './installation-schemas.domain';

/**
 * Creates a new installation schema.
 * @param params - The installation schema data to create
 * @returns {Promise<InstallationSchema>} The created installation schema
 * @throws {APIError} If the installation schema creation fails
 */
export const createInstallationSchema = api(
  { expose: true, method: 'POST', path: '/installation/schemas/create' },
  async (
    params: CreateInstallationSchemaPayload,
  ): Promise<InstallationSchema> => {
    await validateInstallationSchema(params);
    return await installationSchemaRepository.create(params);
  },
);

/**
 * Retrieves an installation schema with its related installation type by its ID.
 * @param params - Object containing the installation schema ID
 * @param params.id - The ID of the installation schema to retrieve
 * @returns {Promise<InstallationSchemaWithRelations>} The found installation schema with related data
 * @throws {APIError} If the installation schema is not found or retrieval fails
 */
export const getInstallationSchema = api(
  { expose: true, method: 'GET', path: '/installation/schemas/:id' },
  async ({ id }: { id: number }): Promise<InstallationSchemaWithRelations> => {
    return await installationSchemaRepository.findOneWithRelations(id);
  },
);

/**
 * Updates an existing installation schema.
 * @param params - Object containing the installation schema ID and update data
 * @param params.id - The ID of the installation schema to update
 * @returns {Promise<InstallationSchema>} The updated installation schema
 * @throws {APIError} If the installation schema is not found or update fails
 */
export const updateInstallationSchema = api(
  { expose: true, method: 'PUT', path: '/installation/schemas/:id/update' },
  async ({
    id,
    ...data
  }: UpdateInstallationSchemaPayload & {
    id: number;
  }): Promise<InstallationSchema> => {
    await validateInstallationSchema(data, id);
    return await installationSchemaRepository.update(id, data);
  },
);

/**
 * Retrieves all installation schemas without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListInstallationSchemasResult>} Unified response with data property containing array of installation schemas
 * @throws {APIError} If retrieval fails
 */
export const listInstallationSchemas = api(
  { expose: true, method: 'POST', path: '/installation/schemas/list/all' },
  async (
    params: ListInstallationSchemasQueryParams,
  ): Promise<ListInstallationSchemasResult> => {
    const installationSchemas =
      await installationSchemaRepository.findAll(params);
    return {
      data: installationSchemas,
    };
  },
);

/**
 * Retrieves installation schemas with pagination and includes related information.
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListInstallationSchemasResult>} Unified paginated response with data and pagination properties including related information
 * @throws {APIError} If retrieval fails
 */
export const listInstallationSchemasPaginated = api(
  { expose: true, method: 'POST', path: '/installation/schemas/list' },
  async (
    params: PaginatedListInstallationSchemasQueryParams,
  ): Promise<PaginatedListInstallationSchemasResult> => {
    const schemasResult =
      await installationSchemaRepository.findAllPaginated(params);

    return await installationSchemaRepository.appendRelations(
      schemasResult.data,
      schemasResult.pagination,
      params,
    );
  },
);

/**
 * Deletes an installation schema by its ID.
 * @param params - Object containing the installation schema ID
 * @param params.id - The ID of the installation schema to delete
 * @returns {Promise<InstallationSchema>} The deleted installation schema
 * @throws {APIError} If the installation schema is not found or deletion fails
 */
export const deleteInstallationSchema = api(
  { expose: true, method: 'DELETE', path: '/installation/schemas/:id/delete' },
  async ({ id }: { id: number }): Promise<InstallationSchema> => {
    return await installationSchemaRepository.delete(id);
  },
);
