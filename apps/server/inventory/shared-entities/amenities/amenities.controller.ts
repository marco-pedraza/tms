import { api } from 'encore.dev/api';
import type {
  Amenity,
  CreateAmenityPayload,
  ListAmenitiesQueryParams,
  ListAmenitiesResult,
  PaginatedListAmenitiesQueryParams,
  PaginatedListAmenitiesResult,
  UpdateAmenityPayload,
} from './amenities.types';
import { amenitiesRepository } from './amenities.repository';
import { amenityDomain } from './amenities.domain';

/**
 * Creates a new amenity.
 * @param params - The amenity data to create
 * @returns {Promise<Amenity>} The created amenity
 * @throws {APIError} If the amenity creation fails
 */
export const createAmenity = api(
  {
    expose: true,
    method: 'POST',
    path: '/amenities/create',
    auth: true,
  },
  async (params: CreateAmenityPayload): Promise<Amenity> => {
    await amenityDomain.validateAmenity(params);
    return await amenitiesRepository.create(params);
  },
);

/**
 * Retrieves an amenity by its ID.
 * @param params - Object containing the amenity ID
 * @param params.id - The ID of the amenity to retrieve
 * @returns {Promise<Amenity>} The found amenity
 * @throws {APIError} If the amenity is not found or retrieval fails
 */
export const getAmenity = api(
  {
    expose: true,
    method: 'GET',
    path: '/amenities/:id',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<Amenity> => {
    return await amenitiesRepository.findOne(id);
  },
);

/**
 * Retrieves all amenities without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListAmenitiesResult>} Unified response with data property containing array of amenities
 * @throws {APIError} If retrieval fails
 */
export const listAmenities = api(
  {
    expose: true,
    method: 'POST',
    path: '/amenities/list/all',
    auth: true,
  },
  async (params: ListAmenitiesQueryParams): Promise<ListAmenitiesResult> => {
    const amenities = await amenitiesRepository.findAll(params);
    return {
      data: amenities,
    };
  },
);

/**
 * Retrieves amenities with pagination (useful for tables).
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListAmenitiesResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listAmenitiesPaginated = api(
  {
    expose: true,
    method: 'POST',
    path: '/amenities/list',
    auth: true,
  },
  async (
    params: PaginatedListAmenitiesQueryParams,
  ): Promise<PaginatedListAmenitiesResult> => {
    return await amenitiesRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing amenity.
 * @param params - Object containing the amenity ID and update data
 * @param params.id - The ID of the amenity to update
 * @returns {Promise<Amenity>} The updated amenity
 * @throws {APIError} If the amenity is not found or update fails
 */
export const updateAmenity = api(
  {
    expose: true,
    method: 'PUT',
    path: '/amenities/:id/update',
    auth: true,
  },
  async ({
    id,
    ...data
  }: UpdateAmenityPayload & { id: number }): Promise<Amenity> => {
    await amenityDomain.validateAmenity(data, id);
    return await amenitiesRepository.update(id, data);
  },
);

/**
 * Deletes an amenity by its ID.
 * @param params - Object containing the amenity ID
 * @param params.id - The ID of the amenity to delete
 * @returns {Promise<Amenity>} The deleted amenity
 * @throws {APIError} If the amenity is not found or deletion fails
 */
export const deleteAmenity = api(
  {
    expose: true,
    method: 'DELETE',
    path: '/amenities/:id/delete',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<Amenity> => {
    return await amenitiesRepository.delete(id);
  },
);
