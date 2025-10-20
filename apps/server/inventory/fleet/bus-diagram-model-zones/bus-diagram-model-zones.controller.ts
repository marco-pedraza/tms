import { api } from 'encore.dev/api';
import { NotFoundError } from '@/shared/errors';
import {
  BusDiagramModelZone,
  BusDiagramModelZoneQueryOptions,
  BusDiagramModelZones,
  CreateBusDiagramModelZonePayload,
  PaginatedBusDiagramModelZones,
  PaginationParamsBusDiagramModelZones,
  UpdateBusDiagramModelZonePayload,
} from './bus-diagram-model-zones.types';
import { busDiagramModelZoneRepository } from './bus-diagram-model-zones.repository';

// Internal type for repository create method
type CreateZoneWithModelId = CreateBusDiagramModelZonePayload & {
  busDiagramModelId: number;
};

/**
 * Creates a new bus diagram model zone.
 * @param params - The zone data to create
 * @returns {Promise<BusDiagramModelZone>} The created zone
 * @throws {APIError} If creation fails
 */
export const createBusDiagramModelZone = api(
  {
    expose: true,
    method: 'POST',
    path: '/bus-diagram-models/:busDiagramModelId/zones',
    auth: true,
  },
  async (
    params: CreateBusDiagramModelZonePayload & { busDiagramModelId: number },
  ): Promise<BusDiagramModelZone> => {
    // Extract busDiagramModelId from the URL path
    const { busDiagramModelId, ...zoneData } = params;

    // Create the zone with the busDiagramModelId from the URL
    return await busDiagramModelZoneRepository.create({
      ...zoneData,
      busDiagramModelId,
    } as CreateZoneWithModelId);
  },
);

/**
 * Retrieves a bus diagram model zone by its ID.
 * @param params - Object containing the zone ID and model ID
 * @param params.id - The ID of the zone to retrieve
 * @param params.busDiagramModelId - The ID of the model the zone belongs to
 * @returns {Promise<BusDiagramModelZone>} The requested zone
 * @throws {APIError} If retrieval fails or zone doesn't exist
 */
export const getBusDiagramModelZone = api(
  {
    expose: true,
    method: 'GET',
    path: '/bus-diagram-models/:busDiagramModelId/zones/:id',
    auth: true,
  },
  async ({
    id,
    busDiagramModelId,
  }: {
    id: number;
    busDiagramModelId: number;
  }): Promise<BusDiagramModelZone> => {
    const zone = await busDiagramModelZoneRepository.findOneForDiagramModel(
      busDiagramModelId,
      id,
    );
    if (!zone) {
      throw new NotFoundError(
        `Zone with ID ${id} not found in diagram model ${busDiagramModelId}`,
      );
    }
    return zone;
  },
);

/**
 * Retrieves all zones for a specific bus diagram model without pagination.
 * @param params - Object containing the bus diagram model ID
 * @param params.busDiagramModelId - The ID of the bus diagram model
 * @returns {Promise<BusDiagramModelZones>} List of zones for the bus diagram model
 * @throws {APIError} If retrieval fails
 */
export const listZonesByDiagramModel = api(
  {
    expose: true,
    method: 'POST',
    path: '/bus-diagram-models/:busDiagramModelId/get-zones',
    auth: true,
  },
  async (
    params: BusDiagramModelZoneQueryOptions & { busDiagramModelId: number },
  ): Promise<BusDiagramModelZones> => {
    const zones = await busDiagramModelZoneRepository.findAll({
      ...params,
      filters: {
        ...params.filters,
        busDiagramModelId: params.busDiagramModelId,
      },
    });

    return {
      busDiagramModelZones: zones,
    };
  },
);

/**
 * Retrieves zones for a specific bus diagram model with pagination.
 * @param params - Object containing the bus diagram model ID and pagination parameters
 * @param params.busDiagramModelId - The ID of the bus diagram model
 * @returns {Promise<PaginatedBusDiagramModelZones>} Paginated list of zones for the bus diagram model
 * @throws {APIError} If retrieval fails
 */
export const listZonesByDiagramModelPaginated = api(
  {
    expose: true,
    method: 'POST',
    path: '/bus-diagram-models/:busDiagramModelId/get-zones/paginated',
    auth: true,
  },
  async (
    params: PaginationParamsBusDiagramModelZones & {
      busDiagramModelId: number;
    },
  ): Promise<PaginatedBusDiagramModelZones> => {
    return await busDiagramModelZoneRepository.findAllPaginated({
      ...params,
      filters: {
        ...params.filters,
        busDiagramModelId: params.busDiagramModelId,
      },
    });
  },
);

/**
 * Updates an existing bus diagram model zone.
 * @param params - Object containing the zone ID, model ID and update data
 * @param params.id - The ID of the zone to update
 * @param params.busDiagramModelId - The ID of the model the zone belongs to
 * @returns {Promise<BusDiagramModelZone>} The updated zone
 * @throws {APIError} If update fails or zone doesn't exist
 */
export const updateBusDiagramModelZone = api(
  {
    expose: true,
    method: 'PATCH',
    path: '/bus-diagram-models/:busDiagramModelId/zones/:id',
    auth: true,
  },
  async ({
    id,
    busDiagramModelId,
    ...data
  }: UpdateBusDiagramModelZonePayload & {
    id: number;
    busDiagramModelId: number;
  }): Promise<BusDiagramModelZone> => {
    // Verify the zone belongs to the specified model before updating
    const zone = await busDiagramModelZoneRepository.findOneForDiagramModel(
      busDiagramModelId,
      id,
    );
    if (!zone) {
      throw new NotFoundError(
        `Zone with ID ${id} not found in diagram model ${busDiagramModelId}`,
      );
    }

    return await busDiagramModelZoneRepository.update(id, data);
  },
);

/**
 * Deletes a bus diagram model zone by its ID.
 * @param params - Object containing the zone ID and model ID
 * @param params.id - The ID of the zone to delete
 * @param params.busDiagramModelId - The ID of the model the zone belongs to
 * @returns {Promise<BusDiagramModelZone>} The deleted zone
 * @throws {APIError} If deletion fails or zone doesn't exist
 */
export const deleteBusDiagramModelZone = api(
  {
    expose: true,
    method: 'DELETE',
    path: '/bus-diagram-models/:busDiagramModelId/zones/:id',
    auth: true,
  },
  async ({
    id,
    busDiagramModelId,
  }: {
    id: number;
    busDiagramModelId: number;
  }): Promise<BusDiagramModelZone> => {
    // Verify the zone belongs to the specified model before deleting
    const zone = await busDiagramModelZoneRepository.findOneForDiagramModel(
      busDiagramModelId,
      id,
    );
    if (!zone) {
      throw new NotFoundError(
        `Zone with ID ${id} not found in diagram model ${busDiagramModelId}`,
      );
    }

    return await busDiagramModelZoneRepository.delete(id);
  },
);
