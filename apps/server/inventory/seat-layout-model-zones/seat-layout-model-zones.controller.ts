import { api } from 'encore.dev/api';
import { NotFoundError } from '../../shared/errors';
import {
  CreateSeatLayoutModelZonePayload,
  PaginatedSeatLayoutModelZones,
  PaginationParamsSeatLayoutModelZones,
  SeatLayoutModelZone,
  SeatLayoutModelZoneQueryOptions,
  SeatLayoutModelZones,
  UpdateSeatLayoutModelZonePayload,
} from './seat-layout-model-zones.types';
import { seatLayoutModelZoneRepository } from './seat-layout-model-zones.repository';

// Internal type for repository create method
type CreateZoneWithModelId = CreateSeatLayoutModelZonePayload & {
  seatLayoutModelId: number;
};

/**
 * Creates a new seat layout model zone.
 * @param params - The zone data to create
 * @returns {Promise<SeatLayoutModelZone>} The created zone
 * @throws {APIError} If creation fails
 */
export const createSeatLayoutModelZone = api(
  {
    expose: true,
    method: 'POST',
    path: '/seat-layout-models/:seatLayoutModelId/zones',
  },
  async (
    params: CreateSeatLayoutModelZonePayload & { seatLayoutModelId: number },
  ): Promise<SeatLayoutModelZone> => {
    // Extract seatLayoutModelId from the URL path
    const { seatLayoutModelId, ...zoneData } = params;

    // Create the zone with the seatLayoutModelId from the URL
    return await seatLayoutModelZoneRepository.create({
      ...zoneData,
      seatLayoutModelId,
    } as CreateZoneWithModelId);
  },
);

/**
 * Retrieves a seat layout model zone by its ID.
 * @param params - Object containing the zone ID and model ID
 * @param params.id - The ID of the zone to retrieve
 * @param params.seatLayoutModelId - The ID of the model the zone belongs to
 * @returns {Promise<SeatLayoutModelZone>} The requested zone
 * @throws {APIError} If retrieval fails or zone doesn't exist
 */
export const getSeatLayoutModelZone = api(
  {
    expose: true,
    method: 'GET',
    path: '/seat-layout-models/:seatLayoutModelId/zones/:id',
  },
  async ({
    id,
    seatLayoutModelId,
  }: {
    id: number;
    seatLayoutModelId: number;
  }): Promise<SeatLayoutModelZone> => {
    const zone = await seatLayoutModelZoneRepository.findOneForLayoutModel(
      seatLayoutModelId,
      id,
    );
    if (!zone) {
      throw new NotFoundError(
        `Zone with ID ${id} not found in layout model ${seatLayoutModelId}`,
      );
    }
    return zone;
  },
);

/**
 * Retrieves all zones for a specific seat layout model without pagination.
 * @param params - Object containing the seat layout model ID
 * @param params.seatLayoutModelId - The ID of the seat layout model
 * @returns {Promise<SeatLayoutModelZones>} List of zones for the seat layout model
 * @throws {APIError} If retrieval fails
 */
export const listZonesByLayoutModel = api(
  {
    expose: true,
    method: 'POST',
    path: '/seat-layout-models/:seatLayoutModelId/get-zones',
  },
  async (
    params: SeatLayoutModelZoneQueryOptions & { seatLayoutModelId: number },
  ): Promise<SeatLayoutModelZones> => {
    const zones = await seatLayoutModelZoneRepository.findAll({
      ...params,
      filters: {
        ...params.filters,
        seatLayoutModelId: params.seatLayoutModelId,
      },
    });

    return {
      seatLayoutModelZones: zones,
    };
  },
);

/**
 * Retrieves zones for a specific seat layout model with pagination.
 * @param params - Object containing the seat layout model ID and pagination parameters
 * @param params.seatLayoutModelId - The ID of the seat layout model
 * @returns {Promise<PaginatedSeatLayoutModelZones>} Paginated list of zones for the seat layout model
 * @throws {APIError} If retrieval fails
 */
export const listZonesByLayoutModelPaginated = api(
  {
    expose: true,
    method: 'POST',
    path: '/seat-layout-models/:seatLayoutModelId/get-zones/paginated',
  },
  async (
    params: PaginationParamsSeatLayoutModelZones & {
      seatLayoutModelId: number;
    },
  ): Promise<PaginatedSeatLayoutModelZones> => {
    return await seatLayoutModelZoneRepository.findAllPaginated({
      ...params,
      filters: {
        ...params.filters,
        seatLayoutModelId: params.seatLayoutModelId,
      },
    });
  },
);

/**
 * Updates an existing seat layout model zone.
 * @param params - Object containing the zone ID, model ID and update data
 * @param params.id - The ID of the zone to update
 * @param params.seatLayoutModelId - The ID of the model the zone belongs to
 * @returns {Promise<SeatLayoutModelZone>} The updated zone
 * @throws {APIError} If update fails or zone doesn't exist
 */
export const updateSeatLayoutModelZone = api(
  {
    expose: true,
    method: 'PATCH',
    path: '/seat-layout-models/:seatLayoutModelId/zones/:id',
  },
  async ({
    id,
    seatLayoutModelId,
    ...data
  }: UpdateSeatLayoutModelZonePayload & {
    id: number;
    seatLayoutModelId: number;
  }): Promise<SeatLayoutModelZone> => {
    // Verify the zone belongs to the specified model before updating
    const zone = await seatLayoutModelZoneRepository.findOneForLayoutModel(
      seatLayoutModelId,
      id,
    );
    if (!zone) {
      throw new NotFoundError(
        `Zone with ID ${id} not found in layout model ${seatLayoutModelId}`,
      );
    }

    return await seatLayoutModelZoneRepository.update(id, data);
  },
);

/**
 * Deletes a seat layout model zone by its ID.
 * @param params - Object containing the zone ID and model ID
 * @param params.id - The ID of the zone to delete
 * @param params.seatLayoutModelId - The ID of the model the zone belongs to
 * @returns {Promise<SeatLayoutModelZone>} The deleted zone
 * @throws {APIError} If deletion fails or zone doesn't exist
 */
export const deleteSeatLayoutModelZone = api(
  {
    expose: true,
    method: 'DELETE',
    path: '/seat-layout-models/:seatLayoutModelId/zones/:id',
  },
  async ({
    id,
    seatLayoutModelId,
  }: {
    id: number;
    seatLayoutModelId: number;
  }): Promise<SeatLayoutModelZone> => {
    // Verify the zone belongs to the specified model before deleting
    const zone = await seatLayoutModelZoneRepository.findOneForLayoutModel(
      seatLayoutModelId,
      id,
    );
    if (!zone) {
      throw new NotFoundError(
        `Zone with ID ${id} not found in layout model ${seatLayoutModelId}`,
      );
    }

    return await seatLayoutModelZoneRepository.delete(id);
  },
);
